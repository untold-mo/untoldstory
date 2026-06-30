import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/_apply_sql.mjs <path-to-sql>');
  process.exit(1);
}
const sql = fs.readFileSync(file, 'utf8');

const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log('OK:', file);
} catch (e) {
  console.error('FAILED:', file, '\n', e.message);
}
await client.end();
