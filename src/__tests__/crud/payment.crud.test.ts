import { paymentService } from '@/services/payment.service';

jest.mock('@/config/database', () => ({
  db: {
    order: { findFirst: jest.fn() },
    payment: { findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(require('@/config/database').db)),
  },
}));
jest.mock('@/config/env', () => ({
  env: { NODE_ENV: 'test', WEBHOOK_SECRET: 'test-webhook-secret' },
}));
jest.mock('@/services/notification.service', () => ({
  notificationService: { create: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseOrder = { id: 'ord-1', userId: 'u-1', total: 500, orderNumber: 'PH-001', paymentMethod: 'COD', paymentStatus: 'UNPAID' };

describe('Payment CRUD', () => {
  describe('CREATE — initiatePayment', () => {
    it('creates payment record for an order', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce(baseOrder);
      mockDb.payment.findUnique.mockResolvedValueOnce(null);
      mockDb.payment.create.mockResolvedValueOnce({ id: 'pay-1', orderId: 'ord-1', amount: 500, status: 'UNPAID' });

      const result = await paymentService.initiatePayment('ord-1', 'u-1');
      expect(mockDb.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ orderId: 'ord-1' }) }),
      );
      expect(result.status).toBe('UNPAID');
    });

    it('returns existing payment if already created', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce(baseOrder);
      const existing = { id: 'pay-1', orderId: 'ord-1', amount: 500, status: 'UNPAID' };
      mockDb.payment.findUnique.mockResolvedValueOnce(existing);

      const result = await paymentService.initiatePayment('ord-1', 'u-1');
      expect(mockDb.payment.create).not.toHaveBeenCalled();
      expect(result.id).toBe('pay-1');
    });

    it('throws for already paid order', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce({ ...baseOrder, paymentStatus: 'PAID' });
      await expect(paymentService.initiatePayment('ord-1', 'u-1')).rejects.toMatchObject({ code: 'ALREADY_PAID' });
    });

    it('throws NOT_FOUND for unknown order', async () => {
      mockDb.order.findFirst.mockResolvedValueOnce(null);
      await expect(paymentService.initiatePayment('ghost', 'u-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('Webhook signature', () => {
    it('returns true for valid HMAC signature', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      const secret = 'test-webhook-secret';
      const body = Buffer.from('{"status":"SUCCESS"}');
      const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

      const valid = paymentService.verifyWebhookSignature(body, sig);
      expect(valid).toBe(true);
    });

    it('returns false for tampered signature', () => {
      const body = Buffer.from('{"status":"SUCCESS"}');
      const valid = paymentService.verifyWebhookSignature(body, 'deadbeef'.repeat(8));
      expect(valid).toBe(false);
    });
  });
});
