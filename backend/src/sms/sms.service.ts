import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private get apiUrl(): string {
    return this.configService.get('ESKIZ_API_URL') || 'https://notify.eskiz.uz/api';
  }

  private get email(): string {
    return this.configService.get('ESKIZ_EMAIL') || '';
  }

  private get password(): string {
    return this.configService.get('ESKIZ_PASSWORD') || '';
  }

  private get senderId(): string {
    return this.configService.get('ESKIZ_SENDER_ID') || '4546';
  }

  async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 300000 && this.token) {
      return this.token;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ data: { token: string } }>(`${this.apiUrl}/auth/login`, {
          email: this.email,
          password: this.password,
        }, { timeout: 5000 }),
      );

      this.token = response.data.data.token;
      this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      this.logger.log('Eskiz.uz authentication successful');
      return this.token;
    } catch (error) {
      this.logger.error('Eskiz.uz authentication failed', error.response?.data || error.message);
      throw new Error('SMS service authentication failed');
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    // In development, skip actual SMS send
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.warn(`DEV MODE - OTP for ${normalizedPhone}: ${code}`);
      return;
    }

    const message = `Olimpiy: Sizning tasdiqlash kodingiz ${code}. Kodni hech kimga bermang.`;

    try {
      const token = await this.authenticate();

      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/message/sms/send`,
          {
            mobile_phone: normalizedPhone,
            message,
            from: this.senderId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          },
        ),
      );

      this.logger.log(`OTP sent to ${normalizedPhone}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${normalizedPhone}`, error.response?.data || error.message);
      this.logger.warn(`DEV MODE - OTP for ${normalizedPhone}: ${code}`);
    }
  }

  async sendCustomMessage(phone: string, message: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.warn(`DEV MODE - Custom SMS for ${normalizedPhone}: ${message}`);
      return;
    }

    try {
      const token = await this.authenticate();

      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/message/sms/send`,
          {
            mobile_phone: normalizedPhone,
            message,
            from: this.senderId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          },
        ),
      );

      this.logger.log(`Custom SMS sent to ${normalizedPhone}`);
    } catch (error) {
      this.logger.error(`Failed to send custom SMS to ${normalizedPhone}`, error.response?.data || error.message);
    }
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
}