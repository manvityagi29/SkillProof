import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { recomputeVerification } from '../services/verification.service';

const router = Router();

// Deliberately shallow by design (see PRD): we only ask GitHub for the
// languages breakdown of a repo. We do NOT parse package.json, READMEs, or
// dependency trees — that's a much larger and more fragile project, and a
// live demo is the wrong place to find that out.
const SKILL_LANGUAGE_HINTS: Record<string, string[]> = {
  React: ['JavaScript', 'TypeScript'],
  TypeScript: ['TypeScript'],
  'Node.js': ['JavaScript', 'TypeScript'],
  Java: ['Java'],
  'Spring Boot': ['Java'],
  SQL: ['PLpgSQL', 'SQL'],
  'Machine Learning': ['Python', 'Jupyter Notebook'],
};

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

router.post('/', requireAuth, async (req, res) => {
  const { skillId, title, repoUrl } = req.body as { skillId: number; title: string; repoUrl: string };
  if (!skillId || !title || !repoUrl) {
    return res.status(400).json({ error: 'skillId, title, and repoUrl are required' });
  }

  const skillRes = await pool.query('SELECT name FROM skills WHERE id=$1', [skillId]);
  if (skillRes.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });
  const skillName = skillRes.rows[0].name;

  let detectedLanguages: string[] = [];
  let evidenceScore = 55; // conservative fallback if the repo can't be reached — never blocks the demo

  const parsed = parseRepoUrl(repoUrl);
  if (parsed) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`, {
        headers: { 'User-Agent': 'proofstack-app' },
      });
      if (ghRes.ok) {
        const langBytes = (await ghRes.json()) as Record<string, number>;
        detectedLanguages = Object.keys(langBytes);
        const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
        const hints = SKILL_LANGUAGE_HINTS[skillName] || [];
        const relevantBytes = hints.reduce((sum, lang) => sum + (langBytes[lang] || 0), 0);
        const relevance = hints.length ? relevantBytes / totalBytes : 0.5;
        evidenceScore = Math.min(98, Math.round(50 + relevance * 50));
      }
    } catch {
      // network issue or rate limit — fall back silently, this is a live-demo safety net
    }
  }

  await pool.query(
    `INSERT INTO evidence (user_id, skill_id, title, repo_url, detected_languages, evidence_score)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.user!.userId, skillId, title, repoUrl, detectedLanguages, evidenceScore]
  );

  const updated = await recomputeVerification(req.user!.userId, skillId);
  res.status(201).json({ detectedLanguages, evidenceScore, verification: updated });
});

router.get('/', requireAuth, async (req, res) => {
  const skillId = req.query.skillId ? Number(req.query.skillId) : null;
  const query = skillId
    ? `SELECT id, skill_id, title, repo_url, detected_languages, evidence_score, created_at
       FROM evidence WHERE user_id=$1 AND skill_id=$2 ORDER BY created_at DESC`
    : `SELECT id, skill_id, title, repo_url, detected_languages, evidence_score, created_at
       FROM evidence WHERE user_id=$1 ORDER BY created_at DESC`;
  const params = skillId ? [req.user!.userId, skillId] : [req.user!.userId];
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.get('/mine/:skillId', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, title, repo_url, detected_languages, evidence_score, created_at
     FROM evidence WHERE user_id=$1 AND skill_id=$2 ORDER BY created_at DESC`,
    [req.user!.userId, req.params.skillId]
  );
  res.json(result.rows);
});

// Alias for /api/github/evidence if hit as a subroute
router.post('/evidence', requireAuth, async (req, res) => {
  const { skillId, title, repoUrl } = req.body as { skillId: number; title: string; repoUrl: string };
  if (!skillId || !title || !repoUrl) {
    return res.status(400).json({ error: 'skillId, title, and repoUrl are required' });
  }

  const skillRes = await pool.query('SELECT name FROM skills WHERE id=$1', [skillId]);
  if (skillRes.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });
  const skillName = skillRes.rows[0].name;

  let detectedLanguages: string[] = [];
  let evidenceScore = 55;

  const parsed = parseRepoUrl(repoUrl);
  if (parsed) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`, {
        headers: { 'User-Agent': 'proofstack-app' },
      });
      if (ghRes.ok) {
        const langBytes = (await ghRes.json()) as Record<string, number>;
        detectedLanguages = Object.keys(langBytes);
        const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
        const hints = SKILL_LANGUAGE_HINTS[skillName] || [];
        const relevantBytes = hints.reduce((sum, lang) => sum + (langBytes[lang] || 0), 0);
        const relevance = hints.length ? relevantBytes / totalBytes : 0.5;
        evidenceScore = Math.min(98, Math.round(50 + relevance * 50));
      }
    } catch {
      // fallback
    }
  }

  await pool.query(
    `INSERT INTO evidence (user_id, skill_id, title, repo_url, detected_languages, evidence_score)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.user!.userId, skillId, title, repoUrl, detectedLanguages, evidenceScore]
  );

  const updated = await recomputeVerification(req.user!.userId, skillId);
  res.status(201).json({ detectedLanguages, evidenceScore, verification: updated });
});

export default router;

