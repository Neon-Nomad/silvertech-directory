import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: tsx scripts/run_sql.ts <sql-file>');
  process.exit(1);
}

const password = process.env.SUPABASE_DB_PASSWORD;
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

if (!password || !url) {
  console.error('Missing SUPABASE_DB_PASSWORD or SUPABASE_URL/VITE_SUPABASE_URL in env.');
  process.exit(1);
}

const host = url.replace('https://', '').replace('http://', '');
const connectionString = `postgresql://postgres:${password}@db.${host}:5432/postgres`;

const sqlPath = path.resolve(process.cwd(), sqlFile);
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf-8');

const run = async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Executed ${sqlFile}`);
  } finally {
    await client.end();
  }
};

run().catch((err) => {
  console.error('SQL execution failed:', err);
  process.exit(1);
});
