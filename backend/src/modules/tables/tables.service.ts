import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Table, TableStatus } from './table.entity';

@Injectable()
export class TablesService {
  constructor(@InjectRepository(Table) private repo: Repository<Table>) {}

  async create(tenantId: string, dto: Partial<Table>) {
    const table = await this.repo.save(this.repo.create({ ...dto, tenantId }));
    await this.generateQr(table.id, tenantId);
    return this.findOne(table.id, tenantId);
  }

  async findAll(tenantId: string, branchId?: string, status?: string) {
    const query = this.repo.createQueryBuilder('t').where('t.tenantId = :tenantId', { tenantId });
    if (branchId) query.andWhere('t.branchId = :branchId', { branchId });
    if (status) query.andWhere('t.status = :status', { status });
    return query.orderBy('t.name', 'ASC').getMany();
  }

  async findOne(id: string, tenantId?: string) {
    const t = await this.repo.findOne({ where: { id, ...(tenantId && { tenantId }) } });
    if (!t) throw new NotFoundException('Table not found');
    return t;
  }

  async update(id: string, tenantId: string, dto: Partial<Table>) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async updateStatus(id: string, tenantId: string, status: TableStatus) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, { status });
    return this.findOne(id);
  }

  async generateQr(tableId: string, tenantId: string) {
    const table = await this.repo.findOne({ where: { id: tableId } });
    if (!table) return;
    const qrUrl = `${process.env.QR_BASE_URL || 'https://client.buyurtma24.uz/menu'}?table=${tableId}`;
    const qrCode = await QRCode.toDataURL(qrUrl);
    await this.repo.update(tableId, { qrCode, qrCodeUrl: qrUrl });
    return { qrCode, qrCodeUrl: qrUrl };
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.repo.softDelete(id);
    return { message: 'Table deleted' };
  }
}
