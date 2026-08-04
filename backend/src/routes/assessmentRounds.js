import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/assessment-rounds
router.get('/', async (req, res) => {
  const { status } = req.query;
  const rounds = await prisma.assessmentRound.findMany({
    where: { ...(status && { status }) },
    include: {
      _count: { select: { assessments: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: rounds });
});

// POST /api/assessment-rounds
router.post('/', authorize('create_assessment'), [
  body('title').notEmpty(),
  body('startDate').notEmpty(),
  body('endDate').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { title, description, startDate, endDate } = req.body;

  const round = await prisma.assessmentRound.create({
    data: {
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdById: req.user.id,
    },
  });
  res.status(201).json({ success: true, data: round });
});

// GET /api/assessment-rounds/:id
router.get('/:id', async (req, res) => {
  const round = await prisma.assessmentRound.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      assessments: {
        include: {
          association: { select: { id: true, name: true, state: true } },
          scoreBand: true,
        },
      },
    },
  });
  res.json({ success: true, data: round });
});

// PUT /api/assessment-rounds/:id
router.put('/:id', authorize('create_assessment'), async (req, res) => {
  const { title, description, startDate, endDate, status } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = new Date(endDate);
  if (status !== undefined) data.status = status;

  const round = await prisma.assessmentRound.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: round });
});

// POST /api/assessment-rounds/:id/activate
router.post('/:id/activate', authorize('create_assessment'), async (req, res) => {
  const round = await prisma.assessmentRound.update({
    where: { id: req.params.id },
    data: { status: 'active' },
  });
  res.json({ success: true, data: round });
});

// POST /api/assessment-rounds/:id/close
router.post('/:id/close', authorize('create_assessment'), async (req, res) => {
  const round = await prisma.assessmentRound.update({
    where: { id: req.params.id },
    data: { status: 'closed' },
  });
  res.json({ success: true, data: round });
});

export default router;
