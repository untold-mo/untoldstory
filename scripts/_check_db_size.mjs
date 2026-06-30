import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows: size } = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`);
console.log('حجم قاعدة البيانات:', size[0].size);

const { rows: avatars } = await client.query(`SELECT length(avatar) AS len FROM public.users WHERE avatar IS NOT NULL ORDER BY len DESC LIMIT 5`);
console.log('أكبر avatar lengths:', avatars.map(r => r.len));

const { rows: tablesizes } = await client.query(`
  SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS size
  FROM pg_catalog.pg_statio_user_tables
  ORDER BY pg_total_relation_size(relid) DESC LIMIT 8
`);
console.log('أكبر الجداول:', tablesizes);

await client.end();
