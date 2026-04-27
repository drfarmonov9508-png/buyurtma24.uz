import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Branch } from '../branches/branch.entity';

export enum TableStatus {
  FREE = 'free',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
}

@Entity('tables')
export class Table extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: true })
  branch: Branch;

  @Column({ length: 50 })
  name: string;

  @Column({ default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.FREE })
  status: TableStatus;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  qrCodeUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  positionX: number;

  @Column({ nullable: true })
  positionY: number;

  @Column({ nullable: true })
  floor: number;

  @Column({ nullable: true })
  section: string;
}
