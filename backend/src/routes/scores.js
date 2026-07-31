import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/scores/scorecard/:assessmentId
router.get('/scorecard/:assessmentId', async (req, res) => {
  const assessment = await prisma.assessment.findUniqueOrThrow({
    where: { id: req.params.assessmentId },
    include: {
      association: true,
      assessmentRound: true,
      scoreBand: true,
      scores: {
        include: { domain: true, indicator: true, scoreBand: true },
        orderBy: [{ scoreLevel: 'asc' }, { domain: { sortOrder: 'asc' } }],
      },
      actionPlans: { include: { domain: true }, where: { status: { not: 'completed' } } },
    },
  });

  // Build scorecard structure
  const domainScores = assessment.scores.filter(s => s.scoreLevel === 'domain');
  const overallScore = assessment.scores.find(s => s.scoreLevel === 'overall');

  const scorecard = {
    assessment: {
      id: assessment.id,
      status: assessment.status,
      type: assessment.assessmentType,
      submittedAt: assessment.submittedAt,
      approvedAt: assessment.approvedAt,
    },
    association: assessment.association,
    round: assessment.assessmentRound,
    overallScore: overallScore?.rawScore,
    scoreBand: assessment.scoreBand,
    domainScores: domainScores.map(d => ({
      domain: d.domain,
      score: d.rawScore,
      band: d.scoreBand,
    })),
    openActionPlans: assessment.actionPlans.length,
    strengths: domainScores.filter(d => d.rawScore >= 3.0).map(d => d.domain?.title),
    gaps: domainScores.filter(d => d.rawScore < 2.0).map(d => d.domain?.title),
  };

  res.json({ success: true, data: scorecard });
});

// GET /api/scores/bands
router.get('/bands', async (req, res) => {
  const bands = await prisma.scoreBand.findMany({ orderBy: { minScore: 'asc' } });
  res.json({ success: true, data: bands });
});

export default router;
