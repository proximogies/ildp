import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { calculateScores } from '../services/scoringEngine.js';

const router = Router();
router.use(authenticate);

// GET /api/assessments
router.get('/', async (req, res) => {
  const { associationId, roundId, status, page = 1, limit = 20 } = req.query;
  const where = {
    ...(associationId && { associationId }),
    ...(roundId && { assessmentRoundId: roundId }),
    ...(status && { status }),
  };

  // Facilitators/association leaders only see their own
  if (req.user.roles.includes('facilitator') || req.user.roles.includes('association_leader')) {
    where.assignedToId = req.user.id;
  }

  const [assessments, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      include: {
        association: { select: { id: true, name: true, state: true } },
        assessmentRound: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        scoreBand: true,
      },
      skip: (page - 1) * limit,
      take: +limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.assessment.count({ where }),
  ]);

  res.json({ success: true, data: assessments, meta: { total, page: +page, limit: +limit } });
});

// POST /api/assessments
router.post('/', authorize('create_assessment'), [
  body('associationId').notEmpty(),
  body('assessmentRoundId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const assessment = await prisma.assessment.create({
    data: { ...req.body, status: 'draft' },
    include: {
      association: true,
      assessmentRound: true,
    },
  });
  res.status(201).json({ success: true, data: assessment });
});

// GET /api/assessments/:id
router.get('/:id', async (req, res) => {
  const assessment = await prisma.assessment.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      association: true,
      assessmentRound: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      scoreBand: true,
      responses: {
        include: {
          domain: true,
          indicator: true,
          question: true,
          evidence: { include: { file: true } },
        },
      },
      scores: { include: { domain: true, indicator: true, scoreBand: true } },
      actionPlans: { include: { domain: true } },
    },
  });
  res.json({ success: true, data: assessment });
});

// PUT /api/assessments/:id
router.put('/:id', async (req, res) => {
  const assessment = await prisma.assessment.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: assessment });
});

// POST /api/assessments/:id/submit
router.post('/:id/submit', authorize('submit_assessment'), async (req, res) => {
  const assessment = await prisma.assessment.update({
    where: { id: req.params.id },
    data: { status: 'submitted', submittedById: req.user.id, submittedAt: new Date() },
  });
  res.json({ success: true, data: assessment });
});

// POST /api/assessments/:id/review
router.post('/:id/review', authorize('review_assessment'), async (req, res) => {
  const assessment = await prisma.assessment.update({
    where: { id: req.params.id },
    data: { status: 'under_review', reviewedById: req.user.id },
  });
  res.json({ success: true, data: assessment });
});

// POST /api/assessments/:id/approve
router.post('/:id/approve', authorize('approve_assessment'), async (req, res) => {
  const assessment = await prisma.assessment.update({
    where: { id: req.params.id },
    data: { status: 'approved', approvedAt: new Date() },
  });

  // Trigger scoring
  await calculateScores(assessment.id);

  res.json({ success: true, data: assessment });
});

// POST /api/assessments/:id/request-correction
router.post('/:id/request-correction', authorize('review_assessment'), async (req, res) => {
  const { comment } = req.body;
  const assessment = await prisma.assessment.update({
    where: { id: req.params.id },
    data: { status: 'correction_requested' },
  });
  res.json({ success: true, data: assessment });
});

// GET /api/assessments/:id/scores
router.get('/:id/scores', async (req, res) => {
  const scores = await prisma.assessmentScore.findMany({
    where: { assessmentId: req.params.id },
    include: { domain: true, indicator: true, scoreBand: true },
    orderBy: [{ scoreLevel: 'asc' }, { domain: { sortOrder: 'asc' } }],
  });
  res.json({ success: true, data: scores });
});

// POST /api/assessments/:id/calculate-scores
router.post('/:id/calculate-scores', authorize('approve_assessment'), async (req, res) => {
  const result = await calculateScores(req.params.id);
  res.json({ success: true, data: result });
});

export default router;
