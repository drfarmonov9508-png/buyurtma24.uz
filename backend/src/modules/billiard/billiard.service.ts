import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable, BilliardTableStatus } from './billiard-table.entity';
import { BilliardOrder, BilliardOrderStatus } from './billiard-order.entity';
import { BilliardTableType } from './billiard-table-type.entity';
import { BilliardExtra } from './billiard-extra.entity';
import { BilliardOrderItem, BilliardOrderItemStatus } from './billiard-order-item.entity';
import { BilliardGateway } from './billiard.gateway';

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
  ) {}

  async findClubs(regionId?: string, serviceSlug?: string, city?: string) {
    const query = this.clubRepo.createQueryBuilder('club')
      .leftJoinAndSelect('club.region', 'region')
      .leftJoinAndSelect('club.service', 'service')
      .where('club.isActive = true');

    if (regionId) query.andWhere('club.regionId = :regionId', { regionId });
    if (serviceSlug) query.andWhere('service.slug = :serviceSlug', { serviceSlug });
    if (city) query.andWhere('club.city = :city', { city });

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
    return this.tableRepo.find({ where: { clubId, isActive: true }, relations: ['type'], order: { name: 'ASC' } });
  }

  async findAdminClub(tenantId: string) {
    const club = await this.clubRepo.findOne({ where: { tenantId, isActive: true }, relations: ['region'] });
    if (!club) throw new NotFoundException('Billiard tashkiloti topilmadi');
    return club;
  }

  async findAdminSnapshot(tenantId: string) {
    const club = await this.findAdminClub(tenantId);
    const [tables, types, extras, orders, pendingItems] = await Promise.all([
      this.tableRepo.find({ where: { clubId: club.id, isActive: true }, relations: ['type'], order: { name: 'ASC' } }),
      this.typeRepo.find({ where: { clubId: club.id }, order: { name: 'ASC' } }),
      this.extraRepo.find({ where: { clubId: club.id, isActive: true }, order: { name: 'ASC' } }),
      this.orderRepo.find({
        where: [
          { clubId: club.id, status: BilliardOrderStatus.PENDING },
          { clubId: club.id, status: BilliardOrderStatus.CONFIRMED },
        ],
        relations: ['table', 'user'],
        order: { createdAt: 'DESC' },
      }),
      this.itemRepo.find({
        where: { status: BilliardOrderItemStatus.PENDING },
        relations: ['order', 'order.table', 'extra'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      club,
      tables,
      types,
      extras,
      orders,
      pendingItems: pendingItems.filter((item) => item.order?.clubId === club.id),
    };
  }

  async createType(tenantId: string, dto: { name: string; tier?: string; details?: string; pricePerHour: number }) {
    const club = await this.findAdminClub(tenantId);
    const type = await this.typeRepo.save(this.typeRepo.create({
      clubId: club.id,
      name: dto.name,
      tier: dto.tier || dto.name.toLowerCase(),
      details: dto.details,
      pricePerHour: Number(dto.pricePerHour || 0),
    }));
    this.gateway.emitClub(club.id, 'catalog-updated', { kind: 'type', type });
    return type;
  }

  async createTable(tenantId: string, dto: { name: string; capacity?: number; pricePerHour: number; typeId?: string }) {
    const club = await this.findAdminClub(tenantId);
    const table = await this.tableRepo.save(this.tableRepo.create({
      clubId: club.id,
      name: dto.name,
      capacity: dto.capacity || 4,
      typeId: dto.typeId || null,
      pricePerHour: Number(dto.pricePerHour || 0),
      status: BilliardTableStatus.FREE,
    }));
    this.gateway.emitClub(club.id, 'table-updated', table);
    return table;
  }

  async createExtra(tenantId: string, dto: { name: string; category?: string; price: number }) {
    const club = await this.findAdminClub(tenantId);
    const extra = await this.extraRepo.save(this.extraRepo.create({
      clubId: club.id,
      name: dto.name,
      category: dto.category,
      price: Number(dto.price || 0),
    }));
    this.gateway.emitClub(club.id, 'catalog-updated', { kind: 'extra', extra });
    return extra;
  }

  async findExtras(clubId: string) {
    return this.extraRepo.find({ where: { clubId, isActive: true }, order: { name: 'ASC' } });
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

    const order = this.orderRepo.create({
      userId,
      clubId: club.id,
      tableId: table.id,
      status: BilliardOrderStatus.PENDING,
      startAt: start,
      endAt: end,
      durationMinutes,
      pricePerHour: Number(table.pricePerHour),
      total: 0,
      note,
    });

    table.status = BilliardTableStatus.RESERVED;
    await this.tableRepo.save(table);
    const saved = await this.orderRepo.save(order);
    this.gateway.emitClub(club.id, 'booking-requested', saved);
    this.gateway.emitClub(club.id, 'table-updated', table);
    return saved;
  }

  async findMyOrders(userId: string) {
    return this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, relations: ['table', 'club'] });
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
    order.confirmedAt = new Date();
    order.startAt = order.confirmedAt;
    order.endAt = null;
    await this.orderRepo.save(order);
    this.gateway.emitClub(order.clubId, 'booking-confirmed', order);
    this.gateway.emitClub(order.clubId, 'table-updated', table);
    return order;
  }

  // Add extra item to order
  async addOrderItem(orderId: string, extraId: string, quantity = 1, status = BilliardOrderItemStatus.ACCEPTED, note?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === BilliardOrderStatus.CANCELLED || order.status === BilliardOrderStatus.COMPLETED) {
      throw new BadRequestException('Order is closed');
    }
    const extra = await this.extraRepo.findOne({ where: { id: extraId } });
    if (!extra) throw new NotFoundException('Extra not found');

    const item = this.itemRepo.create({
      orderId: order.id,
      extraId: extra.id,
      name: extra.name,
      quantity,
      price: status === BilliardOrderItemStatus.ACCEPTED ? Number(extra.price) : 0,
      note,
      status,
    });
    await this.itemRepo.save(item);

    if (status === BilliardOrderItemStatus.ACCEPTED) {
      order.total = Number((Number(order.total) + Number(extra.price) * quantity).toFixed(2));
      await this.orderRepo.save(order);
      this.gateway.emitClub(order.clubId, 'bill-updated', order);
    } else {
      this.gateway.emitClub(order.clubId, 'extra-requested', { item, order });
    }
    return item;
  }

  async requestExtra(orderId: string, extraId: string, quantity = 1, note?: string) {
    return this.addOrderItem(orderId, extraId, quantity, BilliardOrderItemStatus.PENDING, note);
  }

  async acknowledgeItem(itemId: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId }, relations: ['order', 'order.table', 'extra'] });
    if (!item) throw new NotFoundException('Item not found');
    if (item.status === BilliardOrderItemStatus.ACCEPTED) return item;

    item.status = BilliardOrderItemStatus.ACCEPTED;
    item.price = Number(item.extra?.price || item.price || 0);
    item.name = item.name || item.extra?.name || 'Qo‘shimcha buyurtma';
    await this.itemRepo.save(item);

    const order = item.order;
    order.total = Number((Number(order.total) + Number(item.price) * item.quantity).toFixed(2));
    await this.orderRepo.save(order);
    this.gateway.emitClub(order.clubId, 'extra-accepted', { item, order });
    return item;
  }

  async findActiveOrderForTable(tableId: string, userId?: string) {
    const where: any = { tableId, status: BilliardOrderStatus.CONFIRMED };
    if (userId) where.userId = userId;
    const order = await this.orderRepo.findOne({ where, relations: ['table', 'club'] });
    if (!order) throw new NotFoundException('Faol sessiya topilmadi');
    const items = await this.itemRepo.find({ where: { orderId: order.id }, relations: ['extra'] });
    return { order, items };
  }

  // Close order: calculate final total and free the table
  async closeOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === BilliardOrderStatus.COMPLETED) throw new BadRequestException('Order already closed');

    // compute price for duration
    const closedAt = new Date();
    const startedAt = order.confirmedAt || order.startAt || order.createdAt;
    const durationMinutes = Math.max(1, Math.ceil((closedAt.getTime() - new Date(startedAt).getTime()) / 60000));
    const durationHours = durationMinutes / 60;
    const base = Number(order.pricePerHour || 0) * durationHours;

    // sum items
    const items = await this.itemRepo.find({ where: { orderId: order.id }, relations: ['extra'] });
    const extrasTotal = items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);

    const finalTotal = Number((base + extrasTotal).toFixed(2));
    order.total = finalTotal;
    order.status = BilliardOrderStatus.COMPLETED;
    order.durationMinutes = durationMinutes;
    order.closedAt = closedAt;
    order.endAt = closedAt;
    await this.orderRepo.save(order);

    // free table
    const table = order.table;
    table.status = BilliardTableStatus.FREE;
    await this.tableRepo.save(table);
    this.gateway.emitClub(order.clubId, 'order-closed', { order, items, finalTotal });
    this.gateway.emitClub(order.clubId, 'table-updated', table);

    return { order, items, finalTotal };
  }
}
