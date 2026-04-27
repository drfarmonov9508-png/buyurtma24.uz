import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { Discount, PromoCode, BonusWallet } from './discount.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Discount, PromoCode, BonusWallet])],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
