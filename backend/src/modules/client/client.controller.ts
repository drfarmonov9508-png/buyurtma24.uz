import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClientService } from './client.service';

@ApiTags('Client')
@Controller('v1/client')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get client order history across all tenants' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientService.getOrderHistory(userId, +(page || 1), +(limit || 20));
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get tenants where client has ordered' })
  getMyTenants(@CurrentUser('id') userId: string) {
    return this.clientService.getClientTenants(userId);
  }
}
