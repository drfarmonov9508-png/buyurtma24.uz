import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount, PromoCode, BonusWallet } from './discount.entity';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount) private discountRepo: Repository<Discount>,
    @InjectRepository(PromoCode) private promoRepo: Repository<PromoCode>,
    @InjectRepository(BonusWallet) private walletRepo: Repository<BonusWallet>,
  ) {}

  async createDiscount(tenantId: string, dto: Partial<Discount>) {
    return this.discountRepo.save(this.discountRepo.create({ ...dto, tenantId }));
  }

  async getDiscounts(tenantId: string) {
    return this.discountRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async createPromoCode(tenantId: string, dto: Partial<PromoCode>) {
    const existing = await this.promoRepo.findOne({ where: { code: dto.code, tenantId } });
    if (existing) throw new BadRequestException('Promo code already exists');
    return this.promoRepo.save(this.promoRepo.create({ ...dto, tenantId }));
  }

  async validatePromoCode(code: string, tenantId: string, orderAmount: number) {
    const promo = await this.promoRepo.findOne({
      where: { code: code.toUpperCase(), tenantId, isActive: true },
    });
    if (!promo) throw new NotFoundException('Promo code not found or inactive');
    if (promo.endsAt && new Date(promo.endsAt) < new Date()) throw new BadRequestException('Promo code expired');
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) throw new BadRequestException('Promo code usage limit reached');
    if (promo.minOrderAmount && orderAmount < Number(promo.minOrderAmount)) throw new BadRequestException(`Minimum order amount is ${promo.minOrderAmount}`);

    let discountAmount = 0;
    if (promo.type === 'percentage') discountAmount = (orderAmount * Number(promo.value)) / 100;
    else discountAmount = Number(promo.value);

    return { promo, discountAmount: Math.min(discountAmount, orderAmount) };
  }

  async usePromoCode(id: string) {
    await this.promoRepo.increment({ id }, 'usageCount', 1);
  }

  async getPromoCodes(tenantId: string) {
    return this.promoRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async getBonusWallet(userId: string, tenantId: string) {
    let wallet = await this.walletRepo.findOne({ where: { userId, tenantId } });
    if (!wallet) {
      wallet = await this.walletRepo.save(this.walletRepo.create({ userId, tenantId }));
    }
    return wallet;
  }

  async addBonus(userId: string, tenantId: string, amount: number) {
    let wallet = await this.getBonusWallet(userId, tenantId);
    await this.walletRepo.update(wallet.id, {
      balance: Number(wallet.balance) + amount,
      totalEarned: Number(wallet.totalEarned) + amount,
    });
    return this.getBonusWallet(userId, tenantId);
  }

  async spendBonus(userId: string, tenantId: string, amount: number) {
    const wallet = await this.getBonusWallet(userId, tenantId);
    if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient bonus balance');
    await this.walletRepo.update(wallet.id, {
      balance: Number(wallet.balance) - amount,
      totalSpent: Number(wallet.totalSpent) + amount,
    });
    return this.getBonusWallet(userId, tenantId);
  }
}
