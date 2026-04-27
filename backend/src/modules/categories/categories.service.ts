import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  async create(tenantId: string, dto: Partial<Category>) {
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }

  async findAll(tenantId: string, activeOnly = false) {
    const query = this.repo.createQueryBuilder('c').where('c.tenantId = :tenantId', { tenantId });
    if (activeOnly) query.andWhere('c.isActive = true');
    return query.orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC').getMany();
  }

  async findOne(id: string, tenantId?: string) {
    const c = await this.repo.findOne({ where: { id, ...(tenantId && { tenantId }) } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async update(id: string, tenantId: string, dto: Partial<Category>) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
    return { message: 'Category deleted' };
  }
}
