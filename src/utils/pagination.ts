import { PaginationParams, PaginatedResponse } from '@/types';

export function parsePagination(
  page: unknown,
  limit: unknown,
  maxLimit = 100,
): PaginationParams {
  const parsedPage = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(limit ?? 20), 10) || 20),
  );
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pagination.limit);
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
}
