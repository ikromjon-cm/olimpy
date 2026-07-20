import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OlympiadsService } from './olympiads.service';
import { Role } from '@prisma/client';

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

class CreateOlympiadDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsDateString()
  @IsNotEmpty()
  examDate: string;

  @IsDateString()
  @IsNotEmpty()
  regEndDate: string;

  @IsNumber()
  @IsOptional()
  maxCapacity?: number;
}

class UpdateOlympiadDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsDateString()
  @IsOptional()
  examDate?: string;

  @IsDateString()
  @IsOptional()
  regEndDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  maxCapacity?: number;
}

@ApiTags('Olympiads')
@Controller('olympiads')
export class OlympiadsController {
  constructor(private readonly olympiadsService: OlympiadsService) {}

  @Get()
  @ApiOperation({ summary: 'Faol olimpiadalar ro\'yxati (Omma uchun)' })
  @ApiQuery({ name: 'subject', required: false })
  @ApiResponse({ status: 200, description: 'Olimpiadalar ro\'yxati' })
  async findAllPublic() {
    return this.olympiadsService.findActive();
  }

  @Get('active')
  @ApiOperation({ summary: 'Faol olimpiadalar ro\'yxati (frontend compatibility)' })
  @ApiResponse({ status: 200 })
  async findActive() {
    return this.olympiadsService.findActive();
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Mavjud fanlar ro\'yxati' })
  @ApiResponse({ status: 200, description: 'Fanlar ro\'yxati' })
  async getSubjects() {
    return this.olympiadsService.getSubjects();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha olimpiadalar (Admin)' })
  @ApiQuery({ name: 'subject', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Olimpiadalar ro\'yxati' })
  async findAll(
    @Query('subject') subject?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.olympiadsService.findAll({ subject, isActive, search, page: Number(page), limit: Number(limit) });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiadalar statistikasi (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistika' })
  async getStats() {
    return this.olympiadsService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada batafsil ma\'lumoti (Admin)' })
  @ApiResponse({ status: 200, description: 'Olimpiada ma\'lumoti' })
  async findOne(@Param('id') id: string) {
    return this.olympiadsService.findOneWithStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Olimpiada batafsil (Omma uchun)' })
  @ApiResponse({ status: 200, description: 'Olimpiada ma\'lumoti' })
  async findOnePublic(@Param('id') id: string) {
    return this.olympiadsService.findOneWithStats(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi olimpiada yaratish (Admin)' })
  @ApiResponse({ status: 201, description: 'Olimpiada yaratildi' })
  async create(@Body() dto: CreateOlympiadDto, @CurrentUser('id') userId: string) {
    return this.olympiadsService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada yangilash (Admin)' })
  @ApiResponse({ status: 200, description: 'Olimpiada yangilandi' })
  async update(@Param('id') id: string, @Body() dto: UpdateOlympiadDto, @CurrentUser('id') userId: string) {
    return this.olympiadsService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada o\'chirish (Admin)' })
  @ApiResponse({ status: 200, description: 'Olimpiada o\'chirildi' })
  async delete(@Param('id') id: string) {
    await this.olympiadsService.delete(id);
    return { message: 'Olimpiada o\'chirildi' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('admin/:id/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada holatini o\'zgartirish (Admin)' })
  @ApiResponse({ status: 200, description: 'Holat o\'zgartirildi' })
  async toggleActive(@Param('id') id: string) {
    return this.olympiadsService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/:id/locations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiadaga bino qo\'shish (Admin)' })
  @ApiResponse({ status: 201, description: 'Bino qo\'shildi' })
  async addLocation(@Param('id') id: string, @Body('locationId') locationId: string) {
    return this.olympiadsService.addLocation(id, locationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id/locations/:locationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiadadan bino o\'chirish (Admin)' })
  @ApiResponse({ status: 200, description: 'Bino o\'chirildi' })
  async removeLocation(@Param('id') id: string, @Param('locationId') locationId: string) {
    await this.olympiadsService.removeLocation(id, locationId);
    return { message: 'Bino o\'chirildi' };
  }
}