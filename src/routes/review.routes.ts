import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as reviewController from '@/controllers/review.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { createReviewSchema } from '@/validators/prescription.validator';
import { idParamSchema } from '@/validators/order.validator';
import { reviewService } from '@/services/review.service';
import { z } from 'zod';

const productIdParamSchema = z.object({ productId: z.string().uuid() });

const router = Router();

router.get(
  '/products/:productId',
  validateParams(productIdParamSchema),
  reviewController.getProductReviews,
);

router.post(
  '/products/:productId',
  authenticate,
  validateParams(productIdParamSchema),
  validateBody(createReviewSchema),
  reviewController.createReview,
);

router.delete(
  '/:id',
  authenticate,
  validateParams(idParamSchema),
  reviewController.deleteReview,
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    await reviewService.approveReview(req.params.id);
    res.json({ success: true, message: 'Review approved' });
  }),
);

export default router;
