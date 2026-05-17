import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BilliardTable } from './billiard-table.entity';

@Entity('billiard_table_types')
export class BilliardTableType extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  clubId: string;

  @Column({ length: 80 })
  name: string;

  @Column({ length: 40, default: 'oddiy' })
  tier: string;

  @Column({ nullable: true })
  details: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pricePerHour: number;

  @OneToMany(() => BilliardTable, (t) => t.type)
  tables: BilliardTable[];
}
