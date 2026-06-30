import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='price_quotes' ORDER BY column_name`);
console.log(rows.map(r => r.column_name));
await client.end();
