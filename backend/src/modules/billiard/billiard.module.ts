import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BilliardController } from './billiard.controller';
import { BilliardService } from './billiard.service';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable } from './billiard-table.entity';
import { BilliardOrder } from './billiard-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BilliardClub, BilliardTable, BilliardOrder])],
  providers: [BilliardService],
  controllers: [BilliardController],
  exports: [BilliardService],
})
export class BilliardModule {}
