import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, InventoryLog } from './inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private repo: Repository<Inventory>,
    @InjectRepository(InventoryLog) private logRepo: Repository<InventoryLog>,
  ) {}

  async create(tenantId: string, dto: Partial<Inventory>) {
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }

  async findAll(tenantId: string, branchId?: string) {
    const query = this.repo.createQueryBuilder('i').where('i.tenantId = :tenantId', { tenantId });
    if (branchId) query.andWhere('i.branchId = :branchId', { branchId });
    return query.orderBy('i.name', 'ASC').getMany();
  }

  async findLowStock(tenantId: string) {
    return this.repo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId })
      .andWhere('i.quantity <= i.lowStockThreshold')
      .getMany();
  }

  async findOne(id: string, tenantId?: string) {
    const item = await this.repo.findOne({ where: { id, ...(tenantId && { tenantId }) } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async adjust(id: string, tenantId: string, quantityChange: number, action: string, note?: string, userId?: string, orderId?: string) {
    const item = await this.findOne(id, tenantId);
    const before = Number(item.quantity);
    const after = before + quantityChange;

    await this.repo.update(id, { quantity: after });

    await this.logRepo.save(this.logRepo.create({
      tenantId,
      inventoryId: id,
      quantityChange,
      quantityBefore: before,
      quantityAfter: after,
      action,
      note,
      userId,
      orderId,
    }));

    if (after <= 0 && item.isAutoStopList) {
      return { item: await this.findOne(id), outOfStock: true };
    }

    return { item: await this.findOne(id), outOfStock: false };
  }

  async update(id: string, tenantId: string, dto: Partial<Inventory>) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async getLogs(tenantId: string, inventoryId?: string, page = 1, limit = 50) {
    const query = this.logRepo.createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId });
    if (inventoryId) query.andWhere('l.inventoryId = :inventoryId', { inventoryId });
    const [data, total] = await query.orderBy('l.createdAt', 'DESC').skip((page-1)*limit).take(limit).getManyAndCount();
    return { data, total };
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
    return { message: 'Inventory item deleted' };
  }
}
