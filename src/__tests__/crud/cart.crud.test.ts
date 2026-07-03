import { cartService } from '@/services/cart.service';

jest.mock('@/config/database', () => ({
  db: {
    cart: { upsert: jest.fn(), findUnique: jest.fn() },
    product: { findFirst: jest.fn() },
    cartItem: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const mockProduct = {
  id: 'p-1', name: 'Panadol', slug: 'panadol', price: 120,
  discountedPrice: null, requiresPrescription: false, totalStock: 50,
  isActive: true, deletedAt: null, images: [],
};
const mockCart = { id: 'cart-1', userId: 'u-1', items: [] };
const mockCartWithItem = {
  ...mockCart,
  items: [{ id: 'ci-1', cartId: 'cart-1', productId: 'p-1', quantity: 2, prescriptionId: null, product: mockProduct }],
};

describe('Cart CRUD', () => {
  describe('READ — getCart', () => {
    it('returns formatted cart with items', async () => {
      mockDb.cart.upsert.mockResolvedValueOnce(mockCartWithItem);
      const result = await cartService.getCart('u-1');
      expect(result).toBeDefined();
      expect(mockDb.cart.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u-1' } }));
    });
  });

  describe('CREATE — addItem', () => {
    it('adds a product to the cart', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(mockProduct);
      mockDb.cart.upsert.mockResolvedValue(mockCart);
      mockDb.cartItem.upsert.mockResolvedValueOnce({ id: 'ci-new', quantity: 2 });
      mockDb.cart.upsert.mockResolvedValue(mockCartWithItem);

      const result = await cartService.addItem('u-1', 'p-1', 2);
      expect(mockDb.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'p-1' }) }),
      );
      expect(result).toBeDefined();
    });

    it('throws NOT_FOUND for inactive product', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(null);
      await expect(cartService.addItem('u-1', 'ghost', 1)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws INSUFFICIENT_STOCK when quantity exceeds stock', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ ...mockProduct, totalStock: 1 });
      await expect(cartService.addItem('u-1', 'p-1', 5)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    });
  });

  describe('UPDATE — updateItem', () => {
    it('updates item quantity', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(mockProduct);
      mockDb.cart.findUnique.mockResolvedValueOnce(mockCart);
      mockDb.cartItem.findFirst.mockResolvedValueOnce({ id: 'ci-1', cartId: 'cart-1', quantity: 1 });
      mockDb.cartItem.update.mockResolvedValueOnce({ id: 'ci-1', quantity: 3 });
      mockDb.cart.upsert.mockResolvedValueOnce(mockCartWithItem);

      const result = await cartService.updateItem('u-1', 'p-1', 3);
      expect(result).toBeDefined();
    });
  });

  describe('DELETE — removeItem / clearCart', () => {
    it('removes a single item from cart', async () => {
      mockDb.cart.findUnique.mockResolvedValueOnce(mockCart);
      mockDb.cartItem.delete.mockResolvedValueOnce({});
      mockDb.cart.upsert.mockResolvedValueOnce(mockCart);

      const result = await cartService.removeItem('u-1', 'p-1');
      expect(mockDb.cartItem.delete).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('clears all items from cart', async () => {
      mockDb.cart.findUnique.mockResolvedValueOnce(mockCart);
      mockDb.cartItem.deleteMany.mockResolvedValueOnce({ count: 3 });

      await cartService.clearCart('u-1');
      expect(mockDb.cartItem.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ cartId: 'cart-1' }) }),
      );
    });
  });
});
