import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'));
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? 'unknown';

  if (error instanceof AppError && error.isOperational) {
    logger.warn({
      requestId,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });

    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      ...(error.details && { errors: error.details }),
      requestId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = 500;
    let code = 'DB_ERROR';
    let message = 'Database error';

    if (error.code === 'P2002') {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      const target = (error.meta?.target as string[])?.join(', ') ?? 'field';
      message = `Duplicate value for: ${target}`;
    } else if (error.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else if (error.code === 'P2003') {
      statusCode = 422;
      code = 'INVALID_REFERENCE';
      message = 'Related record not found';
    }

    logger.warn({ requestId, code, prismaCode: error.code, message });
    res.status(statusCode).json({ success: false, code, message, requestId });
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.warn({ requestId, code: 'DB_VALIDATION_ERROR', message: error.message });
    res.status(400).json({
      success: false,
      code: 'DB_VALIDATION_ERROR',
      message: 'Invalid data provided',
      requestId,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large'
        : error.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files'
          : 'File upload error';

    res.status(400).json({ success: false, code: 'UPLOAD_ERROR', message, requestId });
    return;
  }

  logger.error({
    requestId,
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  });
}
