import { categoryService } from '@/services/category.service';

jest.mock('@/config/database', () => ({
  db: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: { count: jest.fn() },
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseCategory = {
  id: 'cat-001', name: 'Medicines', slug: 'medicines',
  description: 'All medicines', isActive: true, parentId: null, sortOrder: 1,
  children: [],
};

describe('Category CRUD', () => {
  describe('CREATE', () => {
    it('creates a category with auto-generated slug', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce(null);
      mockDb.category.create.mockResolvedValueOnce(baseCategory);

      const result = await categoryService.create({ name: 'Medicines', sortOrder: 1, isActive: true });

      expect(mockDb.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Medicines' }) }),
      );
      expect(result.name).toBe('Medicines');
    });

    it('throws SLUG_EXISTS if slug already used', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce(baseCategory);
      await expect(categoryService.create({ name: 'Medicines', sortOrder: 1, isActive: true }))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('READ', () => {
    it('returns all top-level categories with children', async () => {
      mockDb.category.findMany.mockResolvedValueOnce([baseCategory]);
      const result = await categoryService.getAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('Medicines');
    });

    it('returns category by slug', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce({ ...baseCategory, parent: null });
      const result = await categoryService.getBySlug('medicines');
      expect(result.slug).toBe('medicines');
    });

    it('throws NOT_FOUND for unknown slug', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce(null);
      await expect(categoryService.getBySlug('ghost')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('UPDATE', () => {
    it('updates category name and re-slugifies', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce(baseCategory);
      mockDb.category.update.mockResolvedValueOnce({ ...baseCategory, name: 'Medicines Updated' });

      const result = await categoryService.update('cat-001', { name: 'Medicines Updated' });
      expect(result.name).toBe('Medicines Updated');
    });
  });

  describe('DELETE', () => {
    it('deletes a category with no products', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce(baseCategory);
      mockDb.product.count.mockResolvedValueOnce(0);
      mockDb.category.delete.mockResolvedValueOnce(baseCategory);

      await categoryService.delete('cat-001');
      expect(mockDb.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-001' } });
    });

    it('throws if category has products', async () => {
      mockDb.category.findUnique.mockResolvedValueOnce(baseCategory);
      mockDb.product.count.mockResolvedValueOnce(3);
      await expect(categoryService.delete('cat-001')).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
