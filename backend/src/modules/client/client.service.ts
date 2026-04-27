import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Tenant } from '../tenants/tenant.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async getOrderHistory(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.tenant', 'tenant')
      .leftJoinAndSelect('o.items', 'items')
      .where('o.clientId = :userId', { userId })
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getClientTenants(userId: string) {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('DISTINCT o."tenantId"', 'tenantId')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o."total")', 'totalSpent')
      .addSelect('MAX(o."createdAt")', 'lastOrderAt')
      .where('o."clientId" = :userId', { userId })
      .groupBy('o."tenantId"')
      .orderBy('MAX(o."createdAt")', 'DESC')
      .getRawMany();

    const tenantIds = result.map((r: any) => r.tenantId).filter(Boolean);
    if (tenantIds.length === 0) return [];

    const tenants = await this.tenantRepo
      .createQueryBuilder('t')
      .whereInIds(tenantIds)
      .getMany();

    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    return result.map((r: any) => ({
      tenant: tenantMap.get(r.tenantId) || null,
      orderCount: parseInt(r.orderCount) || 0,
      totalSpent: parseFloat(r.totalSpent) || 0,
      lastOrderAt: r.lastOrderAt,
    }));
  }
}
