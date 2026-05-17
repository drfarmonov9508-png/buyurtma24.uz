import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Region } from '../regions/region.entity';
import { Service } from '../services/service.entity';
import { BilliardTable } from './billiard-table.entity';

@Entity('billiard_clubs')
@Index(['slug'], { unique: true })
export class BilliardClub extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ length: 120 })
  slug: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  regionId: string;

  @ManyToOne(() => Region, { nullable: true })
  region: Region;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string;

  @ManyToOne(() => Service, { nullable: true })
  service: Service;

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => BilliardTable, (table) => table.club)
  tables: BilliardTable[];
}
