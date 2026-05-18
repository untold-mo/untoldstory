#!/usr/bin/env node
/** فحص تفصيلي عبر n8n API — workflows، credentials، آخر تنفيذات */
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
  console.error('❌ N8N_API_KEY غير معيّن في .env.local');
  process.exit(1);
}

const hdr = { 'X-N8N-API-KEY': apiKey };

async function apiGet(path) {
  const res = await fetch(`${base}/api/v1${path}`, { headers: hdr });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { res, json };
}

const { res: wfRes, json: wfJson } = await apiGet('/workflows?limit=100');
if (!wfRes.ok) {
  console.error('❌ workflows API', wfRes.status, wfJson?.message || wfJson);
  process.exit(1);
}

const list = Array.isArray(wfJson) ? wfJson : wfJson.data || [];
console.log(`\n🔍 n8n API audit — ${base}\n`);
console.log(`Workflows: ${list.length}\n`);

let issues = 0;
const flag = (msg) => {
  console.log(`  ❌ ${msg}`);
  issues += 1;
};
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);

for (const w of list) {
  const { res, json: wf } = await apiGet(`/workflows/${w.id}`);
  if (!res.ok) {
    flag(`${w.name}: لا يمكن قراءة التفاصيل (${res.status})`);
    continue;
  }

  const nodes = wf.nodes || [];
  const insertNodes = nodes.filter((n) => /insert into supabase/i.test(n.name || ''));
  const withCreds = nodes.filter((n) => n.credentials && Object.keys(n.credentials).length > 0);

  console.log(`── ${wf.name} ──`);
  console.log(`   id: ${wf.id} | active: ${wf.active ? 'نعم' : 'لا'}`);

  if (insertNodes.length === 0) {
    if (/notify|إشعار|client/i.test(wf.name || '')) ok('workflow webhook (لا يحتاج Supabase Insert)');
    else warn('لا توجد عقدة Insert into Supabase');
  } else {
    for (const n of insertNodes) {
      const sb = n.credentials?.supabaseApi;
      if (!sb || sb.id === 'CONFIGURE_IN_N8N') {
        flag(`عقدة «${n.name}»: Supabase credential غير مربوط — اختر Credential في n8n`);
      } else {
        ok(`«${n.name}» → Supabase: ${sb.name || sb.id}`);
      }
    }
  }

  if (withCreds.length) {
    const parts = withCreds.map((n) => `${n.name} [${Object.keys(n.credentials).join(', ')}]`);
    console.log(`   credentials: ${parts.join(' | ')}`);
  }

  const { res: exRes, json: exJson } = await apiGet(`/executions?workflowId=${w.id}&limit=5`);
  const execs = exJson?.data || (Array.isArray(exJson) ? exJson : []);
  if (execs.length === 0) {
    warn('لا يوجد تنفيذ سابق مسجّل — جرّب Manual مرة');
  } else {
    const last = execs[0];
    const st = last.status || last.finished ? 'finished' : 'unknown';
    console.log(`   آخر تنفيذ: ${st} — ${last.startedAt || last.createdAt || '—'}`);
    if (st === 'error' || last.status === 'error') {
      flag('آخر تنفيذ فشل — افتح Executions في n8n لقراءة الخطأ');
    } else if (st === 'success' || last.status === 'success') {
      ok('آخر تنفيذ ناجح');
    }
  }
  console.log('');
}

// credentials list (if API supports)
const { res: credRes, json: credJson } = await apiGet('/credentials?limit=50');
if (credRes.ok) {
  const creds = credJson?.data || (Array.isArray(credJson) ? credJson : []);
  const types = [...new Set(creds.map((c) => c.type))];
  console.log('── Credentials في n8n ──');
  console.log(`   العدد: ${creds.length} | الأنواع: ${types.join(', ') || '—'}`);
  const hasSb = creds.some((c) => /supabase/i.test(c.type || ''));
  if (hasSb) ok('يوجد Supabase credential');
  else warn('لم يُعثر على Supabase credential عبر API — تأكد من إنشائه يدوياً');
  for (const c of creds) {
    console.log(`   • ${c.name} (${c.type})`);
  }
} else {
  warn(`credentials API → HTTP ${credRes.status} (قد يكون مقيداً على خطتك)`);
}

console.log('── توصيات ──');
console.log('   • Supabase: Credentials على عقدة Insert (بدون Environment على Hostinger)');
console.log('   • فعّل workflows الليدز بعد ربط Gmail/Sheets/Meta');
console.log('   • defaultAssignedToId في workflow static data: u_5a2729fab2ec4aae (مدير مبيعات)');

if (issues > 0) {
  console.log(`\n❌ ${issues} ملاحظة/مشكلة تحتاج إجراء في واجهة n8n\n`);
  process.exit(1);
}
console.log('\n✅ الفحص عبر API مكتمل\n');
