import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  private isUuid(s: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  }

  private async getTenant(slugOrId: string) {
    const where: any = this.isUuid(slugOrId)
      ? [{ slug: slugOrId }, { id: slugOrId }]
      : { slug: slugOrId };
    const tenant = await this.tenantRepo.findOne({ where });
    if (!tenant) throw new NotFoundException('Cafe not found');
    return tenant;
  }

  async getFullMenu(slugOrId: string) {
    const tenant = await this.getTenant(slugOrId);
    const categories = await this.categoryRepo.find({
      where: { tenantId: tenant.id, isActive: true },
      order: { sortOrder: 'ASC' },
    });
    const products = await this.productRepo.find({
      where: { tenantId: tenant.id, isActive: true },
      order: { sortOrder: 'ASC' },
    });
    const categoriesWithProducts = categories.map((cat) => ({
      ...cat,
      products: products.filter((p) => p.categoryId === cat.id),
    }));
    return {
      cafe: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        logo: tenant.logo,
        currency: tenant.currency,
        address: (tenant as any).address,
        phone: (tenant as any).phone,
      },
      categories: categoriesWithProducts,
    };
  }

  async getCategories(slugOrId: string) {
    const tenant = await this.getTenant(slugOrId);
    return this.categoryRepo.find({
      where: { tenantId: tenant.id, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getProducts(slugOrId: string, categoryId?: string) {
    const tenant = await this.getTenant(slugOrId);
    const where: any = { tenantId: tenant.id, isActive: true };
    if (categoryId) where.categoryId = categoryId;
    return this.productRepo.find({ where, order: { sortOrder: 'ASC' } });
  }
}
