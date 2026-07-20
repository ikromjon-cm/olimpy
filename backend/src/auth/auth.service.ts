import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { Role } from '@prisma/client';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

export interface TokenPayload {
  sub: string;
  phoneNumber: string;
  role: Role;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}

  async sendOtp(phoneNumber: string): Promise<{ message: string; expiresIn: number }> {
    const normalizedPhone = this.normalizePhone(phoneNumber);
    
    // Rate limiting: 1 OTP per 60 seconds
    const rateLimit = await this.redis.checkRateLimit(
      `otp:rate:${normalizedPhone}`,
      1,
      60,
    );

    if (!rateLimit.allowed) {
      throw new ConflictException(
        `SMS kodi yuborish uchun ${rateLimit.resetTime - Date.now()}ms kuting`,
      );
    }

    // Daily limit: 50 OTPs per day
    const dailyLimit = await this.redis.checkRateLimit(
      `otp:daily:${normalizedPhone}`,
      50,
      86400,
    );

    if (!dailyLimit.allowed) {
      throw new ConflictException('Kunlik SMS limiti tugadi. Ertaga urinib ko\'ring.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis with 5 minutes expiry
    await this.redis.setOTP(normalizedPhone, otp, 5);

    // Send SMS via Eskiz.uz
    try {
      await this.smsService.sendOtp(normalizedPhone, otp);
      this.logger.log(`OTP sent to ${normalizedPhone}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${normalizedPhone}`, error);
      // In development, log OTP to console and don't throw
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.warn(`DEV MODE - OTP for ${normalizedPhone}: ${otp}`);
        return {
          message: `Tasdiqlash kodi yuborildi (DEV: ${otp})`,
          expiresIn: 300,
        };
      }
      throw new UnauthorizedException('SMS yuborishda xatolik. Qayta urinib ko\'ring.');
    }

    const isDev = this.configService.get('NODE_ENV') === 'development';
    return {
      message: isDev ? `Tasdiqlash kodi yuborildi (DEV: ${otp})` : 'Tasdiqlash kodi yuborildi',
      expiresIn: 300,
      ...(isDev && { devOtp: otp }),
    };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<Tokens> {
    const normalizedPhone = this.normalizePhone(phoneNumber);

    const isValid = await this.redis.verifyOTP(normalizedPhone, otp);
    
    if (!isValid) {
      throw new UnauthorizedException('Noto\'g\'ri yoki muddati o\'tgan kod');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber: normalizedPhone,
          fullName: 'Yangi foydalanuvchi',
          role: Role.STUDENT,
        },
      });
      this.logger.log(`New user created: ${normalizedPhone}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hisobingiz bloklangan. Adminstratorga murojaat qiling.');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);
    
    // Store refresh token in Redis
    await this.redis.setSession(user.id, { refreshToken: tokens.refreshToken }, 604800); // 7 days

    return tokens;
  }

  async adminPasscodeLogin(passcode: string): Promise<Tokens> {
    const ADMIN_CODE = process.env.ADMIN_PASSCODE || 'admin12345';
    
    if (passcode !== ADMIN_CODE) {
      throw new UnauthorizedException('Xato kod kiritildi');
    }

    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Admin foydalanuvchi topilmadi');
    }

    await this.prisma.user.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(adminUser.id, adminUser.phoneNumber, adminUser.role);
    await this.redis.setSession(adminUser.id, { refreshToken: tokens.refreshToken }, 604800);
    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Yaroqsiz refresh token');
    }

    const userId = payload.sub;
    const session = await this.redis.getSession(userId);
    
    if (!session || session.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Noto\'g\'ri refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki bloklangan');
    }

    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);
    
    await this.redis.setSession(user.id, { refreshToken: tokens.refreshToken }, 604800);

    return tokens;
  }

  async login(dto: LoginDto): Promise<Tokens> {
    const normalizedPhone = this.normalizePhone(dto.phoneNumber);

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      throw new UnauthorizedException('Bunday raqamli foydalanuvchi topilmadi');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hisobingiz bloklangan. Administratorga murojaat qiling.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Parol o\'rnatilmagan. Iltimos, parolni tiklash orqali parol o\'rnating.');
    }

    const isPasswordValid = await this.verifyPassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Parol noto\'g\'ri');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);
    
    await this.redis.setSession(user.id, { refreshToken: tokens.refreshToken }, 604800); // 7 days

    return tokens;
  }

  async register(dto: RegisterDto): Promise<Tokens> {
    const normalizedPhone = this.normalizePhone(dto.phoneNumber);

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingUser) {
      throw new ConflictException('Bu telefon raqam orqali ro\'yxatdan o\'tilgan');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        passwordHash,
        fullName: dto.fullName,
        schoolName: dto.schoolName,
        grade: dto.grade,
        region: dto.region,
        district: dto.district,
        role: Role.STUDENT,
        lastLoginAt: new Date(),
      },
    });

    const tokens = await this.generateTokens(user.id, user.phoneNumber, user.role);
    
    await this.redis.setSession(user.id, { refreshToken: tokens.refreshToken }, 604800);

    return tokens;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const normalizedPhone = this.normalizePhone(dto.phoneNumber);

    const isValid = await this.redis.verifyOTP(normalizedPhone, dto.otp);
    
    if (!isValid) {
      throw new UnauthorizedException('Noto\'g\'ri yoki muddati o\'tgan kod');
    }

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      throw new UnauthorizedException('Bunday raqamli foydalanuvchi topilmadi');
    }

    const passwordHash = await this.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Optionally invalidate all refresh tokens
    await this.redis.deleteSession(user.id);

    return { message: 'Parol muvaffaqiyatli o\'zgartirildi' };
  }

  async logout(userId: string): Promise<void> {
    await this.redis.deleteSession(userId);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        schoolName: true,
        grade: true,
        region: true,
        district: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  private async generateTokens(userId: string, phoneNumber: string, role: Role): Promise<Tokens> {
    const payload: TokenPayload = { sub: userId, phoneNumber, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('998')) {
      cleaned = cleaned.slice(3);
    }
    
    if (cleaned.length === 9) {
      return `998${cleaned}`;
    }
    
    return phone; // Return original if format is unexpected
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}