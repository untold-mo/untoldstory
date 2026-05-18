#!/usr/bin/env node
/**
 * تحقق من جاهزية Supabase لـ workflows الليدز + وصول n8n.
 * الاستخدام: node scripts/verify-n8n-supabase.mjs
 *
 * يقرأ: .env.local (VITE_SUPABASE_*), api/.env (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * اختياري: N8N_BASE_URL, N8N_API_KEY
 */
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
const apiEnv = loadEnvFile('api/.env');

const supabaseUrl = (process.env.VITE_SUPABASE_URL || local.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_ANON_KEY || '';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || apiEnv.SUPABASE_SERVICE_ROLE_KEY || local.SUPABASE_SERVICE_ROLE_KEY || '';
const dbUrl = process.env.DATABASE_URL || apiEnv.DATABASE_URL || '';
const n8nBase = (process.env.N8N_BASE_URL || local.N8N_BASE_URL || 'https://n8n.srv1255426.hstgr.cloud').replace(
  /\/+$/,
  '',
);
const n8nApiKey = process.env.N8N_API_KEY || local.N8N_API_KEY || '';
const clientNotifyUrl =
  process.env.VITE_CLIENT_NOTIFY_WEBHOOK_URL || local.VITE_CLIENT_NOTIFY_WEBHOOK_URL || `${n8nBase}/webhook/client-notify`;

const REQUIRED_LEAD_COLS = [
  'id',
  'name',
  'company',
  'phone',
  'email',
  'status',
  'assigned_to_id',
  'budget',
  'company_size',
  'source',
  'category',
  'score',
  'sla_status',
  'timeline_json',
  'created_at',
  'updated_at',
];

const N8N_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEFAULT_ASSIGNED_TO_ID',
  'META_ACCESS_TOKEN',
  'GMAIL_SEARCH_QUERY',
  'GOOGLE_SHEETS_SPREADSHEET_ID',
];

let failed = 0;

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function warn(msg) {
  console.log(`⚠️  ${msg}`);
}
function fail(msg) {
  console.log(`❌ ${msg}`);
  failed += 1;
}

async function restGet(path, key) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json };
}

async function checkN8n() {
  console.log('\n── n8n ──');
  try {
    const h = await fetch(`${n8nBase}/healthz`);
    if (h.ok) ok(`n8n يعمل: ${n8nBase} (healthz)`);
    else fail(`n8n healthz → HTTP ${h.status}`);
  } catch (e) {
    fail(`لا يمكن الوصول لـ n8n: ${e.message}`);
  }

  try {
    const wh = await fetch(clientNotifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ping', dryRun: true }),
    });
    if (wh.status === 404) {
      fail(`webhook client-notify غير مفعّل (404) — استورد وفعّل n8n/client-notify.workflow.json`);
    } else if (wh.ok || wh.status === 400 || wh.status === 500) {
      ok(`webhook client-notify يستجيب (HTTP ${wh.status}) — الـ workflow موجود`);
    } else {
      warn(`webhook client-notify → HTTP ${wh.status}`);
    }
  } catch (e) {
    fail(`فشل اختبار webhook: ${e.message}`);
  }

  if (n8nApiKey) {
    try {
      const res = await fetch(`${n8nBase}/api/v1/workflows?limit=50`, {
        headers: { 'X-N8N-API-KEY': n8nApiKey },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        fail(`n8n API → ${res.status} (تحقق من N8N_API_KEY)`);
      } else {
        const list = Array.isArray(data) ? data : data.data || [];
        const names = list.map((w) => w.name).filter(Boolean);
        ok(`n8n API: ${list.length} workflow(s)`);
        for (const want of ['Meta Lead Ads', 'Gmail Inbox', 'Google Sheet', 'Client notify']) {
          const hit = names.some((n) => n.toLowerCase().includes(want.toLowerCase().split(' ')[0]));
          if (hit) ok(`  • workflow مطابق: ${want}`);
          else warn(`  • لم يُعثر على workflow يحتوي "${want}" — قد تحتاج استيراد من مجلد n8n/`);
        }
        const active = list.filter((w) => w.active);
        ok(`${active.length} workflow مفعّل (Active)`);
      }
    } catch (e) {
      fail(`n8n API: ${e.message}`);
    }
  } else {
    warn('N8N_API_KEY غير معيّن — لا يمكن سرد الـ workflows تلقائياً (أضفه في .env.local للتحقق الكامل)');
  }

  console.log('\n  متغيرات يجب تعيينها في n8n (Settings → Variables):');
  for (const v of N8N_ENV_VARS) {
    console.log(`    • ${v}`);
  }
}

async function checkSupabase() {
  console.log('\n── Supabase ──');
  if (!supabaseUrl) {
    fail('VITE_SUPABASE_URL غير معيّن في .env.local');
    return;
  }
  ok(`Supabase URL: ${supabaseUrl}`);

  if (anonKey) {
    const { res } = await restGet('leads?select=id&limit=1', anonKey);
    if (res.ok) ok('قراءة جدول leads بـ anon key (RLS يسمح للمستخدمين المسجّلين)');
    else if (res.status === 401) warn('anon key: 401 — تحقق من VITE_SUPABASE_ANON_KEY');
    else warn(`anon قراءة leads → HTTP ${res.status}`);
  } else {
    warn('VITE_SUPABASE_ANON_KEY غير معيّن');
  }

  if (serviceKey) {
    const { res, json } = await restGet('leads?select=id&limit=1', serviceKey);
    if (res.ok) ok('service_role يقرأ leads (مثل n8n)');
    else fail(`service_role قراءة leads → HTTP ${res.status}: ${JSON.stringify(json)?.slice(0, 120)}`);

    const probeId = `lead_verify_${Date.now()}`;
    const probe = {
      id: probeId,
      name: 'اختبار n8n',
      company: '—',
      phone: `0199${String(Date.now()).slice(-8)}`,
      email: `verify-${Date.now()}@n8n-test.local`,
      status: 'جديد',
      budget: 0,
      company_size: 'صغير',
      source: 'email',
      category: 'إعلانات',
      score: 1,
      sla_status: 'مستقر',
      timeline_json: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const post = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(probe),
    });
    if (post.ok || post.status === 201) {
      ok('service_role يستطيع INSERT في leads (جاهز لـ n8n)');
      await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${probeId}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }).catch(() => {});
    } else {
      const errText = await post.text();
      fail(`INSERT تجريبي فشل HTTP ${post.status}: ${errText.slice(0, 200)}`);
    }
  } else {
    fail('SUPABASE_SERVICE_ROLE_KEY غير موجود في api/.env أو .env.local — n8n لن يستطيع إدراج ليدز');
    warn('انسخ service_role من Supabase → Settings → API → service_role إلى n8n Variables');
  }

  if (dbUrl && !/USER:PASSWORD|xxxx/i.test(dbUrl)) {
    try {
      const mod = await import('pg');
      const client = new mod.default.Client({ connectionString: dbUrl });
      await client.connect();
      const cols = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' ORDER BY ordinal_position`,
      );
      const names = cols.rows.map((r) => r.column_name);
      const missing = REQUIRED_LEAD_COLS.filter((c) => !names.includes(c));
      if (missing.length === 0) ok(`أعمدة جدول leads متوافقة مع workflows (${names.length} عمود)`);
      else fail(`أعمدة ناقصة في leads: ${missing.join(', ')}`);

      const mgr = await client.query(
        `SELECT id, name, role FROM users WHERE role IN ('مدير مبيعات', 'مالك') ORDER BY role LIMIT 5`,
      );
      if (mgr.rows.length > 0) {
        ok('مستخدمون للتعيين (DEFAULT_ASSIGNED_TO_ID):');
        for (const u of mgr.rows) console.log(`    ${u.id} — ${u.name} (${u.role})`);
      } else {
        warn('لا يوجد مدير مبيعات/مالك في جدول users — عيّن DEFAULT_ASSIGNED_TO_ID بعد إنشاء الحساب');
      }
      await client.end();
    } catch (e) {
      fail(`اتصال Postgres: ${e.message}`);
    }
  } else {
    warn('DATABASE_URL غير متاح — تخطي فحص الأعمدة عبر SQL');
  }
}

console.log('🔍 تحقق جاهزية n8n + Supabase لليدز\n');
console.log(`n8n: ${n8nBase}`);
console.log(`Supabase: ${supabaseUrl || '(غير معيّن)'}`);

await checkN8n();
await checkSupabase();

console.log('\n── الخلاصة ──');
if (failed === 0) {
  console.log('✅ الأساسيات جاهزة. تأكد يدوياً في n8n: تفعيل workflows الليدز + META_ACCESS_TOKEN + Gmail/Sheets credentials.');
} else {
  console.log(`❌ ${failed} مشكلة/مشاكل تحتاج إصلاح قبل الاعتماد على الاستيراد التلقائي.`);
  process.exit(1);
}
