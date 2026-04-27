import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Tenant) private tenantRepo: Repository<Tenant>) {}

  async getSettings(tenantId: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return {
      name: tenant.name, phone: tenant.phone, address: tenant.address,
      city: tenant.city, currency: tenant.currency, timezone: tenant.timezone,
      defaultLanguage: tenant.defaultLanguage, logo: tenant.logo,
      settings: tenant.settings,
    };
  }

  async updateSettings(tenantId: string, dto: Partial<Tenant>) {
    await this.tenantRepo.update(tenantId, dto);
    return this.getSettings(tenantId);
  }
}
