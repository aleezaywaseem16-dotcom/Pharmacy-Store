import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '@/utils/asyncHandler';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validate.middleware';
import { AppError } from '@/utils/AppError';
import { db } from '@/config/database';
import { orderService } from '@/services/order.service';
import { updateOrderStatusSchema, orderQuerySchema } from '@/validators/order.validator';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get(
  '/',
  validateQuery(orderQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await orderService.getAllOrders(req.query as never);
    res.json(result);
  }),
);

router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const order = await db.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: true,
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: order });
  }),
);

router.patch(
  '/:id/status',
  validateParams(idParamSchema),
  validateBody(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: order });
  }),
);

export default router;
