import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

// POST /api/uploads
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const uploaded = await prisma.uploadedFile.create({
    data: {
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedById: req.user.id,
      storageDisk: 'local',
    },
  });

  res.status(201).json({ success: true, data: uploaded });
});

// POST /api/uploads/link-evidence  (link file to a response)
router.post('/link-evidence', async (req, res) => {
  const { responseId, fileId, notes } = req.body;
  const evidence = await prisma.responseEvidence.create({
    data: { responseId, fileId, notes },
    include: { file: true },
  });
  res.status(201).json({ success: true, data: evidence });
});

// GET /api/uploads/:id
router.get('/:id', async (req, res) => {
  const file = await prisma.uploadedFile.findUniqueOrThrow({ where: { id: req.params.id } });
  res.json({ success: true, data: file });
});

// DELETE /api/uploads/:id
router.delete('/:id', async (req, res) => {
  await prisma.uploadedFile.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'File deleted' });
});

export default router;
