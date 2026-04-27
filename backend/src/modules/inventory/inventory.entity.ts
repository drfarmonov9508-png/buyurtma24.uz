import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';

@Entity('inventory')
export class Inventory extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, default: 'pcs' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  lowStockThreshold: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPrice: number;

  @Column({ default: false })
  isAutoStopList: boolean;
}

@Entity('inventory_logs')
export class InventoryLog extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @ManyToOne(() => Inventory)
  inventory: Inventory;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantityChange: number;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantityBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantityAfter: number;

  @Column({ length: 50 })
  action: string;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  orderId: string;
}
