#!/usr/bin/env node
/**
 * يطبّق كل سكربتات إعداد قاعدة البيانات بالترتيب الصحيح بأمر واحد.
 *
 * السبب: كانت ملفات supabase/sql تُشغّل يدويًا واحدًا واحدًا في لوحة Supabase،
 * فكان يُنسى بعضها بعد الترحيل لمشروع جديد → «أعمدة ناقصة» (حدث مرتين).
 * كل الملفات آمنة لإعادة التشغيل (IF NOT EXISTS / DROP POLICY IF EXISTS)،
 * فتشغيل هذا السكربت بعد أي ترحيل يضمن اكتمال السكيمة والسياسات.
 *
 * الاستخدام:
 *   DATABASE_URL="postgres://..." node scripts/apply-all-sql.mjs
 *   (أو ضع DATABASE_URL في server-api/.env)
 *
 * رابط الاتصال المباشر: Supabase → Settings → Database → Connection string (URI).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sqlDir = join(root, 'supabase', 'sql');

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  if (process.env.SUPABASE_DB_URL?.trim()) return process.env.SUPABASE_DB_URL.trim();
  const envPath = join(root, 'server-api', '.env');
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.+)$/m);
    if (m) {
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return '';
}

/**
 * الترتيب مهم: الأعمدة والجداول أولاً، ثم السياسات (RLS)، ثم Realtime.
 * يُستثنى: enable_leads_realtime.sql (استبدله enable_workspace_realtime.sql)
 * و cleanup_workspace_bloated_branding.sql (تنظيف لمرة واحدة — شغّله يدويًا عند الحاجة).
 */
const ORDER = [
  // 1) الأساس: أعمدة/صفوف افتراضية + تفعيل RLS
  'SUPABASE_SETUP_COPYPASTE.sql',
  // 2) أعمدة ناقصة بعد الترحيل
  'fix_missing_columns.sql',
  'add_lead_last_call.sql',
  // 3) أعمدة إضافية للميزات
  'add_expense_submitted_by_columns.sql',
  'add_monthly_target_commission.sql',
  'add_price_quote_company_margin.sql',
  'add_price_quote_production_fields.sql',
  'add_price_quote_line_items.sql',
  'fix_price_quotes_line_items.sql',
  'add_team_leader.sql',
  // 4) نظام الشغلانات (المشاريع)
  'add_projects_system.sql',
  'add_project_fields.sql',
  'add_project_updates.sql',
  'add_deduction_fields.sql',
  // 5) إصلاحات أعمدة الحجوزات
  'fix_bookings_updated_at.sql',
  // 6) سياسات RLS حسب الدور
  'role_based_rls_policies.sql',
  'add_team_leader_rls.sql',
  'fix_workspace_state_rls_accountant.sql',
  // 7) التخزين + Realtime
  'workspace_assets_storage.sql',
  'add_avatar_storage.sql',
  'enable_workspace_realtime.sql',
  // 8) خطوات ما بعد الترحيل
  'post_migrate_setup.sql',
];

const url = loadDatabaseUrl();
if (!url || /USER:PASSWORD|xxxx/i.test(url)) {
  console.error('❌ عيّن DATABASE_URL (رابط Postgres المباشر من Supabase → Settings → Database).');
  process.exit(1);
}

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  console.error('❌ ثبّت الحزمة: npm install pg --save-dev');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
let applied = 0;
let failed = 0;

try {
  await client.connect();
  console.log('🔌 متصل بقاعدة البيانات\n');
  for (const name of ORDER) {
    const path = join(sqlDir, name);
    if (!existsSync(path)) {
      console.warn(`⚠️  مفقود (تخطّي): ${name}`);
      continue;
    }
    const sql = readFileSync(path, 'utf8');
    process.stdout.write(`⏳ ${name} … `);
    try {
      await client.query(sql);
      applied += 1;
      console.log('✅');
    } catch (e) {
      failed += 1;
      console.log('❌');
      console.error(`   ${e?.message || e}`);
    }
  }
  console.log(`\n📊 تم: ${applied} نجح، ${failed} فشل من ${ORDER.length} ملف.`);
  if (failed > 0) {
    console.error('⚠️  راجع الأخطاء أعلاه — الملفات آمنة لإعادة التشغيل، صحّح ثم أعد التشغيل.');
    process.exit(1);
  }
  console.log('✅ اكتملت السكيمة والسياسات بالكامل.');
} catch (e) {
  console.error('❌ فشل الاتصال:', e?.message || e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
