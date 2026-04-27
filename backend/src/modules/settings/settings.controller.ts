import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Roles(UserRole.CAFE_ADMIN)
  @Get()
  getSettings(@CurrentUser() user: any) {
    return this.service.getSettings(user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Patch()
  updateSettings(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateSettings(user.tenantId, dto);
  }
}
