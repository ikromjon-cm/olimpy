import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard statistikasi' })
  @ApiResponse({ status: 200 })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Foydalanuvchilar ro\'yxati' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async getUsers(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getUsers({
      role,
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('registrations')
  @ApiOperation({ summary: 'Barcha arizalar (Admin)' })
  @ApiQuery({ name: 'olympiadId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async getRegistrations(
    @Query('olympiadId') olympiadId?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getRegistrations({ olympiadId, status, locationId, search, page: Number(page), limit: Number(limit) });
  }

  @Get('registrations/export/:olympiadId')
  @ApiOperation({ summary: 'Ro\'yxatdan o\'tganlarni eksport qilish' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv'] })
  @ApiResponse({ status: 200 })
  async exportRegistrations(
    @Param('olympiadId') olympiadId: string,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res: Response,
  ) {
    const data = await this.adminService.exportRegistrations(olympiadId, format);
    
    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="registrations-${olympiadId}.csv"`);
      return res.send(headers + '\n' + rows);
    }
    
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  }

  @Get('export/:olympiadId')
  @ApiOperation({ summary: 'Eksport (alias for frontend compatibility)' })
  async exportRegistrationsAlias(@Param('olympiadId') olympiadId: string, @Query('format') format: 'excel' | 'csv' = 'excel') {
    return this.adminService.exportRegistrations(olympiadId, format);
  }

  // Location management
  @Get('locations')
  @ApiOperation({ summary: 'Binolar ro\'yxati' })
  @ApiQuery({ name: 'includeRooms', required: false, type: Boolean })
  async getLocations(@Query('includeRooms') includeRooms?: string) {
    return this.adminService.getLocations(includeRooms === 'true');
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Bino ma\'lumoti' })
  async getLocation(@Param('id') id: string) {
    return this.adminService.getLocation(id);
  }

  @Post('locations')
  @ApiOperation({ summary: 'Yangi bino qo\'shish' })
  async createLocation(@Body() data: { name: string; address: string; mapLink?: string; contactPhone?: string; contactPerson?: string }) {
    return this.adminService.createLocation(data);
  }

  @Put('locations/:id')
  @ApiOperation({ summary: 'Binoni tahrirlash' })
  async updateLocation(@Param('id') id: string, @Body() data: Partial<{ name: string; address: string; mapLink: string; contactPhone: string; contactPerson: string; isActive: boolean }>) {
    return this.adminService.updateLocation(id, data);
  }

  @Delete('locations/:id')
  @ApiOperation({ summary: 'Binoni o\'chirish' })
  async deleteLocation(@Param('id') id: string) {
    return this.adminService.deleteLocation(id);
  }

  // Room management
  @Get('rooms/:locationId')
  @ApiOperation({ summary: 'Xonalar ro\'yxati' })
  async getRooms(@Param('locationId') locationId: string) {
    return this.adminService.getRooms(locationId);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Yangi xona qo\'shish' })
  async createRoom(@Body() data: { locationId: string; roomNumber: string; capacity: number; floor?: number; description?: string }) {
    return this.adminService.createRoom(data);
  }

  @Post('rooms/bulk')
  @ApiOperation({ summary: 'Bir nechta xonani bir vaqtda qo\'shish' })
  async bulkCreateRooms(@Body() data: { locationId: string; rooms: { roomNumber: string; capacity: number; floor?: number }[] }) {
    return this.adminService.bulkCreateRooms(data.locationId, data.rooms);
  }

  @Put('rooms/:id')
  @ApiOperation({ summary: 'Xonani tahrirlash' })
  async updateRoom(@Param('id') id: string, @Body() data: Partial<{ roomNumber: string; capacity: number; floor: number; description: string; isActive: boolean }>) {
    return this.adminService.updateRoom(id, data);
  }

  @Delete('rooms/:id')
  @ApiOperation({ summary: 'Xonani o\'chirish' })
  async deleteRoom(@Param('id') id: string) {
    return this.adminService.deleteRoom(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit loglar' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.adminService.getAuditLogs({ userId, action, entity, page: Number(page), limit: Number(limit) });
  }

  @Post('settings')
  @ApiOperation({ summary: 'Tizim sozlamalarini yangilash' })
  @ApiResponse({ status: 200 })
  async updateSetting(@Body() dto: { key: string; value: any }) {
    return this.adminService.setSetting(dto.key, dto.value);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Barcha sozlamalar' })
  @ApiResponse({ status: 200 })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('olympiads/:olympiadId/generate-certificates')
  @ApiOperation({ summary: 'Sertifikatlar generatsiya qilish' })
  @ApiQuery({ name: 'topCount', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async generateCertificates(
    @Param('olympiadId') olympiadId: string,
    @Query('topCount') topCount = 10,
  ) {
    return this.adminService.generateCertificatesForTop(olympiadId, Number(topCount));
  }

  @Post('users/:userId/role')
  @ApiOperation({ summary: 'Foydalanuvchi rolini o\'zgartirish' })
  @ApiResponse({ status: 200 })
  async updateUserRole(@Param('userId') userId: string, @Body('role') role: Role) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Post('users/:userId/toggle-status')
  @ApiOperation({ summary: 'Foydalanuvchi holatini o\'zgartirish' })
  @ApiResponse({ status: 200 })
  async toggleUserStatus(@Param('userId') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }
}