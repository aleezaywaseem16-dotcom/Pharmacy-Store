import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { db } from '@/config/database';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';

const router = Router();
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

const idParam = z.object({ id: z.string().uuid() });

const couponBody = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
});

const couponQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  q: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

router.get(
  '/',
  validateQuery(couponQuery),
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query.page, req.query.limit);
    const q = req.query.q as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const where = {
      ...(q && { code: { contains: q.toUpperCase(), mode: 'insensitive' as const } }),
      ...(isActive !== undefined && { isActive }),
    };

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: { _count: { select: { orders: true } } },
      }),
      db.coupon.count({ where }),
    ]);

    res.json(buildPaginatedResponse(coupons, total, pagination));
  }),
);

router.get(
  '/:id',
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const coupon = await db.coupon.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { orders: true } } },
    });
    if (!coupon) throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: coupon });
  }),
);

router.post(
  '/',
  validateBody(couponBody),
  asyncHandler(async (req, res) => {
    const existing = await db.coupon.findUnique({ where: { code: req.body.code } });
    if (existing) throw new AppError('Coupon code already exists', 409, 'DUPLICATE');

    const coupon = await db.coupon.create({ data: req.body });
    res.status(201).json({ success: true, data: coupon });
  }),
);

router.patch(
  '/:id',
  validateParams(idParam),
  validateBody(couponBody.partial()),
  asyncHandler(async (req, res) => {
    const coupon = await db.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new AppError('Coupon not found', 404, 'NOT_FOUND');

    const updated = await db.coupon.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  }),
);

router.delete(
  '/:id',
  validateParams(idParam),
  asyncHandler(async (req, res) => {
    const coupon = await db.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new AppError('Coupon not found', 404, 'NOT_FOUND');

    await db.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Coupon deleted' });
  }),
);

export default router;
