import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, RefundRequest } from './payment.entity';
import { Order } from '../orders/order.entity';
import { Table } from '../tables/table.entity';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../../common/enums/order-status.enum';
import { TableStatus } from '../tables/table.entity';

export class ProcessPaymentDto {
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  note?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(RefundRequest) private refundRepo: Repository<RefundRequest>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Table) private tableRepo: Repository<Table>,
  ) {}

  async processPayment(orderId: string, tenantId: string, dto: ProcessPaymentDto, cashierId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, tenantId }, relations: ['table'] });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');

    const change = dto.method === PaymentMethod.CASH
      ? Math.max(0, (dto.cashReceived || dto.amount) - dto.amount)
      : 0;

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        tenantId, orderId, method: dto.method, amount: dto.amount,
        cashReceived: dto.cashReceived || dto.amount, change,
        status: PaymentStatus.PAID, cashierId, note: dto.note,
      }),
    );

    await this.orderRepo.update(orderId, {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.COMPLETED,
      cashierId,
      completedAt: new Date(),
    });

    if (order.tableId) {
      await this.tableRepo.update(order.tableId, { status: TableStatus.FREE });
    }

    return { payment, change };
  }

  async splitBill(orderId: string, tenantId: string, splits: ProcessPaymentDto[], cashierId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');

    const totalPaid = splits.reduce((sum, s) => sum + s.amount, 0);
    const payments = [];

    for (const split of splits) {
      const p = await this.paymentRepo.save(
        this.paymentRepo.create({
          tenantId, orderId, method: split.method, amount: split.amount,
          cashReceived: split.cashReceived || split.amount,
          change: Math.max(0, (split.cashReceived || split.amount) - split.amount),
          status: PaymentStatus.PAID, cashierId,
        }),
      );
      payments.push(p);
    }

    if (totalPaid >= Number(order.total)) {
      await this.orderRepo.update(orderId, {
        paymentStatus: PaymentStatus.PAID, status: OrderStatus.COMPLETED,
        cashierId, completedAt: new Date(),
      });
      if (order.tableId) await this.tableRepo.update(order.tableId, { status: TableStatus.FREE });
    } else {
      await this.orderRepo.update(orderId, { paymentStatus: PaymentStatus.PARTIALLY_PAID });
    }

    return payments;
  }

  async requestRefund(orderId: string, tenantId: string, dto: { amount: number; reason: string; orderItemId?: string }, requestedById: string) {
    return this.refundRepo.save(
      this.refundRepo.create({ tenantId, orderId, ...dto, requestedById, status: 'pending' }),
    );
  }

  async processRefund(refundId: string, tenantId: string, approve: boolean, adminId: string, rejectionReason?: string) {
    const refund = await this.refundRepo.findOne({ where: { id: refundId, tenantId } });
    if (!refund) throw new NotFoundException('Refund request not found');

    await this.refundRepo.update(refundId, {
      status: approve ? 'approved' : 'rejected',
      approvedById: adminId,
      approvedAt: new Date(),
      rejectionReason: approve ? undefined : rejectionReason,
    });

    if (approve) {
      await this.orderRepo.update(refund.orderId, { paymentStatus: PaymentStatus.REFUNDED });
    }

    return this.refundRepo.findOne({ where: { id: refundId } });
  }

  async getPayments(tenantId: string, page = 1, limit = 20) {
    const [data, total] = await this.paymentRepo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getRefundRequests(tenantId: string, status?: string) {
    return this.refundRepo.find({
      where: { tenantId, ...(status && { status }) },
      order: { createdAt: 'DESC' },
    });
  }
}
