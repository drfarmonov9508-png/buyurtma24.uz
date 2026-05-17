import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('billiard_extras')
export class BilliardExtra extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  clubId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ default: true })
  isActive: boolean;
}
