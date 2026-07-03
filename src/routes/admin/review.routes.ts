import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { authorize } from '@/middleware/role.middleware';
import { validateParams, validateQuery } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { db } from '@/config/database';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';

const router = Router();
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

const idParam = z.object({ id: z.string().uuid() });
const reviewQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isApproved: z.enum(['true', 'false']).optional(),
  q: z.string().optional(),
});

router.get(
  '/',
  validateQuery(reviewQuery),
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query.page, req.query.limit);
    const isApproved = req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined;
    const q = req.query.q as string | undefined;

    const where = {
      ...(isApproved !== undefined && { isApproved }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { body: { contains: q, mode: 'insensitive' as const } },
          { product: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [reviews, total] = await Promise.all([
      db.productReview.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.productReview.count({ where }),
    ]);

    res.json(buildPaginatedResponse(reviews, total, pagination));
  }),
);

router.patch(
  '/:id/approve',
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const review = await db.productReview.findUnique({ where: { id: req.params.id } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    await db.productReview.update({ where: { id: req.params.id }, data: { isApproved: true } });
    res.json({ success: true, message: 'Review approved' });
  }),
);

router.patch(
  '/:id/reject',
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const review = await db.productReview.findUnique({ where: { id: req.params.id } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    await db.productReview.update({ where: { id: req.params.id }, data: { isApproved: false } });
    res.json({ success: true, message: 'Review rejected' });
  }),
);

router.delete(
  '/:id',
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const review = await db.productReview.findUnique({ where: { id: req.params.id } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    await db.productReview.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Review deleted' });
  }),
);

export default router;
