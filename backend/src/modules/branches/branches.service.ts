import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';

@Injectable()
export class BranchesService {
  constructor(@InjectRepository(Branch) private repo: Repository<Branch>) {}

  async create(tenantId: string, dto: Partial<Branch>) {
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }

  async findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async findOne(id: string, tenantId?: string) {
    const b = await this.repo.findOne({ where: { id, ...(tenantId && { tenantId }) } });
    if (!b) throw new NotFoundException('Branch not found');
    return b;
  }

  async update(id: string, tenantId: string, dto: Partial<Branch>) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
    return { message: 'Branch deleted' };
  }
}
