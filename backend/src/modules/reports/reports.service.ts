import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Payment } from '../payments/payment.entity';
import { User } from '../users/user.entity';
import { OrderStatus, PaymentStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getDashboard(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today);
    monthStart.setDate(1);
    const nextMonthStart = new Date(monthStart);
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const [todayOrders, todayRevenue, totalOrders, activeOrders, currentMonthOrders, previousMonthOrders, currentMonthRevenue, previousMonthRevenue, recentOrders, topProducts, lowStock] = await Promise.all([
      this.orderRepo
        .createQueryBuilder('o')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.createdAt >= :today', { today })
        .andWhere('o.createdAt < :tomorrow', { tomorrow })
        .getCount(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.tenantId = :tenantId', { tenantId })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.createdAt >= :today', { today })
        .andWhere('p.createdAt < :tomorrow', { tomorrow })
        .getRawOne(),
      this.orderRepo.count({ where: { tenantId } }),
      this.orderRepo.count({
        where: { tenantId, status: OrderStatus.PREPARING },
      }),
      this.orderRepo
        .createQueryBuilder('o')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.createdAt >= :monthStart', { monthStart })
        .andWhere('o.createdAt < :nextMonthStart', { nextMonthStart })
        .getCount(),
      this.orderRepo
        .createQueryBuilder('o')
        .where('o.tenantId = :tenantId', { tenantId })
        .andWhere('o.createdAt >= :prevMonthStart', { prevMonthStart })
        .andWhere('o.createdAt < :monthStart', { monthStart })
        .getCount(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.tenantId = :tenantId', { tenantId })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.createdAt >= :monthStart', { monthStart })
        .andWhere('p.createdAt < :nextMonthStart', { nextMonthStart })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.tenantId = :tenantId', { tenantId })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.createdAt >= :prevMonthStart', { prevMonthStart })
        .andWhere('p.createdAt < :monthStart', { monthStart })
        .getRawOne(),
      this.orderRepo.find({ where: { tenantId }, relations: ['table'], order: { createdAt: 'DESC' }, take: 6 }),
      this.getTopProducts(tenantId, 5, monthStart.toISOString(), nextMonthStart.toISOString()),
      this.inventoryRepo.createQueryBuilder('i')
        .where('i.tenantId = :tenantId', { tenantId })
        .andWhere('i.quantity <= i.lowStockThreshold')
        .orderBy('i.quantity', 'ASC')
        .getMany(),
    ]);

    const todayRevenueValue = Number(todayRevenue?.total || 0);
    const currentMonthRevenueValue = Number(currentMonthRevenue?.total || 0);
    const previousMonthRevenueValue = Number(previousMonthRevenue?.total || 0);

    return {
      todayOrders,
      todayRevenue: todayRevenueValue,
      totalOrders,
      activeOrders,
      monthRevenue: currentMonthRevenueValue,
      ordersGrowth: previousMonthOrders > 0 ? Number((((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100).toFixed(1)) : currentMonthOrders > 0 ? 100 : 0,
      revenueGrowth: previousMonthRevenueValue > 0 ? Number((((currentMonthRevenueValue - previousMonthRevenueValue) / previousMonthRevenueValue) * 100).toFixed(1)) : currentMonthRevenueValue > 0 ? 100 : 0,
      recentOrders,
      topProducts,
      lowStock,
    };
  }

  async getSalesByPeriod(tenantId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly', dateFrom?: string, dateTo?: string) {
    const query = this.paymentRepo
      .createQueryBuilder('p')
      .select(`DATE_TRUNC('${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}', p.createdAt)`, 'period')
      .addSelect('SUM(p.amount)', 'revenue')
      .addSelect('COUNT(p.id)', 'orders')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID });

    if (dateFrom) query.andWhere('p.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) query.andWhere('p.createdAt <= :dateTo', { dateTo });

    const rows = await query.groupBy('period').orderBy('period', 'ASC').getRawMany();
    const daily = rows.map((row) => ({
      date: row.period,
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    }));
    const totalRevenue = daily.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalOrders = daily.reduce((sum, item) => sum + Number(item.orders || 0), 0);
    const cancelledQuery = this.orderRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OrderStatus.CANCELLED });
    if (dateFrom) cancelledQuery.andWhere('o.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) cancelledQuery.andWhere('o.createdAt <= :dateTo', { dateTo });
    const cancelledOrders = await cancelledQuery.getCount();

    return {
      daily,
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      cancelledOrders,
    };
  }

  async getTopProducts(tenantId: string, limit = 10, dateFrom?: string, dateTo?: string) {
    const query = this.itemRepo
      .createQueryBuilder('i')
      .select('i.productId', 'id')
      .addSelect('i.productName', 'name')
      .addSelect('SUM(i.quantity)', 'count')
      .addSelect('SUM(i.total)', 'revenue')
      .where('i.tenantId = :tenantId', { tenantId });

    if (dateFrom) query.andWhere('i.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) query.andWhere('i.createdAt <= :dateTo', { dateTo });

    return query
      .groupBy('i.productId, i.productName')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getWaiterPerformance(tenantId: string, dateFrom?: string, dateTo?: string) {
    const query = this.orderRepo
      .createQueryBuilder('o')
      .select('o.waiterId', 'id')
      .addSelect("u.firstName || ' ' || u.lastName", 'name')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.total)', 'revenue')
      .innerJoin('o.waiter', 'u')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.waiterId IS NOT NULL')
      .andWhere('o.status = :status', { status: OrderStatus.COMPLETED });

    if (dateFrom) query.andWhere('o.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) query.andWhere('o.createdAt <= :dateTo', { dateTo });

    return query.groupBy('o.waiterId, u.firstName, u.lastName').orderBy('orderCount', 'DESC').getRawMany();
  }

  async getPeakHours(tenantId: string) {
    return this.orderRepo
      .createQueryBuilder('o')
      .select('EXTRACT(HOUR FROM o.createdAt)', 'hour')
      .addSelect('COUNT(o.id)', 'orderCount')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OrderStatus.COMPLETED })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();
  }

  async getCancellationReport(tenantId: string) {
    const total = await this.orderRepo.count({ where: { tenantId } });
    const cancelled = await this.orderRepo.count({ where: { tenantId, status: OrderStatus.CANCELLED } });
    return { total, cancelled, rate: total > 0 ? ((cancelled / total) * 100).toFixed(2) : 0 };
  }

  async getSuperAdminStats() {
    const [tenantCount, orderCount, revenue] = await Promise.all([
      this.orderRepo.manager.query('SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL'),
      this.orderRepo.count(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.status = :status', { status: PaymentStatus.PAID })
        .getRawOne(),
    ]);

    return {
      tenantCount: Number(tenantCount[0]?.count || 0),
      orderCount,
      totalRevenue: Number(revenue?.total || 0),
    };
  }
}
