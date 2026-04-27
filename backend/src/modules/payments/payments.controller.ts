import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService, ProcessPaymentDto } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Roles(UserRole.CASHIER, UserRole.CAFE_ADMIN)
  @Post('orders/:orderId')
  processPayment(
    @Param('orderId') orderId: string,
    @Body() dto: ProcessPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.processPayment(orderId, user.tenantId, dto, user.id);
  }

  @Roles(UserRole.CASHIER, UserRole.CAFE_ADMIN)
  @Post('orders/:orderId/split')
  splitBill(
    @Param('orderId') orderId: string,
    @Body() body: { splits: ProcessPaymentDto[] },
    @CurrentUser() user: any,
  ) {
    return this.service.splitBill(orderId, user.tenantId, body.splits, user.id);
  }

  @Post('orders/:orderId/refund-request')
  requestRefund(
    @Param('orderId') orderId: string,
    @Body() dto: { amount: number; reason: string; orderItemId?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.requestRefund(orderId, user.tenantId, dto, user.id);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Patch('refunds/:id')
  processRefund(
    @Param('id') id: string,
    @Body() body: { approve: boolean; rejectionReason?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.processRefund(id, user.tenantId, body.approve, user.id, body.rejectionReason);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.CASHIER)
  @Get()
  getPayments(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.getPayments(user.tenantId, +page, +limit);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('refunds')
  getRefundRequests(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.service.getRefundRequests(user.tenantId, status);
  }
}
