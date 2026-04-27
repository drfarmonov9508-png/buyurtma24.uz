import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  async create(dto: Partial<Notification>) {
    return this.repo.save(this.repo.create(dto));
  }

  async getForUser(userId: string, tenantId: string) {
    return this.repo.find({
      where: [{ userId, tenantId }, { userId, tenantId: null }],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    await this.repo.update({ id, userId }, { isRead: true, readAt: new Date() });
    return { message: 'Marked as read' };
  }

  async markAllRead(userId: string, tenantId: string) {
    await this.repo.update({ userId, tenantId, isRead: false }, { isRead: true, readAt: new Date() });
    return { message: 'All marked as read' };
  }

  async getUnreadCount(userId: string, tenantId: string) {
    const count = await this.repo.count({ where: { userId, tenantId, isRead: false } });
    return { count };
  }
}
