import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tenant, TenantStatus, BusinessType } from './tenant.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import * as bcrypt from 'bcryptjs';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsEnum(BusinessType)
  @IsNotEmpty()
  businessType: BusinessType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @IsString()
  @IsNotEmpty()
  adminPhone: string;

  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  trialDays?: number;
}

export class UpdateTenantDto {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: TenantStatus;
  settings?: Record<string, any>;
  defaultLanguage?: string;
  currency?: string;
  timezone?: string;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already taken');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + (dto.trialDays || 14));

    const tenant = await this.tenantRepo.save(
      this.tenantRepo.create({
        name: dto.name,
        slug: dto.slug,
        businessType: dto.businessType,
        phone: dto.adminPhone,
        address: dto.address,
        city: dto.city,
        status: TenantStatus.TRIAL,
        trialEndsAt,
      }),
    );

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    await this.userRepo.save(
      this.userRepo.create({
        tenantId: tenant.id,
        firstName: dto.adminFirstName,
        lastName: dto.adminLastName,
        phone: dto.adminPhone,
        password: hashedPassword,
        role: UserRole.CAFE_ADMIN,
        isActive: true,
      }),
    );

    return {
      tenant,
      credentials: {
        login: dto.adminPhone,
        password: dto.adminPassword,
      },
    };
  }

  async findPublic() {
    return this.tenantRepo.find({
      where: [{ status: TenantStatus.ACTIVE }, { status: TenantStatus.TRIAL }],
      select: ['id', 'name', 'slug', 'address', 'city'],
      order: { name: 'ASC' },
    });
  }

  async findAll(page = 1, limit = 20, search?: string, status?: TenantStatus) {
    const query = this.tenantRepo.createQueryBuilder('t');

    if (search) query.andWhere('t.name ILIKE :search OR t.slug ILIKE :search', { search: `%${search}%` });
    if (status) query.andWhere('t.status = :status', { status });

    const [data, total] = await query
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepo.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    await this.tenantRepo.update(id, dto);
    return this.findOne(id);
  }

  async toggleStatus(id: string, status: TenantStatus) {
    await this.findOne(id);
    await this.tenantRepo.update(id, { status });
    return { message: `Tenant status updated to ${status}` };
  }

  async getStats(id: string) {
    const tenant = await this.findOne(id);
    const staffCount = await this.userRepo.count({ where: { tenantId: id } });
    return { tenant, staffCount };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.tenantRepo.softDelete(id);
    return { message: 'Tenant deleted' };
  }
}
