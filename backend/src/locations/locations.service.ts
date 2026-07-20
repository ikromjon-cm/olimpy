import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Location, Room } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  // Location methods
  async create(data: { name: string; address: string; mapLink?: string; contactPhone?: string; contactPerson?: string }) {
    return this.prisma.location.create({ data });
  }

  async findAll(includeRooms = false) {
    return this.prisma.location.findMany({
      where: { isActive: true },
      include: {
        rooms: includeRooms ? { where: { isActive: true }, orderBy: { roomNumber: 'asc' } } : false,
        _count: { select: { rooms: true, registrations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, includeRooms = false) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        rooms: includeRooms ? { where: { isActive: true }, orderBy: { roomNumber: 'asc' } } : false,
        olympiads: { where: { isActive: true }, include: { olympiad: true } },
      },
    });

    if (!location) {
      throw new NotFoundException('Bino topilmadi');
    }

    return location;
  }

  async update(id: string, data: Partial<Location>) {
    return this.prisma.location.update({ where: { id }, data });
  }

  async delete(id: string) {
    const location = await this.findOne(id);
    
    const [rooms, registrations] = await Promise.all([
      this.prisma.room.count({ where: { locationId: id } }),
      this.prisma.registration.count({ where: { locationId: id } }),
    ]);

    if (rooms > 0) {
      throw new BadRequestException('Bu binoda xonalar mavjud. Avval ulardan bosh torting.');
    }
    if (registrations > 0) {
      throw new BadRequestException('Bu binoda arizalar mavjud. O\'chirish mumkin emas.');
    }

    return this.prisma.location.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const location = await this.findOne(id);
    return this.prisma.location.update({
      where: { id },
      data: { isActive: !location.isActive },
    });
  }

  // Room methods
  async createRoom(data: { locationId: string; roomNumber: string; capacity: number; floor?: number; description?: string }) {
    const location = await this.prisma.location.findUnique({ where: { id: data.locationId } });
    if (!location) throw new NotFoundException('Bino topilmadi');

    const existing = await this.prisma.room.findUnique({
      where: { locationId_roomNumber: { locationId: data.locationId, roomNumber: data.roomNumber } },
    });
    if (existing) throw new BadRequestException('Bu xona raqami allaqachon mavjud');

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

  async getRooms(locationId: string) {
    return this.prisma.room.findMany({
      where: { locationId, isActive: true },
      include: {
        _count: { select: { registrations: { where: { status: { not: 'CANCELLED' } } } } },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async getRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        location: true,
        registrations: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            user: { select: { fullName: true, phoneNumber: true } },
            olympiad: { select: { title: true } },
          },
          orderBy: { seatNumber: 'asc' },
        },
      },
    });

    if (!room) throw new NotFoundException('Xona topilmadi');
    return room;
  }

  async updateRoom(id: string, data: Partial<Room>) {
    return this.prisma.room.update({ where: { id }, data });
  }

  async deleteRoom(id: string) {
    const room = await this.getRoom(id);
    
    const activeRegistrations = room.registrations.filter(r => r.status !== 'CANCELLED');
    if (activeRegistrations.length > 0) {
      throw new BadRequestException('Bu xonada faol arizalar mavjud. O\'chirish mumkin emas.');
    }

    return this.prisma.room.delete({ where: { id } });
  }

  async bulkCreateRooms(locationId: string, rooms: { roomNumber: string; capacity: number; floor?: number }[]) {
    const results: any[] = [];
    
    for (const room of rooms) {
      try {
        const existing = await this.prisma.room.findUnique({
          where: { locationId_roomNumber: { locationId, roomNumber: room.roomNumber } },
        });
        
        if (existing) {
          results.push({ success: false, room, error: 'Xona raqami mavjud' });
          continue;
        }

        const created = await this.prisma.room.create({
          data: { locationId, ...room },
        });
        results.push({ success: true, room: created });
      } catch (error) {
        results.push({ success: false, room, error: error.message });
      }
    }

    return results;
  }

  async getRoomAvailability(olympiadId: string, locationId?: string) {
    const where: any = { isActive: true };
    if (locationId) where.locationId = locationId;

    const locations = await this.prisma.location.findMany({
      where,
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            _count: {
              select: { 
                registrations: { 
                  where: { 
                    olympiadId, 
                    status: { not: 'CANCELLED' } 
                  } 
                } 
              }
            },
          },
        },
        olympiads: {
          where: { olympiadId, isActive: true },
          select: { id: true },
        },
      },
    });

    return locations.map(loc => {
      const isForOlympiad = loc.olympiads.length > 0;
      const totalCapacity = loc.rooms.reduce((sum, r) => sum + r.capacity, 0);
      const occupied = loc.rooms.reduce((sum, r) => sum + r._count.registrations, 0);
      
      return {
        id: loc.id,
        name: loc.name,
        address: loc.address,
        mapLink: loc.mapLink,
        isForOlympiad,
        totalCapacity,
        occupied,
        available: totalCapacity - occupied,
        rooms: loc.rooms.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          capacity: r.capacity,
          occupied: r._count.registrations,
          available: r.capacity - r._count.registrations,
        })),
      };
    });
  }
}