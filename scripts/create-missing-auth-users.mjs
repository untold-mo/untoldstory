#!/usr/bin/env node
/** إنشاء حسابات Supabase Auth للموظفين الموجودين في public.users لكن ناقصين من auth.users في المشروع الجديد */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const rel of ['.env.migrate', '.env.local']) {
  if (existsSync(join(root, rel))) config({ path: join(root, rel) });
}

const URL = String(process.env.NEW_SUPABASE_URL).replace(/\/+$/, '');
const SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
const TEMP_PASSWORD = process.env.TEMP_PASSWORD || 'Untold@2026!';

const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows: appUsers } = await client.query(`SELECT email, name FROM public.users ORDER BY name`);
await client.end();

async function listAuthEmails() {
  const emails = new Set();
  let page = 1;
  for (;;) {
    const r = await fetch(`${URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    const batch = j.users || [];
    for (const u of batch) emails.add(String(u.email).toLowerCase());
    if (batch.length < 200) break;
    page++;
  }
  return emails;
}

async function createAuthUser(email) {
  const r = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: TEMP_PASSWORD, email_confirm: true }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j;
}

const existing = await listAuthEmails();
const missing = appUsers.filter((u) => !existing.has(String(u.email).toLowerCase()));

console.log(`موظفين في public.users: ${appUsers.length}`);
console.log(`موجودين بالفعل في Auth: ${existing.size}`);
console.log(`ناقصين وهيتم إنشاؤهم: ${missing.length}\n`);

const created = [];
for (const u of missing) {
  await createAuthUser(u.email);
  created.push(u);
  console.log(`أنشئ: ${u.name} <${u.email}>`);
}

console.log('\n=== كلمة المرور المؤقتة لكل الحسابات الجديدة ===');
console.log(TEMP_PASSWORD);
console.log('\nلازم كل واحد يغيّر كلمة المرور بعد أول دخول.');
