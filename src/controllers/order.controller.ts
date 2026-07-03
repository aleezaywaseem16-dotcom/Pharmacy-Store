import { Request, Response } from 'express';
import { orderService } from '@/services/order.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.id, req.body);
  res.status(201).json({ success: true, data: order });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.getUserOrders(req.user!.id, req.query as never);
  res.json(result);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id, req.user!.id);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.params.id, req.user!.id, req.body);
  res.json({ success: true, data: order });
});
