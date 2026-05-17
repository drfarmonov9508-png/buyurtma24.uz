import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BilliardController } from './billiard.controller';
import { BilliardService } from './billiard.service';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable } from './billiard-table.entity';
import { BilliardOrder } from './billiard-order.entity';
import { BilliardTableType } from './billiard-table-type.entity';
import { BilliardExtra } from './billiard-extra.entity';
import { BilliardOrderItem } from './billiard-order-item.entity';
import { BilliardGateway } from './billiard.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([BilliardClub, BilliardTable, BilliardOrder, BilliardTableType, BilliardExtra, BilliardOrderItem])],
  providers: [BilliardService, BilliardGateway],
  controllers: [BilliardController],
  exports: [BilliardService],
})
export class BilliardModule {}
