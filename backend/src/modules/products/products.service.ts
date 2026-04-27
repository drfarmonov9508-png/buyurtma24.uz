import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async create(tenantId: string, dto: Partial<Product>) {
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }

  async findAll(tenantId: string, opts: { categoryId?: string; active?: boolean; search?: string; page?: number; limit?: number }) {
    const { categoryId, active, search, page = 1, limit = 50 } = opts;
    const query = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.tenantId = :tenantId', { tenantId });

    if (categoryId) query.andWhere('p.categoryId = :categoryId', { categoryId });
    if (active !== undefined) query.andWhere('p.isActive = :active', { active });
    if (search) query.andWhere('p.name ILIKE :s OR p.nameRu ILIKE :s OR p.nameEn ILIKE :s', { s: `%${search}%` });

    const [data, total] = await query
      .orderBy('p.sortOrder', 'ASC').addOrderBy('p.name', 'ASC')
      .skip((page - 1) * limit).take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId?: string) {
    const p = await this.repo.findOne({
      where: { id, ...(tenantId && { tenantId }) },
      relations: ['category'],
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async update(id: string, tenantId: string, dto: Partial<Product>) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async toggleStopList(id: string, tenantId: string, isStopList: boolean) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, { isStopList });
    return this.findOne(id);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
    return { message: 'Product deleted' };
  }

  async getStopList(tenantId: string) {
    return this.repo.find({ where: { tenantId, isStopList: true }, relations: ['category'] });
  }
}
