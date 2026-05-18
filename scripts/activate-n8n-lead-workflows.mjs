#!/usr/bin/env node
/** تفعيل workflows استيراد الليدز عبر n8n API */
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

const hdr = { 'X-N8N-API-KEY': apiKey };

const res = await fetch(`${base}/api/v1/workflows?limit=100`, { headers: hdr });
const list = (await res.json()).data || [];
const leads = list.filter(
  (w) => /supabase leads|meta lead/i.test(w.name || '') && !/notify|إشعار/i.test(w.name || ''),
);

for (const w of leads) {
  if (w.active) {
    console.log(`✓ مفعّل مسبقاً: ${w.name}`);
    continue;
  }
  const act = await fetch(`${base}/api/v1/workflows/${w.id}/activate`, { method: 'POST', headers: hdr });
  if (act.ok) console.log(`✅ تم التفعيل: ${w.name}`);
  else {
    const err = await act.json().catch(() => ({}));
    console.log(`❌ ${w.name}: HTTP ${act.status}`, err.message || '');
  }
}
