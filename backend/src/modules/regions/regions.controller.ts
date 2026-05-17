import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { RegionType } from './region.entity';

@ApiTags('Regions')
@Controller('v1/regions')
export class RegionsController {
  constructor(private readonly service: RegionsService) {}

  @Get()
  findAll(@Query('type') type?: RegionType, @Query('parentId') parentId?: string) {
    return this.service.findAll(type as RegionType, parentId);
  }

  @Get('tree')
  findTree() {
    return this.service.findTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
