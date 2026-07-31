import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/action-plans
router.get('/', async (req, res) => {
  const { associationId, assessmentId, status, priority, page = 1, limit = 20 } = req.query;
  const where = {
    ...(associationId && { associationId }),
    ...(assessmentId && { assessmentId }),
    ...(status && { status }),
    ...(priority && { priority }),
  };

  const [plans, total] = await Promise.all([
    prisma.actionPlan.findMany({
      where,
      include: {
        association: { select: { id: true, name: true } },
        domain: { select: { id: true, title: true, code: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        updates: { orderBy: { updatedAt: 'desc' }, take: 1 },
      },
      skip: (page - 1) * limit,
      take: +limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.actionPlan.count({ where }),
  ]);

  res.json({ success: true, data: plans, meta: { total, page: +page, limit: +limit } });
});

// POST /api/action-plans
router.post('/', authorize('manage_action_plans'), async (req, res) => {
  const plan = await prisma.actionPlan.create({
    data: { ...req.body, createdById: req.user.id },
    include: { domain: true, association: true },
  });
  res.status(201).json({ success: true, data: plan });
});

// GET /api/action-plans/:id
router.get('/:id', async (req, res) => {
  const plan = await prisma.actionPlan.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      association: true,
      domain: true,
      indicator: true,
      recommendation: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updates: {
        include: { updatedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });
  res.json({ success: true, data: plan });
});

// PUT /api/action-plans/:id
router.put('/:id', authorize('manage_action_plans'), async (req, res) => {
  const plan = await prisma.actionPlan.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: plan });
});

// POST /api/action-plans/:id/updates
router.post('/:id/updates', async (req, res) => {
  const { updateNote, progressPercent, status } = req.body;
  const update = await prisma.actionPlanUpdate.create({
    data: {
      actionPlanId: req.params.id,
      updateNote,
      progressPercent,
      status,
      updatedById: req.user.id,
    },
  });

  // Sync status on parent plan
  if (status) {
    await prisma.actionPlan.update({
      where: { id: req.params.id },
      data: { status, ...(status === 'completed' && { completedAt: new Date() }) },
    });
  }

  res.status(201).json({ success: true, data: update });
});

// POST /api/action-plans/:id/complete
router.post('/:id/complete', async (req, res) => {
  const plan = await prisma.actionPlan.update({
    where: { id: req.params.id },
    data: { status: 'completed', completedAt: new Date() },
  });
  res.json({ success: true, data: plan });
});

export default router;
