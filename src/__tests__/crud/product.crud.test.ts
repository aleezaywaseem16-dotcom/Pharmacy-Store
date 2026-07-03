import { productService } from '@/services/product.service';

jest.mock('@/config/database', () => ({
  db: {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock('@/config/env', () => ({
  env: { NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:3000' },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseProduct = {
  id: 'p-001', name: 'Panadol 500mg', slug: 'panadol-500mg',
  sku: 'PAR-500-20', price: 120, totalStock: 100,
  isActive: true, deletedAt: null, categoryId: 'cat-1',
};

describe('Product CRUD', () => {
  describe('CREATE', () => {
    it('creates a product and returns it', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(null);
      mockDb.product.findUnique.mockResolvedValueOnce(null);
      mockDb.product.create.mockResolvedValueOnce({ ...baseProduct, id: 'p-new' });

      const result = await productService.create({
        categoryId: 'cat-1',
        name: 'Panadol 500mg',
        sku: 'PAR-500-20',
        price: 120,
        requiresPrescription: false,
        isControlled: false,
        isActive: true,
        isFeatured: false,
      });

      expect(mockDb.product.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Panadol 500mg' }) }),
      );
      expect(result.name).toBe('Panadol 500mg');
    });

    it('throws SLUG_EXISTS if slug already taken', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(baseProduct);
      await expect(
        productService.create({ categoryId: 'cat-1', name: 'Panadol 500mg', sku: 'PAR-500-20', price: 120, requiresPrescription: false, isControlled: false, isActive: true, isFeatured: false }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('READ', () => {
    it('returns product by slug', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(baseProduct);
      const result = await productService.getBySlug('panadol-500mg');
      expect(result.slug).toBe('panadol-500mg');
    });

    it('throws NOT_FOUND for missing slug', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(null);
      await expect(productService.getBySlug('ghost')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('returns featured products list', async () => {
      mockDb.product.findMany.mockResolvedValueOnce([baseProduct]);
      const result = await productService.getFeatured();
      expect(Array.isArray(result)).toBe(true);
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isFeatured: true }) }),
      );
    });
  });

  describe('UPDATE', () => {
    it('updates product fields', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(baseProduct);
      mockDb.product.update.mockResolvedValueOnce({ ...baseProduct, price: 150 });

      const result = await productService.update('p-001', { price: 150 });
      expect(result.price).toBe(150);
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p-001' } }),
      );
    });

    it('throws NOT_FOUND for missing product', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(null);
      await expect(productService.update('ghost', { price: 100 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('DELETE (soft)', () => {
    it('soft-deletes by setting deletedAt', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(baseProduct);
      mockDb.product.update.mockResolvedValueOnce({ ...baseProduct, deletedAt: new Date() });

      await productService.softDelete('p-001');
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });
  });
});
