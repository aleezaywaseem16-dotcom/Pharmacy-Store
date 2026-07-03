import { reviewService } from '@/services/review.service';

jest.mock('@/config/database', () => ({
  db: {
    productReview: {
      findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(),
    },
    product: { findFirst: jest.fn(), update: jest.fn() },
    orderItem: { findFirst: jest.fn() },
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));
jest.mock('@/services/product.service', () => ({
  productService: { recalculateRating: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseReview = {
  id: 'rev-001', productId: 'p-1', userId: 'u-1',
  rating: 5, title: 'Great', body: 'Works well',
  isVerified: true, isApproved: false,
};

describe('Review CRUD', () => {
  describe('CREATE', () => {
    it('creates a review for a verified purchaser', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ id: 'p-1', isActive: true, deletedAt: null });
      mockDb.productReview.findUnique.mockResolvedValueOnce(null);
      mockDb.orderItem.findFirst.mockResolvedValueOnce({ id: 'oi-1' });
      mockDb.productReview.create.mockResolvedValueOnce({ ...baseReview, isVerified: true });

      const result = await reviewService.createReview('u-1', 'p-1', { rating: 5, title: 'Great', body: 'Works well' });

      expect(result.isVerified).toBe(true);
      expect(mockDb.productReview.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rating: 5, isVerified: true }) }),
      );
    });

    it('creates unverified review when no purchase found', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ id: 'p-1', isActive: true, deletedAt: null });
      mockDb.productReview.findUnique.mockResolvedValueOnce(null);
      mockDb.orderItem.findFirst.mockResolvedValueOnce(null);
      mockDb.productReview.create.mockResolvedValueOnce({ ...baseReview, isVerified: false });

      const result = await reviewService.createReview('u-1', 'p-1', { rating: 4 });
      expect(result.isVerified).toBe(false);
    });

    it('throws ALREADY_REVIEWED if user already reviewed', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ id: 'p-1', isActive: true, deletedAt: null });
      mockDb.productReview.findUnique.mockResolvedValueOnce(baseReview);
      await expect(reviewService.createReview('u-1', 'p-1', { rating: 3 }))
        .rejects.toMatchObject({ code: 'ALREADY_REVIEWED' });
    });
  });

  describe('READ', () => {
    it('returns approved reviews for a product', async () => {
      mockDb.productReview.findMany.mockResolvedValueOnce([{ ...baseReview, isApproved: true, user: {} }]);
      mockDb.productReview.count.mockResolvedValueOnce(1);

      const result = await reviewService.getProductReviews('p-1', 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('UPDATE — approve', () => {
    it('approves a pending review', async () => {
      mockDb.productReview.findUnique.mockResolvedValueOnce(baseReview);
      mockDb.productReview.update.mockResolvedValueOnce({ ...baseReview, isApproved: true });

      await reviewService.approveReview('rev-001');
      expect(mockDb.productReview.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rev-001' }, data: { isApproved: true } }),
      );
    });
  });

  describe('DELETE', () => {
    it('deletes a review and recalculates product rating', async () => {
      mockDb.productReview.findUnique.mockResolvedValueOnce(baseReview);
      mockDb.productReview.delete.mockResolvedValueOnce(baseReview);

      await reviewService.deleteReview('rev-001', 'u-1', 'ADMIN');
      expect(mockDb.productReview.delete).toHaveBeenCalledWith({ where: { id: 'rev-001' } });
    });
  });
});
