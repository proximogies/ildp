import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/assessments/:assessmentId/responses
router.get('/assessment/:assessmentId', async (req, res) => {
  const responses = await prisma.assessmentResponse.findMany({
    where: { assessmentId: req.params.assessmentId },
    include: {
      domain: true,
      indicator: true,
      question: true,
      evidence: { include: { file: true } },
    },
    orderBy: [{ domain: { sortOrder: 'asc' } }, { indicator: { sortOrder: 'asc' } }],
  });
  res.json({ success: true, data: responses });
});

// POST /api/responses  (upsert a single response)
router.post('/', async (req, res) => {
  const { assessmentId, domainId, indicatorId, questionId, responseValueText, responseValueNumber, responseValueJson, comment } = req.body;

  const response = await prisma.assessmentResponse.upsert({
    where: { assessmentId_questionId: { assessmentId, questionId } },
    update: { responseValueText, responseValueNumber, responseValueJson, comment, enteredById: req.user.id, updatedAt: new Date() },
    create: { assessmentId, domainId, indicatorId, questionId, responseValueText, responseValueNumber, responseValueJson, comment, enteredById: req.user.id },
    include: { question: true },
  });

  // Auto-update assessment status to in_progress
  await prisma.assessment.updateMany({
    where: { id: assessmentId, status: 'draft' },
    data: { status: 'in_progress' },
  });

  res.json({ success: true, data: response });
});

// PUT /api/responses/:id
router.put('/:id', async (req, res) => {
  const response = await prisma.assessmentResponse.update({
    where: { id: req.params.id },
    data: { ...req.body, enteredById: req.user.id },
  });
  res.json({ success: true, data: response });
});

// DELETE /api/responses/:id
router.delete('/:id', async (req, res) => {
  await prisma.assessmentResponse.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Response deleted' });
});

export default router;
