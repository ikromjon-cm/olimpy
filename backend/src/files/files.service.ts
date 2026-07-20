import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async generateTicket(registrationId: string): Promise<string> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        user: { select: { fullName: true, phoneNumber: true, schoolName: true, grade: true } },
        olympiad: true,
        location: true,
        room: true,
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    const fileName = `ticket-${registration.id}-${Date.now()}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);

    // Generate QR code
    const qrData = JSON.stringify({
      registrationId: registration.id,
      qrToken: registration.qrCodeToken,
      olympiad: registration.olympiad.title,
      user: registration.user.fullName,
    });
    
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 200,
      margin: 2,
      color: { dark: '#1e40af', light: '#ffffff' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Chipta - ${registration.olympiad.title}`,
          Author: 'Olimpiy',
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Colors
      const primaryColor = '#1e40af';
      const goldColor = '#d97706';
      const lightGray = '#f3f4f6';
      const darkGray = '#1f2937';

      // Background pattern
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');

      // Header
      doc.rect(50, 50, doc.page.width - 100, 120).fill(primaryColor);
      
      // Logo area
      doc.fontSize(28).font('Helvetica-Bold').fillColor('white').text('OLIMPIY', 70, 70);
      doc.fontSize(14).font('Helvetica').text('Olimpiada Offline Platformasi', 70, 105);

      // Ticket type badge
      doc.rect(doc.page.width - 200, 70, 150, 35).fill(goldColor);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('white').text('CHIPTA', doc.page.width - 190, 78, { width: 130, align: 'center' });

      // Olympiad info
      let yPos = 200;
      doc.fontSize(24).font('Helvetica-Bold').fillColor(darkGray).text(registration.olympiad.title, 50, yPos);
      yPos += 35;
      
      doc.fontSize(14).font('Helvetica').fillColor('#6b7280').text(`Fan: ${registration.olympiad.subject}`, 50, yPos);
      yPos += 25;
      
      const examDate = new Date(registration.olympiad.examDate).toLocaleDateString('uz-UZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const examTime = new Date(registration.olympiad.examDate).toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(`Sana va vaqt: ${examDate} soat ${examTime}`, 50, yPos);
      yPos += 25;

      // Location info
      doc.fontSize(14).fillColor(darkGray).text(`Bino: ${registration.location.name}`, 50, yPos);
      yPos += 20;
      doc.fontSize(12).fillColor('#6b7280').text(`Manzil: ${registration.location.address}`, 50, yPos);
      yPos += 20;
      doc.fontSize(14).fillColor(darkGray).text(`Xona: ${registration.room.roomNumber}`, 50, yPos);
      yPos += 20;
      doc.fontSize(14).fillColor(darkGray).text(`Parta raqami: ${registration.seatNumber}`, 50, yPos);
      yPos += 40;

      // Student info box
      doc.rect(50, yPos, doc.page.width - 100, 100).fill(lightGray).stroke('#e5e7eb');
      doc.fontSize(14).font('Helvetica-Bold').fillColor(darkGray).text('O\'QUVCHI MA\'LUMOTLARI', 70, yPos + 15);
      
      doc.fontSize(12).font('Helvetica').fillColor('#374151').text(`F.I.O: ${registration.user.fullName}`, 70, yPos + 45);
      doc.text(`Telefon: ${registration.user.phoneNumber}`, 70, yPos + 65);
      doc.text(`Maktab: ${registration.user.schoolName || 'Kiritilmagan'}`, 350, yPos + 45);
      doc.text(`Sinf: ${registration.user.grade || 'Kiritilmagan'}-sinf`, 350, yPos + 65);
      
      yPos += 130;

      // QR Code section
      doc.rect(50, yPos, 200, 120).fill('white').stroke('#e5e7eb');
      doc.image(qrCodeBuffer, 75, yPos + 20, { width: 150, height: 150 });
      doc.fontSize(10).fillColor('#6b7280').text('QR kodni skaner qiling', 50, yPos + 180, { width: 200, align: 'center' });

      // Ticket info on right of QR
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkGray).text('CHIPTA MA\'LUMOTLARI', 280, yPos + 20);
      
      const ticketInfo = [
        { label: 'Chipta ID', value: registration.id.slice(0, 8).toUpperCase() },
        { label: 'QR Token', value: registration.qrCodeToken.slice(0, 12) + '...' },
        { label: 'Til', value: registration.lang.toUpperCase() },
        { label: 'Holat', value: 'TASDIQLANGAN' },
      ];

      ticketInfo.forEach((info, index) => {
        const itemY = yPos + 50 + index * 22;
        doc.fontSize(10).fillColor('#6b7280').text(info.label + ':', 280, itemY);
        doc.font('Helvetica-Bold').fillColor(darkGray).text(info.value, 400, itemY);
      });

      // Rules section
      yPos += 160;
      doc.rect(50, yPos, doc.page.width - 100, 120).fill('#fef3c7').stroke('#f59e0b');
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#92400e').text('MUHIM QOIDALAR', 70, yPos + 15);
      
      const rules = [
        '1. Imtihon boshlanishidan 30 daqiqa oldin kelib boring.',
        '2. Shaxsiy hujjat (pasport/shaxsiy) va ushbu chiptani albatta olib boring.',
        '3. Mobil telefon, soatlar va boshqa elektron qurilmalar man etiladigan.',
        '4. Imtihon davriida suhbatlashish, nusxa ko\'chirish taqiqlanadi.',
        '5. Nazoratchi buyrug\'ilari ga amal qilishingiz shart.',
      ];

      rules.forEach((rule, index) => {
        doc.fontSize(10).font('Helvetica').fillColor('#78350f').text(rule, 70, yPos + 45 + index * 20);
      });

      // Footer
      yPos += 140;
      doc.fontSize(10).fillColor('#9ca3af').text(
        'Bu chipta "Olimpiy" platformasi tomonidan avtomatik generatsiya qilingan. nusxalash taqiqlanadi.',
        50,
        doc.page.height - 60,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.fontSize(8).fillColor('#d1d5db').text(
        `Generatsiya qilingan: ${new Date().toLocaleString('uz-UZ')} | olimpiy.uz`,
        50,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();

      stream.on('finish', () => {
        this.logger.log(`Ticket generated: ${filePath}`);
        resolve(`/uploads/${fileName}`);
      });

      stream.on('error', (error) => {
        this.logger.error('PDF generation error', error);
        reject(error);
      });
    });
  }

  async generateCertificate(registrationId: string): Promise<string> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        user: { select: { fullName: true } },
        olympiad: true,
        result: true,
      },
    });

    if (!registration || !registration.result) {
      throw new Error('Registration or result not found');
    }

    const fileName = `certificate-${registration.id}-${Date.now()}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 60,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Certificate design
      const width = doc.page.width;
      const height = doc.page.height;

      // Border
      doc.rect(30, 30, width - 60, height - 60).lineWidth(3).stroke('#d97706');
      doc.rect(40, 40, width - 80, height - 80).lineWidth(1).stroke('#d97706');

      // Header
      doc.fontSize(18).font('Helvetica').fillColor('#1f2937').text('O\'ZBEKISTON RESPUBLIKASI', width / 2, 80, { align: 'center' });
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#d97706').text('OLIMPIADA ISHTIROKCHISI', width / 2, 110, { align: 'center' });

      // Decorative line
      doc.moveTo(width / 2 - 100, 150).lineTo(width / 2 + 100, 150).lineWidth(2).stroke('#d97706');

      // Main text
      doc.fontSize(24).font('Helvetica').fillColor('#1f2937').text('SERTIFIKAT', width / 2, 170, { align: 'center' });
      doc.fontSize(14).font('Helvetica').fillColor('#374151').text('Bu sertifikat quyidagi ishtirokchiga berilgan:', width / 2, 220, { align: 'center' });

      // Student name
      doc.fontSize(32).font('Helvetica-Bold').fillColor('#1e40af').text(registration.user.fullName.toUpperCase(), width / 2, 260, { align: 'center' });

      // Olympiad info
      doc.fontSize(14).font('Helvetica').fillColor('#374151').text(
        `${registration.olympiad.title} (${registration.olympiad.subject})`,
        width / 2,
        320,
        { align: 'center' }
      );

      // Score and rank
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#d97706').text(
        'Yig\'Ball: ' + (registration.result?.score ?? '') + ' | Reyting: ' + (registration.result?.rank ?? '') + '-o\'rin', width / 2, 370, { align: 'center' });

      // Date and signature lines
      doc.fontSize(12).font('Helvetica').fillColor('#6b7280').text(
        `Sana: ${new Date().toLocaleDateString('uz-UZ')}`,
        100,
        height - 140
      );

      doc.text(
        'Tashkilotchi komitet raisi imzosi',
        width - 300,
        height - 140,
        { width: 200, align: 'center' }
      );

      doc.moveTo(width - 300, height - 100).lineTo(width - 100, height - 100).stroke('#6b7280');

      // QR code for verification
      const qrData = JSON.stringify({
        type: 'certificate',
        registrationId: registration.id,
        score: registration.result?.score,
        rank: registration.result?.rank,
      });

      QRCode.toBuffer(qrData, { width: 80 }).then((qrBuffer) => {
        doc.image(qrBuffer, width - 120, 60, { width: 80, height: 80 });
        doc.fontSize(8).fillColor('#9ca3af').text('Tekshirish uchun', width - 120, 145, { width: 80, align: 'center' });
        doc.end();
      });

      stream.on('finish', () => {
        this.logger.log(`Certificate generated: ${filePath}`);
        resolve(`/uploads/${fileName}`);
      });

      stream.on('error', reject);
    });
  }

  async fileExists(fileUrl: string): Promise<boolean> {
    if (!fileUrl) return false;
    const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
    return fs.existsSync(filePath);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;
    const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    }
  }

  getUploadPath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }

  async uploadFile(file: any): Promise<string> {
    if (!file) {
      throw new Error('File not provided');
    }
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${fileName}`;
  }
}