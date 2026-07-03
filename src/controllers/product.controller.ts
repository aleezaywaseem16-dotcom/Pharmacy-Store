import { Request, Response } from 'express';
import { productService } from '@/services/product.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.getProducts(req.query as never);
  res.json(result);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getBySlug(req.params.slug);
  res.json({ success: true, data: product });
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getFeatured();
  res.json({ success: true, data: products });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.update(req.params.id, req.body);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.softDelete(req.params.id);
  res.json({ success: true, message: 'Product deleted' });
});
