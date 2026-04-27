import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(user.tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findAll(user.tenantId, {
      categoryId,
      active: active !== undefined ? active === 'true' : undefined,
      search,
      page: +page,
      limit: +limit,
    });
  }

  @Get('stop-list')
  getStopList(@CurrentUser() user: any) {
    return this.service.getStopList(user.tenantId);
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

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @Patch(':id/stop-list')
  toggleStopList(
    @Param('id') id: string,
    @Body('isStopList') isStopList: boolean,
    @CurrentUser() user: any,
  ) {
    return this.service.toggleStopList(id, user.tenantId, isStopList);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }
}
