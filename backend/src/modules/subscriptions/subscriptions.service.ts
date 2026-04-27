import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, Subscription } from './subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Plan) private planRepo: Repository<Plan>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
  ) {}

  async getPlans() {
    return this.planRepo.find({ where: { isActive: true }, order: { priceMonthly: 'ASC' } });
  }

  async createPlan(dto: Partial<Plan>) {
    return this.planRepo.save(this.planRepo.create(dto));
  }

  async updatePlan(id: string, dto: Partial<Plan>) {
    await this.planRepo.update(id, dto);
    return this.planRepo.findOne({ where: { id } });
  }

  async getTenantSubscription(tenantId: string) {
    return this.subRepo.findOne({
      where: { tenantId, status: 'active' },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async subscribe(tenantId: string, planId: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const existing = await this.subRepo.findOne({ where: { tenantId, status: 'active' } });
    if (existing) {
      await this.subRepo.update(existing.id, { status: 'cancelled' });
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setMonth(endsAt.getMonth() + 1);

    return this.subRepo.save(
      this.subRepo.create({
        tenantId, planId, status: 'active',
        startsAt, endsAt,
        amountPaid: plan.priceMonthly,
      }),
    );
  }

  async cancel(tenantId: string) {
    const sub = await this.getTenantSubscription(tenantId);
    if (!sub) throw new NotFoundException('No active subscription');
    await this.subRepo.update(sub.id, { status: 'cancelled' });
    return { message: 'Subscription cancelled' };
  }

  async getAll(page = 1, limit = 20) {
    const [data, total] = await this.subRepo.findAndCount({
      relations: ['plan'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
