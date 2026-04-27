import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.SUPERADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    if (user.role !== UserRole.SUPERADMIN) dto.tenantId = user.tenantId;
    return this.service.create(dto);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.SUPERADMIN)
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('role') role?: UserRole,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll(user.tenantId, role, +page, +limit);
  }

  @Get('staff')
  getStaff(@CurrentUser() user: any) {
    return this.service.getStaff(user.tenantId);
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.service.update(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.SUPERADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.CAFE_ADMIN, UserRole.MANAGER, UserRole.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
