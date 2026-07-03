import request from 'supertest';
import app from '@/app';

jest.mock('@/config/database', () => ({ db: {} }));

const mockGetProducts = jest.fn();
const mockGetFeatured = jest.fn();
const mockGetBySlug = jest.fn();
const mockCreateProduct = jest.fn();

jest.mock('@/services/product.service', () => ({
  productService: {
    getProducts: (...args: unknown[]) => mockGetProducts(...args),
    getFeatured: (...args: unknown[]) => mockGetFeatured(...args),
    getBySlug: (...args: unknown[]) => mockGetBySlug(...args),
    create: (...args: unknown[]) => mockCreateProduct(...args),
  },
}));

jest.mock('@/utils/jwt', () => ({
  signAccessToken: () => 'mock-token',
  verifyAccessToken: (token: string) => {
    if (token === 'admin-token') {
      return { sub: 'admin-001', email: 'admin@pharmacy.com', role: 'SUPER_ADMIN' };
    }
    throw Object.assign(new Error('Invalid token'), { code: 'TOKEN_INVALID', statusCode: 401 });
  },
}));

const mockProduct = {
  id: 'prod-001',
  name: 'Panadol 500mg',
  slug: 'panadol-500mg',
  price: 120,
  totalStock: 100,
  requiresPrescription: false,
  isActive: true,
};

const mockPaginatedResponse = {
  success: true,
  data: [mockProduct],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

describe('GET /api/v1/products', () => {
  it('returns 200 with paginated product list', async () => {
    mockGetProducts.mockResolvedValueOnce(mockPaginatedResponse);
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 422 for invalid enum in query params', async () => {
    const res = await request(app).get('/api/v1/products?sortBy=INVALID_SORT_VALUE');
    expect(res.status).toBe(422);
  });

  it('passes search query to service', async () => {
    mockGetProducts.mockResolvedValueOnce(mockPaginatedResponse);
    await request(app).get('/api/v1/products?search=panadol');
    expect(mockGetProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'panadol' }),
    );
  });
});

describe('GET /api/v1/products/featured', () => {
  it('returns 200 with featured products', async () => {
    mockGetFeatured.mockResolvedValueOnce([mockProduct]);
    const res = await request(app).get('/api/v1/products/featured');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/products/:slug', () => {
  it('returns 200 with product data', async () => {
    mockGetBySlug.mockResolvedValueOnce(mockProduct);
    const res = await request(app).get('/api/v1/products/panadol-500mg');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('panadol-500mg');
  });

  it('returns 404 when product not found', async () => {
    const { AppError } = await import('@/utils/AppError');
    mockGetBySlug.mockRejectedValueOnce(new AppError('Product not found', 404, 'NOT_FOUND'));
    const res = await request(app).get('/api/v1/products/nonexistent-product');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/v1/products (admin only)', () => {
  const newProduct = {
    categoryId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Augmentin 500mg',
    sku: 'AUG-500-30',
    price: 450,
    requiresPrescription: true,
    dosageForm: 'Tablet',
    strength: '500mg/125mg',
    packSize: '30 tablets',
    shortDescription: 'Broad-spectrum antibiotic',
  };

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/v1/products').send(newProduct);
    expect(res.status).toBe(401);
  });

  it('returns 201 when created by admin', async () => {
    mockCreateProduct.mockResolvedValueOnce({ ...newProduct, id: 'prod-new', slug: 'augmentin-500mg' });
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', 'Bearer admin-token')
      .send(newProduct);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
