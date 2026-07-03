import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as categoryController from '@/controllers/category.controller';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { db } from '@/config/database';
import { createCategorySchema, updateCategorySchema } from '@/validators/product.validator';
import { idParamSchema } from '@/validators/order.validator';
import { z } from 'zod';

const router = Router();
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

const categoryQuery = z.object({ page: z.string().optional(), limit: z.string().optional(), q: z.string().optional() });

router.get('/', validateQuery(categoryQuery), asyncHandler(async (req, res) => {
  const { parsePagination, buildPaginatedResponse } = await import('@/utils/pagination');
  const pagination = parsePagination(req.query.page, req.query.limit);
  const q = req.query.q as string | undefined;

  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};

  const [categories, total] = await Promise.all([
    db.category.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { sortOrder: 'asc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    db.category.count({ where }),
  ]);

  res.json(buildPaginatedResponse(categories, total, pagination));
}));

router.get('/:id', validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const category = await db.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true } }, parent: { select: { id: true, name: true } } },
  });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  res.json({ success: true, data: category });
}));

router.post('/', validateBody(createCategorySchema), categoryController.createCategory);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validateParams(idParamSchema), categoryController.deleteCategory);

export default router;
