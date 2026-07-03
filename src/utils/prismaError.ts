import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/AppError';

export function handlePrismaError(error: unknown): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') ?? 'field';
        return new AppError(`Duplicate value for: ${target}`, 409, 'DUPLICATE_ENTRY');
      }
      case 'P2025':
        return new AppError('Record not found', 404, 'NOT_FOUND');
      case 'P2003':
        return new AppError('Related record not found', 422, 'INVALID_REFERENCE');
      case 'P2014':
        return new AppError('Invalid relation', 400, 'INVALID_RELATION');
      case 'P2021':
        return new AppError('Table does not exist', 500, 'DB_SCHEMA_ERROR');
      default:
        return new AppError(`Database error: ${error.code}`, 500, 'DB_ERROR');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError('Invalid database query', 400, 'DB_VALIDATION_ERROR');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError('Database connection failed', 503, 'DB_CONNECTION_ERROR');
  }

  return new AppError('Internal server error', 500, 'INTERNAL_ERROR');
}
