import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
}

export enum BusinessType {
  CAFE = 'cafe',
  RESTAURANT = 'restaurant',
  OSHXONA = 'oshxona',
  FASTFOOD = 'fastfood',
  MARKET = 'market',
  SUPERMARKET = 'supermarket',
  DOKON = 'dokon',
  BOSHQA = 'boshqa',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  slug: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.CAFE,
  })
  businessType: BusinessType;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, any>;

  @Column({ default: 'uz' })
  defaultLanguage: string;

  @Column({ default: 'UZS' })
  currency: string;

  @Column({ nullable: true })
  timezone: string;
}
