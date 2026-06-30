#!/usr/bin/env node
/** تأكيد إيميلات كل المستخدمين المرحّلين في مشروع Supabase الجديد */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const rel of ['.env.migrate', '.env.local']) {
  if (existsSync(join(root, rel))) config({ path: join(root, rel) });
}

const URL = String(process.env.NEW_SUPABASE_URL).replace(/\/+$/, '');
const SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('NEW_SUPABASE_SERVICE_ROLE_KEY مفقود في .env.migrate');
  process.exit(1);
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  for (;;) {
    const r = await fetch(`${URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    const batch = j.users || [];
    users.push(...batch);
    if (batch.length < 200) break;
    page++;
  }
  return users;
}

async function confirmUser(id) {
  const r = await fetch(`${URL}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_confirm: true }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j;
}

const users = await listAllUsers();
console.log(`عدد المستخدمين الموجودين: ${users.length}`);

let confirmed = 0;
let skipped = 0;
for (const u of users) {
  if (u.email_confirmed_at) {
    skipped++;
    continue;
  }
  await confirmUser(u.id);
  confirmed++;
  console.log(`تم تأكيد: ${u.email}`);
}

console.log(`\nتم تأكيد ${confirmed} حساب، ${skipped} كانوا مؤكدين بالفعل.`);
