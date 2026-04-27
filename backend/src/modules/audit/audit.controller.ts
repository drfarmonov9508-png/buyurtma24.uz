import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Roles(UserRole.CAFE_ADMIN, UserRole.SUPERADMIN)
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findAll(user.tenantId, { userId, entity, action, page: +page, limit: +limit });
  }
}
