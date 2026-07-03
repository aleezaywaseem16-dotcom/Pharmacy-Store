import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/utils/AppError';
import { ValidationErrorDetail } from '@/types';

function formatZodError(error: ZodError): ValidationErrorDetail[] {
  return error.errors.map((e) => ({
    field: e.path.join('.') || 'value',
    message: e.message,
  }));
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError('Validation failed', 422, 'VALIDATION_ERROR', formatZodError(result.error)),
      );
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new AppError('Validation failed', 422, 'VALIDATION_ERROR', formatZodError(result.error)),
      );
    }
    Object.assign(req.query, result.data);
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(
        new AppError('Validation failed', 422, 'VALIDATION_ERROR', formatZodError(result.error)),
      );
    }
    Object.assign(req.params, result.data);
    next();
  };
}
