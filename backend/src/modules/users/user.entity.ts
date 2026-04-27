import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../tenants/tenant.entity';
import { UserRole } from '../../common/enums/role.enum';

@Entity('users')
@Index(['tenantId', 'phone'], { unique: true, where: '"deleted_at" IS NULL' })
export class User extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  tenant: Tenant;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  branchId: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[];

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ default: 'uz' })
  language: string;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
