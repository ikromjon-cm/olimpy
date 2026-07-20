import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { Role } from '@prisma/client';

@Injectable()
export class ProctorService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
  ) {}

  async getMyOlympiads(proctorId: string) {
    const proctor = await this.prisma.user.findFirst({
      where: { id: proctorId, role: Role.PROCTOR },
      select: { id: true, fullName: true, role: true },
    });

    if (!proctor) {
      throw new NotFoundException('Nazoratchi topilmadi');
    }

    // Get active Olympiads (could be assigned to proctor or all active)
    const olympiads = await this.prisma.olympiad.findMany({
      where: { isActive: true },
      include: {
        locations: {
          where: { isActive: true },
          include: {
            location: {
              include: {
                rooms: { where: { isActive: true } },
              },
            },
          },
        },
        _count: { select: { registrations: { where: { status: 'PAID' } } } },
      },
      orderBy: { examDate: 'asc' },
    });

    return olympiads.map(o => ({
      ...o,
      locations: o.locations.map(ol => ({
        ...ol.location,
        roomCount: ol.location.rooms.length,
        totalCapacity: ol.location.rooms.reduce((sum, r) => sum + r.capacity, 0),
      })),
    }));
  }

  async validateProctorAccess(proctorId: string, olympiadId: string): Promise<boolean> {
    // In a real app, you might have a ProctorOlympiad assignment table
    // For now, allow all proctors to access all active olympiads
    const olympiad = await this.prisma.olympiad.findUnique({
      where: { id: olympiadId, isActive: true },
    });
    return !!olympiad;
  }

  async getOlympiadForProctor(proctorId: string, olympiadId: string) {
    const hasAccess = await this.validateProctorAccess(proctorId, olympiadId);
    if (!hasAccess) {
      throw new NotFoundException('Olimpiada topilmadi yoki ruxsat yo\'q');
    }

    const olympiad = await this.prisma.olympiad.findUnique({
      where: { id: olympiadId },
      include: {
        locations: {
          where: { isActive: true },
          include: {
            location: {
              include: {
                rooms: {
                  where: { isActive: true },
                  include: {
                    _count: { select: { registrations: { where: { status: { not: 'CANCELLED' } } } } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const stats = await this.attendanceService.getAttendanceStats(olympiadId);

    return { ...olympiad, stats };
  }

  async getRegistrationsForScanning(
    proctorId: string,
    olympiadId: string,
    filters: { locationId?: string; roomId?: string; status?: string } = {}
  ) {
    const hasAccess = await this.validateProctorAccess(proctorId, olympiadId);
    if (!hasAccess) {
      throw new NotFoundException('Ruxsat yo\'q');
    }

    return this.attendanceService.getOlympiadAttendance(olympiadId, filters as any);
  }

  async getProctorStats(proctorId: string) {
    const scans = await this.prisma.attendance.findMany({
      where: { proctorId, status: 'ATTENDED' },
      include: { registration: { select: { olympiadId: true } } },
    });

    const byOlympiad = scans.reduce((acc, scan) => {
      const oid = scan.registration.olympiadId;
      acc[oid] = (acc[oid] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalScans: scans.length,
      byOlympiad,
      recentScans: scans.slice(-10).map(s => ({
        id: s.id,
        scannedAt: s.scannedAt,
        registrationId: s.registrationId,
        olympiadId: s.registration.olympiadId,
      })),
    };
  }

  async getScanHistory(proctorId: string, limit = 100) {
    return this.prisma.attendance.findMany({
      where: { proctorId },
      include: {
        registration: {
          select: {
            id: true,
            seatNumber: true,
            user: { select: { fullName: true, phoneNumber: true } },
            olympiad: { select: { title: true, subject: true } },
            room: { select: { roomNumber: true } },
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: limit,
    });
  }
}