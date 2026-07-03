import { signAccessToken, verifyAccessToken } from '@/utils/jwt';
import { AppError } from '@/utils/AppError';
import { UserRole } from '@prisma/client';

jest.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-that-is-long-enough-32ch',
    JWT_EXPIRES_IN: '15m',
  },
}));

const testPayload = {
  id: 'user-123',
  email: 'test@example.com',
  role: UserRole.CUSTOMER,
};

describe('signAccessToken', () => {
  it('returns a string token', () => {
    const token = signAccessToken(testPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes the user id, email and role', () => {
    const token = signAccessToken(testPayload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(testPayload.id);
    expect(decoded.email).toBe(testPayload.email);
    expect(decoded.role).toBe(testPayload.role);
  });
});

describe('verifyAccessToken', () => {
  it('throws TOKEN_INVALID for a tampered token', () => {
    const token = signAccessToken(testPayload);
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(() => verifyAccessToken(tampered)).toThrow(AppError);
    try {
      verifyAccessToken(tampered);
    } catch (err) {
      expect((err as AppError).code).toBe('TOKEN_INVALID');
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it('throws TOKEN_INVALID for a garbage string', () => {
    expect(() => verifyAccessToken('not.a.token')).toThrow(AppError);
  });

  it('throws TOKEN_EXPIRED for an expired token', () => {
    jest.mock('@/config/env', () => ({
      env: {
        JWT_SECRET: 'test-secret-key-that-is-long-enough-32ch',
        JWT_EXPIRES_IN: '0s',
      },
    }));
  });
});
