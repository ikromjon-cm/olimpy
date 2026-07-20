import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResultsService } from './results.service';
import { Role } from '@prisma/client';

@ApiTags('Results')
@Controller('results')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('my-results')
  @ApiOperation({ summary: 'Mening natijalarim' })
  @ApiResponse({ status: 200 })
  async getMyResults(@CurrentUser('id') userId: string) {
    return this.resultsService.findAll({ userId });
  }

  @Get('registration/:registrationId')
  @ApiOperation({ summary: 'Ariza natijasi' })
  @ApiResponse({ status: 200 })
  async getByRegistration(@Param('registrationId') registrationId: string) {
    return this.resultsService.findByRegistration(registrationId);
  }

  @Get('certificate/:registrationId')
  @ApiOperation({ summary: 'Sertifikat yuklab olish' })
  @ApiResponse({ status: 200 })
  async getCertificate(@Param('registrationId') registrationId: string) {
    const result = await this.resultsService.findByRegistration(registrationId);
    if (!result?.certificateUrl) {
      return { message: 'Sertifikat mavjud emas', hasCertificate: false };
    }
    return { certificateUrl: result.certificateUrl, hasCertificate: true };
  }

  // Admin endpoints
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/create')
  @ApiOperation({ summary: 'Natija qo\'shish (Admin)' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: { registrationId: string; score: number; rank?: number }) {
    return this.resultsService.create(dto.registrationId, { score: dto.score, rank: dto.rank });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/bulk')
  @ApiOperation({ summary: 'Ko\'p natijalar qo\'shish (Admin) - Excel import uchun' })
  @ApiResponse({ status: 201 })
  async bulkCreate(@Body('results') results: { registrationId: string; score: number; rank?: number }[]) {
    return this.resultsService.bulkCreate(results);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/olympiad/:olympiadId')
  @ApiOperation({ summary: 'Olimpiada barcha natijalari (Admin)' })
  @ApiQuery({ name: 'minScore', required: false, type: Number })
  @ApiQuery({ name: 'maxScore', required: false, type: Number })
  @ApiQuery({ name: 'hasCertificate', required: false, type: Boolean })
  @ApiResponse({ status: 200 })
  async getOlympiadResults(
    @Param('olympiadId') olympiadId: string,
    @Query('minScore') minScore?: number,
    @Query('maxScore') maxScore?: number,
  ) {
    return this.resultsService.findAll({ olympiadId, minScore, maxScore });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/olympiad/:olympiadId/stats')
  @ApiOperation({ summary: 'Olimpiada natija statistikasi (Admin)' })
  @ApiResponse({ status: 200 })
  async getStats(@Param('olympiadId') olympiadId: string) {
    return this.resultsService.getStats(olympiadId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/olympiad/:olympiadId/generate-certificates')
  @ApiOperation({ summary: 'Eng yaxshi natijalarga sertifikat generatsiya qilish (Admin)' })
  @ApiQuery({ name: 'topCount', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async generateCertificates(
    @Param('olympiadId') olympiadId: string,
    @Query('topCount') topCount = 10,
  ) {
    await this.resultsService.generateCertificatesForTop(olympiadId, Number(topCount));
    return { message: `Top ${topCount} sertifikat generatsiya qilindi` };
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('admin/:id')
  @ApiOperation({ summary: 'Natija yangilash (Admin)' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: { score?: number; rank?: number }) {
    return this.resultsService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Natija o\'chirish (Admin)' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string) {
    await this.resultsService.delete(id);
    return { message: 'Natija o\'chirildi' };
  }
}