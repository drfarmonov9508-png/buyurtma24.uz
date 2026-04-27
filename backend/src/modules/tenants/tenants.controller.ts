import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService, CreateTenantDto, UpdateTenantDto } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { TenantStatus } from './tenant.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Public()
  @Get('public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active cafes (public, no auth)' })
  findPublic() {
    return this.service.findPublic();
  }

  @Roles(UserRole.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Create new cafe/tenant' })
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Roles(UserRole.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
  ) {
    return this.service.findAll(+page, +limit, search, status);
  }

  @Roles(UserRole.SUPERADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    return this.service.toggleStatus(id, status);
  }

  @Roles(UserRole.SUPERADMIN)
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.service.getStats(id);
  }

  @Roles(UserRole.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
