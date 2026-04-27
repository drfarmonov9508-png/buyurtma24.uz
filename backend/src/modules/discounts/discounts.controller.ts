import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/discounts')
export class DiscountsController {
  constructor(private readonly service: DiscountsService) {}

  @Roles(UserRole.CAFE_ADMIN)
  @Post()
  createDiscount(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createDiscount(user.tenantId, dto);
  }

  @Get()
  getDiscounts(@CurrentUser() user: any) {
    return this.service.getDiscounts(user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Post('promo-codes')
  createPromoCode(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createPromoCode(user.tenantId, dto);
  }

  @Get('promo-codes')
  getPromoCodes(@CurrentUser() user: any) {
    return this.service.getPromoCodes(user.tenantId);
  }

  @Post('promo-codes/validate')
  validatePromoCode(
    @Body() body: { code: string; orderAmount: number },
    @CurrentUser() user: any,
  ) {
    return this.service.validatePromoCode(body.code, user.tenantId, body.orderAmount);
  }

  @Get('wallet')
  getWallet(@CurrentUser() user: any) {
    return this.service.getBonusWallet(user.id, user.tenantId);
  }
}
