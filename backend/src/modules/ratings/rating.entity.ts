import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

@Entity('ratings')
@Index(['userId', 'tenantId'], { unique: true, where: '"deleted_at" IS NULL' })
export class Rating extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;
}
