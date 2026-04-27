import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../tables/table.entity';

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
  ) {}

  async generateQr(tableId: string, appUrl: string) {
    const table = await this.tableRepo.findOne({ where: { id: tableId }, relations: ['tenant'] });
    if (!table) throw new NotFoundException('Table not found');
    const url = `${appUrl}/menu/${table.tenant?.slug || table.tenantId}?table=${tableId}`;
    return { url, tableId, tableName: table.name };
  }
}
