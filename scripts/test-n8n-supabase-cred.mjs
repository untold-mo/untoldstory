#!/usr/bin/env node
/** اختبار credential Supabase عبر تشغيل Meta workflow يدوياً */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(relPath) {
  const p = join(root, relPath);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

const local = loadEnvFile('.env.local');
const base = (process.env.N8N_BASE_URL || local.N8N_BASE_URL || 'https://n8n.srv1255426.hstgr.cloud').replace(
  /\/+$/,
  '',
);
const apiKey = process.env.N8N_API_KEY || local.N8N_API_KEY || '';
if (!apiKey) {
  console.error('❌ N8N_API_KEY مطلوب');
  process.exit(1);
}

const hdr = { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' };

const wfRes = await fetch(`${base}/api/v1/workflows?limit=50`, { headers: hdr });
const list = (await wfRes.json()).data || [];
const meta = list.find((w) => /meta lead/i.test(w.name || ''));
if (!meta) {
  console.error('❌ workflow Meta غير موجود');
  process.exit(1);
}

console.log(`تشغيل تجريبي: ${meta.name} (${meta.id})…`);

const runRes = await fetch(`${base}/api/v1/workflows/${meta.id}/run`, {
  method: 'POST',
  headers: hdr,
  body: JSON.stringify({}),
});

if (!runRes.ok) {
  const alt = await fetch(`${base}/api/v1/workflows/${meta.id}/execute`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({}),
  });
  if (!alt.ok) {
    const err = await alt.json().catch(() => ({}));
    console.log(`⚠️  لا يمكن التشغيل عبر API (${runRes.status}/${alt.status})`);
    console.log('   جرّب يدوياً في n8n: Execute workflow → Manual');
    console.log('   ', err.message || '');
    process.exit(0);
  }
}

const runJson = await (runRes.ok ? runRes : fetch(`${base}/api/v1/workflows/${meta.id}/execute`, { method: 'POST', headers: hdr })).json();
const execId = runJson.executionId || runJson.data?.executionId || runJson.id;
console.log(`execution: ${execId || '(انظر Executions في n8n)'}`);

await new Promise((r) => setTimeout(r, 4000));

const exRes = await fetch(`${base}/api/v1/executions?workflowId=${meta.id}&limit=1`, { headers: hdr });
const exJson = await exRes.json();
const last = (exJson.data || [])[0];
if (!last) {
  console.log('⚠️  لا يوجد تنفيذ بعد — افتح n8n → Executions');
  process.exit(0);
}

console.log(`الحالة: ${last.status} — ${last.startedAt || last.createdAt}`);
if (last.status === 'success') {
  console.log('✅ التنفيذ نجح — Supabase credential على الأرجح صحيح (راجع inserted في المخرجات)');
} else if (last.status === 'error') {
  console.log('❌ التنفيذ فشل — افتح التفاصيل في n8n (قد يكون META_ACCESS_TOKEN وليس Supabase)');
} else {
  console.log('⏳ التنفيذ لا يزال قيد التشغيل أو لم يكتمل بعد');
}
