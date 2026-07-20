import { Controller, Get, Post, Param, Res, UseGuards, NotFoundException, ForbiddenException, BadRequestException, UseInterceptors, UploadedFile, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { Role } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Fayl yuklash (rasm, video, pdf va boshqalar)' })
  @ApiResponse({ status: 201, description: 'Yuklangan fayl manzili' })
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }
    const fileUrl = await this.filesService.uploadFile(file);
    return { url: fileUrl, filename: file.originalname, size: file.size, mimetype: file.mimetype };
  }

  @UseGuards(JwtAuthGuard)
  @Get('ticket/:registrationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chipta PDF yuklab olish' })
  @ApiResponse({ status: 200, description: 'PDF fayl' })
  async downloadTicket(
    @Param('registrationId') registrationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Res() res: Response,
  ) {
    const registration = await this.filesService['prisma'].registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Ariza topilmadi');
    }

    if (userRole !== Role.ADMIN && registration.userId !== userId) {
      throw new ForbiddenException('Bu chiptaga kirish huquqi yo\'q');
    }

    if (registration.status !== 'PAID') {
      throw new BadRequestException('Faqat to\'langan arizalar uchun chipta mavjud');
    }

    let ticketUrl = registration.ticketUrl;
    
    if (!ticketUrl || !(await this.filesService.fileExists(ticketUrl))) {
      ticketUrl = await this.filesService.generateTicket(registrationId);
    }

    const filePath = this.filesService.getUploadPath(path.basename(ticketUrl));
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${registrationId}.pdf"`);
    res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get('certificate/:registrationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sertifikat PDF yuklab olish' })
  @ApiResponse({ status: 200, description: 'PDF fayl' })
  async downloadCertificate(
    @Param('registrationId') registrationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Res() res: Response,
  ) {
    const registration = await this.filesService['prisma'].registration.findUnique({
      where: { id: registrationId },
      include: { result: true },
    });

    if (!registration) {
      throw new NotFoundException('Ariza topilmadi');
    }

    if (userRole !== Role.ADMIN && registration.userId !== userId) {
      throw new ForbiddenException('Bu sertifikatga kirish huquqi yo\'q');
    }

    if (!registration.result) {
      throw new BadRequestException('Sertifikat hali yaratilmagan');
    }

    let certificateUrl = registration.result.certificateUrl;
    
    if (!certificateUrl || !(await this.filesService.fileExists(certificateUrl))) {
      certificateUrl = await this.filesService.generateCertificate(registrationId);
      
      await this.filesService['prisma'].result.update({
        where: { registrationId },
        data: { certificateUrl },
      });
    }

    const filePath = this.filesService.getUploadPath(path.basename(certificateUrl));
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${registrationId}.pdf"`);
    res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/export/:olympiadId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Olimpiada ro\'yxatini Excel ga eksport qilish (Admin)' })
  @ApiResponse({ status: 200, description: 'Excel fayl' })
  async exportRegistrations(@Param('olympiadId') olympiadId: string, @Res() res: Response) {
    const buffer = await this.registrationsService.exportToExcel(olympiadId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="arizalar-${olympiadId.slice(0,8)}-${Date.now()}.xlsx"`);
    res.send(buffer);
  }
}