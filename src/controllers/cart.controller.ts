import { Request, Response } from 'express';
import { cartService } from '@/services/cart.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);
  res.json({ success: true, data: cart });
});

export const addCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, prescriptionId } = req.body;
  const cart = await cartService.addItem(req.user!.id, productId, quantity, prescriptionId);
  res.status(201).json({ success: true, data: cart });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!.id, req.params.itemId, req.body.quantity);
  res.json({ success: true, data: cart });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.id, req.params.itemId);
  res.json({ success: true, data: cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clearCart(req.user!.id);
  res.json({ success: true, message: 'Cart cleared' });
});
