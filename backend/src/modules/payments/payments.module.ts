import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, RefundRequest } from './payment.entity';
import { Order } from '../orders/order.entity';
import { Table } from '../tables/table.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, RefundRequest, Order, Table])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
