import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { signToken, requireAuth } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role, college, branch, githubUrl, company } = req.body as {
    name: string; email: string; password: string; role: UserRole;
    college?: string; branch?: string; githubUrl?: string; company?: string;
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  if (!['candidate', 'captain', 'recruiter'].includes(role)) {
    return res.status(400).json({ error: 'role must be candidate, captain, or recruiter' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, college, branch, github_url, company)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, role`,
    [name, email, passwordHash, role, college || null, branch || null, githubUrl || null, company || null]
  );
  const user = result.rows[0];
  const token = signToken({ userId: user.id, role: user.role, name: user.name });
  res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const result = await pool.query('SELECT id, name, role, password_hash FROM users WHERE email=$1', [email]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = signToken({ userId: user.id, role: user.role, name: user.name });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, college, branch, github_url, company, created_at FROM users WHERE id=$1`,
    [req.user!.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(result.rows[0]);
});

export default router;

