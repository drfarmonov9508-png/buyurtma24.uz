import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService, CreateOrderDto, AddItemsDto } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { OrderStatus, OrderType } from '../../common/enums/order-status.enum';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/orders')
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly gateway: OrdersGateway,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    const tenantId = user.tenantId || dto.tenantId;
    if (user.role === UserRole.CLIENT) dto.clientId = user.id;
    const order = await this.service.create(tenantId, dto, user.branchId);
    this.gateway.emitNewOrder(tenantId, order, user.branchId);
    return order;
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: OrderStatus,
    @Query('type') type?: OrderType,
    @Query('tableId') tableId?: string,
    @Query('waiterId') waiterId?: string,
    @Query('clientId') clientId?: string,
    @Query('tenantId') tenantIdParam?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = user.tenantId || tenantIdParam;
    const waiterId_ = user.role === UserRole.WAITER ? user.id : waiterId;
    const clientId_ = user.role === UserRole.CLIENT ? user.id : clientId;
    return this.service.findAll(tenantId, { status, type, tableId, waiterId: waiterId_, clientId: clientId_, page: +page, limit: +limit, dateFrom, dateTo });
  }

  @Get('kitchen')
  getKitchenOrders(@CurrentUser() user: any) {
    return this.service.getKitchenOrders(user.tenantId, user.branchId);
  }

  @Get('table/:tableId/active')
  getActiveTableOrder(@Param('tableId') tableId: string, @CurrentUser() user: any) {
    return this.service.getActiveTableOrders(user.tenantId, tableId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN, UserRole.WAITER)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @CurrentUser() user: any,
  ) {
    const order = await this.service.updateStatus(id, user.tenantId, status, user.id);
    this.gateway.emitOrderStatusChange(user.tenantId, order);
    return order;
  }

  @Roles(UserRole.KITCHEN)
  @Patch('items/:itemId/status')
  async updateItemStatus(
    @Param('itemId') itemId: string,
    @Body('status') status: OrderStatus,
    @CurrentUser() user: any,
  ) {
    return this.service.updateItemStatus(itemId, user.tenantId, status);
  }

  @Roles(UserRole.WAITER, UserRole.CASHIER, UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.CLIENT)
  @Post(':id/items')
  async addItems(
    @Param('id') id: string,
    @Body() dto: AddItemsDto,
    @CurrentUser() user: any,
  ) {
    const order = await this.service.addItems(id, user.tenantId, dto);
    this.gateway.emitOrderStatusChange(user.tenantId, order);
    return order;
  }

  @Roles(UserRole.CASHIER, UserRole.CAFE_ADMIN)
  @Patch(':id/discount')
  applyDiscount(
    @Param('id') id: string,
    @Body('discountAmount') discountAmount: number,
    @CurrentUser() user: any,
  ) {
    return this.service.applyDiscount(id, user.tenantId, discountAmount);
  }
}
