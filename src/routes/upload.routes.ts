import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/role.middleware';
import { uploadRateLimiter } from '@/middleware/rateLimiter.middleware';
import { uploadProductImage } from '@/middleware/upload.middleware';
import * as uploadController from '@/controllers/upload.controller';

const router = Router();

router.post(
  '/product-image',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadRateLimiter,
  (req, res, next) => uploadProductImage(req, res, next),
  uploadController.uploadProductImageHandler,
);

export default router;
