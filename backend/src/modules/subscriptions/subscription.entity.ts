import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';

export enum PlanName {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('plans')
export class Plan extends BaseEntity {
  @Column({ type: 'enum', enum: PlanName, unique: true })
  name: PlanName;

  @Column({ length: 100 })
  displayName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  priceMonthly: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  priceYearly: number;

  @Column({ default: 5 })
  maxUsers: number;

  @Column({ default: 10 })
  maxTables: number;

  @Column({ default: 1 })
  maxBranches: number;

  @Column({ default: false })
  hasInventory: boolean;

  @Column({ default: true })
  hasQrMenu: boolean;

  @Column({ default: false })
  hasDelivery: boolean;

  @Column({ default: false })
  hasAdvancedAnalytics: boolean;

  @Column({ default: false })
  hasApiAccess: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];
}

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan)
  plan: Plan;

  @Column({ length: 50, default: 'active' })
  status: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ default: false })
  isAutoRenew: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountPaid: number;

  @Column({ length: 20, default: 'monthly' })
  billingCycle: string;

  @Column({ nullable: true })
  transactionId: string;
}
