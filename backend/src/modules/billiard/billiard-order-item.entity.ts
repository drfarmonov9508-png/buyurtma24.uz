import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BilliardOrder } from './billiard-order.entity';
import { BilliardExtra } from './billiard-extra.entity';

export enum BilliardOrderItemStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}

@Entity('billiard_order_items')
export class BilliardOrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => BilliardOrder, { onDelete: 'CASCADE' })
  order: BilliardOrder;

  @Column({ type: 'uuid', nullable: true })
  extraId: string;

  @ManyToOne(() => BilliardExtra, { nullable: true })
  extra: BilliardExtra;

  @Column({ nullable: true })
  name: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'enum', enum: BilliardOrderItemStatus, default: BilliardOrderItemStatus.ACCEPTED })
  status: BilliardOrderItemStatus;
}
