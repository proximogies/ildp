import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/reports
router.get('/', async (req, res) => {
  const reports = await prisma.report.findMany({
    include: {
      generatedBy: { select: { id: true, firstName: true, lastName: true } },
      association: { select: { id: true, name: true } },
    },
    orderBy: { generatedAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: reports });
});

// POST /api/reports/generate
router.post('/generate', authorize('manage_reports'), async (req, res) => {
  const { reportType, assessmentId, associationId, parameters } = req.body;

  // Log the report generation request
  const report = await prisma.report.create({
    data: {
      reportType,
      assessmentId,
      associationId,
      generatedById: req.user.id,
      parametersJson: parameters,
    },
  });

  // In production: trigger async PDF/Excel generation job
  res.status(201).json({
    success: true,
    data: report,
    message: 'Report generation queued. Download will be available shortly.',
  });
});

// GET /api/reports/:id/download
router.get('/:id/download', async (req, res) => {
  const report = await prisma.report.findUniqueOrThrow({ where: { id: req.params.id } });
  // In production: stream file from storage
  res.json({ success: true, data: report });
});

export default router;
