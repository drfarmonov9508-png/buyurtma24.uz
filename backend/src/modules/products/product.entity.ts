import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  category: Category;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true })
  nameRu: string;

  @Column({ nullable: true })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  descriptionRu: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountPrice: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ nullable: true })
  video: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isStopList: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isCombo: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column({ nullable: true })
  preparationTime: number;

  @Column({ type: 'jsonb', nullable: true })
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string }>;

  @Column({ type: 'jsonb', nullable: true })
  extras: Array<{ name: string; price: number }>;

  @Column({ type: 'jsonb', nullable: true })
  variants: Array<{ name: string; price: number }>;
}
