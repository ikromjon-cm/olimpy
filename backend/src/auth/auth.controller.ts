import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telefon raqamga OTP kod yuborish' })
  @ApiResponse({ status: 200, description: 'Kod muvaffaqiyatli yuborildi' })
  @ApiResponse({ status: 429, description: 'Juda ko\'p so\'rov' })
  async sendOtp(@Body() dto: SendOtpDto) {
    this.logger.log(`Sending OTP to ${dto.phoneNumber}`);
    return this.authService.sendOtp(dto.phoneNumber);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP kodni tekshirish va token olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli avtorizatsiya', type: Object })
  @ApiResponse({ status: 401, description: 'Noto\'g\'ri kod' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    this.logger.log(`Verifying OTP for ${dto.phoneNumber}`);
    return this.authService.verifyOtp(dto.phoneNumber, dto.otp);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access tokenni yangilash' })
  @ApiResponse({ status: 200, description: 'Yangi tokenlar' })
  @ApiResponse({ status: 401, description: 'Noto\'g\'ri refresh token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('admin-login')
  @ApiOperation({ summary: 'Admin passcode login' })
  @ApiResponse({ status: 200, description: 'Admin tokenlar' })
  async adminLogin(@Body('passcode') passcode: string) {
    return this.authService.adminPasscodeLogin(passcode);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parol yordamida tizimga kirish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli avtorizatsiya', type: Object })
  @ApiResponse({ status: 401, description: 'Noto\'g\'ri parol yoki telefon raqam' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for ${dto.phoneNumber}`);
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi foydalanuvchini ro\'yxatdan o\'tkazish' })
  @ApiResponse({ status: 201, description: 'Muvaffaqiyatli ro\'yxatdan o\'tildi' })
  @ApiResponse({ status: 409, description: 'Bu telefon raqam band' })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`Register attempt for ${dto.phoneNumber}`);
    return this.authService.register(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parolni tiklash' })
  @ApiResponse({ status: 200, description: 'Parol muvaffaqiyatli o\'zgartirildi' })
  @ApiResponse({ status: 401, description: 'Tasdiqlash kodi xato' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.log(`Password reset for ${dto.phoneNumber}`);
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tizimdan chiqish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli chiqildi' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi ma\'lumotlari' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi ma\'lumotlari' })
  async getProfile(@CurrentUser() user: any) {
    const { passwordHash, ...result } = user;
    return result;
  }
}