import { prisma } from '../lib/prisma.js';

/**
 * Calculate scores for an assessment at indicator, domain, and overall levels.
 */
export async function calculateScores(assessmentId) {
  // Load all responses with their questions (score mappings)
  const responses = await prisma.assessmentResponse.findMany({
    where: { assessmentId },
    include: {
      question: true,
      indicator: { include: { domain: true } },
    },
  });

  const scoreBands = await prisma.scoreBand.findMany({ orderBy: { minScore: 'asc' } });

  // Delete existing scores for this assessment
  await prisma.assessmentScore.deleteMany({ where: { assessmentId } });

  // Group responses by indicator
  const byIndicator = {};
  for (const r of responses) {
    const key = r.indicatorId;
    if (!byIndicator[key]) byIndicator[key] = { indicator: r.indicator, responses: [] };
    byIndicator[key].responses.push(r);
  }

  const indicatorScores = [];

  // ── Indicator-level scoring ──────────────────────────────────────────────
  for (const [indicatorId, { indicator, responses: rList }] of Object.entries(byIndicator)) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const r of rList) {
      const scoreMapping = r.question.scoreMappingJson;
      let questionScore = 0;

      if (scoreMapping) {
        const val = r.responseValueText || String(r.responseValueNumber ?? '');
        questionScore = scoreMapping[val] ?? scoreMapping[val?.toLowerCase()] ?? 0;
      } else if (r.responseValueNumber !== null) {
        questionScore = Math.min(4, Math.max(0, r.responseValueNumber));
      }

      totalScore += questionScore;
      totalWeight += 1;
    }

    const rawScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const band = getBand(rawScore, scoreBands);

    const saved = await prisma.assessmentScore.create({
      data: {
        assessmentId,
        domainId: indicator.domainId,
        indicatorId,
        scoreLevel: 'indicator',
        rawScore,
        normalizedScore: rawScore,
        weightedScore: rawScore * indicator.weight,
        scoreBandId: band?.id,
      },
    });

    indicatorScores.push({ domainId: indicator.domainId, rawScore, weight: indicator.weight });
  }

  // ── Domain-level scoring ─────────────────────────────────────────────────
  const byDomain = {};
  for (const s of indicatorScores) {
    if (!byDomain[s.domainId]) byDomain[s.domainId] = [];
    byDomain[s.domainId].push(s);
  }

  const domainScores = [];

  for (const [domainId, scores] of Object.entries(byDomain)) {
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = scores.reduce((sum, s) => sum + s.rawScore * s.weight, 0);
    const domainScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const band = getBand(domainScore, scoreBands);

    await prisma.assessmentScore.create({
      data: {
        assessmentId,
        domainId,
        scoreLevel: 'domain',
        rawScore: domainScore,
        normalizedScore: domainScore,
        scoreBandId: band?.id,
      },
    });

    domainScores.push({ domainId, score: domainScore });
  }

  // ── Overall scoring ──────────────────────────────────────────────────────
  const overallScore = domainScores.length > 0
    ? domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length
    : 0;

  const overallBand = getBand(overallScore, scoreBands);

  await prisma.assessmentScore.create({
    data: {
      assessmentId,
      scoreLevel: 'overall',
      rawScore: overallScore,
      normalizedScore: overallScore,
      scoreBandId: overallBand?.id,
    },
  });

  // Update assessment overall score
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { overallScore, scoreBandId: overallBand?.id },
  });

  // ── Generate recommendations → action plans ──────────────────────────────
  await generateActionPlans(assessmentId, domainScores);

  return { overallScore, band: overallBand?.name, domainScores };
}

function getBand(score, bands) {
  return bands.find(b => score >= b.minScore && score <= b.maxScore) || null;
}

async function generateActionPlans(assessmentId, domainScores) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });

  for (const { domainId, score } of domainScores) {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        domainId,
        conditionType: 'score_below',
      },
    });

    for (const rec of recommendations) {
      const threshold = parseFloat(rec.conditionValue || '2.0');
      if (score < threshold) {
        // Check if action plan already exists
        const existing = await prisma.actionPlan.findFirst({
          where: { assessmentId, recommendationId: rec.id },
        });
        if (!existing) {
          await prisma.actionPlan.create({
            data: {
              assessmentId,
              associationId: assessment.associationId,
              domainId,
              recommendationId: rec.id,
              title: rec.title,
              description: rec.recommendationText,
              priority: rec.priorityLevel,
              status: 'not_started',
              createdById: assessment.submittedById,
            },
          });
        }
      }
    }
  }
}
