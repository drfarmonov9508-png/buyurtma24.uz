import { Controller, Get, Param, Query, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BilliardService } from './billiard.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Billiard')
@Controller('v1/billiard')
export class BilliardController {
  constructor(private readonly service: BilliardService) {}

  @Get('clubs')
  findClubs(
    @Query('regionId') regionId?: string,
    @Query('serviceSlug') serviceSlug?: string,
  ) {
    return this.service.findClubs(regionId, serviceSlug);
  }

  @Get('clubs/:id')
  findClub(@Param('id') id: string) {
    return this.service.findClub(id);
  }

  @Get('clubs/:id/tables')
  findClubTables(@Param('id') id: string) {
    return this.service.findTables(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('tables/:id/book')
  bookTable(
    @Param('id') tableId: string,
    @CurrentUser('id') userId: string,
    @Body('startAt') startAt: string,
    @Body('durationMinutes') durationMinutes: number,
    @Body('note') note?: string,
  ) {
    return this.service.bookTable(userId, tableId, new Date(startAt), durationMinutes ?? 60, note);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('orders/my')
  findMyOrders(@CurrentUser('id') userId: string) {
    return this.service.findMyOrders(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Get('admin/snapshot')
  adminSnapshot(@CurrentUser('tenantId') tenantId: string) {
    return this.service.adminSnapshot(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Get('admin/analytics')
  getAnalytics(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getAnalytics(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('types')
  createType(@CurrentUser('tenantId') tenantId: string, @Body() data: any) {
    return this.service.createType(tenantId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('tables')
  createTable(@CurrentUser('tenantId') tenantId: string, @Body() data: any) {
    return this.service.createTable(tenantId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('extras')
  createExtra(@CurrentUser('tenantId') tenantId: string, @Body() data: any) {
    return this.service.createExtra(tenantId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Patch('extras/:id')
  updateExtra(@Param('id') id: string, @Body() data: any) {
    return this.service.updateExtra(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('tables/:id/open')
  openTable(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.service.openTable(adminId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Patch('orders/items/:id/acknowledge')
  acknowledgeItem(@Param('id') id: string) {
    return this.service.acknowledgeItem(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('orders/:id/close')
  closeOrder(@Param('id') id: string) {
    return this.service.closeOrder(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Get('orders/pending')
  findPending(@Query('clubId') clubId: string) {
    return this.service.findPendingOrders(clubId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('orders/:id/confirm')
  confirmOrder(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.service.confirmOrder(id, adminId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BILLIARD_ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @Post('orders/:id/items')
  addOrderItem(@Param('id') id: string, @Body('extraId') extraId: string, @Body('quantity') quantity: number) {
    return this.service.addOrderItem(id, extraId, quantity || 1);
  }
}
