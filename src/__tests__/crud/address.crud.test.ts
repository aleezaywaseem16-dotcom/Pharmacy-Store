import { authService } from '@/services/auth.service';

jest.mock('@/config/database', () => ({
  db: {
    userAddress: {
      create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(),
      update: jest.fn(), updateMany: jest.fn(), delete: jest.fn(),
    },
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    refreshToken: { create: jest.fn(), updateMany: jest.fn() },
    emailVerificationToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-32-chars-minimum!!',
    JWT_EXPIRES_IN: '15m', REFRESH_TOKEN_EXPIRES_DAYS: 7,
    BCRYPT_ROUNDS: 4, NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:3000',
  },
}));
jest.mock('@/services/email.service', () => ({
  emailService: { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.resetAllMocks());

const baseAddress = {
  id: 'addr-1', userId: 'u-1', label: 'Home',
  streetLine1: '12 Gulshan Block 5', city: 'Karachi',
  state: 'Sindh', postalCode: '75300', country: 'PK', isDefault: true,
};

describe('Address CRUD', () => {
  describe('CREATE — addAddress', () => {
    it('creates an address for the user', async () => {
      mockDb.userAddress.create.mockResolvedValueOnce(baseAddress);

      const result = await authService.addAddress('u-1', {
        label: 'Home', streetLine1: '12 Gulshan Block 5',
        city: 'Karachi', state: 'Sindh', postalCode: '75300',
        country: 'PK', isDefault: false,
      });

      expect(mockDb.userAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u-1', label: 'Home' }) }),
      );
      expect(result.city).toBe('Karachi');
    });

    it('clears existing defaults when isDefault is true', async () => {
      mockDb.userAddress.updateMany.mockResolvedValueOnce({ count: 1 });
      mockDb.userAddress.create.mockResolvedValueOnce({ ...baseAddress, isDefault: true });

      const result = await authService.addAddress('u-1', {
        label: 'Home', streetLine1: '12 Gulshan', city: 'Karachi', state: 'Sindh', postalCode: '75300',
        country: 'PK', isDefault: true,
      });
      expect(result.isDefault).toBe(true);
      expect(mockDb.userAddress.updateMany).toHaveBeenCalled();
    });
  });

  describe('READ — getAddresses', () => {
    it('returns all addresses for a user', async () => {
      mockDb.userAddress.findMany.mockResolvedValueOnce([baseAddress]);
      const result = await authService.getAddresses('u-1');
      expect(result).toHaveLength(1);
      expect(mockDb.userAddress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u-1' } }),
      );
    });

    it('returns empty array when user has no addresses', async () => {
      mockDb.userAddress.findMany.mockResolvedValueOnce([]);
      const result = await authService.getAddresses('u-1');
      expect(result).toEqual([]);
    });
  });

  describe('UPDATE — updateAddress', () => {
    it('updates city and state of an address', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce(baseAddress);
      mockDb.userAddress.update.mockResolvedValueOnce({ ...baseAddress, city: 'Lahore' });

      const result = await authService.updateAddress('addr-1', 'u-1', {
        label: 'Home', streetLine1: '12 Gulshan', city: 'Lahore', state: 'Punjab', postalCode: '54000',
        country: 'PK', isDefault: false,
      });
      expect(result.city).toBe('Lahore');
    });

    it('throws NOT_FOUND for address not owned by user', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce(null);
      await expect(
        authService.updateAddress('ghost', 'u-1', { label: 'X', streetLine1: 'X', city: 'X', state: 'X', postalCode: 'X', country: 'PK', isDefault: false }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('DELETE', () => {
    it('deletes an address owned by the user', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce(baseAddress);
      mockDb.userAddress.delete.mockResolvedValueOnce(baseAddress);

      await authService.deleteAddress('addr-1', 'u-1');
      expect(mockDb.userAddress.delete).toHaveBeenCalledWith({ where: { id: 'addr-1' } });
    });

    it('throws NOT_FOUND when address does not belong to user', async () => {
      mockDb.userAddress.findFirst.mockResolvedValueOnce(null);
      await expect(authService.deleteAddress('ghost', 'u-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
