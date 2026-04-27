import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsObject, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Order, OrderItem } from './order.entity';
import { OrderStatus, OrderType, PaymentStatus } from '../../common/enums/order-status.enum';
import { Table, TableStatus } from '../tables/table.entity';
import { Product } from '../products/product.entity';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  extras?: any[];

  @IsOptional()
  variant?: any;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  waiterId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  deliveryAddress?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class AddItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Table) private tableRepo: Repository<Table>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(tenantId: string, dto: CreateOrderDto, branchId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        tenantId,
        branchId,
        orderNumber: this.generateOrderNumber(),
        type: dto.type || OrderType.DINE_IN,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        tableId: dto.tableId,
        clientId: dto.clientId,
        waiterId: dto.waiterId,
        note: dto.note || dto.notes,
        deliveryAddress: dto.deliveryAddress,
      });

      const saved = await manager.save(Order, order);

      let subtotal = 0;
      const items: OrderItem[] = [];

      for (const item of dto.items) {
        const product = await manager.findOne(Product, { where: { id: item.productId } });
        if (!product || product.isStopList) throw new BadRequestException(`Product ${item.productId} unavailable`);

        const extrasTotal = (item.extras || []).reduce((sum, e) => sum + (e.price || 0), 0);
        const variantExtra = item.variant?.price || 0;
        const price = Number(product.discountPrice || product.price);
        const itemTotal = (price + extrasTotal + variantExtra) * item.quantity;
        subtotal += itemTotal;

        items.push(manager.create(OrderItem, {
          tenantId,
          orderId: saved.id,
          productId: item.productId,
          productName: product.name,
          price,
          quantity: item.quantity,
          total: itemTotal,
          note: item.note,
          extras: item.extras,
          variant: item.variant,
          status: OrderStatus.PENDING,
        }));
      }

      await manager.save(OrderItem, items);
      await manager.update(Order, saved.id, { subtotal, total: subtotal });

      if (dto.tableId) {
        await manager.update(Table, dto.tableId, { status: TableStatus.OCCUPIED });
      }

      return manager.findOne(Order, { where: { id: saved.id }, relations: ['items', 'table', 'waiter'] });
    });
  }

  async findAll(tenantId: string, opts: {
    status?: OrderStatus; type?: OrderType; tableId?: string;
    waiterId?: string; cashierId?: string; clientId?: string;
    page?: number; limit?: number;
    dateFrom?: string; dateTo?: string;
  }) {
    const { status, type, tableId, waiterId, cashierId, clientId, page = 1, limit = 20, dateFrom, dateTo } = opts;
    const query = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.table', 'table')
      .leftJoinAndSelect('o.waiter', 'waiter')
      .leftJoinAndSelect('o.client', 'client')
      .where('o.tenantId = :tenantId', { tenantId });

    if (status) query.andWhere('o.status = :status', { status });
    if (type) query.andWhere('o.type = :type', { type });
    if (tableId) query.andWhere('o.tableId = :tableId', { tableId });
    if (waiterId) query.andWhere('o.waiterId = :waiterId', { waiterId });
    if (cashierId) query.andWhere('o.cashierId = :cashierId', { cashierId });
    if (clientId) query.andWhere('o.clientId = :clientId', { clientId });
    if (dateFrom) query.andWhere('o.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) query.andWhere('o.createdAt <= :dateTo', { dateTo });

    const [data, total] = await query
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit).take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId?: string) {
    const order = await this.orderRepo.findOne({
      where: { id, ...(tenantId && { tenantId }) },
      relations: ['items', 'table', 'waiter', 'client'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, tenantId: string, status: OrderStatus, userId?: string) {
    const order = await this.findOne(id, tenantId);

    const update: Partial<Order> = { status };
    if (status === OrderStatus.COMPLETED) {
      update.completedAt = new Date();
      update.paymentStatus = PaymentStatus.PAID;
      if (order.tableId) await this.tableRepo.update(order.tableId, { status: TableStatus.FREE });
    }
    if (status === OrderStatus.CANCELLED) {
      update.cancelledAt = new Date();
      if (order.tableId) await this.tableRepo.update(order.tableId, { status: TableStatus.FREE });
    }

    await this.orderRepo.update(id, update);
    return this.findOne(id, tenantId);
  }

  async updateItemStatus(itemId: string, tenantId: string, status: OrderStatus) {
    const item = await this.itemRepo.findOne({ where: { id: itemId, tenantId } });
    if (!item) throw new NotFoundException('Order item not found');
    await this.itemRepo.update(itemId, { status });
    return this.itemRepo.findOne({ where: { id: itemId } });
  }

  async addItems(orderId: string, tenantId: string, dto: AddItemsDto) {
    const order = await this.findOne(orderId, tenantId);
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('Cannot add items to this order');
    }

    let additionalTotal = 0;
    const items: OrderItem[] = [];

    for (const item of dto.items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product || product.isStopList) throw new BadRequestException(`Product ${item.productId} unavailable`);
      const price = Number(product.discountPrice || product.price);
      const itemTotal = price * item.quantity;
      additionalTotal += itemTotal;
      items.push(this.itemRepo.create({
        tenantId, orderId, productId: item.productId,
        productName: product.name, price, quantity: item.quantity,
        total: itemTotal, note: item.note, extras: item.extras, variant: item.variant,
        status: OrderStatus.PENDING,
      }));
    }

    await this.itemRepo.save(items);
    const newTotal = Number(order.total) + additionalTotal;
    await this.orderRepo.update(orderId, { total: newTotal, subtotal: Number(order.subtotal) + additionalTotal });
    return this.findOne(orderId, tenantId);
  }

  async applyDiscount(orderId: string, tenantId: string, discountAmount: number) {
    const order = await this.findOne(orderId, tenantId);
    const newTotal = Math.max(0, Number(order.subtotal) - discountAmount);
    await this.orderRepo.update(orderId, { discountAmount, total: newTotal });
    return this.findOne(orderId, tenantId);
  }

  async getKitchenOrders(tenantId: string, branchId?: string) {
    const query = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.table', 'table')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status IN (:...statuses)', { statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] });
    if (branchId) query.andWhere('o.branchId = :branchId', { branchId });
    return query.orderBy('o.createdAt', 'ASC').getMany();
  }

  async getActiveTableOrders(tenantId: string, tableId: string) {
    return this.orderRepo.findOne({
      where: { tenantId, tableId, status: OrderStatus.PENDING },
      relations: ['items'],
    });
  }
}
