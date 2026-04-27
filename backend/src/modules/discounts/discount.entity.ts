import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('discounts')
export class Discount extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: DiscountType, default: DiscountType.PERCENTAGE })
  type: DiscountType;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  maxDiscountAmount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  startsAt: Date;

  @Column({ nullable: true })
  endsAt: Date;
}

@Entity('promo_codes')
export class PromoCode extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'enum', enum: DiscountType, default: DiscountType.PERCENTAGE })
  type: DiscountType;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderAmount: number;

  @Column({ nullable: true })
  usageLimit: number;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ nullable: true })
  perUserLimit: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  startsAt: Date;

  @Column({ nullable: true })
  endsAt: Date;
}

@Entity('bonus_wallets')
export class BonusWallet extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSpent: number;
}
