import { Request, Response } from 'express';
import { inventoryService } from '@/services/inventory.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getBatches = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.getBatches(
    req.query.page,
    req.query.limit,
    req.query.productId as string | undefined,
  );
  res.json(result);
});

export const createBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await inventoryService.createBatch(req.body, req.user!.id);
  res.status(201).json({ success: true, data: batch });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  await inventoryService.adjustStock(req.body, req.user!.id);
  res.json({ success: true, message: 'Stock adjusted' });
});

export const getExpiringSoon = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
  const batches = await inventoryService.getExpiringSoon(days);
  res.json({ success: true, data: batches });
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const threshold = req.query.threshold ? parseInt(String(req.query.threshold), 10) : 10;
  const products = await inventoryService.getLowStock(threshold);
  res.json({ success: true, data: products });
});
