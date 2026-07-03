import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authRateLimiter } from '@/middleware/rateLimiter.middleware';
import { validateBody, validateParams } from '@/middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  addressSchema,
} from '@/validators/auth.validator';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/login',    authRateLimiter, validateBody(loginSchema),    authController.login);

// Logout does NOT require a valid access token — only the httpOnly cookie.
// This ensures logout always succeeds even when the access token has expired.
router.post('/logout', authController.logout);

// Refresh access token using httpOnly refresh token cookie
router.post('/refresh-token', authController.refreshToken);

router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail);

// ── Authenticated ─────────────────────────────────────────────────────────────
// Revoke all sessions (requires valid access token)
router.post('/logout-all', authenticate, authController.logoutAll);

router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validateBody(updateProfileSchema), authController.updateProfile);
router.patch('/me/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

router.get('/me/addresses',     authenticate, authController.getAddresses);
router.post('/me/addresses',    authenticate, validateBody(addressSchema), authController.addAddress);
router.patch('/me/addresses/:id',  authenticate, validateParams(idParamSchema), validateBody(addressSchema), authController.updateAddress);
router.delete('/me/addresses/:id', authenticate, validateParams(idParamSchema), authController.deleteAddress);

export default router;
