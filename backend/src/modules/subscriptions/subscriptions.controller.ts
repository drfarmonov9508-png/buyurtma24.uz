import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Public()
  @Get('plans')
  getPlans() {
    return this.service.getPlans();
  }

  @Roles(UserRole.SUPERADMIN)
  @Post('plans')
  createPlan(@Body() dto: any) {
    return this.service.createPlan(dto);
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.service.updatePlan(id, dto);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('my')
  getMySubscription(@CurrentUser() user: any) {
    return this.service.getTenantSubscription(user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Post('subscribe/:planId')
  subscribe(@Param('planId') planId: string, @CurrentUser() user: any) {
    return this.service.subscribe(user.tenantId, planId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Post('cancel')
  cancel(@CurrentUser() user: any) {
    return this.service.cancel(user.tenantId);
  }

  @Roles(UserRole.SUPERADMIN)
  @Get()
  getAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getAll(+page, +limit);
  }
}
