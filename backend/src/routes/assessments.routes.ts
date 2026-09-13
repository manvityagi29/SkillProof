import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { recomputeVerification } from '../services/verification.service';

const router = Router();

// GET /api/assessments - list available skill assessments
router.get('/', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT s.id, s.name, s.category, COUNT(aq.id) AS question_count
     FROM skills s
     JOIN assessment_questions aq ON aq.skill_id = s.id
     GROUP BY s.id, s.name, s.category
     ORDER BY s.name`
  );
  res.json(result.rows);
});

// GET /api/assessments/results - user's assessment history
router.get('/results', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT ar.id, ar.skill_id, s.name AS skill_name, ar.score, ar.correct_count, ar.total_count, ar.created_at
     FROM assessment_results ar
     JOIN skills s ON s.id = ar.skill_id
     WHERE ar.user_id = $1
     ORDER BY ar.created_at DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

router.get('/:skillId/questions', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, question, options FROM assessment_questions WHERE skill_id=$1 ORDER BY id`,
    [req.params.skillId]
  );
  res.json(result.rows);
});

// GET /api/assessments/:id - alias for questions
router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, question, options FROM assessment_questions WHERE skill_id=$1 ORDER BY id`,
    [req.params.id]
  );
  res.json(result.rows);
});

router.post('/:skillId/submit', requireAuth, async (req, res) => {
  const skillId = Number(req.params.skillId);
  const { answers } = req.body as { answers: Array<{ questionId: number; selectedIndex: number }> };
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }

  const questionIds = answers.map((a) => a.questionId);
  const correctRes = await pool.query(
    `SELECT id, correct_index FROM assessment_questions WHERE id = ANY($1)`,
    [questionIds]
  );
  const correctMap = new Map(correctRes.rows.map((r) => [r.id, r.correct_index]));

  let correctCount = 0;
  for (const a of answers) {
    if (correctMap.get(a.questionId) === a.selectedIndex) correctCount += 1;
  }
  const score = Number(((correctCount / answers.length) * 100).toFixed(2));

  const resultInsert = await pool.query(
    `INSERT INTO assessment_results (user_id, skill_id, score, correct_count, total_count)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [req.user!.userId, skillId, score, correctCount, answers.length]
  );
  const attemptId = resultInsert.rows[0].id;

  // Persist individual answers to assessment_answers
  for (const a of answers) {
    const isCorrect = correctMap.get(a.questionId) === a.selectedIndex;
    await pool.query(
      `INSERT INTO assessment_answers (attempt_id, user_id, skill_id, question_id, selected_index, is_correct)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [attemptId, req.user!.userId, skillId, a.questionId, a.selectedIndex, isCorrect]
    );
  }

  const verification = await recomputeVerification(req.user!.userId, skillId);
  res.status(201).json({ score, correctCount, totalCount: answers.length, verification });
});

// POST /api/assessments/:skillId/cancel - cancel/disqualify assessment due to anti-cheating violation
router.post('/:skillId/cancel', requireAuth, async (req, res) => {
  const skillId = Number(req.params.skillId);
  const { reason = 'Proctoring Violation: Tab switching detected during active session.', strikes = 2 } = req.body || {};

  // Record disqualified attempt with 0 score
  const resultInsert = await pool.query(
    `INSERT INTO assessment_results (user_id, skill_id, score, correct_count, total_count)
     VALUES ($1, $2, 0, 0, 0) RETURNING id, created_at`,
    [req.user!.userId, skillId]
  );

  const attemptId = resultInsert.rows[0].id;
  const createdAt = resultInsert.rows[0].created_at;

  res.status(200).json({
    cancelled: true,
    disqualified: true,
    attemptId,
    reason,
    strikes,
    score: 0,
    created_at: createdAt
  });
});

export default router;

