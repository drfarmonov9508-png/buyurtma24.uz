import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('v1/services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  findAll(@Query('active') active = 'true') {
    return this.service.findAll(active !== 'false');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
