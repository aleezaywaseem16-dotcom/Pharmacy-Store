import { Request, Response } from 'express';
import { prescriptionService } from '@/services/prescription.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { env } from '@/config/env';

export const uploadPrescription = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const imageKeys = files.map((f) => `prescriptions/${f.filename}`);

  const prescription = await prescriptionService.create(req.user!.id, req.body, imageKeys);
  res.status(201).json({ success: true, data: prescription });
});

export const getUserPrescriptions = asyncHandler(async (req: Request, res: Response) => {
  const result = await prescriptionService.getUserPrescriptions(
    req.user!.id,
    req.query.page,
    req.query.limit,
    req.query.status as string | undefined,
  );
  res.json(result);
});

export const getPrescriptionById = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await prescriptionService.getById(req.params.id, req.user!.id);
  res.json({ success: true, data: prescription });
});

export const deletePrescription = asyncHandler(async (req: Request, res: Response) => {
  await prescriptionService.delete(req.params.id, req.user!.id);
  res.json({ success: true, message: 'Prescription deleted' });
});

export const getPrescriptionImageUrl = asyncHandler(async (req: Request, res: Response) => {
  const key = `prescriptions/${req.params.filename}`;
  const url = `${req.protocol}://${req.get('host')}/${env.UPLOAD_DIR}/${key}`;
  res.json({ success: true, data: { url } });
});
