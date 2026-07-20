import { Controller, Post, Get, Param, Body, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { Role, AttendanceStatus } from '@prisma/client';

class ScanQrDto {
  @IsString()
  qrCodeToken: string;
}

class BulkAttendanceDto {
  items: { registrationId: string; status: AttendanceStatus }[];
}

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private jwtService: JwtService,
  ) {}

  @Public()
  @Post('scan')
  @ApiOperation({ summary: 'QR kodni skanerlash (Proctor mobil ilovasidan)' })
  @ApiResponse({ status: 200, description: 'Skanerlash natijasi' })
  async scanQr(@Body() dto: ScanQrDto, @Request() req: any) {
    // Try JWT first, then header fallback
    let proctorId = req.headers['x-proctor-id'];
    
    if (!proctorId) {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        try {
          const payload = this.jwtService.verify(token);
          proctorId = payload.sub;
        } catch {
          // Token invalid - ignore
        }
      }
    }
    
    if (!proctorId) {
      return {
        success: false,
        status: 'error',
        message: 'Proctor avtorizatsiyalanmagan',
      };
    }

    return this.attendanceService.scanQr(proctorId, dto.qrCodeToken);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROCTOR, Role.ADMIN)
  @Post('bulk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ko\'p arizalar uchun davomat belgilash (Proctor/Admin)' })
  @ApiResponse({ status: 200 })
  async bulkUpdate(@Body() dto: BulkAttendanceDto, @CurrentUser('id') proctorId: string) {
    return this.attendanceService.bulkUpdateAttendance(dto.items, proctorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROCTOR, Role.ADMIN)
  @Post(':registrationId/absent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kelmagan deb belgilash' })
  @ApiResponse({ status: 200 })
  async markAbsent(@Param('registrationId') registrationId: string, @CurrentUser('id') proctorId: string, @Body('notes') notes?: string) {
    return this.attendanceService.markAbsent(registrationId, proctorId, notes);
  }

  @UseGuards(JwtAuthGuard)
  @Get('registration/:registrationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ariza davomat ma\'lumoti' })
  @ApiResponse({ status: 200 })
  async getByRegistration(@Param('registrationId') registrationId: string) {
    return this.attendanceService.getAttendanceByRegistration(registrationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROCTOR)
  @Get('olympiad/:olympiadId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada davomati ro\'yxati' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AttendanceStatus })
  @ApiResponse({ status: 200 })
  async getOlympiadAttendance(
    @Param('olympiadId') olympiadId: string,
    @Query('locationId') locationId?: string,
    @Query('roomId') roomId?: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    return this.attendanceService.getOlympiadAttendance(olympiadId, { locationId, roomId, status });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROCTOR)
  @Get('olympiad/:olympiadId/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada davomat statistikasi' })
  @ApiResponse({ status: 200 })
  async getStats(@Param('olympiadId') olympiadId: string) {
    return this.attendanceService.getAttendanceStats(olympiadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROCTOR)
  @Get('my-scans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening skanerlashlarim (Proctor)' })
  @ApiResponse({ status: 200 })
  async getMyScans(@CurrentUser('id') proctorId: string) {
    return this.attendanceService.getProctorScans(proctorId);
  }
}