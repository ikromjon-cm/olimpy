import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, RegStatus, AttendanceStatus } from '@prisma/client';
import { FilesService } from '../files/files.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  // Dashboard stats
  async getDashboardStats() {
    const [
      totalUsers,
      totalStudents,
      totalProctors,
      totalAdmins,
      totalOlympiads,
      activeOlympiads,
      totalRegistrations,
      pendingRegistrations,
      paidRegistrations,
      totalRevenue,
      todayRegistrations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.PROCTOR } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.olympiad.count(),
      this.prisma.olympiad.count({ where: { isActive: true } }),
      this.prisma.registration.count(),
      this.prisma.registration.count({ where: { status: RegStatus.PENDING } }),
      this.prisma.registration.count({ where: { status: RegStatus.PAID } }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.registration.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Registration trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const registrationTrend = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const count = await this.prisma.registration.count({
          where: {
            createdAt: { gte: date, lt: nextDay },
          },
        });
        
        return { date: date.toISOString().split('T')[0], count };
      })
    );

    // Olympiad stats
    const olympiadStats = await this.prisma.olympiad.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          where: { status: RegStatus.PAID },
          select: { id: true },
        },
      },
    });

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        proctors: totalProctors,
        admins: totalAdmins,
      },
      olympiads: {
        total: totalOlympiads,
        active: activeOlympiads,
        bySubject: olympiadStats.map(o => ({
          id: o.id,
          title: o.title,
          subject: o.subject,
          totalRegistrations: o._count.registrations,
          paidRegistrations: o.registrations.length,
        })),
      },
      registrations: {
        total: totalRegistrations,
        pending: pendingRegistrations,
        paid: paidRegistrations,
        today: todayRegistrations,
      },
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
      },
      registrationTrend,
    };
  }

  // User management
  async getUsers(filters: {
    role?: Role;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { role, search, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { schoolName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phoneNumber: true,
          fullName: true,
          role: true,
          schoolName: true,
          grade: true,
          region: true,
          district: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(userId: string, role: Role) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  // Location management
  async createLocation(data: { name: string; address: string; mapLink?: string; contactPhone?: string; contactPerson?: string }) {
    return this.prisma.location.create({ data });
  }

  async updateLocation(id: string, data: Partial<{ name: string; address: string; mapLink: string; contactPhone: string; contactPerson: string; isActive: boolean }>) {
    return this.prisma.location.update({ where: { id }, data });
  }

  async deleteLocation(id: string) {
    // Check if location has rooms or registrations
    const [rooms, registrations] = await Promise.all([
      this.prisma.room.count({ where: { locationId: id } }),
      this.prisma.registration.count({ where: { locationId: id } }),
    ]);

    if (rooms > 0 || registrations > 0) {
      throw new Error('Bu binoda xonalar yoki arizalar mavjud. Avval ulardan bosh torting.');
    }

    return this.prisma.location.delete({ where: { id } });
  }

  async getLocations(includeRooms = false) {
    return this.prisma.location.findMany({
      where: { isActive: true },
      include: {
        rooms: includeRooms ? { where: { isActive: true }, orderBy: { roomNumber: 'asc' } } : false,
        _count: { select: { rooms: true, registrations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getLocation(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        rooms: { where: { isActive: true }, orderBy: { roomNumber: 'asc' } },
        _count: { select: { rooms: true, registrations: true } },
      },
    });
    if (!location) throw new Error('Bino topilmadi');
    return location;
  }

  // Room management
  async createRoom(data: { locationId: string; roomNumber: string; capacity: number; floor?: number; description?: string }) {
    const location = await this.prisma.location.findUnique({ where: { id: data.locationId } });
    if (!location) throw new Error('Bino topilmadi');

    return this.prisma.room.create({
      data: {
        locationId: data.locationId,
        roomNumber: data.roomNumber,
        capacity: data.capacity,
        floor: data.floor,
        description: data.description,
      },
    });
  }

  async updateRoom(id: string, data: Partial<{ roomNumber: string; capacity: number; floor: number; description: string; isActive: boolean }>) {
    return this.prisma.room.update({ where: { id }, data });
  }

  async deleteRoom(id: string) {
    const registrations = await this.prisma.registration.count({ where: { roomId: id } });
    if (registrations > 0) {
      throw new Error('Bu xonada arizalar mavjud. Avval ulardan bosh torting.');
    }
    return this.prisma.room.delete({ where: { id } });
  }

  async getRooms(locationId: string) {
    return this.prisma.room.findMany({
      where: { locationId, isActive: true },
      include: {
        _count: { select: { registrations: { where: { status: { not: 'CANCELLED' } } } } },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  // Bulk operations
  async bulkCreateRooms(locationId: string, rooms: { roomNumber: string; capacity: number; floor?: number }[]) {
    const results: any[] = [];
    for (const room of rooms) {
      try {
        const created = await this.prisma.room.create({
          data: { locationId, ...room },
        });
        results.push({ success: true, data: created });
      } catch (error) {
        results.push({ success: false, data: room, error: error.message });
      }
    }
    return results;
  }

  async generateCertificatesForTop(olympiadId: string, topCount: number) {
    const results = await this.prisma.result.findMany({
      where: { registration: { olympiadId } },
      orderBy: { score: 'desc' },
      take: topCount,
      include: { registration: { include: { user: true, olympiad: true } } },
    });

    const generated: any[] = [];
    for (const result of results) {
      try {
        const url = await this.filesService.generateCertificate(result.registrationId);
        await this.prisma.result.update({
          where: { id: result.id },
          data: { certificateUrl: url },
        });
        generated.push({ registrationId: result.registrationId, url });
      } catch (error) {
        this.logger.error(`Certificate generation failed for ${result.registrationId}`, error);
      }
    }

    return { message: `${generated.length} sertifikat generatsiya qilindi`, generated };
  }

  // Registration management (admin)
  async getRegistrations(filters: {
    olympiadId?: string;
    status?: string;
    locationId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { olympiadId, status, locationId, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.RegistrationWhereInput = {};
    if (olympiadId) where.olympiadId = olympiadId;
    if (status) where.status = status as RegStatus;
    if (locationId) where.locationId = locationId;
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: search } } },
        { user: { schoolName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, phoneNumber: true, schoolName: true, grade: true, region: true, district: true } },
          olympiad: { select: { id: true, title: true, subject: true } },
          location: { select: { id: true, name: true } },
          room: { select: { id: true, roomNumber: true } },
          payment: { select: { status: true, transactionId: true, amount: true } },
          attendance: { select: { status: true, scannedAt: true } },
          result: { select: { score: true, rank: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return { data: registrations, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // System settings
  async getSettings() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async setSetting(key: string, value: any) {
    return this.prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  // Audit logs
  async getAuditLogs(filters: { userId?: string; action?: string; entity?: string; page?: number; limit?: number }) {
    const { userId, action, entity, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // Export data
  async exportRegistrations(olympiadId: string, format: 'excel' | 'csv' = 'excel') {
    const registrations = await this.prisma.registration.findMany({
      where: { olympiadId, status: { not: RegStatus.CANCELLED } },
      include: {
        user: { select: { fullName: true, phoneNumber: true, schoolName: true, grade: true, region: true, district: true } },
        olympiad: { select: { title: true, subject: true } },
        location: { select: { name: true } },
        room: { select: { roomNumber: true } },
        payment: { select: { status: true, transactionId: true, amount: true } },
        attendance: { select: { status: true, scannedAt: true } },
        result: { select: { score: true, rank: true } },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { room: { roomNumber: 'asc' } },
        { seatNumber: 'asc' },
      ],
    });

    // Transform for export
    return registrations.map((reg, index) => ({
      '№': index + 1,
      'F.I.O': reg.user.fullName,
      'Telefon': reg.user.phoneNumber,
      'Maktab': reg.user.schoolName || '',
      'Sinf': reg.user.grade || '',
      'Hudud': reg.user.region || '',
      'Tuman': reg.user.district || '',
      'Olimpiada': reg.olympiad.title,
      'Fan': reg.olympiad.subject,
      'Bino': reg.location.name,
      'Xona': reg.room.roomNumber,
      'Parta': reg.seatNumber,
      'Til': reg.lang.toUpperCase(),
      'Holat': reg.status,
      'To\'lov': reg.payment?.status || 'PENDING',
      'To\'lov ID': reg.payment?.transactionId || '',
      'Summa': reg.payment?.amount || 0,
      'Keldi': reg.attendance?.status === AttendanceStatus.ATTENDED ? 'HA' : 'YO\'Q',
      'Kelgan vaqt': reg.attendance?.scannedAt ? reg.attendance.scannedAt.toLocaleString('uz-UZ') : '',
      'Ball': reg.result?.score || '',
      'O\'rin': reg.result?.rank || '',
    }));
  }
}