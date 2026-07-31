import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import associationRoutes from './routes/associations.js';
import assessmentRoundRoutes from './routes/assessmentRounds.js';
import assessmentRoutes from './routes/assessments.js';
import domainRoutes from './routes/domains.js';
import responseRoutes from './routes/responses.js';
import uploadRoutes from './routes/uploads.js';
import scoreRoutes from './routes/scores.js';
import actionPlanRoutes from './routes/actionPlans.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static uploads (local storage)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/associations', associationRoutes);
app.use('/api/assessment-rounds', assessmentRoundRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/action-plans', actionPlanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ILDP API running on http://localhost:${PORT}`);
});

export default app;
