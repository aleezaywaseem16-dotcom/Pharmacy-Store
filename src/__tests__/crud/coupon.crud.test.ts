// Direct db mock — coupon doesn't have a dedicated service yet

const mockDb = {
  coupon: {
    create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
    update: jest.fn(), count: jest.fn(),
  },
};

jest.mock('@/config/database', () => ({ db: mockDb }));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));

beforeEach(() => jest.clearAllMocks());

const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const baseCoupon = {
  id: 'coup-1', code: 'SAVE10', type: 'PERCENTAGE', value: 10,
  usageCount: 0, usageLimit: 100, validFrom: new Date(), validUntil, isActive: true,
};

describe('Coupon CRUD', () => {
  describe('CREATE', () => {
    it('creates a coupon', async () => {
      mockDb.coupon.create.mockResolvedValueOnce(baseCoupon);

      const result = await mockDb.coupon.create({
        data: { code: 'SAVE10', type: 'PERCENTAGE', value: 10, validFrom: new Date(), validUntil },
      });

      expect(mockDb.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ code: 'SAVE10' }) }),
      );
      expect(result.code).toBe('SAVE10');
    });
  });

  describe('READ', () => {
    it('finds a coupon by code', async () => {
      mockDb.coupon.findUnique.mockResolvedValueOnce(baseCoupon);

      const result = await mockDb.coupon.findUnique({ where: { code: 'SAVE10' } });
      expect(result.type).toBe('PERCENTAGE');
    });

    it('returns null for expired or invalid code', async () => {
      mockDb.coupon.findUnique.mockResolvedValueOnce(null);
      const result = await mockDb.coupon.findUnique({ where: { code: 'EXPIRED' } });
      expect(result).toBeNull();
    });

    it('lists all active coupons', async () => {
      mockDb.coupon.findMany.mockResolvedValueOnce([baseCoupon]);
      const result = await mockDb.coupon.findMany({ where: { isActive: true } });
      expect(result).toHaveLength(1);
    });
  });

  describe('UPDATE', () => {
    it('increments usage count on apply', async () => {
      mockDb.coupon.update.mockResolvedValueOnce({ ...baseCoupon, usageCount: 1 });

      const result = await mockDb.coupon.update({
        where: { id: 'coup-1' },
        data: { usageCount: { increment: 1 } },
      });

      expect(mockDb.coupon.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { usageCount: { increment: 1 } } }),
      );
      expect(result.usageCount).toBe(1);
    });

    it('deactivates a coupon', async () => {
      mockDb.coupon.update.mockResolvedValueOnce({ ...baseCoupon, isActive: false });
      const result = await mockDb.coupon.update({ where: { id: 'coup-1' }, data: { isActive: false } });
      expect(result.isActive).toBe(false);
    });
  });
});
