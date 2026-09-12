import { pool } from '../db/pool';

/**
 * Verification Score = Assessment (60%) + Evidence (40%)
 * Kept deliberately to two transparent inputs so it can be explained and
 * defended in one sentence, rather than a multi-factor formula that is
 * hard to justify live. See PRD Module 5.
 */
export const ASSESSMENT_WEIGHT = 0.6;
export const EVIDENCE_WEIGHT = 0.4;

export function statusForScore(score: number): 'unverified' | 'developing' | 'verified' | 'highly_verified' {
  if (score >= 90) return 'highly_verified';
  if (score >= 75) return 'verified';
  if (score >= 40) return 'developing';
  return 'unverified';
}

export async function recomputeVerification(userId: number, skillId: number) {
  const latestAssessment = await pool.query(
    `SELECT score FROM assessment_results WHERE user_id=$1 AND skill_id=$2 ORDER BY created_at DESC LIMIT 1`,
    [userId, skillId]
  );
  const evidenceAvg = await pool.query(
    `SELECT COALESCE(AVG(evidence_score), 0) AS avg_score FROM evidence WHERE user_id=$1 AND skill_id=$2`,
    [userId, skillId]
  );

  const assessmentScore = latestAssessment.rows[0] ? Number(latestAssessment.rows[0].score) : 0;
  const evidenceScore = Number(evidenceAvg.rows[0].avg_score);
  const verificationScore = Number((assessmentScore * ASSESSMENT_WEIGHT + evidenceScore * EVIDENCE_WEIGHT).toFixed(2));
  const status = statusForScore(verificationScore);

  await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, assessment_score, evidence_score, verification_score, verification_status)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET
       assessment_score = EXCLUDED.assessment_score,
       evidence_score = EXCLUDED.evidence_score,
       verification_score = EXCLUDED.verification_score,
       verification_status = EXCLUDED.verification_status,
       updated_at = now()`,
    [userId, skillId, assessmentScore, evidenceScore, verificationScore, status]
  );

  return { assessmentScore, evidenceScore, verificationScore, status };
}

export async function getVerificationChain(userId: number, skillId: number) {
  const skillRes = await pool.query('SELECT verification_score, verification_status FROM user_skills WHERE user_id=$1 AND skill_id=$2', [userId, skillId]);
  const assessmentRes = await pool.query(
    `SELECT score, correct_count, total_count, created_at FROM assessment_results WHERE user_id=$1 AND skill_id=$2 ORDER BY created_at DESC LIMIT 1`,
    [userId, skillId]
  );
  const evidenceRes = await pool.query(
    `SELECT title, repo_url, detected_languages, evidence_score, created_at FROM evidence WHERE user_id=$1 AND skill_id=$2 ORDER BY created_at DESC`,
    [userId, skillId]
  );

  return {
    verification: skillRes.rows[0] || null,
    assessment: assessmentRes.rows[0] || null,
    evidence: evidenceRes.rows,
  };
}
