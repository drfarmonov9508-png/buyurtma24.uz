import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Roles(UserRole.CAFE_ADMIN, UserRole.SUPERADMIN)
  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    return this.service.getDashboard(user.tenantId);
  }

  @Roles(UserRole.SUPERADMIN)
  @Get('superadmin/stats')
  getSuperAdminStats() {
    return this.service.getSuperAdminStats();
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('sales')
  getSales(
    @CurrentUser() user: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getSalesByPeriod(user.tenantId, period, dateFrom, dateTo);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('top-products')
  getTopProducts(
    @CurrentUser() user: any,
    @Query('limit') limit = 10,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getTopProducts(user.tenantId, +limit, dateFrom, dateTo);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('waiter-performance')
  getWaiterPerformance(
    @CurrentUser() user: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getWaiterPerformance(user.tenantId, dateFrom, dateTo);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('peak-hours')
  getPeakHours(@CurrentUser() user: any) {
    return this.service.getPeakHours(user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('cancellations')
  getCancellationReport(@CurrentUser() user: any) {
    return this.service.getCancellationReport(user.tenantId);
  }
}
