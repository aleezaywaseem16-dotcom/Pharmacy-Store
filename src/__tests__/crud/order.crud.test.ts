import { orderService } from '@/services/order.service';

jest.mock('@/config/database', () => ({
  db: {
    userAddress: { findFirst: jest.fn() },
    cart: { findUnique: jest.fn() },
    prescription: { findFirst: jest.fn() },
    coupon: { findUnique: jest.fn() },
    inventoryBatch: { findMany: jest.fn(), update: jest.fn() },
    order: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    orderItem: { findFirst: jest.fn(), findMany: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    product: { update: jest.fn() },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(require('@/config/database').db)),
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:3000' } }));
jest.mock('@/services/notification.service', () => ({ notificationService: { create: jest.fn() } }));
jest.mock('@/services/email.service', () => ({ emailService: { sendOrderConfirmation: jest.fn() } }));
jest.mock('@/services/product.service', () => ({ productService: { recalculateTotalStock: jest.fn() } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseOrder = {
  id: 'ord-001', orderNumber: 'PH-20260701-0001', userId: 'u-1',
  status: 'PENDING', paymentStatus: 'UNPAID', total: 240,
  items: [], address: {}, coupon: null, payment: null,
};

describe('Order CRUD', () => {
  describe('CREATE', () => {
    it('throws CART_EMPTY when cart has no items', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce({ id: 'addr-1' });
      mockDb.cart.findUnique.mockResolvedValueOnce({ id: 'cart-1', items: [] });

      await expect(
        orderService.createOrder('u-1', {
          addressId: 'addr-1', paymentMethod: 'COD',
        }),
      ).rejects.toMatchObject({ code: 'CART_EMPTY' });
    });

    it('throws NOT_FOUND when address not found', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce(null);
      await expect(
        orderService.createOrder('u-1', { addressId: 'ghost', paymentMethod: 'COD' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws PRESCRIPTION_REQUIRED for Rx items without prescription', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce({ id: 'addr-1' });
      mockDb.cart.findUnique.mockResolvedValueOnce({
        id: 'cart-1',
        items: [{ product: { requiresPrescription: true, isActive: true, deletedAt: null, id: 'p-1', name: 'Aug', sku: 'AUG', price: 450, discountedPrice: null } }],
      });

      await expect(
        orderService.createOrder('u-1', { addressId: 'addr-1', paymentMethod: 'COD' }),
      ).rejects.toMatchObject({ code: 'PRESCRIPTION_REQUIRED' });
    });
  });

  describe('READ', () => {
    it('returns paginated orders for a user', async () => {
      mockDb.order.findMany.mockResolvedValueOnce([baseOrder]);
      mockDb.order.count.mockResolvedValueOnce(1);

      const result = await orderService.getUserOrders('u-1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(mockDb.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'u-1' }) }),
      );
    });

    it('returns order by id for owner', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce(baseOrder);
      const result = await orderService.getOrderById('ord-001', 'u-1');
      expect(result.orderNumber).toBe('PH-20260701-0001');
    });

    it('throws NOT_FOUND for order not belonging to user', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce(null);
      await expect(orderService.getOrderById('ord-001', 'other-user')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('UPDATE', () => {
    it('cancels an order in PENDING status', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce({ ...baseOrder, status: 'PENDING' });
      mockDb.order.update.mockResolvedValueOnce({ ...baseOrder, status: 'CANCELLED' });
      mockDb.orderStatusHistory.create.mockResolvedValueOnce({});
      mockDb.orderItem.findMany.mockResolvedValueOnce([]); // inside $transaction
      mockDb.orderItem.findMany.mockResolvedValueOnce([]); // after $transaction (stock recalc)

      const result = await orderService.cancelOrder('ord-001', 'u-1', { reason: 'Changed mind' });
      expect(result.status).toBe('CANCELLED');
    });

    it('throws CANNOT_CANCEL for delivered order', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce({ ...baseOrder, status: 'DELIVERED' });
      await expect(
        orderService.cancelOrder('ord-001', 'u-1', { reason: 'Test' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
