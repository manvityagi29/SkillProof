import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from './pool';

function statusFor(score: number): string {
  if (score >= 90) return 'highly_verified';
  if (score >= 75) return 'verified';
  if (score >= 40) return 'developing';
  return 'unverified';
}

async function upsertUserSkill(
  userId: number,
  skillName: string,
  assessmentScore: number,
  evidenceScore: number
) {
  const verificationScore = Number((assessmentScore * 0.6 + evidenceScore * 0.4).toFixed(2));
  const status = statusFor(verificationScore);
  const skillRes = await pool.query('SELECT id FROM skills WHERE name = $1', [skillName]);
  const skillId = skillRes.rows[0].id;
  await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, claimed_level, assessment_score, evidence_score, verification_score, verification_status)
     VALUES ($1,$2,4,$3,$4,$5,$6)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET
       assessment_score = EXCLUDED.assessment_score,
       evidence_score = EXCLUDED.evidence_score,
       verification_score = EXCLUDED.verification_score,
       verification_status = EXCLUDED.verification_status`,
    [userId, skillId, assessmentScore, evidenceScore, verificationScore, status]
  );
  await pool.query(
    `INSERT INTO assessment_results (user_id, skill_id, score, correct_count, total_count)
     VALUES ($1,$2,$3,$4,5)`,
    [userId, skillId, assessmentScore, Math.round((assessmentScore / 100) * 5)]
  );
  return skillId;
}

async function insertEvidence(userId: number, skillId: number, title: string, repoUrl: string, langs: string[], score: number) {
  await pool.query(
    `INSERT INTO evidence (user_id, skill_id, title, repo_url, detected_languages, evidence_score)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, skillId, title, repoUrl, langs, score]
  );
}

async function main() {
  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
  await pool.query(seedSql);
  console.log('Skills, questions, and challenge prompts seeded.');

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers: Array<{ name: string; email: string; role: string; college?: string; branch?: string; github?: string; company?: string }> = [
    { name: 'Manu Dev Tyagi', email: 'manu@demo.dev', role: 'candidate', college: 'BIT Punjab', branch: 'Computer Engineering', github: 'https://github.com/octocat' },
    { name: 'Rahul Sharma', email: 'rahul@demo.dev', role: 'candidate', college: 'BIT Punjab', branch: 'CSE', github: 'https://github.com/torvalds' },
    { name: 'Sneha Kapoor', email: 'sneha@demo.dev', role: 'candidate', college: 'BIT Punjab', branch: 'Design', github: 'https://github.com/gaearon' },
    { name: 'Aman Verma', email: 'aman@demo.dev', role: 'candidate', college: 'BIT Punjab', branch: 'AI/ML', github: 'https://github.com/karpathy' },
    { name: 'Arjun Mehta', email: 'arjun@demo.dev', role: 'candidate', college: 'BIT Punjab', branch: 'CSE', github: 'https://github.com/sindresorhus' },
    { name: 'Priya Nair', email: 'priya@demo.dev', role: 'captain', college: 'BIT Punjab', branch: 'CSE' },
    { name: 'Neha Recruiter', email: 'neha@demo.dev', role: 'recruiter', company: 'Acme Technologies' },
  ];

  const ids: Record<string, number> = {};
  for (const u of demoUsers) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, college, branch, github_url, company)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [u.name, u.email, passwordHash, u.role, u.college || null, u.branch || null, u.github || null, u.company || null]
    );
    ids[u.email] = res.rows[0].id;
  }
  console.log('Demo users created. All passwords: password123');

  // Manu — the hero Skill Passport profile
  const manuReactSkillId = await upsertUserSkill(ids['manu@demo.dev'], 'React', 91, 80);
  await insertEvidence(ids['manu@demo.dev'], manuReactSkillId, 'Collaborative Drawing App', 'https://github.com/octocat/whiteboard', ['TypeScript', 'JavaScript'], 80);
  await upsertUserSkill(ids['manu@demo.dev'], 'Java', 93, 88);
  await upsertUserSkill(ids['manu@demo.dev'], 'AWS', 55, 70);
  await upsertUserSkill(ids['manu@demo.dev'], 'Node.js', 84, 80);

  // Rahul — strong frontend candidate for team discovery demo
  const rahulReactId = await upsertUserSkill(ids['rahul@demo.dev'], 'React', 92, 92);
  await insertEvidence(ids['rahul@demo.dev'], rahulReactId, 'Realtime Kanban Board', 'https://github.com/torvalds/kanban', ['TypeScript', 'React'], 92);

  // Sneha — design
  await upsertUserSkill(ids['sneha@demo.dev'], 'Figma / UI Design', 94, 90);

  // Aman — ML
  await upsertUserSkill(ids['aman@demo.dev'], 'Machine Learning', 89, 85);

  // Arjun — backend, already on the demo team
  await upsertUserSkill(ids['arjun@demo.dev'], 'Java', 91, 85);
  await upsertUserSkill(ids['arjun@demo.dev'], 'Spring Boot', 88, 80);
  await upsertUserSkill(ids['arjun@demo.dev'], 'SQL', 82, 75);

  // Demo team captained by Priya, needs Frontend / Design / ML, Arjun already accepted as Backend
  const teamRes = await pool.query(
    `INSERT INTO teams (name, hackathon, captain_id, max_members) VALUES ($1,$2,$3,4) RETURNING id`,
    ['Code Titans', 'Bit N Build - International Hackathon', ids['priya@demo.dev']]
  );
  const teamId = teamRes.rows[0].id;

  const reqSkills = ['React', 'Node.js', 'Figma / UI Design', 'Machine Learning'];
  for (const s of reqSkills) {
    const skillRes = await pool.query('SELECT id FROM skills WHERE name=$1', [s]);
    await pool.query(
      `INSERT INTO team_requirements (team_id, skill_id, importance) VALUES ($1,$2,4)
       ON CONFLICT DO NOTHING`,
      [teamId, skillRes.rows[0].id]
    );
  }

  await pool.query(
    `INSERT INTO team_members (team_id, user_id, status, role_label) VALUES ($1,$2,'accepted','Backend')`,
    [teamId, ids['arjun@demo.dev']]
  );

  // Recruiter job posting: SDE Intern requiring Java + SQL, min verification 75
  const jobRes = await pool.query(
    `INSERT INTO jobs (recruiter_id, title, min_verification) VALUES ($1,$2,75) RETURNING id`,
    [ids['neha@demo.dev'], 'SDE Intern - Backend']
  );
  const jobId = jobRes.rows[0].id;
  for (const s of ['Java', 'SQL']) {
    const skillRes = await pool.query('SELECT id FROM skills WHERE name=$1', [s]);
    await pool.query(`INSERT INTO job_requirements (job_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [jobId, skillRes.rows[0].id]);
  }

  console.log('Demo team "Code Titans" and demo job "SDE Intern" created.');
  console.log('Seed complete. Log in as priya@demo.dev (captain), neha@demo.dev (recruiter), or manu@demo.dev (candidate) — password123.');
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
