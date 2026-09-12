import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const result = await pool.query('SELECT id, name, category FROM skills ORDER BY name');
  res.json(result.rows);
});

router.post('/claim', requireAuth, async (req, res) => {
  const { skillId, claimedLevel } = req.body as { skillId: number; claimedLevel?: number };
  if (!skillId) {
    return res.status(400).json({ error: 'skillId is required' });
  }
  await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, claimed_level) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET claimed_level = EXCLUDED.claimed_level`,
    [req.user!.userId, skillId, claimedLevel || 3]
  );
  res.status(201).json({ ok: true, skillId });
});

router.get('/my', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name AS skill_name, s.category,
            us.assessment_score, us.evidence_score, us.verification_score, us.verification_status, us.updated_at
     FROM user_skills us JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
     ORDER BY us.verification_score DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

export default router;

