#!/usr/bin/env node
/**
 * يربط credential Supabase الموجود في n8n بعقد Insert في workflows الليدز.
 * الاستخدام: node scripts/patch-n8n-supabase-cred.mjs [--dry-run]
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
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
  console.error('❌ N8N_API_KEY مطلوب في .env.local');
  process.exit(1);
}

const hdr = { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: hdr,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { res, json };
}

const { res: credRes, json: credJson } = await api('GET', '/credentials?limit=50');
const creds = credJson?.data || (Array.isArray(credJson) ? credJson : []);
const sbCred = creds.find((c) => c.type === 'supabaseApi' || /supabase/i.test(c.type || ''));
if (!sbCred?.id) {
  console.error('❌ لم يُعثر على Supabase credential في n8n');
  process.exit(1);
}
console.log(`Supabase credential: ${sbCred.name} (${sbCred.id})`);

const { res: wfRes, json: wfJson } = await api('GET', '/workflows?limit=100');
const list = wfJson?.data || (Array.isArray(wfJson) ? wfJson : []);
const leadWfs = list.filter((w) => /supabase leads|meta lead|gmail inbox|google sheets/i.test(w.name || ''));

let patched = 0;
for (const w of leadWfs) {
  const { res, json: wf } = await api('GET', `/workflows/${w.id}`);
  if (!res.ok) {
    console.error(`❌ ${w.name}: ${res.status}`);
    continue;
  }

  let changed = false;
  const nodes = (wf.nodes || []).map((n) => {
    if (!/insert into supabase/i.test(n.name || '')) return n;
    const cur = n.credentials?.supabaseApi;
    if (cur?.id && cur.id !== 'CONFIGURE_IN_N8N' && cur.id === sbCred.id) {
      console.log(`✓ ${w.name} — مربوط مسبقاً`);
      return n;
    }
    changed = true;
    return {
      ...n,
      credentials: {
        supabaseApi: { id: sbCred.id, name: sbCred.name },
      },
    };
  });

  if (!changed) continue;

  if (dryRun) {
    console.log(`[dry-run] سيُحدَّث: ${w.name}`);
    patched += 1;
    continue;
  }

  const body = {
    name: wf.name,
    nodes,
    connections: wf.connections,
    settings: { executionOrder: wf.settings?.executionOrder || 'v1' },
  };

  const { res: putRes, json: putJson } = await api('PUT', `/workflows/${w.id}`, body);
  if (!putRes.ok) {
    console.error(`❌ فشل تحديث ${w.name}:`, putRes.status, putJson?.message || putJson);
    continue;
  }
  console.log(`✅ تم ربط Supabase على: ${w.name}`);
  patched += 1;
}

if (patched === 0) console.log('لا workflows تحتاج تحديث.');
else if (!dryRun) console.log(`\nتم تحديث ${patched} workflow(s). شغّل: npm run audit:n8n`);
