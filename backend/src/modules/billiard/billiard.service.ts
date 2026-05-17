import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable, BilliardTableStatus } from './billiard-table.entity';
import { BilliardOrder, BilliardOrderStatus } from './billiard-order.entity';
import { BilliardTableType } from './billiard-table-type.entity';
import { BilliardExtra } from './billiard-extra.entity';
import { BilliardOrderItem } from './billiard-order-item.entity';

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
