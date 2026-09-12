import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('Schema created.');
  await pool.end();
}

main().catch((err) => {
  console.error('Schema init failed:', err.message);
  process.exit(1);
});
