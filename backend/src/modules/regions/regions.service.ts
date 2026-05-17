import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region, RegionType } from './region.entity';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly repo: Repository<Region>,
  ) {}

  async findAll(type?: RegionType, parentId?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;
    if (parentId !== undefined) where.parentId = parentId;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findTree() {
    const items = await this.repo.find({ where: { isActive: true }, order: { type: 'ASC', name: 'ASC' } });
    const map = new Map<string, Region & { children: Region[] }>();
    items.forEach((item) => map.set(item.id, { ...item, children: [] } as Region & { children: Region[] }));
    const roots: (Region & { children: Region[] })[] = [];

    for (const item of map.values()) {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(item);
      } else {
        roots.push(item);
      }
    }

    return roots;
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id, isActive: true } });
  }
}
