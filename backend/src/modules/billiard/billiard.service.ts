import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable, BilliardTableStatus } from './billiard-table.entity';
import { BilliardOrder, BilliardOrderStatus } from './billiard-order.entity';
import { BilliardTableType } from './billiard-table-type.entity';
import { BilliardExtra } from './billiard-extra.entity';
import { BilliardOrderItem, BilliardOrderItemStatus } from './billiard-order-item.entity';
import { BilliardGateway } from './billiard.gateway';
import { AuthService } from '../auth/auth.service';
import { randomUUID } from 'crypto';

@Injectable()
export class BilliardService {
  constructor(
    @InjectRepository(BilliardClub)
    private readonly clubRepo: Repository<BilliardClub>,
    @InjectRepository(BilliardTable)
    private readonly tableRepo: Repository<BilliardTable>,
    @InjectRepository(BilliardOrder)
    private readonly orderRepo: Repository<BilliardOrder>,
    @InjectRepository(BilliardTableType)
    private readonly typeRepo: Repository<BilliardTableType>,
    @InjectRepository(BilliardExtra)
    private readonly extraRepo: Repository<BilliardExtra>,
    @InjectRepository(BilliardOrderItem)
    private readonly itemRepo: Repository<BilliardOrderItem>,
    private readonly gateway: BilliardGateway,
    private readonly authService: AuthService,
  ) {}

  private emit(clubId: string, userId: string | undefined, event: string, payload: any) {
    this.gateway.emitClub(clubId, event, payload);
    if (userId) this.gateway.emitUser(userId, event, payload);
  }

  private async loadOrder(orderId: string) {
    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['table', 'table.type', 'club', 'items', 'items.extra', 'user'],
    });
  }

  async findClubs(regionId?: string, serviceSlug?: string) {
    const query = this.clubRepo.createQueryBuilder('club')
      .leftJoinAndSelect('club.region', 'region')
      .leftJoinAndSelect('club.service', 'service')
      .where('club.isActive = true');

    if (regionId) query.andWhere('club.regionId = :regionId', { regionId });
    if (serviceSlug) query.andWhere('service.slug = :serviceSlug', { serviceSlug });

    return query.orderBy('club.name', 'ASC').getMany();
  }

  async findClub(id: string) {
    const club = await this.clubRepo.findOne({ where: { id, isActive: true }, relations: ['region', 'service'] });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async findClubTypes(clubId: string) {
    await this.findClub(clubId);
    return this.typeRepo.find({ where: { clubId }, order: { name: 'ASC' } });
  }

  async findTables(clubId: string) {
    const club = await this.clubRepo.findOne({ where: { id: clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');
    return this.tableRepo.find({
      where: { clubId, isActive: true },
      order: { name: 'ASC' },
      relations: ['type'],
    });
  }

  async findClubExtras(clubId: string) {
    await this.findClub(clubId);
    return this.extraRepo.find({
      where: { clubId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async bookTable(userId: string, tableId: string, note?: string) {
    const table = await this.tableRepo.findOne({ where: { id: tableId, isActive: true }, relations: ['type'] });
    if (!table) throw new NotFoundException('Table not found');
    if (table.status !== BilliardTableStatus.FREE) {
      throw new BadRequestException('Table is not available');
    }

    const club = await this.clubRepo.findOne({ where: { id: table.clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');

    const start = new Date();
    const order = this.orderRepo.create({
      userId,
      clubId: club.id,
      tableId: table.id,
      status: BilliardOrderStatus.PENDING,
      startAt: start,
      endAt: null,
      durationMinutes: 0,
      pricePerHour: Number(table.pricePerHour),
      total: 0,
      note,
    });

    table.status = BilliardTableStatus.RESERVED;
    await this.tableRepo.save(table);
    const saved = await this.orderRepo.save(order);
    const full = await this.loadOrder(saved.id);
    this.emit(club.id, userId, 'booking-requested', full);
    this.emit(club.id, userId, 'session-updated', full);
    return full;
  }

  async findMyOrders(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['table', 'table.type', 'club', 'items', 'items.extra'],
    });
  }

  private async getClubByTenant(tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant not found');
    const club = await this.clubRepo.findOne({ where: { tenantId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async adminSnapshot(tenantId: string) {
    const club = await this.getClubByTenant(tenantId);
    const tables = await this.tableRepo.find({ where: { clubId: club.id, isActive: true }, order: { name: 'ASC' }, relations: ['type'] });
    const types = await this.typeRepo.find({ where: { clubId: club.id }, order: { name: 'ASC' } });
    const extras = await this.extraRepo.find({ where: { clubId: club.id, isActive: true } });
    const orders = await this.orderRepo.find({
      where: { clubId: club.id, status: In([BilliardOrderStatus.PENDING, BilliardOrderStatus.CONFIRMED]) },
      order: { createdAt: 'ASC' },
      relations: ['table', 'table.type', 'items', 'items.extra', 'user'],
    });
    const pendingItems = await this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.order', 'order')
      .leftJoinAndSelect('item.extra', 'extra')
      .leftJoinAndSelect('order.table', 'table')
      .where('item.status = :status', { status: 'pending' })
      .andWhere('order.clubId = :clubId', { clubId: club.id })
      .getMany();

    return { club, tables, types, extras, orders, pendingItems };
  }

  private resolveDateRange(query: { period?: string; from?: string; to?: string }) {
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;

    if (query.from) from = new Date(query.from);
    if (query.to) to = new Date(query.to);

    if (!from && query.period) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      switch (query.period) {
        case 'today':
          from = start;
          break;
        case 'week': {
          const d = new Date(start);
          d.setDate(d.getDate() - 6);
          from = d;
          break;
        }
        case 'month': {
          const d = new Date(start);
          d.setDate(1);
          from = d;
          break;
        }
        case 'year': {
          from = new Date(now.getFullYear(), 0, 1);
          break;
        }
        default:
          break;
      }
    }

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    return { from, to };
  }

  async getAnalytics(
    tenantId: string,
    query: { period?: string; from?: string; to?: string; userId?: string; groupBy?: string } = {},
  ) {
    const club = await this.getClubByTenant(tenantId);
    const { from, to } = this.resolveDateRange(query);

    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.extra', 'extra')
      .where('order.clubId = :clubId', { clubId: club.id })
      .andWhere('order.status = :status', { status: BilliardOrderStatus.COMPLETED });

    if (from) qb.andWhere('order.closedAt >= :from', { from });
    if (to) qb.andWhere('order.closedAt <= :to', { to });
    if (query.userId) qb.andWhere('order.userId = :userId', { userId: query.userId });

    const orders = await qb.orderBy('order.closedAt', 'DESC').getMany();

    const mapSession = (order: BilliardOrder) => {
      const acceptedItems = (order.items || []).filter((i) => i.status === BilliardOrderItemStatus.ACCEPTED);
      const extrasTotal = acceptedItems.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
      const tableTotal = Number((Number(order.total || 0) - extrasTotal).toFixed(2));
      return {
        id: order.id,
        userId: order.userId,
        userName: order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : 'Noma\'lum',
        userPhone: order.user?.phone || '',
        tableId: order.tableId,
        tableName: order.table?.name || '—',
        startAt: order.startAt,
        confirmedAt: order.confirmedAt,
        closedAt: order.closedAt,
        durationMinutes: order.durationMinutes || 0,
        pricePerHour: Number(order.pricePerHour || 0),
        tableTotal,
        extrasTotal,
        total: Number(order.total || 0),
        items: acceptedItems.map((it) => ({
          id: it.id,
          name: it.name || it.extra?.name,
          quantity: it.quantity,
          price: Number(it.price),
          lineTotal: Number(it.price) * it.quantity,
        })),
      };
    };

    const sessions = orders.map(mapSession);

    const totals = {
      sessions: orders.length,
      minutes: orders.reduce((sum, o) => sum + (o.durationMinutes || 0), 0),
      revenue: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      tableRevenue: sessions.reduce((s, x) => s + x.tableTotal, 0),
      extrasRevenue: sessions.reduce((s, x) => s + x.extrasTotal, 0),
    };

    const byTableMap = new Map<string, any>();
    sessions.forEach((s) => {
      const entry = byTableMap.get(s.tableId) || { tableId: s.tableId, tableName: s.tableName, sessions: 0, minutes: 0, revenue: 0 };
      entry.sessions += 1;
      entry.minutes += s.durationMinutes;
      entry.revenue += s.total;
      byTableMap.set(s.tableId, entry);
    });

    const byUserMap = new Map<string, any>();
    sessions.forEach((s) => {
      const entry = byUserMap.get(s.userId) || {
        userId: s.userId,
        userName: s.userName,
        userPhone: s.userPhone,
        sessions: 0,
        minutes: 0,
        revenue: 0,
        orders: [] as any[],
      };
      entry.sessions += 1;
      entry.minutes += s.durationMinutes;
      entry.revenue += s.total;
      entry.orders.push(s);
      byUserMap.set(s.userId, entry);
    });

    const byDayMap = new Map<string, any>();
    sessions.forEach((s) => {
      const day = s.closedAt ? new Date(s.closedAt).toISOString().slice(0, 10) : 'unknown';
      const entry = byDayMap.get(day) || { date: day, sessions: 0, minutes: 0, revenue: 0 };
      entry.sessions += 1;
      entry.minutes += s.durationMinutes;
      entry.revenue += s.total;
      byDayMap.set(day, entry);
    });

    const allUsers = await this.orderRepo.createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .select(['order.userId AS "userId"', 'user.firstName AS "firstName"', 'user.lastName AS "lastName"', 'user.phone AS "phone"'])
      .where('order.clubId = :clubId', { clubId: club.id })
      .andWhere('order.status = :status', { status: BilliardOrderStatus.COMPLETED })
      .groupBy('order.userId')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .addGroupBy('user.phone')
      .getRawMany();

    return {
      period: query.period || 'month',
      from: from?.toISOString(),
      to: to?.toISOString(),
      totals,
      byTable: Array.from(byTableMap.values()).sort((a, b) => b.revenue - a.revenue),
      byUser: Array.from(byUserMap.values()).sort((a, b) => b.revenue - a.revenue),
      byDay: Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      sessions,
      users: allUsers.map((u) => ({
        userId: u.userId,
        userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Mijoz',
        userPhone: u.phone,
      })),
    };
  }

  async createType(tenantId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    const type = await this.typeRepo.save({ ...data, clubId: club.id });
    this.gateway.emitClub(club.id, 'table-updated', { types: true });
    return type;
  }

  async createTable(tenantId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    const table = await this.tableRepo.save({
      ...data,
      clubId: club.id,
      qrToken: randomUUID(),
    });
    const full = await this.tableRepo.findOne({ where: { id: table.id }, relations: ['type'] });
    this.gateway.emitClub(club.id, 'table-updated', { table: full });
    return full;
  }

  async updateTable(tenantId: string, tableId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    const table = await this.tableRepo.findOne({ where: { id: tableId, clubId: club.id } });
    if (!table) throw new NotFoundException('Table not found');

    if (data.name !== undefined) table.name = data.name;
    if (data.typeId !== undefined) table.typeId = data.typeId || null;
    if (data.pricePerHour !== undefined) table.pricePerHour = Number(data.pricePerHour);
    if (data.capacity !== undefined) table.capacity = Number(data.capacity);
    if (data.isActive !== undefined) table.isActive = data.isActive;
    if (!table.qrToken) table.qrToken = randomUUID();

    await this.tableRepo.save(table);
    const full = await this.tableRepo.findOne({ where: { id: table.id }, relations: ['type'] });
    this.gateway.emitClub(club.id, 'table-updated', { table: full });
    return full;
  }

  async deleteTable(tenantId: string, tableId: string) {
    const club = await this.getClubByTenant(tenantId);
    const table = await this.tableRepo.findOne({ where: { id: tableId, clubId: club.id } });
    if (!table) throw new NotFoundException('Table not found');

    const activeOrder = await this.orderRepo.findOne({
      where: {
        tableId: table.id,
        status: In([BilliardOrderStatus.PENDING, BilliardOrderStatus.CONFIRMED]),
      },
    });
    if (activeOrder) throw new BadRequestException('Stolda faol sessiya bor');

    table.isActive = false;
    await this.tableRepo.save(table);
    this.gateway.emitClub(club.id, 'table-updated', { tableId: table.id, deleted: true });
    return { success: true };
  }

  async deleteExtra(id: string, tenantId?: string) {
    const extra = await this.extraRepo.findOne({ where: { id } });
    if (!extra) throw new NotFoundException('Extra not found');
    if (tenantId) {
      const club = await this.getClubByTenant(tenantId);
      if (extra.clubId !== club.id) throw new ForbiddenException('Access denied');
    }
    extra.isActive = false;
    const saved = await this.extraRepo.save(extra);
    this.gateway.emitClub(extra.clubId, 'inventory-updated', saved);
    return saved;
  }

  async findTableByQrToken(qrToken: string) {
    const table = await this.tableRepo.findOne({
      where: { qrToken, isActive: true },
      relations: ['type', 'club', 'club.region'],
    });
    if (!table) throw new NotFoundException('Stol topilmadi');
    return table;
  }

  async bookTableByQr(qrToken: string, phone: string) {
    const normalized = phone.replace(/\s/g, '').trim();
    if (!normalized) throw new BadRequestException('Telefon raqam kiriting');

    const table = await this.findTableByQrToken(qrToken);
    if (table.status !== BilliardTableStatus.FREE) {
      throw new BadRequestException('Stol hozir band');
    }

    const auth = await this.authService.clientPhoneAuth({ phone: normalized });
    const user = auth.user;
    const order = await this.bookTable(user.id, table.id);

    return {
      user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      order,
      table,
    };
  }

  async createExtra(tenantId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    const extra = await this.extraRepo.save({ ...data, clubId: club.id });
    this.gateway.emitClub(club.id, 'inventory-updated', extra);
    return extra;
  }

  async updateExtra(id: string, data: any) {
    const extra = await this.extraRepo.findOne({ where: { id } });
    if (!extra) throw new NotFoundException('Extra not found');
    if (data.addQuantity !== undefined) {
      extra.stockQuantity = Number(extra.stockQuantity || 0) + Number(data.addQuantity || 0);
    }
    if (data.name !== undefined) extra.name = data.name;
    if (data.category !== undefined) extra.category = data.category;
    if (data.image !== undefined) extra.image = data.image;
    if (data.price !== undefined) extra.price = Number(data.price);
    if (data.alertThreshold !== undefined) extra.alertThreshold = Number(data.alertThreshold);
    if (data.isActive !== undefined) extra.isActive = data.isActive;
    const saved = await this.extraRepo.save(extra);
    this.gateway.emitClub(extra.clubId, 'inventory-updated', saved);
    return saved;
  }

  async openTable(adminId: string, tableId: string) {
    const table = await this.tableRepo.findOne({ where: { id: tableId, isActive: true }, relations: ['type'] });
    if (!table) throw new NotFoundException('Table not found');
    if (table.status !== BilliardTableStatus.FREE) {
      throw new BadRequestException('Table is not available');
    }

    const club = await this.clubRepo.findOne({ where: { id: table.clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');

    const start = new Date();
    const order = this.orderRepo.create({
      userId: adminId,
      clubId: club.id,
      tableId: table.id,
      status: BilliardOrderStatus.CONFIRMED,
      startAt: start,
      confirmedAt: start,
      endAt: null,
      durationMinutes: 0,
      pricePerHour: Number(table.pricePerHour || 0),
      total: 0,
    });

    table.status = BilliardTableStatus.OCCUPIED;
    await this.tableRepo.save(table);
    const saved = await this.orderRepo.save(order);
    const full = await this.loadOrder(saved.id);
    this.emit(club.id, adminId, 'booking-confirmed', full);
    this.emit(club.id, adminId, 'table-updated', { table, order: full });
    return full;
  }

  async acknowledgeItem(itemId: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId }, relations: ['order', 'extra'] });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.status === BilliardOrderItemStatus.ACCEPTED) return item;

    const extra = item.extra || (item.extraId ? await this.extraRepo.findOne({ where: { id: item.extraId } }) : null);
    if (extra && Number(extra.stockQuantity || 0) < item.quantity) {
      throw new BadRequestException('Omborda yetarli emas');
    }
    if (extra) {
      extra.stockQuantity = Number(extra.stockQuantity || 0) - item.quantity;
      await this.extraRepo.save(extra);
      this.gateway.emitClub(item.order.clubId, 'inventory-updated', extra);
    }

    item.status = BilliardOrderItemStatus.ACCEPTED;
    const saved = await this.itemRepo.save(item);
    if (item.order) {
      this.gateway.emitClub(item.order.clubId, 'extra-accepted', saved);
    }
    return saved;
  }

  async findPendingOrders(clubId: string) {
    return this.orderRepo.find({
      where: { clubId, status: BilliardOrderStatus.PENDING },
      order: { createdAt: 'ASC' },
      relations: ['table', 'table.type', 'user'],
    });
  }

  async confirmOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== BilliardOrderStatus.PENDING) throw new BadRequestException('Order not pending');

    const now = new Date();
    order.status = BilliardOrderStatus.CONFIRMED;
    order.confirmedAt = now;
    order.durationMinutes = 0;
    order.total = 0;
    await this.orderRepo.save(order);

    const table = order.table;
    table.status = BilliardTableStatus.OCCUPIED;
    await this.tableRepo.save(table);

    const full = await this.loadOrder(order.id);
    this.emit(order.clubId, order.userId, 'booking-confirmed', full);
    this.emit(order.clubId, order.userId, 'session-updated', full);
    return full;
  }

  async rejectOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== BilliardOrderStatus.PENDING) throw new BadRequestException('Order not pending');

    order.status = BilliardOrderStatus.CANCELLED;
    order.closedAt = new Date();
    await this.orderRepo.save(order);

    const table = order.table;
    if (table) {
      table.status = BilliardTableStatus.FREE;
      await this.tableRepo.save(table);
    }

    const full = await this.loadOrder(order.id);
    this.emit(order.clubId, order.userId, 'booking-rejected', full);
    this.emit(order.clubId, order.userId, 'session-updated', full);
    return full;
  }

  async requestOrderItem(userId: string, orderId: string, extraId: string, quantity = 1) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your session');
    if (order.status !== BilliardOrderStatus.CONFIRMED) {
      throw new BadRequestException('Faol sessiya topilmadi');
    }

    const extra = await this.extraRepo.findOne({ where: { id: extraId, clubId: order.clubId, isActive: true } });
    if (!extra) throw new NotFoundException('Extra not found');
    if (Number(extra.stockQuantity || 0) < quantity) {
      throw new BadRequestException('Omborda yetarli emas');
    }

    const item = this.itemRepo.create({
      orderId: order.id,
      extraId: extra.id,
      name: extra.name,
      quantity,
      price: Number(extra.price),
      status: BilliardOrderItemStatus.PENDING,
    });
    await this.itemRepo.save(item);

    const full = await this.loadOrder(order.id);
    const payload = { order: full, item, table: order.table, extra };
    this.gateway.emitClub(order.clubId, 'extra-requested', payload);
    this.emit(order.clubId, userId, 'session-updated', full);
    return item;
  }

  async addOrderItem(orderId: string, extraId: string, quantity = 1) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === BilliardOrderStatus.CANCELLED || order.status === BilliardOrderStatus.COMPLETED) {
      throw new BadRequestException('Order is closed');
    }
    const extra = await this.extraRepo.findOne({ where: { id: extraId } });
    if (!extra) throw new NotFoundException('Extra not found');
    if (Number(extra.stockQuantity || 0) < quantity) {
      throw new BadRequestException('Omborda yetarli emas');
    }

    extra.stockQuantity = Number(extra.stockQuantity || 0) - quantity;
    await this.extraRepo.save(extra);

    const item = this.itemRepo.create({
      orderId: order.id,
      extraId: extra.id,
      name: extra.name,
      quantity,
      price: Number(extra.price),
      status: BilliardOrderItemStatus.ACCEPTED,
    });
    await this.itemRepo.save(item);

    this.gateway.emitClub(order.clubId, 'extra-requested', { orderId: order.id, item });
    this.gateway.emitClub(order.clubId, 'inventory-updated', extra);
    return item;
  }

  async closeOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === BilliardOrderStatus.COMPLETED) throw new BadRequestException('Order already closed');
    if (order.status === BilliardOrderStatus.CANCELLED) throw new BadRequestException('Order cancelled');

    const closedAt = new Date();
    const startTime = order.confirmedAt || order.startAt;
    const elapsedMs = Math.max(0, closedAt.getTime() - new Date(startTime).getTime());
    const durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000));
    const base = Number((Number(order.pricePerHour || 0) * (durationMinutes / 60)).toFixed(2));

    const items = await this.itemRepo.find({ where: { orderId: order.id }, relations: ['extra'] });
    const acceptedItems = items.filter((i) => i.status === BilliardOrderItemStatus.ACCEPTED);
    const extrasTotal = acceptedItems.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
    const finalTotal = Number((base + extrasTotal).toFixed(2));

    order.durationMinutes = durationMinutes;
    order.total = finalTotal;
    order.status = BilliardOrderStatus.COMPLETED;
    order.closedAt = closedAt;
    order.endAt = closedAt;
    await this.orderRepo.save(order);

    const table = order.table;
    table.status = BilliardTableStatus.FREE;
    await this.tableRepo.save(table);

    const full = await this.loadOrder(order.id);
    const payload = { order: full, items: acceptedItems, finalTotal, tableTime: base, extrasTotal };
    this.emit(order.clubId, order.userId, 'order-closed', payload);
    this.emit(order.clubId, order.userId, 'session-updated', full);
    return payload;
  }
}
