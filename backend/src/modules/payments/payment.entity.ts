import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Order } from '../orders/order.entity';
import { PaymentMethod, PaymentStatus } from '../../common/enums/order-status.enum';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  order: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashReceived: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  change: number;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  cashierId: string;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}

@Entity('refund_requests')
export class RefundRequest extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  order: Order;

  @Column({ nullable: true })
  orderItemId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ nullable: true })
  requestedById: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;
}
