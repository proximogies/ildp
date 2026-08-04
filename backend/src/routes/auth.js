import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = Router();

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.status === 'invited') {
    return res.status(403).json({ success: false, message: 'Please accept your invitation first. Check your email.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Account is not active. Contact your administrator.' });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const roles = user.userRoles.map(ur => ur.role.code);
  const permissions = [...new Set(user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code)))];
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles,
      permissions,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, lastLoginAt: true },
  });
  res.json({ success: true, data: { ...user, roles: req.user.roles, permissions: req.user.permissions } });
});

// POST /api/auth/accept-invite — user sets their password from invite email
router.post('/accept-invite', [
  body('token').notEmpty().withMessage('Invite token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { token, password } = req.body;

  const user = await prisma.user.findUnique({ where: { inviteToken: token } });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired invite link' });
  }

  if (user.inviteExpiry && user.inviteExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'This invite link has expired. Ask your administrator to resend it.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: 'active',
      inviteToken: null,
      inviteExpiry: null,
    },
  });

  res.json({ success: true, message: 'Account activated. You can now log in.' });
});

// GET /api/auth/invite-info?token=xxx — get user info for invite page
router.get('/invite-info', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Token required' });

  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { firstName: true, lastName: true, email: true, inviteExpiry: true, status: true },
  });

  if (!user) return res.status(404).json({ success: false, message: 'Invalid invite link' });

  if (user.inviteExpiry && user.inviteExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'Invite link has expired' });
  }

  res.json({ success: true, data: { firstName: user.firstName, lastName: user.lastName, email: user.email } });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (user && user.status === 'active') {
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({ to: email, firstName: user.firstName, resetUrl });
    } catch (err) {
      console.error('Failed to send reset email:', err.message);
    }
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { token, password } = req.body;

  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
  }

  if (user.resetExpiry && user.resetExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'Reset link has expired. Request a new one.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpiry: null,
    },
  });

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

export default router;
