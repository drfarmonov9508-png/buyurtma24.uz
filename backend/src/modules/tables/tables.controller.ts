import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { TableStatus } from './table.entity';

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(user.tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('tenantId') tenantIdParam?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = user.tenantId || tenantIdParam || '';
    return this.service.findAll(tenantId, branchId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER, UserRole.CLIENT)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TableStatus,
    @Body('tenantId') tenantIdBody: string,
    @CurrentUser() user: any,
  ) {
    const tenantId = user.tenantId || tenantIdBody;
    return this.service.updateStatus(id, tenantId, status);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER)
  @Post(':id/qr')
  generateQr(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.generateQr(id, user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }
}
