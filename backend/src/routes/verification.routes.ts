import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { getVerificationChain } from '../services/verification.service';

const router = Router();

// GET /api/verification - all verified skills for current user
router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name AS skill_name, s.category,
            us.assessment_score, us.evidence_score, us.verification_score, us.verification_status, us.updated_at
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
     ORDER BY us.verification_score DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

// GET /api/verification/:skillId/chain - current user's chain
router.get('/:skillId/chain', requireAuth, async (req, res) => {
  const chain = await getVerificationChain(req.user!.userId, Number(req.params.skillId));
  res.json(chain);
});

// Powers the Verification Chain screen for any specific user & skill
router.get('/:userId/:skillId/chain', requireAuth, async (req, res) => {
  const chain = await getVerificationChain(Number(req.params.userId), Number(req.params.skillId));
  res.json(chain);
});

// GET /api/verification/:skillId - single skill verification for current user
router.get('/:skillId', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name AS skill_name, s.category,
            us.assessment_score, us.evidence_score, us.verification_score, us.verification_status, us.updated_at
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1 AND us.skill_id = $2`,
    [req.user!.userId, req.params.skillId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Skill verification not found' });
  res.json(result.rows[0]);
});

export default router;

