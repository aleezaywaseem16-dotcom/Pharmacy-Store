import { inventoryService } from '@/services/inventory.service';

jest.mock('@/config/database', () => ({
  db: {
    inventoryBatch: {
      create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(),
      update: jest.fn(), count: jest.fn(),
    },
    product: { findFirst: jest.fn(), update: jest.fn() },
    stockAdjustment: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(require('@/config/database').db)),
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));
jest.mock('@/services/product.service', () => ({
  productService: { recalculateStock: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const baseBatch = {
  id: 'batch-1', productId: 'p-1', batchNumber: 'BATCH-001',
  quantity: 100, reservedQty: 0, expiryDate: new Date('2028-01-01'),
  purchasePrice: 80, isActive: true,
};

describe('Inventory CRUD', () => {
  describe('CREATE — createBatch', () => {
    it('creates an inventory batch and logs adjustment', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce({ id: 'p-1', name: 'Panadol' });
      mockDb.inventoryBatch.create.mockResolvedValueOnce(baseBatch);
      mockDb.stockAdjustment.create.mockResolvedValueOnce({});

      const result = await inventoryService.createBatch({
        productId: 'p-1', batchNumber: 'BATCH-001', quantity: 100,
        expiryDate: new Date('2028-01-01'), purchasePrice: 80,
      }, 'admin-1');

      expect(mockDb.inventoryBatch.create).toHaveBeenCalled();
      expect(mockDb.stockAdjustment.create).toHaveBeenCalled();
      expect(result.batchNumber).toBe('BATCH-001');
    });

    it('throws NOT_FOUND when product does not exist', async () => {
      mockDb.product.findFirst.mockResolvedValueOnce(null);
      await expect(
        inventoryService.createBatch({ productId: 'ghost', batchNumber: 'B-1', quantity: 10, expiryDate: new Date(), purchasePrice: 50 }, 'admin-1'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('READ', () => {
    it('returns paginated batches', async () => {
      mockDb.inventoryBatch.findMany.mockResolvedValueOnce([baseBatch]);
      mockDb.inventoryBatch.count.mockResolvedValueOnce(1);

      const result = await inventoryService.getBatches(1, 10);
      expect(result.data).toHaveLength(1);
    });

    it('filters batches by productId', async () => {
      mockDb.inventoryBatch.findMany.mockResolvedValueOnce([baseBatch]);
      mockDb.inventoryBatch.count.mockResolvedValueOnce(1);

      await inventoryService.getBatches(1, 10, 'p-1');
      expect(mockDb.inventoryBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ productId: 'p-1' }) }),
      );
    });

    it('returns batches expiring soon', async () => {
      mockDb.inventoryBatch.findMany.mockResolvedValueOnce([baseBatch]);
      const result = await inventoryService.getExpiringSoon(30);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('UPDATE — adjustStock', () => {
    it('records a stock adjustment and triggers recalculation', async () => {
      mockDb.inventoryBatch.findUnique.mockResolvedValueOnce({ ...baseBatch, quantity: 100 });
      mockDb.inventoryBatch.update.mockResolvedValueOnce({ ...baseBatch, quantity: 95 });
      mockDb.stockAdjustment.create.mockResolvedValueOnce({});

      await inventoryService.adjustStock({
        batchId: 'batch-1', type: 'DAMAGE', quantity: 5, reason: 'Dropped'
      }, 'admin-1');

      expect(mockDb.stockAdjustment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'DAMAGE', quantity: 5 }) }),
      );
    });
  });
});
