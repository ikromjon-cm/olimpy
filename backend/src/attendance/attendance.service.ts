import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus, Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private prisma: PrismaService) {}

  async scanQr(proctorId: string, qrCodeToken: string): Promise<{
    success: boolean;
    status: 'success' | 'error' | 'already_scanned' | 'not_paid';
    message: string;
    data?: any;
  }> {
    const registration = await this.prisma.registration.findUnique({
      where: { qrCodeToken },
      include: {
        user: { select: { id: true, fullName: true, phoneNumber: true, schoolName: true, grade: true } },
        olympiad: { select: { id: true, title: true, subject: true, examDate: true } },
        location: { select: { name: true } },
        room: { select: { roomNumber: true } },
        payment: true,
        attendance: true,
      },
    });

    if (!registration) {
      return {
        success: false,
        status: 'error',
        message: 'QR kod topilmadi. Noto\'g\'ri yoki eski kod.',
      };
    }

    // Check if registration is paid
    if (registration.status !== 'PAID') {
      return {
        success: false,
        status: 'not_paid',
        message: `Ariza to\'lanmagan! Holat: ${this.getStatusLabel(registration.status)}`,
        data: { registration, paymentRequired: true },
      };
    }

    // Check if already attended
    if (registration.attendance) {
      if (registration.attendance.status === AttendanceStatus.ATTENDED) {
        return {
          success: false,
          status: 'already_scanned',
          message: `Bu o'quvchi allaqachon keldi deb belgilangan! (${registration.attendance.scannedAt?.toLocaleTimeString()})`,
          data: { registration, attendance: registration.attendance },
        };
      }
    }

    // Mark as attended
    const attendance = await this.prisma.attendance.upsert({
      where: { registrationId: registration.id },
      create: {
        registrationId: registration.id,
        status: AttendanceStatus.ATTENDED,
        proctorId,
        scannedAt: new Date(),
      },
      update: {
        status: AttendanceStatus.ATTENDED,
        proctorId,
        scannedAt: new Date(),
      },
    });

    this.logger.log(`Attendance marked: ${registration.user.fullName} - ${registration.olympiad.title} by proctor ${proctorId}`);

    return {
      success: true,
      status: 'success',
      message: `${registration.user.fullName} - ${registration.olympiad.title} imtihoniga keldi!`,
      data: {
        registration: {
          id: registration.id,
          fullName: registration.user.fullName,
          phoneNumber: registration.user.phoneNumber,
          schoolName: registration.user.schoolName,
          grade: registration.user.grade,
          olympiadTitle: registration.olympiad.title,
          subject: registration.olympiad.subject,
          locationName: registration.location.name,
          roomNumber: registration.room.roomNumber,
          seatNumber: registration.seatNumber,
          lang: registration.lang,
        },
        attendance: {
          scannedAt: attendance.scannedAt,
          proctorId: attendance.proctorId,
        },
      },
    };
  }

  async getAttendanceByRegistration(registrationId: string) {
    return this.prisma.attendance.findUnique({
      where: { registrationId },
      include: {
        proctor: { select: { id: true, fullName: true } },
        registration: {
          include: {
            user: { select: { fullName: true, phoneNumber: true } },
            olympiad: { select: { title: true } },
            room: { select: { roomNumber: true } },
          },
        },
      },
    });
  }

  async getOlympiadAttendance(olympiadId: string, filters?: {
    locationId?: string;
    roomId?: string;
    status?: AttendanceStatus;
  }) {
    const where: any = { olympiadId };
    
    if (filters?.locationId) where.locationId = filters.locationId;
    if (filters?.roomId) where.roomId = filters.roomId;

    return this.prisma.registration.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, phoneNumber: true, schoolName: true, grade: true } },
        location: { select: { name: true } },
        room: { select: { roomNumber: true } },
        attendance: true,
        payment: { select: { status: true } },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { room: { roomNumber: 'asc' } },
        { seatNumber: 'asc' },
      ],
    });
  }

  async getAttendanceStats(olympiadId: string) {
    const [total, attended, absent, registered] = await Promise.all([
      this.prisma.registration.count({ where: { olympiadId, status: 'PAID' } }),
      this.prisma.attendance.count({
        where: { registration: { olympiadId }, status: AttendanceStatus.ATTENDED },
      }),
      this.prisma.attendance.count({
        where: { registration: { olympiadId }, status: AttendanceStatus.ABSENT } },
      ),
      this.prisma.attendance.count({
        where: { registration: { olympiadId }, status: AttendanceStatus.REGISTERED },
      }),
    ]);

    return {
      total,
      attended,
      absent,
      registered,
      attendanceRate: total > 0 ? ((attended / total) * 100).toFixed(1) : 0,
    };
  }

  async markAbsent(registrationId: string, proctorId: string, notes?: string) {
    return this.prisma.attendance.upsert({
      where: { registrationId },
      create: {
        registrationId,
        status: AttendanceStatus.ABSENT,
        proctorId,
        notes,
      },
      update: {
        status: AttendanceStatus.ABSENT,
        proctorId,
        notes,
      },
    });
  }

  async bulkUpdateAttendance(data: { registrationId: string; status: AttendanceStatus }[], proctorId: string) {
    const results: any[] = [];
    
    for (const item of data) {
      try {
        const attendance = await this.prisma.attendance.upsert({
          where: { registrationId: item.registrationId },
          create: {
            registrationId: item.registrationId,
            status: item.status,
            proctorId,
          },
          update: {
            status: item.status,
            proctorId,
          },
        });
        results.push({ registrationId: item.registrationId, success: true, attendance });
      } catch (error) {
        results.push({ registrationId: item.registrationId, success: false, error: error.message });
      }
    }

    return results;
  }

  async getProctorScans(proctorId: string) {
    return this.prisma.attendance.findMany({
      where: { proctorId },
      include: {
        registration: {
          include: {
            user: { select: { fullName: true, phoneNumber: true } },
            olympiad: { select: { title: true } },
            room: { select: { roomNumber: true } },
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
    });
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Kutilmoqda',
      PAID: 'To\'langan',
      CANCELLED: 'Bekor qilingan',
    };
    return labels[status] || status;
  }
}