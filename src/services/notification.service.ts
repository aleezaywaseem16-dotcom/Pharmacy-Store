import { NotificationType, Prisma } from '@prisma/client';
import { db } from '@/config/database';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';

class NotificationService {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    return db.notification.create({
      data: { userId, type, title, body, data: data as Prisma.InputJsonValue | undefined },
    });
  }

  async getUserNotifications(userId: string, page: unknown, limit: unknown) {
    const pagination = parsePagination(page, limit);

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.notification.count({ where: { userId } }),
    ]);

    return buildPaginatedResponse(notifications, total, pagination);
  }

  async markAsRead(id: string, userId: string) {
    return db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return db.notification.count({ where: { userId, isRead: false } });
  }
}

export const notificationService = new NotificationService();
