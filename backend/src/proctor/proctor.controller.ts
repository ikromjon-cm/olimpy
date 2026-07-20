import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProctorService } from './proctor.service';
import { Role } from '@prisma/client';

@ApiTags('Proctor')
@Controller('proctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROCTOR, Role.ADMIN)
@ApiBearerAuth()
export class ProctorController {
  constructor(private readonly proctorService: ProctorService) {}

  @Get('olympiads')
  @ApiOperation({ summary: 'Mening olimpiadalarim (Proctor)' })
  @ApiResponse({ status: 200 })
  async getMyOlympiads(@CurrentUser('id') proctorId: string) {
    return this.proctorService.getMyOlympiads(proctorId);
  }

  @Get('olympiads/:olympiadId')
  @ApiOperation({ summary: 'Olimpiada batafsil (Proctor uchun)' })
  @ApiResponse({ status: 200 })
  async getOlympiad(@CurrentUser('id') proctorId: string, @Param('olympiadId') olympiadId: string) {
    const hasAccess = await this.proctorService.validateProctorAccess(proctorId, olympiadId);
    if (!hasAccess) {
      return { message: 'Bu olimpiadaga kirish huquqi yo\'q' };
    }
    return this.proctorService.getOlympiadForProctor(proctorId, olympiadId);
  }

  @Get('olympiads/:olympiadId/registrations')
  @ApiOperation({ summary: 'Skanerlash uchun ro\'yxatdan o\'tganlar' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['REGISTERED', 'ATTENDED', 'ABSENT'] })
  @ApiResponse({ status: 200 })
  async getRegistrations(
    @CurrentUser('id') proctorId: string,
    @Param('olympiadId') olympiadId: string,
    @Query('locationId') locationId?: string,
    @Query('roomId') roomId?: string,
    @Query('status') status?: string,
  ) {
    return this.proctorService.getRegistrationsForScanning(proctorId, olympiadId, {
      locationId,
      roomId,
      status: status as any,
    });
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Mening statistikam' })
  @ApiResponse({ status: 200 })
  async getMyStats(@CurrentUser('id') proctorId: string) {
    return this.proctorService.getProctorStats(proctorId);
  }

  @Get('my-scans')
  @ApiOperation({ summary: 'Mening skanerlashlarim' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async getMyScans(@CurrentUser('id') proctorId: string, @Query('limit') limit = 100) {
    return this.proctorService.getScanHistory(proctorId);
  }
}