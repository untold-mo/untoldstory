import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(`
  SELECT column_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'
`);
console.log('قبل:', rows);

await client.query(`ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL`);
console.log('تم إزالة NOT NULL من password_hash');

const { rows: after } = await client.query(`
  SELECT column_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'
`);
console.log('بعد:', after);

await client.end();
