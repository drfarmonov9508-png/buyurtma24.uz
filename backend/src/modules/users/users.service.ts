import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { IsString, IsOptional, IsEnum, IsEmail, IsBoolean, MinLength } from 'class-validator';
import { User } from './user.entity';
import { UserRole } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.repo.findOne({
      where: { phone: dto.phone, tenantId: dto.tenantId },
    });
    if (existing) throw new ConflictException('User with this phone already exists');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({ ...dto, password: hashed });
    return this.repo.save(user);
  }

  async findAll(tenantId: string, role?: UserRole, page = 1, limit = 20) {
    const query = this.repo.createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId });

    if (role) query.andWhere('u.role = :role', { role });

    const [data, total] = await query
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByPhone(phone: string, tenantId?: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone, ...(tenantId && { tenantId }) } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: 'User deleted' };
  }

  async getStaff(tenantId: string) {
    return this.repo.find({
      where: { tenantId },
      order: { role: 'ASC', firstName: 'ASC' },
    });
  }
}
