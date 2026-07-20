import { IsString, Length, Matches, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam (O\'zbekiston formati)' })
  @IsString()
  @Matches(/^[\d\s\-\+\(\)]{7,20}$/, { message: 'Noto\'g\'ri telefon raqam formati' })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  @Matches(/^[\d\s\-\+\(\)]{7,20}$/, { message: 'Noto\'g\'ri telefon raqam formati' })
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: '6 xonali OTP kod' })
  @IsString()
  @Length(6, 6, { message: 'Kod 6 xonali bo\'lishi kerak' })
  @Matches(/^\d{6}$/, { message: 'Kod faqat raqamlardan iborat bo\'lishi kerak' })
  otp: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}

export class LoginDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  @Matches(/^[\d\s\-\+\(\)]{7,20}$/, { message: 'Noto\'g\'ri telefon raqam formati' })
  phoneNumber: string;

  @ApiProperty({ example: 'password123', description: 'Parol' })
  @IsString()
  @Length(6, 100, { message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  @Matches(/^[\d\s\-\+\(\)]{7,20}$/, { message: 'Noto\'g\'ri telefon raqam formati' })
  phoneNumber: string;

  @ApiProperty({ example: 'password123', description: 'Parol' })
  @IsString()
  @Length(6, 100, { message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  password: string;

  @ApiProperty({ example: 'Eshmat Toshmatov', description: 'F.I.O' })
  @IsString()
  @Length(3, 100, { message: 'F.I.O kamida 3 ta belgidan iborat bo\'lishi kerak' })
  fullName: string;

  @ApiProperty({ example: '1-maktab', description: 'Maktab nomi' })
  @IsString()
  schoolName: string;

  @ApiProperty({ example: 10, description: 'Sinf' })
  @IsInt({ message: 'Sinf raqam bo\'lishi kerak' })
  @Min(1)
  @Max(11)
  grade: number;

  @ApiProperty({ example: 'Toshkent', description: 'Viloyat' })
  @IsString()
  region: string;

  @ApiProperty({ example: 'Yunusobod', description: 'Tuman' })
  @IsString()
  district: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: 'Tasdiqlash kodi' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'newpassword123', description: 'Yangi parol' })
  @IsString()
  @Length(6, 100)
  newPassword: string;
}