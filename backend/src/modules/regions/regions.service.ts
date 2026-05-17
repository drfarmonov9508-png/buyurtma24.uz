import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: { name: string; type: RegionType; parentId?: string }) {
    const name = dto.name?.trim();
    if (!name) throw new NotFoundException('Hudud nomi kiritilmadi');

    const parent = dto.parentId ? await this.findOne(dto.parentId) : null;
    if (dto.parentId && !parent) throw new NotFoundException('Asosiy hudud topilmadi');

    const slug = parent ? `${parent.slug}-${this.slugify(name)}`.slice(0, 100) : this.slugify(name);
    const existing = await this.repo.findOne({
      where: { slug, type: dto.type, parentId: dto.parentId || null, isActive: true } as any,
    });
    if (existing) return existing;

    try {
      return await this.repo.save(this.repo.create({
        name,
        slug,
        type: dto.type,
        parentId: dto.parentId || null,
        path: parent ? `${parent.path || parent.slug}/${slug}` : slug,
        isActive: true,
      }));
    } catch {
      throw new ConflictException('Hudud allaqachon mavjud');
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/['‘’`]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || `hudud-${Date.now()}`;
  }
}
