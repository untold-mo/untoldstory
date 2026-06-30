import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`);
for (const r of rows) {
  const c = await client.query(`SELECT COUNT(*)::int AS c FROM public."${r.table_name}"`);
  console.log(r.table_name, c.rows[0].c);
}
await client.end();
