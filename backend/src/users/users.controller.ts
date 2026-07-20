import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { IsOptional, IsString, IsNumber, IsEnum, IsNotEmpty } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() schoolName?: string;
  @IsOptional() @IsNumber() grade?: number;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() parentPhone?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() password?: string;
}

class UpdateRoleDto {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Joriy foydalanuvchi profili' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi profili' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Profilni yangilash' })
  @ApiResponse({ status: 200, description: 'Profil yangilandi' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('students')
  @ApiOperation({ summary: 'O\'quvchilar ro\'yxati (Admin)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'schoolName', required: false })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'O\'quvchilar ro\'yxati' })
  async getStudents(
    @Query('search') search?: string,
    @Query('region') region?: string,
    @Query('district') district?: string,
    @Query('schoolName') schoolName?: string,
    @Query('grade') grade?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getStudents({
      search,
      region,
      district,
      schoolName,
      grade,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('proctors')
  @ApiOperation({ summary: 'Nazoratchilar ro\'yxati (Admin)' })
  @ApiResponse({ status: 200, description: 'Nazoratchilar ro\'yxati' })
  async getProctors() {
    return this.usersService.getProctors();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admins')
  @ApiOperation({ summary: 'Adminlar ro\'yxati (Admin)' })
  @ApiResponse({ status: 200, description: 'Adminlar ro\'yxati' })
  async getAdmins() {
    return this.usersService.getAdmins();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/role')
  @ApiOperation({ summary: 'Foydalanuvchi rolini o\'zgartirish (Admin)' })
  @ApiResponse({ status: 200, description: 'Rol o\'zgartirildi' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser('role') currentUserRole: Role) {
    return this.usersService.updateRole(id, dto.role, currentUserRole);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id/deactivate')
  @ApiOperation({ summary: 'Foydalanuvchini deaktivlashtirish (Admin)' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi deaktivlashtirildi' })
  async deactivate(@Param('id') id: string) {
    await this.usersService.deactivate(id);
    return { message: 'Foydalanuvchi deaktivlashtirildi' };
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/activate')
  @ApiOperation({ summary: 'Foydalanuvchini aktivlashtirish (Admin)' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi aktivlashtirildi' })
  async activate(@Param('id') id: string) {
    await this.usersService.activate(id);
    return { message: 'Foydalanuvchi aktivlashtirildi' };
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats')
  @ApiOperation({ summary: 'Foydalanuvchilar statistikasi (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistika' })
  async getStats() {
    return this.usersService.getStats();
  }
}