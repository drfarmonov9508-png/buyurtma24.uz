import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  async findAll(activeOnly = true) {
    const where: any = {};
    if (activeOnly) where.isActive = true;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id, isActive: true } });
  }
}
