import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { LoginDto, StaffLoginDto, ClientLoginDto, ClientPhoneDto, RefreshTokenDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/role.enum';
import { AuditLog } from '../audit/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async staffLogin(dto: StaffLoginDto, ip?: string) {
    const query = this.userRepo.createQueryBuilder('user')
      .addSelect('user.password')
      .where('(user.phone = :phone OR user.email = :email)', { phone: dto.phone, email: dto.phone })
      .andWhere('user.role != :role', { role: UserRole.CLIENT });

    if (dto.tenantSlug) {
      query
        .innerJoin('user.tenant', 'tenant')
        .andWhere('tenant.slug = :slug', { slug: dto.tenantSlug });
    }

    const user = await query.getOne();
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    try { await this.userRepo.update(user.id, { lastLoginAt: new Date() }); } catch { /* column may not exist */ }

    const tokens = await this.generateTokens(user);

    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          tenantId: user.tenantId,
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: ip,
          description: `User ${user.phone} logged in`,
        }),
      );
    } catch { /* audit table may not exist yet */ }

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async superadminLogin(dto: LoginDto, ip?: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.phone = :phone OR user.email = :email', {
        phone: dto.phone,
        email: dto.phone,
      })
      .andWhere('user.role = :role', { role: UserRole.SUPERADMIN })
      .getOne();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    try { await this.userRepo.update(user.id, { lastLoginAt: new Date() }); } catch { /* column may not exist */ }

    const tokens = await this.generateTokens(user);

    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          userId: user.id,
          action: 'SUPERADMIN_LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: ip,
        }),
      );
    } catch { /* audit table may not exist yet */ }

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async clientAuth(dto: ClientLoginDto, tenantSlug: string) {
    const tenant = await this.tenantRepo.findOne({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Cafe not found');

    let user = await this.userRepo.findOne({
      where: { phone: dto.phone, tenantId: tenant.id, role: UserRole.CLIENT },
    });

    if (!user) {
      user = this.userRepo.create({
        tenantId: tenant.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.CLIENT,
        password: Math.random().toString(36).slice(-8),
        isActive: true,
      });
      await this.userRepo.save(user);
    } else {
      try {
        await this.userRepo.update(user.id, {
          firstName: dto.firstName,
          lastName: dto.lastName,
          lastLoginAt: new Date(),
        });
      } catch { /* column may not exist */ }
    }

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens, isNewUser: !user.lastLoginAt };
  }

  async clientPhoneAuth(dto: ClientPhoneDto) {
    let user = await this.userRepo.findOne({
      where: { phone: dto.phone, role: UserRole.CLIENT },
    });

    if (!user) {
      user = this.userRepo.create({
        firstName: dto.firstName || 'Mehmon',
        lastName: dto.lastName || '',
        phone: dto.phone,
        role: UserRole.CLIENT,
        password: Math.random().toString(36).slice(-8),
        isActive: true,
      });
      await this.userRepo.save(user);
    } else {
      try {
        const updates: any = { lastLoginAt: new Date() };
        if (dto.firstName) updates.firstName = dto.firstName;
        if (dto.lastName) updates.lastName = dto.lastName;
        await this.userRepo.update(user.id, updates);
      } catch { /* column may not exist */ }
    }

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('Invalid token');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    try { await this.userRepo.update(user.id, { refreshToken }); } catch { /* column may not exist */ }

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    const { password, refreshToken, ...safe } = user as any;
    return safe;
  }
}
