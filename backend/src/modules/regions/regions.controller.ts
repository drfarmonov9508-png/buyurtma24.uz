import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { RegionType } from './region.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post()
  create(@Body() body: { name: string; type: RegionType; parentId?: string }) {
    return this.service.create(body);
  }
}
