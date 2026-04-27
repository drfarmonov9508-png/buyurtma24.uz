import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async log(dto: Partial<AuditLog>) {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(tenantId: string, opts: { userId?: string; entity?: string; action?: string; page?: number; limit?: number }) {
    const { userId, entity, action, page = 1, limit = 50 } = opts;
    const query = this.repo.createQueryBuilder('a').where('a.tenantId = :tenantId OR a.tenantId IS NULL', { tenantId });
    if (userId) query.andWhere('a.userId = :userId', { userId });
    if (entity) query.andWhere('a.entity = :entity', { entity });
    if (action) query.andWhere('a.action = :action', { action });
    const [data, total] = await query.orderBy('a.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }
}
