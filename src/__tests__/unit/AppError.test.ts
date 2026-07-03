import { AppError } from '@/utils/AppError';

describe('AppError', () => {
  it('sets message and defaults', () => {
    const err = new AppError('Something failed');
    expect(err.message).toBe('Something failed');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err.details).toBeUndefined();
  });

  it('accepts custom statusCode and code', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('accepts validation details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
    expect(err.details).toEqual(details);
  });

  it('is an instance of Error', () => {
    const err = new AppError('Test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('has a stack trace', () => {
    const err = new AppError('Test');
    expect(err.stack).toBeDefined();
  });

  it('isOperational is always true', () => {
    const err = new AppError('Any message', 503, 'SERVICE_UNAVAILABLE');
    expect(err.isOperational).toBe(true);
  });
});
