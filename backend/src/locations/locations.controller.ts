import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LocationsService } from './locations.service';
import { Role } from '@prisma/client';

import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  mapLink?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;
}

class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  mapLink?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

class RoomItemDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @IsNumber()
  @IsOptional()
  floor?: number;
}

class BulkRoomsDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomItemDto)
  rooms: RoomItemDto[];
}

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // Public endpoints
  @Get()
  @ApiOperation({ summary: 'Barcha faol binolar' })
  @ApiResponse({ status: 200 })
  async findAll(@Query('includeRooms') includeRooms?: string) {
    return this.locationsService.findAll(includeRooms === 'true');
  }

  @Get('availability/:olympiadId')
  @ApiOperation({ summary: 'Olimpiada uchun bino bo\'sh joylari' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiResponse({ status: 200 })
  async getAvailability(
    @Param('olympiadId') olympiadId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.locationsService.getRoomAvailability(olympiadId, locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bino batafsil ma\'lumoti' })
  @ApiResponse({ status: 200 })
  async findOne(@Param('id') id: string, @Query('includeRooms') includeRooms?: string) {
    return this.locationsService.findOne(id, includeRooms === 'true');
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi bino yaratish (Admin)' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bino yangilash (Admin)' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bino o\'chirish (Admin)' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string) {
    return this.locationsService.delete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bino holatini o\'zgartirish (Admin)' })
  @ApiResponse({ status: 200 })
  async toggleActive(@Param('id') id: string) {
    return this.locationsService.toggleActive(id);
  }

  // Room endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('rooms')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi xona yaratish (Admin)' })
  @ApiResponse({ status: 201 })
  async createRoom(@Body() dto: CreateRoomDto) {
    return this.locationsService.createRoom(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('rooms/bulk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ko\'p xonalar yaratish (Admin)' })
  @ApiResponse({ status: 201 })
  async bulkCreateRooms(@Body() dto: BulkRoomsDto) {
    return this.locationsService.bulkCreateRooms(dto.locationId, dto.rooms);
  }

  @Get(':locationId/rooms')
  @ApiOperation({ summary: 'Binodagi xonalar' })
  @ApiResponse({ status: 200 })
  async getRooms(@Param('locationId') locationId: string) {
    return this.locationsService.getRooms(locationId);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Xona batafsil ma\'lumoti' })
  @ApiResponse({ status: 200 })
  async getRoom(@Param('id') id: string) {
    return this.locationsService.getRoom(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('rooms/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xona yangilash (Admin)' })
  @ApiResponse({ status: 200 })
  async updateRoom(@Param('id') id: string, @Body() dto: Partial<CreateRoomDto>) {
    return this.locationsService.updateRoom(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('rooms/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xona o\'chirish (Admin)' })
  @ApiResponse({ status: 200 })
  async deleteRoom(@Param('id') id: string) {
    return this.locationsService.deleteRoom(id);
  }
}