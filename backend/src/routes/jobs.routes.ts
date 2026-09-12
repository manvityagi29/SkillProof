import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';
import { rankCandidatesForJob } from '../services/matching.service';

const router = Router();

// POST /api/jobs - create a job
router.post('/', requireAuth, requireRole('recruiter'), async (req, res) => {
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

// GET /api/jobs - list jobs
router.get('/', requireAuth, async (req, res) => {
  const isRecruiter = req.user!.role === 'recruiter';
  const query = isRecruiter
    ? `SELECT j.id, j.title, j.min_verification, j.created_at, u.name AS recruiter_name, u.company,
              COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
       FROM jobs j
       JOIN users u ON u.id = j.recruiter_id
       LEFT JOIN job_requirements jr ON jr.job_id = j.id
       LEFT JOIN skills s ON s.id = jr.skill_id
       WHERE j.recruiter_id = $1
       GROUP BY j.id, u.name, u.company ORDER BY j.created_at DESC`
    : `SELECT j.id, j.title, j.min_verification, j.created_at, u.name AS recruiter_name, u.company,
              COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
       FROM jobs j
       JOIN users u ON u.id = j.recruiter_id
       LEFT JOIN job_requirements jr ON jr.job_id = j.id
       LEFT JOIN skills s ON s.id = jr.skill_id
       GROUP BY j.id, u.name, u.company ORDER BY j.created_at DESC`;
  const params = isRecruiter ? [req.user!.userId] : [];
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// GET /api/jobs/:id - single job
router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT j.id, j.title, j.min_verification, j.created_at, u.name AS recruiter_name, u.company,
            COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
     FROM jobs j
     JOIN users u ON u.id = j.recruiter_id
     LEFT JOIN job_requirements jr ON jr.job_id = j.id
     LEFT JOIN skills s ON s.id = jr.skill_id
     WHERE j.id = $1
     GROUP BY j.id, u.name, u.company`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
  res.json(result.rows[0]);
});

// GET /api/jobs/:id/candidates - ranked candidates meeting threshold
router.get('/:id/candidates', requireAuth, requireRole('recruiter'), async (req, res) => {
  const ranked = await rankCandidatesForJob(Number(req.params.id));
  res.json(ranked);
});

// POST /api/jobs/:id/shortlist - shortlist candidate
router.post('/:id/shortlist', requireAuth, requireRole('recruiter'), async (req, res) => {
  const { userId } = req.body as { userId: number };
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  await pool.query(
    `INSERT INTO job_shortlist (job_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, userId]
  );
  res.status(201).json({ ok: true, jobId: Number(req.params.id), userId });
});

// GET /api/jobs/:id/shortlist - get shortlisted candidates
router.get('/:id/shortlist', requireAuth, requireRole('recruiter'), async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.college, u.branch, js.created_at
     FROM job_shortlist js JOIN users u ON u.id = js.user_id
     WHERE js.job_id = $1 ORDER BY js.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

export default router;
