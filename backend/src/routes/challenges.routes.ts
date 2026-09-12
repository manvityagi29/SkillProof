import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/prompts/:skillId', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, title, prompt, time_limit_minutes FROM challenge_prompts WHERE skill_id=$1`,
    [req.params.skillId]
  );
  res.json(result.rows);
});

// Captain assigns a pre-join challenge to a candidate for a specific skill.
router.post('/', requireAuth, requireRole('captain'), async (req, res) => {
  const { teamId, candidateId, skillId, promptId, title, prompt, description, timeLimitMinutes, instructions, starterCode } = req.body as {
    teamId: number; candidateId: number; skillId: number; promptId?: number;
    title?: string; prompt?: string; description?: string; timeLimitMinutes?: number;
    instructions?: string; starterCode?: string;
  };

  let effectivePromptId = promptId;
  if (!effectivePromptId && title && (prompt || description)) {
    const promptText = prompt || description || '';
    const promptInsert = await pool.query(
      `INSERT INTO challenge_prompts (skill_id, title, prompt, time_limit_minutes, instructions, starter_code)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [skillId, title, promptText, timeLimitMinutes || 15, instructions || null, starterCode || null]
    );
    effectivePromptId = promptInsert.rows[0].id;
  }

  if (!effectivePromptId) {
    return res.status(400).json({ error: 'promptId or title + description is required' });
  }

  const result = await pool.query(
    `INSERT INTO challenges (team_id, candidate_id, skill_id, prompt_id, status)
     VALUES ($1,$2,$3,$4,'assigned') RETURNING id`,
    [teamId, candidateId, skillId, effectivePromptId]
  );
  res.status(201).json({ id: result.rows[0].id });
});


router.get('/mine', requireAuth, requireRole('candidate'), async (req, res) => {
  const result = await pool.query(
    `SELECT c.id, c.status, c.score, c.recommendation, c.code_submission,
            c.correctness, c.code_quality, c.problem_solving, c.comments, c.verdict,
            cp.title, cp.prompt, cp.time_limit_minutes, cp.instructions, cp.starter_code,
            t.name AS team_name, s.name AS skill_name
     FROM challenges c
     JOIN challenge_prompts cp ON cp.id = c.prompt_id
     JOIN teams t ON t.id = c.team_id
     JOIN skills s ON s.id = c.skill_id
     WHERE c.candidate_id = $1 ORDER BY c.created_at DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

router.get('/team/:teamId', requireAuth, requireRole('captain'), async (req, res) => {
  const result = await pool.query(
    `SELECT c.id, c.status, c.score, c.recommendation, c.code_submission, c.rubric,
            c.correctness, c.code_quality, c.problem_solving, c.comments, c.verdict,
            cp.title, cp.prompt, cp.time_limit_minutes, cp.instructions, cp.starter_code,
            u.name AS candidate_name, s.name AS skill_name, t.name AS team_name, t.id AS team_id
     FROM challenges c
     JOIN challenge_prompts cp ON cp.id = c.prompt_id
     JOIN teams t ON t.id = c.team_id
     JOIN users u ON u.id = c.candidate_id
     JOIN skills s ON s.id = c.skill_id
     WHERE c.team_id = $1 ORDER BY c.created_at DESC`,
    [req.params.teamId]
  );
  res.json(result.rows);
});

// GET /api/challenges - list challenges based on user role
router.get('/', requireAuth, async (req, res) => {
  if (req.user!.role === 'captain') {
    const result = await pool.query(
      `SELECT c.id, c.status, c.score, c.recommendation, c.code_submission, c.rubric,
              c.correctness, c.code_quality, c.problem_solving, c.comments, c.verdict,
              cp.title, cp.prompt, cp.time_limit_minutes, cp.instructions, cp.starter_code,
              u.name AS candidate_name, s.name AS skill_name, t.name AS team_name, t.id AS team_id
       FROM challenges c
       JOIN challenge_prompts cp ON cp.id = c.prompt_id
       JOIN teams t ON t.id = c.team_id
       JOIN users u ON u.id = c.candidate_id
       JOIN skills s ON s.id = c.skill_id
       WHERE t.captain_id = $1 ORDER BY c.created_at DESC`,
      [req.user!.userId]
    );
    return res.json(result.rows);
  }

  const result = await pool.query(
    `SELECT c.id, c.status, c.score, c.recommendation, c.code_submission,
            c.correctness, c.code_quality, c.problem_solving, c.comments, c.verdict,
            cp.title, cp.prompt, cp.time_limit_minutes, cp.instructions, cp.starter_code,
            t.name AS team_name, s.name AS skill_name
     FROM challenges c
     JOIN challenge_prompts cp ON cp.id = c.prompt_id
     JOIN teams t ON t.id = c.team_id
     JOIN skills s ON s.id = c.skill_id
     WHERE c.candidate_id = $1 ORDER BY c.created_at DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

// GET /api/challenges/:id - single challenge details
router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT c.id, c.status, c.score, c.recommendation, c.code_submission, c.rubric,
            c.correctness, c.code_quality, c.problem_solving, c.comments, c.verdict,
            cp.title, cp.prompt, cp.time_limit_minutes, cp.instructions, cp.starter_code,
            u.name AS candidate_name, s.name AS skill_name, t.name AS team_name, t.id AS team_id,
            t.captain_id, c.candidate_id
     FROM challenges c
     JOIN challenge_prompts cp ON cp.id = c.prompt_id
     JOIN teams t ON t.id = c.team_id
     JOIN users u ON u.id = c.candidate_id
     JOIN skills s ON s.id = c.skill_id
     WHERE c.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Challenge not found' });
  const ch = result.rows[0];

  // Auth check: must be the candidate or the team captain
  if (req.user!.role === 'candidate' && ch.candidate_id !== req.user!.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user!.role === 'captain' && ch.captain_id !== req.user!.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(ch);
});

// Candidate submits code.
router.post('/:id/submit', requireAuth, requireRole('candidate'), async (req, res) => {
  const { code } = req.body as { code: string };
  await pool.query(
    `UPDATE challenges SET code_submission=$1, status='submitted', submitted_at=now() WHERE id=$2 AND candidate_id=$3`,
    [code, req.params.id, req.user!.userId]
  );
  await pool.query(
    `INSERT INTO challenge_submissions (challenge_id, candidate_id, code)
     VALUES ($1,$2,$3)`,
    [req.params.id, req.user!.userId, code]
  );
  res.json({ ok: true });
});

// Captain reviews challenge with human rubric
// Fields: Correctness, Code Quality, Problem Solving, Overall Score, Comments, Verdict (ACCEPT/REJECT)
router.post('/:id/review', requireAuth, requireRole('captain'), async (req, res) => {
  const { correctness, codeQuality, problemSolving, overallScore, comments, verdict, roleLabel } = req.body as {
    correctness?: number; codeQuality?: number; problemSolving?: number;
    overallScore?: number; comments?: string; verdict: 'ACCEPT' | 'REJECT'; roleLabel?: string;
  };

  const challengeRes = await pool.query('SELECT team_id, candidate_id FROM challenges WHERE id=$1', [req.params.id]);
  if (challengeRes.rows.length === 0) return res.status(404).json({ error: 'Challenge not found' });
  const { team_id, candidate_id } = challengeRes.rows[0];

  const calculatedScore = overallScore ?? Math.round(((correctness || 0) + (codeQuality || 0) + (problemSolving || 0)) / 3);
  const isAccepted = verdict === 'ACCEPT';
  const recommendation = isAccepted ? 'STRONG MATCH' : 'NOT ACCEPTED';
  const status = isAccepted ? 'accepted' : 'rejected';

  await pool.query(
    `UPDATE challenges SET
       score=$1, recommendation=$2, correctness=$3, code_quality=$4,
       problem_solving=$5, comments=$6, verdict=$7, status=$8, scored_at=now()
     WHERE id=$9`,
    [calculatedScore, recommendation, correctness || null, codeQuality || null, problemSolving || null, comments || null, verdict, status, req.params.id]
  );

  if (isAccepted) {
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, status, role_label) VALUES ($1,$2,'accepted',$3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET status='accepted', role_label=EXCLUDED.role_label`,
      [team_id, candidate_id, roleLabel || null]
    );
  }

  res.json({ ok: true, score: calculatedScore, verdict, status });
});

// Captain scores against a visible rubric checklist
router.post('/:id/score', requireAuth, requireRole('captain'), async (req, res) => {
  const { rubric } = req.body as { rubric: Record<string, boolean> };
  const checks = Object.values(rubric);
  const passedCount = checks.filter(Boolean).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const recommendation = score >= 80 ? 'STRONG MATCH' : score >= 60 ? 'MODERATE MATCH' : 'NEEDS IMPROVEMENT';

  await pool.query(
    `UPDATE challenges SET rubric=$1, score=$2, recommendation=$3, status='scored', scored_at=now() WHERE id=$4`,
    [JSON.stringify(rubric), score, recommendation, req.params.id]
  );
  res.json({ score, recommendation });
});

router.post('/:id/decision', requireAuth, requireRole('captain'), async (req, res) => {
  const { accept, roleLabel } = req.body as { accept: boolean; roleLabel?: string };
  const challengeRes = await pool.query('SELECT team_id, candidate_id FROM challenges WHERE id=$1', [req.params.id]);
  if (challengeRes.rows.length === 0) return res.status(404).json({ error: 'Challenge not found' });
  const { team_id, candidate_id } = challengeRes.rows[0];

  await pool.query(`UPDATE challenges SET status=$1 WHERE id=$2`, [accept ? 'accepted' : 'rejected', req.params.id]);

  if (accept) {
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, status, role_label) VALUES ($1,$2,'accepted',$3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET status='accepted', role_label=EXCLUDED.role_label`,
      [team_id, candidate_id, roleLabel || null]
    );
  }
  res.json({ ok: true });
});

export default router;

