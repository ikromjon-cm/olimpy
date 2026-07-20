import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegionsService } from './regions.service';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha regionlar ro\'yxati (tartiblangan)' })
  @ApiResponse({ status: 200, description: 'Regionlar ro\'yxati' })
  async findAll() {
    return this.regionsService.findAll();
  }

  @Get(':id/districts')
  @ApiOperation({ summary: 'Region bo\'yicha tumanlar ro\'yxati' })
  @ApiResponse({ status: 200, description: 'Tumanlar ro\'yxati' })
  @ApiResponse({ status: 404, description: 'Region topilmadi' })
  async getDistricts(@Param('id') id: string) {
    return this.regionsService.getDistricts(id);
  }
}
