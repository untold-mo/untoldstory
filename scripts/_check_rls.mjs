import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows: tables } = await client.query(`SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY relname`);
console.log('=== جداول و RLS ===');
for (const t of tables) console.log(t.relname, t.relrowsecurity ? 'RLS ON' : 'RLS OFF');

const { rows: pol } = await client.query(`SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`);
console.log('\n=== Policies الموجودة ===');
for (const p of pol) console.log(p.tablename, '|', p.policyname, '|', p.cmd, '|', p.roles);

await client.end();
