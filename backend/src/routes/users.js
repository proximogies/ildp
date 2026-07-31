import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const userSelect = {
  id: true, firstName: true, lastName: true, email: true,
  phone: true, status: true, lastLoginAt: true, createdAt: true,
  userRoles: { include: { role: true } },
};

// GET /api/users
router.get('/', authorize('manage_users'), async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(search && { OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, skip: (page - 1) * limit, take: +limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: users, meta: { total, page: +page, limit: +limit } });
});

// POST /api/users
router.post('/', authorize('manage_users'), [
  body('email').isEmail(),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('roleCode').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { firstName, lastName, email, phone, roleCode } = req.body;
  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) return res.status(400).json({ success: false, message: 'Invalid role' });

  const user = await prisma.user.create({
    data: {
      firstName, lastName, email, phone, passwordHash, status: 'invited',
      userRoles: { create: { roleId: role.id } },
    },
    select: userSelect,
  });

  res.status(201).json({ success: true, data: user, tempPassword });
});

// GET /api/users/:id
router.get('/:id', authorize('manage_users'), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, select: userSelect });
  res.json({ success: true, data: user });
});

// PUT /api/users/:id
router.put('/:id', authorize('manage_users'), async (req, res) => {
  const { firstName, lastName, phone, status } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { firstName, lastName, phone, status },
    select: userSelect,
  });
  res.json({ success: true, data: user });
});

// DELETE /api/users/:id
router.delete('/:id', authorize('manage_users'), async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ success: true, message: 'User deactivated' });
});

export default router;
