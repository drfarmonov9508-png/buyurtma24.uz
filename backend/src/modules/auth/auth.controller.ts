import { Controller, Post, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, StaffLoginDto, ClientLoginDto, ClientPhoneDto, RefreshTokenDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('superadmin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SuperAdmin login' })
  superadminLogin(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.superadminLogin(dto, req.ip);
  }

  @Public()
  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff login (admin, cashier, waiter, kitchen)' })
  staffLogin(@Body() dto: StaffLoginDto, @Req() req: Request) {
    return this.authService.staffLogin(dto, req.ip);
  }

  @Public()
  @Post('client/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Client login by phone only (no password, no tenant needed)' })
  clientPhoneAuth(@Body() dto: ClientPhoneDto) {
    return this.authService.clientPhoneAuth(dto);
  }

  @Public()
  @Post('client/:tenantSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guest client auth (create or login by phone) - legacy' })
  clientAuth(
    @Body() dto: ClientLoginDto,
    @Req() req: Request & { params: { tenantSlug: string } },
  ) {
    return this.authService.clientAuth(dto, req.params.tenantSlug);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }
}
