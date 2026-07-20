import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        schoolName: true,
        grade: true,
        region: true,
        district: true,
        parentPhone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  async findByPhone(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    schoolName?: string;
    grade?: number;
    region?: string;
    district?: string;
    parentPhone?: string;
    avatarUrl?: string;
    password?: string;
  }) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (data.grade && (data.grade < 1 || data.grade > 11)) {
      throw new BadRequestException('Sinf 1 dan 11 gacha bo\'lishi kerak');
    }

    const { password, ...updateData } = data;
    let dataToUpdate: any = { ...updateData };

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      dataToUpdate.passwordHash = passwordHash;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        schoolName: true,
        grade: true,
        region: true,
        district: true,
        parentPhone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  async updateRole(userId: string, role: Role, currentUserRole: Role) {
    if (currentUserRole !== Role.ADMIN) {
      throw new ForbiddenException('Faqat admin roli o\'zgartirishi mumkin');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
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
        createdAt: true,
      },
    });
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return false;
    }

    return bcrypt.compare(password, user.passwordHash);
  }

  async deactivate(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async activate(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  async getStudents(filters: {
    search?: string;
    region?: string;
    district?: string;
    schoolName?: string;
    grade?: number;
    page?: number;
    limit?: number;
  }) {
    const { search, region, district, schoolName, grade, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      role: Role.STUDENT,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { schoolName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (region) where.region = region;
    if (district) where.district = district;
    if (schoolName) where.schoolName = { contains: schoolName, mode: 'insensitive' };
    if (grade) where.grade = grade;

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
          schoolName: true,
          grade: true,
          region: true,
          district: true,
          parentPhone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { registrations: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProctors() {
    return this.prisma.user.findMany({
      where: { role: Role.PROCTOR },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdmins() {
    return this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [students, proctors, admins, totalRegistrations] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.PROCTOR } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.registration.count(),
    ]);

    const registrationsByStatus = await this.prisma.registration.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      users: {
        total: students + proctors + admins,
        students,
        proctors,
        admins,
      },
      registrations: {
        total: totalRegistrations,
        byStatus: registrationsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  }
}