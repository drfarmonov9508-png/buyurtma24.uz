import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum RegionType {
  REGION = 'region',
  DISTRICT = 'district',
  NEIGHBORHOOD = 'neighborhood',
}

@Entity('regions')
@Index(['slug', 'type'], { unique: true })
export class Region extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'enum', enum: RegionType, default: RegionType.REGION })
  type: RegionType;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => Region, (region) => region.children, { nullable: true, onDelete: 'SET NULL' })
  parent: Region;

  @OneToMany(() => Region, (region) => region.parent)
  children: Region[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  path: string;
}
