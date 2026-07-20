import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Registration, RegStatus, Role } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private filesService: FilesService,
  ) {}

  async create(userId: string, data: {
    olympiadId: string;
    locationId: string;
    roomId?: string;
    lang: 'uz' | 'ru' | 'en';
  }) {
    const { olympiadId, locationId, roomId, lang } = data;

    // Check if user already has registration for this olympiad
    const existing = await this.prisma.registration.findUnique({
      where: { olympiadId_userId: { olympiadId, userId } },
    });

    if (existing) {
      throw new ConflictException('Siz bu olimpiadaga allaqachon ariz bergan');
    }

    // Get olympiad with locations and rooms
    const olympiad = await this.prisma.olympiad.findUnique({
      where: { id: olympiadId },
      include: {
        locations: {
          where: { locationId: locationId, isActive: true },
          include: { location: { include: { rooms: { where: { isActive: true } } } } },
        },
      },
    });

    if (!olympiad || !olympiad.isActive) {
      throw new NotFoundException('Olimpiada topilmadi yoki faol emas');
    }

    if (new Date() > olympiad.regEndDate) {
      throw new BadRequestException('Ro\'yxatdan o\'tish muddati tugagan');
    }

    // Check if location is valid for this olympiad
    const olympiadLocation = olympiad.locations[0];
    if (!olympiadLocation) {
      throw new BadRequestException('Bu olimpiada uchun tanlangan bino mavjud emas');
    }

    // Use transaction with SERIALIZABLE isolation for race condition prevention
    const result = await this.prisma.$transaction(async (tx) => {
      // Lock the rooms for this location to prevent race conditions
      const rooms = await tx.room.findMany({
        where: {
          locationId,
          isActive: true,
          ...(roomId ? { id: roomId } : {}),
        },
        orderBy: { roomNumber: 'asc' },
      });

      if (rooms.length === 0) {
        throw new BadRequestException('Faol xonalar topilmadi');
      }

      // Find available room with capacity
      let selectedRoom: any = null;
      let assignedSeat = 0;

      for (const room of rooms) {
        const currentCount = await tx.registration.count({
          where: { roomId: room.id, olympiadId, status: { not: 'CANCELLED' } },
        });

        if (currentCount < room.capacity) {
          selectedRoom = room;
          assignedSeat = currentCount + 1;
          break;
        }
      }

      if (!selectedRoom) {
        throw new ConflictException('Barcha joylar band. Boshqa bino tanlang.');
      }

      // Create registration with seat assignment
      const registration = await tx.registration.create({
        data: {
          userId,
          olympiadId,
          locationId,
          roomId: selectedRoom.id,
          seatNumber: assignedSeat,
          lang,
          status: 'PENDING',
        },
        include: {
          user: { select: { id: true, fullName: true, phoneNumber: true } },
          olympiad: true,
          location: true,
          room: true,
        },
      });

      // Update room current seats
      await tx.room.update({
        where: { id: selectedRoom.id },
        data: { currentSeats: { increment: 1 } },
      });

      return { registration, selectedRoom, assignedSeat };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 15000,
    });

    this.logger.log(`Registration created: ${result.registration.id} for user ${userId}, seat ${result.assignedSeat} in room ${result.selectedRoom.roomNumber}`);

    return result.registration;
  }

  async findByUser(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      include: {
        olympiad: true,
        location: true,
        room: true,
        payment: true,
        attendance: true,
        result: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId?: string, userRole?: Role) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, phoneNumber: true, schoolName: true, grade: true } },
        olympiad: true,
        location: true,
        room: true,
        payment: true,
        attendance: true,
        result: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Ariza topilmadi');
    }

    // Check access permissions
    if (userId && userRole !== Role.ADMIN && registration.userId !== userId) {
      throw new ForbiddenException('Bu arizaga kirish huquqi yo\'q');
    }

    return registration;
  }

  async findByQrToken(qrCodeToken: string) {
    return this.prisma.registration.findUnique({
      where: { qrCodeToken },
      include: {
        user: { select: { id: true, fullName: true, phoneNumber: true, schoolName: true, grade: true } },
        olympiad: true,
        location: true,
        room: true,
        payment: true,
        attendance: true,
      },
    });
  }

  async cancel(id: string, userId: string, userRole: Role) {
    const registration = await this.findById(id, userId, userRole);

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('Ariza allaqachon bekor qilingan');
    }

    if (registration.status === 'PAID') {
      throw new BadRequestException('To\'langan arizani bekor qilib bo\'lmaydi. Admin bilan bog\'laning.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.registration.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      await tx.room.update({
        where: { id: registration.roomId },
        data: { currentSeats: { decrement: 1 } },
      });

      return updated;
    });
  }

  async generateTicket(registrationId: string, userId: string, userRole: Role): Promise<string> {
    const registration = await this.findById(registrationId, userId, userRole);

    if (registration.status !== 'PAID') {
      throw new BadRequestException('Faqat to\'langan arizalar uchun chipta generatsiya qilinadi');
    }

    if (registration.ticketUrl) {
      // Check if file still exists
      const exists = await this.filesService.fileExists(registration.ticketUrl);
      if (exists) {
        return registration.ticketUrl;
      }
    }

    const ticketUrl = await this.filesService.generateTicket(registrationId);
    
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { ticketUrl },
    });

    return ticketUrl;
  }

  async getAvailableLocations(olympiadId: string) {
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
      },
    });

    if (!olympiad) {
      throw new NotFoundException('Olimpiada topilmadi');
    }

    return olympiad.locations.map(ol => {
      const totalCapacity = ol.location.rooms.reduce((sum, r) => sum + r.capacity, 0);
      const totalOccupied = ol.location.rooms.reduce((sum, r) => sum + r.currentSeats, 0);
      
      return {
        id: ol.location.id,
        name: ol.location.name,
        address: ol.location.address,
        mapLink: ol.location.mapLink,
        totalCapacity,
        availableSeats: totalCapacity - totalOccupied,
        rooms: ol.location.rooms.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          capacity: r.capacity,
          availableSeats: r.capacity - r.currentSeats,
        })),
      };
    });
  }

  async findAllAdmin(filters: {
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
        { user: { fullName: { contains: search, mode: 'insensitive' as const } } },
        { user: { phoneNumber: { contains: search } } },
        { user: { schoolName: { contains: search, mode: 'insensitive' as const } } },
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

  async exportToExcel(olympiadId: string): Promise<Buffer> {
    const registrations = await this.prisma.registration.findMany({
      where: { olympiadId },
      include: {
        user: { select: { fullName: true, phoneNumber: true, schoolName: true, grade: true, region: true, district: true } },
        olympiad: { select: { title: true, subject: true, examDate: true } },
        location: { select: { name: true, address: true } },
        room: { select: { roomNumber: true } },
        payment: { select: { status: true, amount: true, transactionId: true } },
        attendance: { select: { status: true, scannedAt: true } },
        result: { select: { score: true, rank: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Olimpiy';
    workbook.created = new Date();

    // Sheet 1: Registrations
    const ws = workbook.addWorksheet('Arizalar');
    
    ws.columns = [
      { header: '#', key: 'no', width: 5 },
      { header: 'F.I.O', key: 'fullName', width: 30 },
      { header: 'Telefon', key: 'phoneNumber', width: 18 },
      { header: 'Maktab', key: 'schoolName', width: 25 },
      { header: 'Sinf', key: 'grade', width: 8 },
      { header: 'Viloyat', key: 'region', width: 20 },
      { header: 'Tuman', key: 'district', width: 20 },
      { header: 'Olimpiada', key: 'olympiad', width: 30 },
      { header: 'Fan', key: 'subject', width: 15 },
      { header: 'Bino', key: 'location', width: 20 },
      { header: 'Xona', key: 'room', width: 10 },
      { header: 'Holat', key: 'status', width: 15 },
      { header: 'To\'lov', key: 'paymentStatus', width: 15 },
      { header: 'Summa', key: 'amount', width: 12 },
      { header: 'Davomat', key: 'attendance', width: 15 },
      { header: 'Ball', key: 'score', width: 8 },
      { header: 'O\'rin', key: 'rank', width: 8 },
      { header: 'Ro\'yxatdan o\'tgan', key: 'createdAt', width: 20 },
    ];

    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    registrations.forEach((reg, index) => {
      const row = {
        no: index + 1,
        fullName: reg.user?.fullName || '',
        phoneNumber: reg.user?.phoneNumber || '',
        schoolName: reg.user?.schoolName || '',
        grade: reg.user?.grade ? `${reg.user.grade}-sinf` : '',
        region: reg.user?.region || '',
        district: reg.user?.district || '',
        olympiad: reg.olympiad?.title || '',
        subject: reg.olympiad?.subject || '',
        location: reg.location?.name || '',
        room: reg.room?.roomNumber || '',
        status: reg.status,
        paymentStatus: reg.payment?.status || '-',
        amount: reg.payment?.amount ? `${reg.payment.amount} so\'m` : '-',
        attendance: reg.attendance?.status || '-',
        score: reg.result?.score ?? '-',
        rank: reg.result?.rank ? `#${reg.result.rank}` : '-',
        createdAt: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('uz-UZ') : '',
      };
      ws.addRow(row);

      // Alternate row coloring
      const rowNum = index + 2;
      if (index % 2 === 0) {
        ws.getRow(rowNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      ws.getRow(rowNum).alignment = { vertical: 'middle' };
    });

    // Sheet 2: Statistics
    const ws2 = workbook.addWorksheet('Statistika');
    
    const olympiad = registrations[0]?.olympiad;
    if (olympiad) {
      ws2.addRow(['Olimpiada', olympiad.title || '']);
      ws2.addRow(['Fan', olympiad.subject || '']);
      ws2.addRow(['Imtihon sanasi', olympiad.examDate ? new Date(olympiad.examDate).toLocaleDateString('uz-UZ') : '']);
      ws2.addRow([]);
    }
    
    ws2.addRow(['Statistika']);
    ws2.addRow(['Jami arizalar', registrations.length]);
    ws2.addRow(['Tasdiqlangan (PAID)', registrations.filter(r => r.status === 'PAID').length]);
    ws2.addRow(['Kutilmoqda (PENDING)', registrations.filter(r => r.status === 'PENDING').length]);
    ws2.addRow(['Bekor qilingan', registrations.filter(r => r.status === 'CANCELLED').length]);
    ws2.addRow([]);
    const scores = registrations.filter(r => r.result?.score != null).map(r => Number(r.result!.score));
    const avgScore = scores.length > 0 ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1) : '0.0';
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const participants = registrations.filter(r => r.status !== 'CANCELLED').length;
    const attended = registrations.filter(r => ['PRESENT', 'ATTENDED', 'SCANNED'].includes(r.attendance?.status || '')).length;
    const absent = registrations.filter(r => ['ABSENT', 'NO_SHOW'].includes(r.attendance?.status || '')).length;
    
    ws2.addRow(['Ballar bo\'yicha']);
    ws2.addRow(['O\'rtacha ball', avgScore]);
    ws2.addRow(['Eng yuqori ball', maxScore]);
    ws2.addRow(['Ishtirokchilar', participants]);
    ws2.addRow(['Kelganlar', attended]);
    ws2.addRow(['Kelmaganalar', absent]);

    // Style statistics sheet
    ws2.getRow(1).font = { bold: true, size: 14 };
    ws2.getRow(5).font = { bold: true, size: 12 };
    ws2.getRow(11).font = { bold: true, size: 12 };
    ws2.columns = [{ width: 25 }, { width: 20 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getStats(olympiadId?: string) {
    const where = olympiadId ? { olympiadId } : {};

    const [total, pending, paid, cancelled, byStatus, byLanguage] = await Promise.all([
      this.prisma.registration.count({ where }),
      this.prisma.registration.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.registration.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.registration.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.registration.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.registration.groupBy({
        by: ['lang'],
        where,
        _count: { id: true },
      }),
    ]);

    return { total, pending, paid, cancelled, byStatus, byLanguage };
  }
}