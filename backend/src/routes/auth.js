import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

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

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Account is not active' });
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

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail()], async (req, res) => {
  // In production: generate reset token, send email
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  // In production: verify token, update password
  res.json({ success: true, message: 'Password reset successfully' });
});

export default router;
