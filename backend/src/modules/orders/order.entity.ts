import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Table } from '../tables/table.entity';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../../common/enums/order-status.enum';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.DINE_IN })
  type: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'uuid', nullable: true })
  tableId: string;

  @ManyToOne(() => Table, { nullable: true })
  table: Table;

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @ManyToOne(() => User, { nullable: true })
  client: User;

  @Column({ type: 'uuid', nullable: true })
  waiterId: string;

  @ManyToOne(() => User, { nullable: true })
  waiter: User;

  @Column({ type: 'uuid', nullable: true })
  cashierId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  promoCodeId: string;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'jsonb', nullable: true })
  deliveryAddress: Record<string, any>;

  @Column({ nullable: true })
  estimatedReadyAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ length: 200 })
  productName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'jsonb', nullable: true })
  extras: Array<{ name: string; price: number }>;

  @Column({ type: 'jsonb', nullable: true })
  variant: { name: string; price: number };
}
