import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Roles(UserRole.CAFE_ADMIN)
  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(user.tenantId, dto);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get()
  findAll(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.service.findAll(user.tenantId, branchId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('low-stock')
  findLowStock(@CurrentUser() user: any) {
    return this.service.findLowStock(user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get('logs')
  getLogs(
    @CurrentUser() user: any,
    @Query('inventoryId') inventoryId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.getLogs(user.tenantId, inventoryId, +page, +limit);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Post(':id/adjust')
  adjust(
    @Param('id') id: string,
    @Body() body: { quantityChange: number; action: string; note?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.adjust(id, user.tenantId, body.quantityChange, body.action, body.note, user.id);
  }

  @Roles(UserRole.CAFE_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }
}
