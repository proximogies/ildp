import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendInviteEmail } from '../services/emailService.js';

const router = Router();
router.use(authenticate);

const userSelect = {
  id: true, firstName: true, lastName: true, email: true,
  phone: true, status: true, lastLoginAt: true, createdAt: true, updatedAt: true,
  userRoles: { include: { role: true } },
};

// GET /api/users
router.get('/', authorize('manage_users'), async (req, res) => {
  const { page = 1, limit = 20, search, status, role } = req.query;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(role && {
      userRoles: { some: { role: { code: role } } },
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, select: userSelect,
      skip: (page - 1) * limit,
      take: +limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: users, meta: { total, page: +page, limit: +limit } });
});

// GET /api/users/:id
router.get('/:id', authorize('manage_users'), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.params.id },
    select: userSelect,
  });
  res.json({ success: true, data: user });
});

// POST /api/users — invite a new user
router.post('/', authorize('manage_users'), [
  body('email').isEmail().withMessage('Valid email required'),
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('roleCode').notEmpty().withMessage('Role required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { firstName, lastName, email, phone, roleCode } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists' });

  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) return res.status(400).json({ success: false, message: 'Invalid role' });

  // Generate invite token (48hr expiry)
  const inviteToken = uuidv4();
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Placeholder password hash — user will set real password via invite link
  const passwordHash = await bcrypt.hash(uuidv4(), 10);

  const user = await prisma.user.create({
    data: {
      firstName, lastName, email, phone, passwordHash,
      status: 'invited',
      inviteToken,
      inviteExpiry,
      userRoles: { create: { roleId: role.id } },
    },
    select: userSelect,
  });

  // Send invite email — non-blocking, don't fail the request if email fails
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

  try {
    await sendInviteEmail({ to: email, firstName, inviteUrl });
  } catch (err) {
    console.error('Failed to send invite email:', err.message);
    // Still return success — admin can resend
  }

  res.status(201).json({ success: true, data: user });
});

// POST /api/users/:id/resend-invite
router.post('/:id/resend-invite', authorize('manage_users'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.status !== 'invited') {
    return res.status(400).json({ success: false, message: 'User has already accepted their invite' });
  }

  const inviteToken = uuidv4();
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { inviteToken, inviteExpiry },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

  try {
    await sendInviteEmail({ to: user.email, firstName: user.firstName, inviteUrl });
  } catch (err) {
    console.error('Failed to resend invite email:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send invite email. Check your email service configuration.' });
  }

  res.json({ success: true, message: 'Invite resent' });
});

// PUT /api/users/:id
router.put('/:id', authorize('manage_users'), [
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { firstName, lastName, phone, status, roleCode } = req.body;

  // Prevent deactivating your own account
  if (req.params.id === req.user.id && status && status !== 'active') {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
  }

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (status !== undefined) updateData.status = status;

  // If roleCode provided, update the user's role
  if (roleCode) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) return res.status(400).json({ success: false, message: 'Invalid role' });

    // Replace existing roles
    await prisma.userRole.deleteMany({ where: { userId: req.params.id } });
    await prisma.userRole.create({ data: { userId: req.params.id, roleId: role.id } });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: userSelect,
  });

  res.json({ success: true, data: user });
});

// DELETE /api/users/:id — soft delete
router.delete('/:id', authorize('manage_users'), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }

  await prisma.user.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), status: 'inactive' },
  });

  res.json({ success: true, message: 'User removed' });
});

export default router;
