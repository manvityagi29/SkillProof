import { pool } from '../db/pool';

export interface SkillRequirement {
  skillId: number;
  skillName: string;
  importance: number; // 1-5
}

export interface CandidateMatch {
  userId: number;
  name: string;
  college: string | null;
  matchPercent: number;
  skillBreakdown: Array<{ skillName: string; verificationScore: number; isTeamGap: boolean }>;
}

/**
 * Match % = weighted average of (candidate's verified score for each required skill),
 * where a skill the team is currently missing entirely counts at full weight and a
 * skill the team already has covered counts at half weight. This is the "find the
 * candidate the team needs, not just the best individual" logic from the PRD,
 * expressed as one explainable rule instead of a four-factor formula.
 */
export async function rankCandidatesForTeam(teamId: number): Promise<CandidateMatch[]> {
  const requirements = await pool.query(
    `SELECT tr.skill_id, s.name AS skill_name, tr.importance
     FROM team_requirements tr JOIN skills s ON s.id = tr.skill_id
     WHERE tr.team_id = $1`,
    [teamId]
  );

  const coverage = await pool.query(
    `SELECT tr.skill_id, COUNT(us.id) > 0 AS covered
     FROM team_requirements tr
     LEFT JOIN team_members tm ON tm.team_id = tr.team_id AND tm.status = 'accepted'
     LEFT JOIN user_skills us ON us.user_id = tm.user_id AND us.skill_id = tr.skill_id AND us.verification_score >= 60
     WHERE tr.team_id = $1
     GROUP BY tr.skill_id`,
    [teamId]
  );
  const gapMap = new Map<number, boolean>();
  coverage.rows.forEach((r) => gapMap.set(r.skill_id, !r.covered));

  const existingMemberIds = await pool.query(`SELECT user_id FROM team_members WHERE team_id=$1`, [teamId]);
  const excludeIds = existingMemberIds.rows.map((r) => r.user_id);

  const candidates = await pool.query(
    `SELECT id, name, college FROM users WHERE role = 'candidate' ${excludeIds.length ? 'AND id != ALL($1)' : ''}`,
    excludeIds.length ? [excludeIds] : []
  );

  const results: CandidateMatch[] = [];
  for (const candidate of candidates.rows) {
    let weightedSum = 0;
    let weightTotal = 0;
    const breakdown = [];
    for (const req of requirements.rows) {
      const skillRes = await pool.query(
        `SELECT verification_score FROM user_skills WHERE user_id=$1 AND skill_id=$2`,
        [candidate.id, req.skill_id]
      );
      const score = skillRes.rows[0] ? Number(skillRes.rows[0].verification_score) : 0;
      const isGap = gapMap.get(req.skill_id) ?? true;
      const weight = (req.importance || 3) * (isGap ? 1 : 0.5);
      weightedSum += score * weight;
      weightTotal += weight;
      breakdown.push({ skillName: req.skill_name, verificationScore: score, isTeamGap: isGap });
    }
    const matchPercent = weightTotal > 0 ? Number((weightedSum / weightTotal).toFixed(1)) : 0;
    results.push({ userId: candidate.id, name: candidate.name, college: candidate.college, matchPercent, skillBreakdown: breakdown });
  }

  return results.sort((a, b) => b.matchPercent - a.matchPercent);
}

export async function rankCandidatesForJob(jobId: number) {
  const job = await pool.query('SELECT min_verification FROM jobs WHERE id=$1', [jobId]);
  const requirements = await pool.query(
    `SELECT jr.skill_id, s.name AS skill_name FROM job_requirements jr JOIN skills s ON s.id = jr.skill_id WHERE jr.job_id=$1`,
    [jobId]
  );
  const candidates = await pool.query(`SELECT id, name, college FROM users WHERE role='candidate'`);

  const minVerification = Number(job.rows[0]?.min_verification ?? 0);
  const results = [];
  for (const candidate of candidates.rows) {
    const breakdown = [];
    let total = 0;
    let meetsMinimum = true;
    for (const req of requirements.rows) {
      const skillRes = await pool.query(`SELECT verification_score FROM user_skills WHERE user_id=$1 AND skill_id=$2`, [candidate.id, req.skill_id]);
      const score = skillRes.rows[0] ? Number(skillRes.rows[0].verification_score) : 0;
      if (score < minVerification) meetsMinimum = false;
      total += score;
      breakdown.push({ skillName: req.skill_name, verificationScore: score });
    }
    const avg = requirements.rows.length ? Number((total / requirements.rows.length).toFixed(1)) : 0;
    if (meetsMinimum && requirements.rows.length > 0) {
      results.push({ userId: candidate.id, name: candidate.name, college: candidate.college, averageScore: avg, skillBreakdown: breakdown });
    }
  }
  return results.sort((a, b) => b.averageScore - a.averageScore);
}
