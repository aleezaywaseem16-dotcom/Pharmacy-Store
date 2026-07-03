import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';

export const uploadProductImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No image uploaded', 400, 'FILE_MISSING');
  const storageKey = `products/${req.file.filename}`;
  res.status(201).json({ success: true, data: { storageKey } });
});
