import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async create(registrationId: string, data: { score: number; rank?: number }) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { result: true },
    });

    if (!registration) {
      throw new NotFoundException('Ariza topilmadi');
    }

    if (registration.result) {
      throw new BadRequestException('Natija allaqachon mavjud');
    }

    if (registration.status !== 'PAID') {
      throw new BadRequestException('Faqat to\'langan arizalar uchun natija kiritiladi');
    }

    return this.prisma.result.create({
      data: {
        registrationId,
        score: data.score,
        rank: data.rank,
      },
    });
  }

  async bulkCreate(results: { registrationId: string; score: number; rank?: number }[]) {
    const created: any[] = [];
    const errors: any[] = [];

    for (const item of results) {
      try {
        const result = await this.create(item.registrationId, {
          score: item.score,
          rank: item.rank,
        });
        created.push(result);
      } catch (error) {
        errors.push({ registrationId: item.registrationId, error: error.message });
      }
    }

    return { created, errors };
  }

  async findByRegistration(registrationId: string) {
    return this.prisma.result.findUnique({
      where: { registrationId },
      include: {
        registration: {
          include: {
            user: { select: { fullName: true, phoneNumber: true, schoolName: true, grade: true } },
            olympiad: { select: { title: true, subject: true } },
          },
        },
      },
    });
  }

  async findAll(filters: {
    olympiadId?: string;
    userId?: string;
    minScore?: number;
    maxScore?: number;
    page?: number;
    limit?: number;
  }) {
    const { olympiadId, userId, minScore, maxScore, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ResultWhereInput = {};
    const registrationWhere: Prisma.RegistrationWhereInput = {};

    if (olympiadId) registrationWhere.olympiadId = olympiadId;
    if (userId) registrationWhere.userId = userId;
    if (Object.keys(registrationWhere).length > 0) where.registration = registrationWhere;

    if (minScore !== undefined || maxScore !== undefined) {
      where.score = {};
      if (minScore !== undefined) where.score.gte = minScore;
      if (maxScore !== undefined) where.score.lte = maxScore;
    }

    const [results, total] = await Promise.all([
      this.prisma.result.findMany({
        where,
        skip,
        take: limit,
        include: {
          registration: {
            include: {
              user: { select: { fullName: true, phoneNumber: true, schoolName: true, grade: true } },
              olympiad: { select: { title: true, subject: true } },
              room: { select: { roomNumber: true } },
            },
          },
        },
        orderBy: { score: 'desc' },
      }),
      this.prisma.result.count({ where }),
    ]);

    return {
      data: results,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(registrationId: string, data: { score?: number; rank?: number }) {
    const result = await this.prisma.result.findUnique({ where: { registrationId } });
    
    if (!result) {
      throw new NotFoundException('Natija topilmadi');
    }

    return this.prisma.result.update({
      where: { registrationId },
      data,
    });
  }

  async delete(registrationId: string) {
    const result = await this.prisma.result.findUnique({ where: { registrationId } });
    
    if (!result) {
      throw new NotFoundException('Natija topilmadi');
    }

    // Also delete certificate if exists
    if (result.certificateUrl) {
      await this.filesService.deleteFile(result.certificateUrl);
    }

    return this.prisma.result.delete({ where: { registrationId } });
  }

  async generateCertificate(registrationId: string): Promise<string> {
    return this.filesService.generateCertificate(registrationId);
  }

  async getOlympiadRanking(olympiadId: string, limit = 100) {
    return this.prisma.result.findMany({
      where: { registration: { olympiadId } },
      include: {
        registration: {
          include: {
            user: { select: { fullName: true, schoolName: true, grade: true } },
            room: { select: { roomNumber: true } },
          },
        },
      },
      orderBy: { score: 'desc' },
      take: limit,
    });
  }

  async generateCertificatesForTop(olympiadId: string, topCount: number) {
    const results = await this.prisma.result.findMany({
      where: { registration: { olympiadId } },
      orderBy: { score: 'desc' },
      take: topCount,
      include: { registration: { include: { user: true, olympiad: true } } },
    });

    const generated: string[] = [];
    for (const result of results) {
      try {
        const url = await this.filesService.generateCertificate(result.registrationId);
        await this.prisma.result.update({
          where: { id: result.id },
          data: { certificateUrl: url },
        });
        generated.push(url);
      } catch (error) {
        this.logger.error(`Certificate generation failed for ${result.registrationId}`, error);
      }
    }

    return { count: generated.length, urls: generated };
  }

  async getStats(olympiadId?: string) {
    const where = olympiadId ? { registration: { olympiadId } } : {};

    const [total, avgScore, maxScore, minScore, scoreDistribution] = await Promise.all([
      this.prisma.result.count({ where }),
      this.prisma.result.aggregate({ where, _avg: { score: true } }),
      this.prisma.result.aggregate({ where, _max: { score: true } }),
      this.prisma.result.aggregate({ where, _min: { score: true } }),
      this.prisma.result.groupBy({
        by: ['score'],
        where,
        _count: { id: true },
        orderBy: { score: 'desc' },
        take: 20,
      }),
    ]);

    return {
      total,
      avgScore: avgScore._avg.score || 0,
      maxScore: maxScore._max.score || 0,
      minScore: minScore._min.score || 0,
      scoreDistribution: scoreDistribution.map(d => ({
        score: d.score,
        count: d._count.id,
      })),
    };
  }
}