import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';

describe('parsePagination', () => {
  it('returns defaults when called with undefined', () => {
    const result = parsePagination(undefined, undefined);
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('parses valid page and limit', () => {
    const result = parsePagination('3', '10');
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps page to minimum 1', () => {
    expect(parsePagination('0', '10').page).toBe(1);
    expect(parsePagination('-5', '10').page).toBe(1);
  });

  it('clamps limit to minimum 1 for negative values', () => {
    expect(parsePagination('1', '-10').limit).toBe(1);
    expect(parsePagination('1', '-1').limit).toBe(1);
  });

  it('falls back to default 20 when limit is 0 (falsy)', () => {
    expect(parsePagination('1', '0').limit).toBe(20);
  });

  it('clamps limit to maxLimit (default 100)', () => {
    expect(parsePagination('1', '200').limit).toBe(100);
  });

  it('respects custom maxLimit', () => {
    expect(parsePagination('1', '50', 30).limit).toBe(30);
  });

  it('handles non-numeric strings gracefully', () => {
    const result = parsePagination('abc', 'xyz');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('calculates skip correctly', () => {
    expect(parsePagination('5', '15').skip).toBe(60);
  });
});

describe('buildPaginatedResponse', () => {
  const pagination = { page: 2, limit: 10, skip: 10 };

  it('returns correct structure', () => {
    const result = buildPaginatedResponse(['a', 'b'], 25, pagination);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a', 'b']);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('hasNext is false on last page', () => {
    const result = buildPaginatedResponse([], 20, { page: 2, limit: 10, skip: 10 });
    expect(result.pagination.hasNext).toBe(false);
  });

  it('hasPrev is false on first page', () => {
    const result = buildPaginatedResponse([], 50, { page: 1, limit: 10, skip: 0 });
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('handles empty data', () => {
    const result = buildPaginatedResponse([], 0, { page: 1, limit: 10, skip: 0 });
    expect(result.data).toEqual([]);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
  });
});
