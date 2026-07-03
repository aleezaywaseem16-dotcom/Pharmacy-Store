import { notificationService } from '@/services/notification.service';

jest.mock('@/config/database', () => ({
  db: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseNotif = {
  id: 'notif-1', userId: 'u-1', type: 'ORDER_PLACED',
  title: 'Order Placed', body: 'Your order PH-001 was placed.',
  isRead: false, readAt: null,
};

describe('Notification CRUD', () => {
  describe('CREATE', () => {
    it('creates a notification for a user', async () => {
      mockDb.notification.create.mockResolvedValueOnce(baseNotif);

      const result = await notificationService.create(
        'u-1', 'ORDER_PLACED', 'Order Placed', 'Your order PH-001 was placed.', { orderId: 'ord-1' },
      );

      expect(mockDb.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'u-1', type: 'ORDER_PLACED' }),
        }),
      );
      expect(result.title).toBe('Order Placed');
    });
  });

  describe('READ', () => {
    it('returns paginated notifications for user', async () => {
      mockDb.notification.findMany.mockResolvedValueOnce([baseNotif]);
      mockDb.notification.count.mockResolvedValueOnce(1);

      const result = await notificationService.getUserNotifications('u-1', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(mockDb.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u-1' } }),
      );
    });

    it('returns unread count', async () => {
      mockDb.notification.count.mockResolvedValueOnce(3);
      const count = await notificationService.getUnreadCount('u-1');
      expect(count).toBe(3);
      expect(mockDb.notification.count).toHaveBeenCalledWith({
        where: { userId: 'u-1', isRead: false },
      });
    });
  });

  describe('UPDATE — mark read', () => {
    it('marks a single notification as read', async () => {
      mockDb.notification.updateMany.mockResolvedValueOnce({ count: 1 });
      await notificationService.markAsRead('notif-1', 'u-1');
      expect(mockDb.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'notif-1', userId: 'u-1' }, data: { isRead: true, readAt: expect.any(Date) } }),
      );
    });

    it('marks all notifications as read', async () => {
      mockDb.notification.updateMany.mockResolvedValueOnce({ count: 5 });
      await notificationService.markAllRead('u-1');
      expect(mockDb.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u-1', isRead: false } }),
      );
    });
  });
});
