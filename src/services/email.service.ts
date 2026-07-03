import nodemailer, { Transporter } from 'nodemailer';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT ?? 587,
        secure: (env.EMAIL_PORT ?? 587) === 465,
        auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
      });
    } else {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }

    return this.transporter;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!env.EMAIL_HOST) {
      logger.info({ event: 'email_skipped', to, subject, reason: 'No SMTP configured' });
      return;
    }

    try {
      await this.getTransporter().sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      logger.info({ event: 'email_sent', to, subject });
    } catch (err) {
      logger.error({ event: 'email_failed', to, subject, error: (err as Error).message });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.send(
      email,
      'Verify your email — Pharmacy',
      `<h2>Verify your email</h2><p>Click the link below to verify your email address:</p><a href="${link}">${link}</a><p>This link expires in 24 hours.</p>`,
    );
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.send(
      email,
      'Reset your password — Pharmacy',
      `<h2>Password Reset</h2><p>Click the link below to reset your password:</p><a href="${link}">${link}</a><p>This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>`,
    );
  }

  async sendOrderConfirmation(
    email: string,
    orderNumber: string,
    total: string,
  ): Promise<void> {
    await this.send(
      email,
      `Order Confirmed — ${orderNumber}`,
      `<h2>Order Confirmed</h2><p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p><p>Total: <strong>PKR ${total}</strong></p><p>We will notify you when your order is shipped.</p>`,
    );
  }
}

export const emailService = new EmailService();
