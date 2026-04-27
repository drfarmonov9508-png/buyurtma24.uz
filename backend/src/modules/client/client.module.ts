import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Tenant])],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
