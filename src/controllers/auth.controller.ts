import { Request, Response } from 'express';
import { authService } from '@/services/auth.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { env } from '@/config/env';

const REMEMBER_ME_DAYS = 30;
const SESSION_DAYS = env.REFRESH_TOKEN_EXPIRES_DAYS;

const isProd = env.NODE_ENV === 'production';

function cookieOptions(rememberMe: boolean) {
  return {
    httpOnly: true,
    secure: isProd,
    // 'none' required for cross-origin (frontend & backend on different domains in prod)
    sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
    path: '/',
    ...(rememberMe
      ? { maxAge: REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000 }
      : { maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 }),
  };
}

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
  path: '/',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: user,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, rememberMe, user } = await authService.login(
    req.body,
    req.ip,
    req.headers['user-agent'],
  );

  res.cookie('refreshToken', refreshToken, cookieOptions(rememberMe));
  res.json({
    success: true,
    data: { accessToken, user },
  });
});

// Logout does NOT require a valid access token — only the refresh token cookie.
// This ensures users can always log out even if their access token has expired.
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.refreshToken as string | undefined;
  if (rawToken) await authService.logout(rawToken);
  res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Revoke ALL sessions for the authenticated user (requires valid access token)
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user!.id);
  res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
  res.json({ success: true, message: 'All sessions terminated' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.refreshToken as string | undefined;
  if (!rawToken) {
    res.status(401).json({
      success: false,
      code: 'TOKEN_MISSING',
      message: 'No refresh token. Please log in.',
    });
    return;
  }

  const { accessToken, refreshToken: newRaw } = await authService.refreshToken(
    rawToken,
    req.ip,
    req.headers['user-agent'],
  );

  // Preserve the same maxAge as the existing cookie by reading from the stored token TTL.
  // We use the same SESSION_DAYS default here since we don't track rememberMe server-side.
  res.cookie('refreshToken', newRaw, cookieOptions(false));
  res.json({ success: true, data: { accessToken } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  // Always respond the same way to avoid email enumeration
  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  res.json({ success: true, message: 'Password reset successfully. Please log in.' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  res.json({ success: true, message: 'Email verified successfully.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  // Revoke all sessions — user must log in again with new password
  res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
  res.json({ success: true, message: 'Password changed. All sessions have been terminated. Please log in again.' });
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await authService.getAddresses(req.user!.id);
  res.json({ success: true, data: addresses });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await authService.addAddress(req.user!.id, req.body);
  res.status(201).json({ success: true, data: address });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await authService.updateAddress(req.params.id, req.user!.id, req.body);
  res.json({ success: true, data: address });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await authService.deleteAddress(req.params.id, req.user!.id);
  res.json({ success: true, message: 'Address deleted' });
});
