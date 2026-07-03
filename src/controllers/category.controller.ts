import { Request, Response } from 'express';
import { categoryService } from '@/services/category.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.getAll();
  res.json({ success: true, data: categories });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getBySlug(req.params.slug);
  res.json({ success: true, data: category });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(req.params.id, req.body);
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.delete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});
