import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable } from './billiard-table.entity';

export enum BilliardOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('billiard_orders')
export class BilliardOrder extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ type: 'uuid' })
  clubId: string;

  @ManyToOne(() => BilliardClub, { nullable: false })
  club: BilliardClub;

  @Column({ type: 'uuid' })
  tableId: string;

  @ManyToOne(() => BilliardTable, { nullable: false })
  table: BilliardTable;

  @Column({ type: 'enum', enum: BilliardOrderStatus, default: BilliardOrderStatus.PENDING })
  status: BilliardOrderStatus;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ default: 60 })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pricePerHour: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  note: string;
}
