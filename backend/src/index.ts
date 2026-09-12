import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors'; // makes async route handler rejections reach the error middleware instead of crashing the process

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import skillsRoutes from './routes/skills.routes';
import evidenceRoutes from './routes/evidence.routes';
import assessmentsRoutes from './routes/assessments.routes';
import verificationRoutes from './routes/verification.routes';
import teamsRoutes from './routes/teams.routes';
import challengesRoutes from './routes/challenges.routes';
import adminRoutes from './routes/admin.routes';
import jobsRoutes from './routes/jobs.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'proofstack-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/github', evidenceRoutes);
app.use('/api/github/evidence', evidenceRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobsRoutes);


// Central error handler — keeps a bad request from crashing a live demo
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ProofStack backend running on http://localhost:${PORT}`);
});

// Demo-day safety net: a single bad request or a dropped DB connection should
// never take the whole server down mid-presentation. We still log loudly so
// it's not silently swallowed during development.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection (server kept running):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server kept running):', err);
});
