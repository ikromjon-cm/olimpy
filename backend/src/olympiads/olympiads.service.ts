import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Prisma, Olympiad, Role } from '@prisma/client';

@Injectable()
export class OlympiadsService {
  private readonly logger = new Logger(OlympiadsService.name);
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findActive() {
    const cacheKey = 'olympiads:active';
    const cached = await this.redis.getCache<any[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const data = await this.prisma.olympiad.findMany({
      where: {
        isActive: true,
        regEndDate: { gte: now },
      },
      include: {
        locations: {
          where: { isActive: true },
          include: {
            location: {
              include: {
                rooms: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    roomNumber: true,
                    capacity: true,
                    currentSeats: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { examDate: 'asc' },
    });

    await this.redis.setCache(cacheKey, data, 60);
    return data;
  }

  async getSubjects() {
    const olympiads = await this.prisma.olympiad.findMany({
      where: { isActive: true },
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    });
    return olympiads.map(o => o.subject);
  }

  async findAll(filters: {
    subject?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { subject, isActive, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OlympiadWhereInput = {};

    if (subject) where.subject = subject;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [olympiads, total] = await Promise.all([
      this.prisma.olympiad.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { registrations: true } },
          locations: { include: { location: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.olympiad.count({ where }),
    ]);

    return {
      data: olympiads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const [total, active, totalRegistrations, totalRevenue] = await Promise.all([
      this.prisma.olympiad.count(),
      this.prisma.olympiad.count({ where: { isActive: true } }),
      this.prisma.registration.count(),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    const bySubject = await this.prisma.olympiad.groupBy({
      by: ['subject'],
      _count: { id: true },
    });

    const recentRegistrations = await this.prisma.registration.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    return {
      total,
      active,
      totalRegistrations,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      bySubject,
      recentRegistrations,
    };
  }

  async findOneWithStats(id: string) {
    const olympiad = await this.prisma.olympiad.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            location: {
              include: {
                rooms: {
                  where: { isActive: true },
                  include: {
                    _count: { select: { registrations: true } },
                  },
                },
              },
            },
          },
        },
        registrations: {
          include: {
            user: { select: { id: true, fullName: true, phoneNumber: true, schoolName: true, grade: true } },
            room: { select: { roomNumber: true } },
            location: { select: { name: true } },
            payment: true,
            attendance: true,
            result: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!olympiad) {
      throw new NotFoundException('Olimpiada topilmadi');
    }

    // Calculate stats
    const stats = {
      totalRegistrations: olympiad._count.registrations,
      paidRegistrations: olympiad.registrations.filter(r => r.status === 'PAID').length,
      pendingRegistrations: olympiad.registrations.filter(r => r.status === 'PENDING').length,
      cancelledRegistrations: olympiad.registrations.filter(r => r.status === 'CANCELLED').length,
      attended: olympiad.registrations.filter(r => r.attendance?.status === 'ATTENDED').length,
      absent: olympiad.registrations.filter(r => r.attendance?.status === 'ABSENT').length,
    };

    return { ...olympiad, stats };
  }

  async create(data: Prisma.OlympiadUncheckedCreateInput, createdById: string) {
    await this.redis.deleteCachePattern('olympiads:*');
    return this.prisma.olympiad.create({
      data: {
        ...data,
        createdById,
        updatedById: createdById,
      },
    });
  }

  async update(id: string, data: Prisma.OlympiadUncheckedUpdateInput, updatedById: string) {
    const olympiad = await this.prisma.olympiad.findUnique({ where: { id } });
    if (!olympiad) {
      throw new NotFoundException('Olimpiada topilmadi');
    }

    await this.redis.deleteCachePattern('olympiads:*');
    return this.prisma.olympiad.update({
      where: { id },
      data: {
        ...data,
        updatedById,
      },
    });
  }

  async delete(id: string) {
    const olympiad = await this.prisma.olympiad.findUnique({ where: { id } });
    if (!olympiad) {
      throw new NotFoundException('Olimpiada topilmadi');
    }

    const paidRegistrations = await this.prisma.registration.count({
      where: { olympiadId: id, status: 'PAID' },
    });

    if (paidRegistrations > 0) {
      throw new BadRequestException('To\'langan arizalar bor. O\'chirish mumkin emas.');
    }

    await this.redis.deleteCachePattern('olympiads:*');
    await this.prisma.olympiad.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const olympiad = await this.prisma.olympiad.findUnique({ where: { id } });
    if (!olympiad) {
      throw new NotFoundException('Olimpiada topilmadi');
    }

    await this.redis.deleteCachePattern('olympiads:*');
    return this.prisma.olympiad.update({
      where: { id },
      data: { isActive: !olympiad.isActive },
    });
  }

  async addLocation(olympiadId: string, locationId: string) {
    const olympiad = await this.prisma.olympiad.findUnique({ where: { id: olympiadId } });
    if (!olympiad) {
      throw new NotFoundException('Olimpiada topilmadi');
    }

    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      throw new NotFoundException('Bino topilmadi');
    }

    return this.prisma.olympiadLocation.create({
      data: { olympiadId, locationId },
    });
  }

  async removeLocation(olympiadId: string, locationId: string) {
    await this.prisma.olympiadLocation.delete({
      where: { olympiadId_locationId: { olympiadId, locationId } },
    });
  }
}