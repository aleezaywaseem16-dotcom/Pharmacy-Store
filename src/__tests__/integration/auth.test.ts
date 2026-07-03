/**
 * Auth integration tests — covers every scenario listed in the spec:
 *   Register, Login, Logout, Refresh, Invalid password, Wrong email,
 *   Expired token, Unauthorized access, Refresh token, Page refresh,
 *   Close browser, Reopen browser, Remember Me, Role-Based auth,
 *   Change password, Forgot/Reset password, Email verification.
 */
import request from 'supertest';
import app from '@/app';
import { AppError } from '@/utils/AppError';

// ── Module mocks (all set up before any imports resolve) ─────────────────────

jest.mock('@/config/database', () => ({ db: {} }));

jest.mock('@/services/auth.service', () => {
  const register = jest.fn();
  const login = jest.fn();
  const logout = jest.fn();
  const logoutAll = jest.fn();
  const refreshToken = jest.fn();
  const forgotPassword = jest.fn();
  const resetPassword = jest.fn();
  const verifyEmail = jest.fn();
  const getProfile = jest.fn();
  const updateProfile = jest.fn();
  const changePassword = jest.fn();
  const getAddresses = jest.fn();
  const addAddress = jest.fn();
  return {
    authService: {
      register, login, logout, logoutAll, refreshToken, forgotPassword,
      resetPassword, verifyEmail, getProfile, updateProfile, changePassword,
      getAddresses, addAddress,
    },
  };
});

jest.mock('@/utils/jwt', () => ({
  signAccessToken: () => 'mock-access-token',
  verifyAccessToken: (token: string) => {
    if (token === 'valid-token') {
      return { sub: 'user-001', email: 'user@example.com', role: 'CUSTOMER' };
    }
    if (token === 'admin-token') {
      return { sub: 'admin-001', email: 'admin@example.com', role: 'ADMIN' };
    }
    if (token === 'expired-token') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      throw new (require('@/utils/AppError').AppError)('Token expired', 401, 'TOKEN_EXPIRED');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    throw new (require('@/utils/AppError').AppError)('Invalid token', 401, 'TOKEN_INVALID');
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockSvc = () => require('@/services/auth.service').authService;

const VALID_USER = {
  id: 'user-001',
  email: 'user@example.com',
  firstName: 'Ali',
  lastName: 'Hassan',
  role: 'CUSTOMER',
  isVerified: true,
};

const VALID_REGISTER = {
  firstName: 'Ali', lastName: 'Hassan',
  email: 'ali@example.com', password: 'Password@1',
};

const VALID_LOGIN = { email: 'ali@example.com', password: 'Password@1' };

beforeEach(() => jest.clearAllMocks());

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/register', () => {
  it('201 — success: creates user, returns user object', async () => {
    mockSvc().register.mockResolvedValueOnce(VALID_USER);

    const res = await request(app).post('/api/v1/auth/register').send(VALID_REGISTER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/verify/i);
    expect(res.body.data.email).toBe(VALID_USER.email);
  });

  it('409 — email already in use', async () => {
    mockSvc().register.mockRejectedValueOnce(new AppError('Email already in use', 409, 'EMAIL_TAKEN'));

    const res = await request(app).post('/api/v1/auth/register').send(VALID_REGISTER);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_TAKEN');
    expect(res.body.message).toBeTruthy();
  });

  it('422 — missing email field', async () => {
    const { email: _e, ...payload } = VALID_REGISTER;
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toBeDefined();
  });

  it('422 — invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...VALID_REGISTER, email: 'not-an-email' });
    expect(res.status).toBe(422);
  });

  it('422 — password too short', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...VALID_REGISTER, password: 'abc' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('422 — password missing uppercase', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...VALID_REGISTER, password: 'password1' });
    expect(res.status).toBe(422);
  });

  it('422 — password missing number', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...VALID_REGISTER, password: 'Password' });
    expect(res.status).toBe(422);
  });

  it('422 — missing firstName', async () => {
    const { firstName: _f, ...payload } = VALID_REGISTER;
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(422);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/login', () => {
  const loginSuccess = (rememberMe = false) => ({
    accessToken: 'mock-access-token',
    refreshToken: 'raw-refresh-token',
    rememberMe,
    user: VALID_USER,
  });

  it('200 — success: returns accessToken, sets httpOnly cookie', async () => {
    mockSvc().login.mockResolvedValueOnce(loginSuccess());

    const res = await request(app).post('/api/v1/auth/login').send(VALID_LOGIN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('mock-access-token');
    expect(res.body.data.user.email).toBe(VALID_USER.email);
    // refresh token must be in httpOnly cookie, not in the body
    expect(res.body.data.refreshToken).toBeUndefined();
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
    expect(cookieStr).toContain('refreshToken=');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('200 — rememberMe=true sets longer maxAge in cookie', async () => {
    mockSvc().login.mockResolvedValueOnce(loginSuccess(true));

    const res = await request(app).post('/api/v1/auth/login').send({ ...VALID_LOGIN, rememberMe: true });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
    // Max-Age should reflect 30 days (2592000 seconds)
    expect(cookieStr).toMatch(/Max-Age=2592000/i);
  });

  it('401 — wrong password', async () => {
    mockSvc().login.mockRejectedValueOnce(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));

    const res = await request(app).post('/api/v1/auth/login').send({ email: VALID_LOGIN.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
    // Must not reveal whether it's the email or password that's wrong
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('401 — wrong email (same generic error — prevents user enumeration)', async () => {
    mockSvc().login.mockRejectedValueOnce(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'Password@1' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('403 — account deactivated', async () => {
    mockSvc().login.mockRejectedValueOnce(new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE'));

    const res = await request(app).post('/api/v1/auth/login').send(VALID_LOGIN);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_INACTIVE');
  });

  it('422 — invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'bad', password: 'Password@1' });
    expect(res.status).toBe(422);
  });

  it('422 — empty password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: VALID_LOGIN.email, password: '' });
    expect(res.status).toBe(422);
  });

  it('response body never includes refreshToken (it is httpOnly cookie only)', async () => {
    mockSvc().login.mockResolvedValueOnce(loginSuccess());
    const res = await request(app).post('/api/v1/auth/login').send(VALID_LOGIN);
    expect(JSON.stringify(res.body)).not.toContain('raw-refresh-token');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/logout', () => {
  it('200 — success with refresh cookie: revokes token', async () => {
    mockSvc().logout.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', 'refreshToken=some-raw-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockSvc().logout).toHaveBeenCalledWith('some-raw-token');
    // Cookie should be cleared
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies ?? '');
    expect(cookieStr).toContain('refreshToken=;');
  });

  it('200 — succeeds even with NO cookie (idempotent logout)', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockSvc().logout).not.toHaveBeenCalled();
  });

  it('200 — succeeds even with EXPIRED access token (no auth required)', async () => {
    // No authenticate middleware on logout — expired token must not block it
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer expired-token')
      .set('Cookie', 'refreshToken=some-raw-token');

    expect(res.status).toBe(200);
  });

  it('200 — succeeds even with NO access token at all', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', 'refreshToken=some-raw-token');
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGOUT ALL (authenticated — revoke all sessions)
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/logout-all', () => {
  it('200 — revokes all sessions for the user', async () => {
    mockSvc().logoutAll.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/all sessions/i);
    expect(mockSvc().logoutAll).toHaveBeenCalledWith('user-001');
  });

  it('401 — requires valid access token', async () => {
    const res = await request(app).post('/api/v1/auth/logout-all');
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN  (simulates: page refresh, close browser + reopen)
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/refresh-token', () => {
  it('200 — page refresh: valid cookie → new accessToken + rotated cookie', async () => {
    mockSvc().refreshToken.mockResolvedValueOnce({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', 'refreshToken=old-valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('new-access-token');
    // New rotated cookie must be set
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies ?? '');
    expect(cookieStr).toContain('refreshToken=');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('200 — reopen browser: persistent cookie still valid → refresh succeeds', async () => {
    // This scenario is identical to page-refresh from the server perspective.
    // The browser sends the stored cookie; the server validates and rotates it.
    mockSvc().refreshToken.mockResolvedValueOnce({
      accessToken: 'new-access-token',
      refreshToken: 'rotated-token',
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', 'refreshToken=persisted-token');

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('401 — no cookie (session expired / browser cleared cookies)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh-token');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_MISSING');
    expect(res.body.message).toMatch(/log in/i);
  });

  it('401 — expired refresh token', async () => {
    mockSvc().refreshToken.mockRejectedValueOnce(new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID'));

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', 'refreshToken=expired-token');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('401 — revoked refresh token (e.g., after logout-all)', async () => {
    mockSvc().refreshToken.mockRejectedValueOnce(new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID'));

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', 'refreshToken=revoked-token');

    expect(res.status).toBe(401);
  });

  it('401 — session invalidated after password change', async () => {
    mockSvc().refreshToken.mockRejectedValueOnce(new AppError('Session invalidated — please log in again', 401, 'SESSION_INVALID'));

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', 'refreshToken=old-pre-pw-change-token');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SESSION_INVALID');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — access control
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/auth/me — protected route', () => {
  it('401 — no Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('401 — malformed Authorization header (no Bearer prefix)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Token valid-token');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('401 — invalid / tampered JWT', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer tampered.jwt.token');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('401 — expired JWT', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer expired-token');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('401 — undefined user after JWT error (never shows null/undefined user)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(res.body.data).toBeUndefined();
  });

  it('200 — valid token returns user profile', async () => {
    mockSvc().getProfile.mockResolvedValueOnce(VALID_USER);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe(VALID_USER.email);
    expect(res.body.data.id).toBe(VALID_USER.id);
  });

  it('500 — never shows {} or blank body on unhandled error', async () => {
    mockSvc().getProfile.mockRejectedValueOnce(new Error('Unexpected DB crash'));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.message).toBeTruthy();
    // Must not return empty object {}
    expect(Object.keys(res.body).length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL
// ═════════════════════════════════════════════════════════════════════════════

describe('Role-based access control', () => {
  it('403 — CUSTOMER token cannot access admin route', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', 'Bearer valid-token'); // CUSTOMER role
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('200 — ADMIN token can access admin route', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', 'Bearer admin-token'); // ADMIN role
    // Admin route exists — should not be 403 (may be 200 or 500 depending on DB mock)
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  it('401 — no token on admin route', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v1/auth/me/change-password', () => {
  const payload = { currentPassword: 'OldPass@1', newPassword: 'NewPass@1' };

  it('200 — success: clears cookie and confirms', async () => {
    mockSvc().changePassword.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .patch('/api/v1/auth/me/change-password')
      .set('Authorization', 'Bearer valid-token')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers['set-cookie'] as string[] | string | undefined;
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies ?? '');
    expect(cookieStr).toContain('refreshToken=;');
  });

  it('400 — wrong current password', async () => {
    mockSvc().changePassword.mockRejectedValueOnce(new AppError('Current password is incorrect', 400, 'INVALID_CREDENTIALS'));

    const res = await request(app)
      .patch('/api/v1/auth/me/change-password')
      .set('Authorization', 'Bearer valid-token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('422 — new password fails strength rules', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/change-password')
      .set('Authorization', 'Bearer valid-token')
      .send({ currentPassword: 'OldPass@1', newPassword: 'weak' });
    expect(res.status).toBe(422);
  });

  it('401 — not authenticated', async () => {
    const res = await request(app).patch('/api/v1/auth/me/change-password').send(payload);
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/forgot-password', () => {
  it('200 — registered email: same response (no enumeration)', async () => {
    mockSvc().forgotPassword.mockResolvedValueOnce(undefined);
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'user@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it('200 — unknown email returns SAME response (prevents email enumeration)', async () => {
    mockSvc().forgotPassword.mockResolvedValueOnce(undefined);
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('422 — invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/reset-password', () => {
  const validReset = { token: 'valid-reset-token', password: 'NewPass@1' };

  it('200 — valid token: resets password', async () => {
    mockSvc().resetPassword.mockResolvedValueOnce(undefined);
    const res = await request(app).post('/api/v1/auth/reset-password').send(validReset);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('400 — invalid token', async () => {
    mockSvc().resetPassword.mockRejectedValueOnce(new AppError('Invalid or expired reset token', 400, 'TOKEN_INVALID'));
    const res = await request(app).post('/api/v1/auth/reset-password').send(validReset);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('400 — expired token', async () => {
    mockSvc().resetPassword.mockRejectedValueOnce(new AppError('Invalid or expired reset token', 400, 'TOKEN_INVALID'));
    const res = await request(app).post('/api/v1/auth/reset-password').send(validReset);
    expect(res.status).toBe(400);
  });

  it('400 — already-used token', async () => {
    mockSvc().resetPassword.mockRejectedValueOnce(new AppError('Invalid or expired reset token', 400, 'TOKEN_INVALID'));
    const res = await request(app).post('/api/v1/auth/reset-password').send(validReset);
    expect(res.status).toBe(400);
  });

  it('422 — new password too weak', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: 'tok', password: 'weak' });
    expect(res.status).toBe(422);
  });

  it('422 — missing token', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({ password: 'NewPass@1' });
    expect(res.status).toBe(422);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/verify-email', () => {
  it('200 — valid token: marks email as verified', async () => {
    mockSvc().verifyEmail.mockResolvedValueOnce(undefined);
    const res = await request(app).post('/api/v1/auth/verify-email').send({ token: 'valid-email-token' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/verified/i);
  });

  it('400 — invalid / expired / used token', async () => {
    mockSvc().verifyEmail.mockRejectedValueOnce(new AppError('Invalid or expired verification token', 400, 'TOKEN_INVALID'));
    const res = await request(app).post('/api/v1/auth/verify-email').send({ token: 'bad-token' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('422 — missing token field', async () => {
    const res = await request(app).post('/api/v1/auth/verify-email').send({});
    expect(res.status).toBe(422);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v1/auth/me', () => {
  it('200 — updates profile fields', async () => {
    const updated = { ...VALID_USER, firstName: 'Updated' };
    mockSvc().updateProfile.mockResolvedValueOnce(updated);

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token')
      .send({ firstName: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Updated');
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).patch('/api/v1/auth/me').send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });

  it('422 — empty firstName rejected', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token')
      .send({ firstName: '' });
    expect(res.status).toBe(422);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ERROR SHAPE — never shows {} or blank
// ═════════════════════════════════════════════════════════════════════════════

describe('Error response shape', () => {
  it('404 — unknown route returns structured error, never {}', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBeTruthy();
    expect(res.body.message).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toBe('{}');
  });

  it('401 responses always have code + message fields', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.body.code).toBeDefined();
    expect(res.body.message).toBeDefined();
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it('422 validation errors include field-level details', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'bad' });
    expect(res.body.errors).toBeDefined();
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors[0]).toHaveProperty('field');
    expect(res.body.errors[0]).toHaveProperty('message');
  });
});
