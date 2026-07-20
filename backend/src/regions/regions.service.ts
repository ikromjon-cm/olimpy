import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.region.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async getDistricts(regionId: string) {
    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
    });
    if (!region) {
      throw new NotFoundException('Region topilmadi');
    }

    return this.prisma.district.findMany({
      where: { regionId },
      orderBy: { name: 'asc' },
    });
  }
}
