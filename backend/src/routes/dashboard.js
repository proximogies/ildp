import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  const [
    totalAssociations,
    activeRounds,
    pendingReview,
    completedAssessments,
    overdueActions,
    recentAssessments,
  ] = await Promise.all([
    prisma.association.count({ where: { deletedAt: null } }),
    prisma.assessmentRound.count({ where: { status: 'active' } }),
    prisma.assessment.count({ where: { status: { in: ['submitted', 'under_review'] } } }),
    prisma.assessment.count({ where: { status: 'approved' } }),
    prisma.actionPlan.count({ where: { status: 'overdue' } }),
    prisma.assessment.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        association: { select: { id: true, name: true } },
        assessmentRound: { select: { id: true, title: true } },
        scoreBand: true,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalAssociations,
      activeRounds,
      pendingReview,
      completedAssessments,
      overdueActions,
      recentAssessments,
    },
  });
});

// GET /api/dashboard/analytics
router.get('/analytics', async (req, res) => {
  const { state, roundId, valueChain } = req.query;

  // Average score by domain across all approved assessments
  const domainScores = await prisma.assessmentScore.groupBy({
    by: ['domainId'],
    where: {
      scoreLevel: 'domain',
      assessment: {
        status: 'approved',
        ...(roundId && { assessmentRoundId: roundId }),
        ...(state && { association: { state } }),
      },
    },
    _avg: { rawScore: true },
    _count: true,
  });

  const domains = await prisma.assessmentDomain.findMany({ orderBy: { sortOrder: 'asc' } });
  const domainMap = Object.fromEntries(domains.map(d => [d.id, d]));

  const domainAnalytics = domainScores.map(ds => ({
    domain: domainMap[ds.domainId],
    avgScore: ds._avg.rawScore,
    count: ds._count,
  }));

  // Score distribution by band
  const bandDistribution = await prisma.assessment.groupBy({
    by: ['scoreBandId'],
    where: { status: 'approved' },
    _count: true,
  });

  const bands = await prisma.scoreBand.findMany();
  const bandMap = Object.fromEntries(bands.map(b => [b.id, b]));

  res.json({
    success: true,
    data: {
      domainAnalytics,
      bandDistribution: bandDistribution.map(b => ({
        band: b.scoreBandId ? bandMap[b.scoreBandId] : null,
        count: b._count,
      })),
    },
  });
});

export default router;
