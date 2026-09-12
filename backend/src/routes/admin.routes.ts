import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';
import { rankCandidatesForJob } from '../services/matching.service';

const router = Router();

router.post('/jobs', requireAuth, requireRole('recruiter'), async (req, res) => {
  const { title, minVerification, requiredSkills } = req.body as {
    title: string; minVerification?: number; requiredSkills: number[];
  };
  if (!title || !requiredSkills || requiredSkills.length === 0) {
    return res.status(400).json({ error: 'title and at least one requiredSkill are required' });
  }
  const jobRes = await pool.query(
    `INSERT INTO jobs (recruiter_id, title, min_verification) VALUES ($1,$2,$3) RETURNING id`,
    [req.user!.userId, title, minVerification ?? 60]
  );
  const jobId = jobRes.rows[0].id;
  for (const skillId of requiredSkills) {
    await pool.query(`INSERT INTO job_requirements (job_id, skill_id) VALUES ($1,$2)`, [jobId, skillId]);
  }
  res.status(201).json({ id: jobId });
});

router.get('/jobs', requireAuth, requireRole('recruiter'), async (req, res) => {
  const result = await pool.query(
    `SELECT j.id, j.title, j.min_verification, j.created_at,
            COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
     FROM jobs j
     LEFT JOIN job_requirements jr ON jr.job_id = j.id
     LEFT JOIN skills s ON s.id = jr.skill_id
     WHERE j.recruiter_id = $1
     GROUP BY j.id ORDER BY j.created_at DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

router.get('/jobs/:id', requireAuth, requireRole('recruiter'), async (req, res) => {

  const result = await pool.query(
    `SELECT j.id, j.title, j.min_verification, j.created_at,
            COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
     FROM jobs j
     LEFT JOIN job_requirements jr ON jr.job_id = j.id
     LEFT JOIN skills s ON s.id = jr.skill_id
     WHERE j.id = $1
     GROUP BY j.id`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
  res.json(result.rows[0]);
});

router.get('/jobs/:id/candidates', requireAuth, requireRole('recruiter'), async (req, res) => {
  const ranked = await rankCandidatesForJob(Number(req.params.id));
  res.json(ranked);
});


router.post('/jobs/:id/shortlist', requireAuth, requireRole('recruiter'), async (req, res) => {
  const { userId } = req.body as { userId: number };
  await pool.query(
    `INSERT INTO job_shortlist (job_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, userId]
  );
  res.status(201).json({ ok: true });
});

router.get('/jobs/:id/shortlist', requireAuth, requireRole('recruiter'), async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.college, js.created_at
     FROM job_shortlist js JOIN users u ON u.id = js.user_id
     WHERE js.job_id = $1 ORDER BY js.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

// Platform-wide stats for the recruiter/admin dashboard widgets
router.get('/stats', requireAuth, requireRole('recruiter'), async (_req, res) => {
  const candidateCount = await pool.query(`SELECT COUNT(*) FROM users WHERE role='candidate'`);
  const verifiedSkillCount = await pool.query(`SELECT COUNT(*) FROM user_skills WHERE verification_status IN ('verified','highly_verified')`);
  const teamCount = await pool.query(`SELECT COUNT(*) FROM teams`);
  const avgVerification = await pool.query(`SELECT COALESCE(AVG(verification_score),0) AS avg FROM user_skills`);

  res.json({
    candidateCount: Number(candidateCount.rows[0].count),
    verifiedSkillCount: Number(verifiedSkillCount.rows[0].count),
    teamCount: Number(teamCount.rows[0].count),
    avgVerification: Number(Number(avgVerification.rows[0].avg).toFixed(1)),
  });
});

export default router;
