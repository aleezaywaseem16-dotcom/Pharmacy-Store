import { wishlistService } from '@/services/wishlist.service';

jest.mock('@/config/database', () => ({
  db: {
    wishlistItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: { findFirst: jest.fn() },
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseItem = { id: 'w-1', userId: 'u-1', productId: 'p-1', addedAt: new Date() };

describe('Wishlist CRUD', () => {
  describe('CREATE — add', () => {
    it('adds product to wishlist', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ id: 'p-1', isActive: true, deletedAt: null });
      mockDb.wishlistItem.findUnique.mockResolvedValueOnce(null);
      mockDb.wishlistItem.create.mockResolvedValueOnce(baseItem);

      const result = await wishlistService.add('u-1', 'p-1');
      expect(mockDb.wishlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: 'u-1', productId: 'p-1' } }),
      );
      expect(result.productId).toBe('p-1');
    });

    it('throws NOT_FOUND for missing product', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(null);
      await expect(wishlistService.add('u-1', 'ghost')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws ALREADY_IN_WISHLIST if already added', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ id: 'p-1', isActive: true, deletedAt: null });
      mockDb.wishlistItem.findUnique.mockResolvedValueOnce(baseItem);
      await expect(wishlistService.add('u-1', 'p-1')).rejects.toMatchObject({ code: 'ALREADY_IN_WISHLIST' });
    });
  });

  describe('READ — getWishlist / isInWishlist', () => {
    it('returns paginated wishlist items', async () => {
      mockDb.wishlistItem.findMany.mockResolvedValueOnce([baseItem]);
      mockDb.wishlistItem.count.mockResolvedValueOnce(1);

      const result = await wishlistService.getWishlist('u-1', 1, 20);
      expect(result.data).toHaveLength(1);
    });

    it('returns true when product is in wishlist', async () => {
      mockDb.wishlistItem.findUnique.mockResolvedValueOnce(baseItem);
      const result = await wishlistService.isInWishlist('u-1', 'p-1');
      expect(result).toBe(true);
    });

    it('returns false when product is not in wishlist', async () => {
      mockDb.wishlistItem.findUnique.mockResolvedValueOnce(null);
      const result = await wishlistService.isInWishlist('u-1', 'p-2');
      expect(result).toBe(false);
    });
  });

  describe('DELETE — remove', () => {
    it('removes product from wishlist', async () => {
      mockDb.wishlistItem.findUnique.mockResolvedValueOnce(baseItem);
      mockDb.wishlistItem.delete.mockResolvedValueOnce(baseItem);

      await wishlistService.remove('u-1', 'p-1');
      expect(mockDb.wishlistItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_productId: { userId: 'u-1', productId: 'p-1' } },
        }),
      );
    });

    it('throws NOT_FOUND if item not in wishlist', async () => {
      mockDb.wishlistItem.findUnique.mockResolvedValueOnce(null);
      await expect(wishlistService.remove('u-1', 'ghost')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
