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

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 0 })
  alertThreshold: number;

  @Column({ default: true })
  isActive: boolean;
}
