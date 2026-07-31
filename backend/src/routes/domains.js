import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/domains
router.get('/', async (req, res) => {
  const domains = await prisma.assessmentDomain.findMany({
    where: { isActive: true },
    include: {
      indicators: {
        where: { isActive: true },
        include: { questions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: domains });
});

// GET /api/domains/:id
router.get('/:id', async (req, res) => {
  const domain = await prisma.assessmentDomain.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      indicators: {
        where: { isActive: true },
        include: { questions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
  res.json({ success: true, data: domain });
});

export default router;
