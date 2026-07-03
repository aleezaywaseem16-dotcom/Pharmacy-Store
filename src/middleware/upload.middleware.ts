import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PRESCRIPTION_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

function createStorage(folder: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(env.UPLOAD_DIR, folder));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400, 'INVALID_FILE_TYPE'));
  }
}

function prescriptionFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_PRESCRIPTION_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP and PDF files are allowed', 400, 'INVALID_FILE_TYPE'));
  }
}

export const uploadProductImage = multer({
  storage: createStorage('products'),
  fileFilter: imageFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_PRODUCT_MB * 1024 * 1024,
    files: 1,
  },
}).single('image');

export const uploadPrescriptionImages = multer({
  storage: createStorage('prescriptions'),
  fileFilter: prescriptionFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_PRESCRIPTION_MB * 1024 * 1024,
    files: 5,
  },
}).array('images', 5);
