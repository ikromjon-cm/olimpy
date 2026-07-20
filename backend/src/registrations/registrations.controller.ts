import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegistrationsService } from './registrations.service';
import { Response } from 'express';
import { Role } from '@prisma/client';

class CreateRegistrationDto {
  @IsString()
  olympiadId: string;

  @IsString()
  locationId: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsIn(['uz', 'ru', 'en'])
  lang: 'uz' | 'ru' | 'en';
}

@ApiTags('Registrations')
@Controller('registrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi arizani yaratish' })
  @ApiResponse({ status: 201, description: 'Ariza yaratildi' })
  @ApiResponse({ status: 409, description: 'Joylar band yoki allaqachon arizani bor' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Foydalanuvchining arizalari' })
  @ApiResponse({ status: 200, description: 'Arizalar ro\'yxati' })
  async findMyRegistrations(@CurrentUser('id') userId: string) {
    return this.registrationsService.findByUser(userId);
  }

  @Get('available-locations/:olympiadId')
  @ApiOperation({ summary: 'Olimpiada uchun mavjud binolar va bo\'sh joylar' })
  @ApiResponse({ status: 200, description: 'Binolar ro\'yxati bo\'sh joylar soni bilan' })
  async getAvailableLocations(@Param('olympiadId') olympiadId: string) {
    return this.registrationsService.getAvailableLocations(olympiadId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ariza batafsil ma\'lumoti' })
  @ApiResponse({ status: 200, description: 'Ariza ma\'lumoti' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.registrationsService.findById(id, userId, userRole);
  }

  @Get('qr/:qrCodeToken')
  @ApiOperation({ summary: 'QR kod orqali arizani topish (Proctor uchun)' })
  @ApiResponse({ status: 200, description: 'Ariza ma\'lumoti' })
  async findByQrToken(@Param('qrCodeToken') qrCodeToken: string) {
    return this.registrationsService.findByQrToken(qrCodeToken);
  }

  @Post(':id/ticket')
  @ApiOperation({ summary: 'Chipta PDF generatsiya qilish va yuklab olish' })
  @ApiResponse({ status: 200, description: 'Chipta URL' })
  async generateTicket(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const ticketUrl = await this.registrationsService.generateTicket(id, userId, userRole);
    return { ticketUrl };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Arizani bekor qilish (faqat PENDING holatida)' })
  @ApiResponse({ status: 200, description: 'Ariza bekor qilindi' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.registrationsService.cancel(id, userId, userRole);
  }

  // Admin endpoints
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  @ApiOperation({ summary: 'Barcha arizalar (Admin)' })
  @ApiQuery({ name: 'olympiadId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'CANCELLED'] })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Arizalar ro\'yxati' })
  async findAllAdmin(
    @Query('olympiadId') olympiadId?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.registrationsService.findAllAdmin({ olympiadId, status, locationId, search, page: Number(page), limit: Number(limit) });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Arizalar statistikasi (Admin)' })
  @ApiQuery({ name: 'olympiadId', required: false })
  @ApiResponse({ status: 200, description: 'Statistika' })
  async getStats(@Query('olympiadId') olympiadId?: string) {
    return this.registrationsService.getStats(olympiadId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/export/:olympiadId')
  @ApiOperation({ summary: 'Olimpiada uchun arizalarni Excel ga eksport qilish (Admin)' })
  @ApiResponse({ status: 200, description: 'Excel fayl' })
  async exportToExcel(@Param('olympiadId') olympiadId: string, @Res() res: Response) {
    const buffer = await this.registrationsService.exportToExcel(olympiadId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="arizalar-${olympiadId.slice(0,8)}-${Date.now()}.xlsx"`);
    res.send(buffer);
  }
}