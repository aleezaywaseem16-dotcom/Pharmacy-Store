import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as prescriptionController from '@/controllers/prescription.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams } from '@/middleware/validate.middleware';
import { uploadPrescriptionImages } from '@/middleware/upload.middleware';
import { uploadRateLimiter } from '@/middleware/rateLimiter.middleware';
import { prescriptionService } from '@/services/prescription.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { createPrescriptionSchema, reviewPrescriptionSchema } from '@/validators/prescription.validator';
import { idParamSchema } from '@/validators/order.validator';
import { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

router.get('/', prescriptionController.getUserPrescriptions);
router.get('/:id', validateParams(idParamSchema), prescriptionController.getPrescriptionById);

router.post(
  '/',
  uploadRateLimiter,
  (req, res, next) => uploadPrescriptionImages(req, res, next),
  validateBody(createPrescriptionSchema),
  prescriptionController.uploadPrescription,
);

router.delete('/:id', validateParams(idParamSchema), prescriptionController.deletePrescription);

router.get(
  '/admin/queue',
  authorize(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await prescriptionService.getPendingQueue(
      req.query.page,
      req.query.limit,
      req.query.status as string | undefined,
    );
    res.json(result);
  }),
);

router.patch(
  '/:id/review',
  authorize(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(idParamSchema),
  validateBody(reviewPrescriptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const prescription = await prescriptionService.review(req.params.id, req.user!.id, req.body);
    res.json({ success: true, data: prescription });
  }),
);

export default router;
