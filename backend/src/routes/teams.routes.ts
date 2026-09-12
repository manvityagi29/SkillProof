import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';
import { rankCandidatesForTeam } from '../services/matching.service';

const router = Router();

router.post('/', requireAuth, requireRole('captain'), async (req, res) => {
  const { name, hackathon, maxMembers, requiredSkills } = req.body as {
    name: string; hackathon?: string; maxMembers?: number; requiredSkills: Array<{ skillId: number; importance: number }>;
  };
  if (!name || !requiredSkills || requiredSkills.length === 0) {
    return res.status(400).json({ error: 'name and at least one requiredSkill are required' });
  }
  const teamRes = await pool.query(
    `INSERT INTO teams (name, hackathon, captain_id, max_members) VALUES ($1,$2,$3,$4) RETURNING id`,
    [name, hackathon || null, req.user!.userId, maxMembers || 4]
  );
  const teamId = teamRes.rows[0].id;
  for (const s of requiredSkills) {
    await pool.query(
      `INSERT INTO team_requirements (team_id, skill_id, importance) VALUES ($1,$2,$3)`,
      [teamId, s.skillId, s.importance || 3]
    );
  }
  res.status(201).json({ id: teamId });
});

router.get('/', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT t.id, t.name, t.hackathon, t.max_members, u.name AS captain_name,
            (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id AND tm.status='accepted') AS member_count,
            COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
     FROM teams t
     JOIN users u ON u.id = t.captain_id
     LEFT JOIN team_requirements tr ON tr.team_id = t.id
     LEFT JOIN skills s ON s.id = tr.skill_id
     GROUP BY t.id, u.name
     ORDER BY t.created_at DESC`
  );
  res.json(result.rows);
});

router.get('/open', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT t.id, t.name, t.hackathon, t.max_members, u.name AS captain_name,
            (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id AND tm.status='accepted') AS member_count,
            COALESCE(ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS required_skills
     FROM teams t
     JOIN users u ON u.id = t.captain_id
     LEFT JOIN team_requirements tr ON tr.team_id = t.id
     LEFT JOIN skills s ON s.id = tr.skill_id
     GROUP BY t.id, u.name
     ORDER BY t.created_at DESC`
  );
  res.json(result.rows);
});

router.get('/mine', requireAuth, requireRole('captain'), async (req, res) => {
  const result = await pool.query(`SELECT id, name, hackathon, max_members FROM teams WHERE captain_id=$1 ORDER BY created_at DESC`, [req.user!.userId]);
  res.json(result.rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const team = await pool.query(
    `SELECT t.*, u.name AS captain_name FROM teams t JOIN users u ON u.id = t.captain_id WHERE t.id=$1`,
    [teamId]
  );
  if (team.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

  const requirements = await pool.query(
    `SELECT tr.skill_id, s.name AS skill_name, s.category, tr.importance FROM team_requirements tr JOIN skills s ON s.id = tr.skill_id WHERE tr.team_id=$1`,
    [teamId]
  );
  const members = await pool.query(
    `SELECT tm.id, tm.user_id, tm.status, tm.role_label, u.name, u.college
     FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id=$1`,
    [teamId]
  );

  res.json({ team: team.rows[0], requirements: requirements.rows, members: members.rows });
});

// POST /api/teams/:id/skills - add or update required skill
router.post('/:id/skills', requireAuth, requireRole('captain'), async (req, res) => {
  const teamId = Number(req.params.id);
  const { skillId, importance } = req.body as { skillId: number; importance?: number };
  if (!skillId) return res.status(400).json({ error: 'skillId is required' });

  await pool.query(
    `INSERT INTO team_requirements (team_id, skill_id, importance)
     VALUES ($1,$2,$3)
     ON CONFLICT (team_id, skill_id) DO UPDATE SET importance = EXCLUDED.importance`,
    [teamId, skillId, importance || 3]
  );
  res.status(201).json({ ok: true });
});

// Team Skill Coverage / Gaps widget: per required skill, best verification score among accepted members
router.get('/:id/coverage', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name AS skill_name, s.category, tr.importance,
            COALESCE(MAX(us.verification_score) FILTER (WHERE tm.status = 'accepted'), 0) AS coverage_score
     FROM team_requirements tr
     JOIN skills s ON s.id = tr.skill_id
     LEFT JOIN team_members tm ON tm.team_id = tr.team_id AND tm.status = 'accepted'
     LEFT JOIN user_skills us ON us.user_id = tm.user_id AND us.skill_id = tr.skill_id
     WHERE tr.team_id = $1
     GROUP BY s.id, s.name, s.category, tr.importance`,
    [teamId]
  );
  const overall = result.rows.length
    ? Number((result.rows.reduce((sum, r) => sum + Number(r.coverage_score), 0) / result.rows.length).toFixed(1))
    : 0;
  res.json({ byCategory: result.rows, overallHealth: overall, skills: result.rows });
});

// GET /api/teams/:id/gaps - alias for coverage
router.get('/:id/gaps', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const result = await pool.query(
    `SELECT s.id AS skill_id, s.name AS skill_name, s.category, tr.importance,
            COALESCE(MAX(us.verification_score) FILTER (WHERE tm.status = 'accepted'), 0) AS coverage_score,
            CASE WHEN COALESCE(MAX(us.verification_score) FILTER (WHERE tm.status = 'accepted'), 0) < 60 THEN true ELSE false END AS is_gap
     FROM team_requirements tr
     JOIN skills s ON s.id = tr.skill_id
     LEFT JOIN team_members tm ON tm.team_id = tr.team_id AND tm.status = 'accepted'
     LEFT JOIN user_skills us ON us.user_id = tm.user_id AND us.skill_id = tr.skill_id
     WHERE tr.team_id = $1
     GROUP BY s.id, s.name, s.category, tr.importance`,
    [teamId]
  );
  res.json(result.rows);
});

router.get('/:id/matches', requireAuth, requireRole('captain'), async (req, res) => {
  const matches = await rankCandidatesForTeam(Number(req.params.id));
  res.json(matches);
});

// GET /api/teams/:id/candidates - alias for candidate matches
router.get('/:id/candidates', requireAuth, requireRole('captain'), async (req, res) => {
  const matches = await rankCandidatesForTeam(Number(req.params.id));
  res.json(matches);
});

router.post('/:id/join-request', requireAuth, requireRole('candidate'), async (req, res) => {
  const teamId = Number(req.params.id);
  await pool.query(
    `INSERT INTO team_members (team_id, user_id, status) VALUES ($1,$2,'pending')
     ON CONFLICT (team_id, user_id) DO NOTHING`,
    [teamId, req.user!.userId]
  );
  res.status(201).json({ ok: true });
});

router.post('/:id/members/:memberId/decision', requireAuth, requireRole('captain'), async (req, res) => {
  const { status, roleLabel } = req.body as { status: 'accepted' | 'rejected'; roleLabel?: string };
  await pool.query(
    `UPDATE team_members SET status=$1, role_label=COALESCE($2, role_label) WHERE id=$3`,
    [status, roleLabel || null, req.params.memberId]
  );
  res.json({ ok: true });
});

export default router;

