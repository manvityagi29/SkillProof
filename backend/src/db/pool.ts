import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  'postgresql://postgres:postgres@localhost:5432/proofstack';

const isCloud =
  !connectionString.includes('pinggy') &&
  !connectionString.includes('sslmode=disable') &&
  (connectionString.includes('sslmode=require') ||
   connectionString.includes('neon.tech') ||
   connectionString.includes('supabase.co') ||
   connectionString.includes('render.com'));

export const pool = new Pool({
  connectionString,
  ssl: isCloud ? { rejectUnauthorized: false } : undefined,
});
