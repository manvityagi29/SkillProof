import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, college, branch, github_url, company, created_at FROM users WHERE id=$1`,
    [req.user!.userId]
  );
  res.json(result.rows[0]);
});

// The Skill Passport — hero screen. Returns every claimed skill with its
// verification score and status, ordered highest score first.
router.get('/me/passport', requireAuth, async (req, res) => {
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

router.get('/:id/passport', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name AS skill_name, s.category,
            us.assessment_score, us.evidence_score, us.verification_score, us.verification_status, us.updated_at
     FROM user_skills us JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
     ORDER BY us.verification_score DESC`,
    [req.params.id]
  );
  const userRes = await pool.query(`SELECT id, name, college, branch FROM users WHERE id=$1`, [req.params.id]);
  res.json({ user: userRes.rows[0], skills: result.rows });
});

// Claim a skill (self-reported starting point — must still be assessed/evidenced to verify)
router.post('/me/skills', requireAuth, async (req, res) => {
  const { skillId, claimedLevel } = req.body as { skillId: number; claimedLevel: number };
  await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, claimed_level) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET claimed_level = EXCLUDED.claimed_level`,
    [req.user!.userId, skillId, claimedLevel || 3]
  );
  res.status(201).json({ ok: true });
});

export default router;
