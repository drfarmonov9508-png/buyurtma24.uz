import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable, BilliardTableStatus } from './billiard-table.entity';
import { BilliardOrder, BilliardOrderStatus } from './billiard-order.entity';
import { BilliardTableType } from './billiard-table-type.entity';
import { BilliardExtra } from './billiard-extra.entity';
import { BilliardOrderItem, BilliardOrderItemStatus } from './billiard-order-item.entity';

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
  ) {}

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

  async findTables(clubId: string) {
    const club = await this.clubRepo.findOne({ where: { id: clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');
    return this.tableRepo.find({ where: { clubId, isActive: true }, order: { name: 'ASC' } });
  }

  async bookTable(userId: string, tableId: string, startAt: Date, durationMinutes: number, note?: string) {
    const table = await this.tableRepo.findOne({ where: { id: tableId, isActive: true } });
    if (!table) throw new NotFoundException('Table not found');
    if (table.status !== BilliardTableStatus.FREE) {
      throw new BadRequestException('Table is not available');
    }

    const club = await this.clubRepo.findOne({ where: { id: table.clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');

    const start = startAt instanceof Date ? startAt : new Date(startAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const total = Number((Number(table.pricePerHour) * (durationMinutes / 60)).toFixed(2));

    const order = this.orderRepo.create({
      userId,
      clubId: club.id,
      tableId: table.id,
      status: BilliardOrderStatus.PENDING,
      startAt: start,
      endAt: end,
      durationMinutes,
      pricePerHour: Number(table.pricePerHour),
      total,
      note,
    });

    table.status = BilliardTableStatus.RESERVED;
    await this.tableRepo.save(table);
    return this.orderRepo.save(order);
  }

  async findMyOrders(userId: string) {
    return this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, relations: ['table', 'club', 'items', 'items.extra'] });
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
    const orders = await this.orderRepo.find({ where: { clubId: club.id, status: In([BilliardOrderStatus.PENDING, BilliardOrderStatus.CONFIRMED]) }, order: { createdAt: 'ASC' }, relations: ['table', 'items', 'items.extra'] });
    const pendingItems = await this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.order', 'order')
      .leftJoinAndSelect('item.extra', 'extra')
      .leftJoinAndSelect('order.table', 'table')
      .where('item.status = :status', { status: 'pending' })
      .andWhere('order.clubId = :clubId', { clubId: club.id })
      .getMany();

    return { club, tables, types, extras, orders, pendingItems };
  }

  async getAnalytics(tenantId: string) {
    const club = await this.getClubByTenant(tenantId);
    const orders = await this.orderRepo.find({ where: { clubId: club.id, status: BilliardOrderStatus.COMPLETED }, relations: ['table'] });
    const totals = {
      sessions: orders.length,
      minutes: orders.reduce((sum, order) => sum + (order.durationMinutes || 0), 0),
      revenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
    const byTableMap = new Map<string, any>();
    orders.forEach((order) => {
      const tableId = order.tableId;
      const entry = byTableMap.get(tableId) || { tableId, tableName: order.table?.name || 'Noma' , sessions: 0, minutes: 0, revenue: 0 };
      entry.sessions += 1;
      entry.minutes += order.durationMinutes || 0;
      entry.revenue += Number(order.total || 0);
      byTableMap.set(tableId, entry);
    });

    return { totals, byTable: Array.from(byTableMap.values()) };
  }

  async createType(tenantId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    return this.typeRepo.save({ ...data, clubId: club.id });
  }

  async createTable(tenantId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    return this.tableRepo.save({ ...data, clubId: club.id });
  }

  async createExtra(tenantId: string, data: any) {
    const club = await this.getClubByTenant(tenantId);
    return this.extraRepo.save({ ...data, clubId: club.id });
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
    return this.extraRepo.save(extra);
  }

  async openTable(adminId: string, tableId: string) {
    const table = await this.tableRepo.findOne({ where: { id: tableId, isActive: true } });
    if (!table) throw new NotFoundException('Table not found');
    if (table.status !== BilliardTableStatus.FREE) {
      throw new BadRequestException('Table is not available');
    }

    const club = await this.clubRepo.findOne({ where: { id: table.clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');

    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60000);
    const total = Number(table.pricePerHour || 0);

    const order = this.orderRepo.create({
      userId: adminId,
      clubId: club.id,
      tableId: table.id,
      status: BilliardOrderStatus.PENDING,
      startAt: start,
      endAt: end,
      durationMinutes: 60,
      pricePerHour: Number(table.pricePerHour || 0),
      total,
    });

    table.status = BilliardTableStatus.RESERVED;
    await this.tableRepo.save(table);
    return this.orderRepo.save(order);
  }

  async acknowledgeItem(itemId: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId }, relations: ['order'] });
    if (!item) throw new NotFoundException('Order item not found');
    item.status = BilliardOrderItemStatus.ACCEPTED;
    return this.itemRepo.save(item);
  }

  // Admin: list pending orders for a club
  async findPendingOrders(clubId: string) {
    return this.orderRepo.find({ where: { clubId, status: BilliardOrderStatus.PENDING }, order: { createdAt: 'ASC' }, relations: ['table', 'user'] });
  }

  // Admin: confirm order (set CONFIRMED and OCCUPIED)
  async confirmOrder(orderId: string, adminId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== BilliardOrderStatus.PENDING) throw new BadRequestException('Order not pending');

    const table = order.table;
    table.status = BilliardTableStatus.OCCUPIED;
    await this.tableRepo.save(table);

    order.status = BilliardOrderStatus.CONFIRMED;
    await this.orderRepo.save(order);
    return order;
  }

  // Add extra item to order
  async addOrderItem(orderId: string, extraId: string, quantity = 1) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === BilliardOrderStatus.CANCELLED || order.status === BilliardOrderStatus.COMPLETED) {
      throw new BadRequestException('Order is closed');
    }
    const extra = await this.extraRepo.findOne({ where: { id: extraId } });
    if (!extra) throw new NotFoundException('Extra not found');

    const item = this.itemRepo.create({ orderId: order.id, extraId: extra.id, quantity, price: Number(extra.price) });
    await this.itemRepo.save(item);

    // update order total
    order.total = Number((Number(order.total) + Number(extra.price) * quantity).toFixed(2));
    await this.orderRepo.save(order);
    return item;
  }

  // Close order: calculate final total and free the table
  async closeOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === BilliardOrderStatus.COMPLETED) throw new BadRequestException('Order already closed');

    // compute price for duration
    const durationHours = (order.durationMinutes || 60) / 60;
    const base = Number(order.pricePerHour || 0) * durationHours;

    // sum items
    const items = await this.itemRepo.find({ where: { orderId: order.id }, relations: ['extra'] });
    const extrasTotal = items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);

    const finalTotal = Number((base + extrasTotal).toFixed(2));
    order.total = finalTotal;
    order.status = BilliardOrderStatus.COMPLETED;
    await this.orderRepo.save(order);

    // free table
    const table = order.table;
    table.status = BilliardTableStatus.FREE;
    await this.tableRepo.save(table);

    return { order, items, finalTotal };
  }
}
