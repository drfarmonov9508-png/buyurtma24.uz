import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BilliardClub } from './billiard-club.entity';

export enum BilliardTableStatus {
  FREE = 'free',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

@Entity('billiard_tables')
export class BilliardTable extends BaseEntity {
  @Column({ type: 'uuid' })
  clubId: string;

  @ManyToOne(() => BilliardClub, (club) => club.tables, { onDelete: 'CASCADE' })
  club: BilliardClub;

  @Column({ length: 80 })
  name: string;

  @Column({ default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: BilliardTableStatus, default: BilliardTableStatus.FREE })
  status: BilliardTableStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pricePerHour: number;

  @Column({ default: true })
  isActive: boolean;
}
