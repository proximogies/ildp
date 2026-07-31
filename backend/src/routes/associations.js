import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/associations
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search, state, valueChain } = req.query;
  const where = {
    deletedAt: null,
    ...(state && { state }),
    ...(valueChain && { valueChain }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [associations, total] = await Promise.all([
    prisma.association.findMany({
      where,
      include: {
        contacts: { where: { isPrimary: true } },
        assessments: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, status: true, overallScore: true, createdAt: true } },
      },
      skip: (page - 1) * limit,
      take: +limit,
      orderBy: { name: 'asc' },
    }),
    prisma.association.count({ where }),
  ]);

  res.json({ success: true, data: associations, meta: { total, page: +page, limit: +limit } });
});

// POST /api/associations
router.post('/', authorize('create_association'), [
  body('name').notEmpty(),
  body('state').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const association = await prisma.association.create({
    data: { ...req.body, createdById: req.user.id },
  });
  res.status(201).json({ success: true, data: association });
});

// GET /api/associations/:id
router.get('/:id', async (req, res) => {
  const association = await prisma.association.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      contacts: true,
      membershipProfiles: { orderBy: { snapshotDate: 'desc' }, take: 5 },
      leadershipProfiles: { where: { activeStatus: true } },
      assessments: {
        include: { assessmentRound: true, scoreBand: true },
        orderBy: { createdAt: 'desc' },
      },
      actionPlans: { where: { status: { not: 'completed' } }, take: 5 },
    },
  });
  res.json({ success: true, data: association });
});

// PUT /api/associations/:id
router.put('/:id', authorize('edit_association'), async (req, res) => {
  const association = await prisma.association.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: association });
});

// DELETE /api/associations/:id
router.delete('/:id', authorize('delete_association'), async (req, res) => {
  await prisma.association.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ success: true, message: 'Association deleted' });
});

// POST /api/associations/:id/contacts
router.post('/:id/contacts', authorize('edit_association'), async (req, res) => {
  const contact = await prisma.associationContact.create({
    data: { ...req.body, associationId: req.params.id },
  });
  res.status(201).json({ success: true, data: contact });
});

// POST /api/associations/:id/leadership
router.post('/:id/leadership', authorize('edit_association'), async (req, res) => {
  const profile = await prisma.leadershipProfile.create({
    data: { ...req.body, associationId: req.params.id },
  });
  res.status(201).json({ success: true, data: profile });
});

export default router;
