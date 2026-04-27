import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  nameRu: string;

  @Column({ nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  parentId: string;
}
