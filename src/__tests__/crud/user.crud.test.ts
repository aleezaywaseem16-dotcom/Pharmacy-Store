import { authService } from '@/services/auth.service';

jest.mock('@/config/database', () => ({
  db: {
    user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    refreshToken: { create: jest.fn(), updateMany: jest.fn() },
    emailVerificationToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    userAddress: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(require('@/config/database').db)),
  },
}));
jest.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-32-chars-minimum!!',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_DAYS: 7,
    BCRYPT_ROUNDS: 4,
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));
jest.mock('@/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;
const mockUserCreate = mockDb.user.create;
const mockUserFindUnique = mockDb.user.findUnique;
const mockUserUpdate = mockDb.user.update;
const mockEmailVerificationTokenCreate = mockDb.emailVerificationToken.create;

beforeEach(() => jest.clearAllMocks());

describe('User CRUD', () => {
  describe('CREATE — register', () => {
    it('creates a new user and sends verification email', async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);
      const fakeUser = { id: 'u-1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'CUSTOMER' };
      mockUserCreate.mockResolvedValueOnce(fakeUser);
      mockEmailVerificationTokenCreate.mockResolvedValueOnce({});

      const result = await authService.register({
        email: 'a@b.com', password: 'Pass@123', firstName: 'A', lastName: 'B',
      });

      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'a@b.com' }) }),
      );
      expect(result.email).toBe('a@b.com');
    });

    it('throws EMAIL_TAKEN if email already exists', async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: 'existing' });
      await expect(authService.register({ email: 'taken@b.com', password: 'Pass@123', firstName: 'A', lastName: 'B' }))
        .rejects.toMatchObject({ code: 'EMAIL_TAKEN', statusCode: 409 });
    });
  });

  describe('READ — getProfile', () => {
    it('returns user profile by id', async () => {
      const fakeUser = { id: 'u-1', email: 'a@b.com', firstName: 'A', lastName: 'B', phone: null, role: 'CUSTOMER', isVerified: false, createdAt: new Date() };
      mockUserFindUnique.mockResolvedValueOnce(fakeUser);

      const result = await authService.getProfile('u-1');
      expect(result.id).toBe('u-1');
      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u-1' } }),
      );
    });

    it('throws NOT_FOUND for missing user', async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);
      await expect(authService.getProfile('ghost')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('UPDATE — updateProfile', () => {
    it('updates user first/last name', async () => {
      const updated = { id: 'u-1', email: 'a@b.com', firstName: 'New', lastName: 'Name', phone: null, role: 'CUSTOMER' };
      mockUserUpdate.mockResolvedValueOnce(updated);

      const result = await authService.updateProfile('u-1', { firstName: 'New', lastName: 'Name' });
      expect(result.firstName).toBe('New');
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u-1' }, data: expect.objectContaining({ firstName: 'New' }) }),
      );
    });
  });

  describe('DELETE — changePassword (revokes all sessions)', () => {
    it('throws NOT_FOUND when user does not exist', async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);
      await expect(authService.changePassword('ghost', 'old', 'new')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
