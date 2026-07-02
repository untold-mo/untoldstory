import { config } from 'dotenv';
config({ path: '.env.migrate' });
const URL = process.env.NEW_SUPABASE_URL, ANON = process.env.NEW_SUPABASE_ANON_KEY;

async function login(email, pwd) {
  const r = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pwd }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(email + ': ' + (j.error_description || j.msg));
  return j.access_token;
}

const tok = await login('admin@untold.com', 'UntoldAccess2026!');

// كل الجداول اللي التطبيق بيستخدمها
const tables = [
  'users', 'leads', 'invoices', 'expenses', 'price_quotes', 'manual_customers',
  'manual_journal_entries', 'monthly_targets', 'workspace_state', 'accounting_policy',
  'attendance_records', 'audit_events', 'projects', 'project_tasks', 'employee_deductions',
  'shoot_bookings', 'closed_months', 'chart_of_accounts',
];

for (const t of tables) {
  const r = await fetch(`${URL}/rest/v1/${t}?select=*&limit=1`, {
    headers: { apikey: ANON, Authorization: 'Bearer ' + tok, Prefer: 'count=exact' },
  });
  const count = r.headers.get('content-range')?.split('/')[1] ?? '?';
  const body = await r.json().catch(() => null);
  const ok = r.status === 200 || r.status === 206;
  console.log(ok ? '✅' : '❌', t.padEnd(24), ok ? `(${count} صف)` : `HTTP ${r.status}: ${body?.message || ''}`);
}

// اختبار كتابة: إضافة هدف شهري وحذفه
const mt = await fetch(`${URL}/rest/v1/monthly_targets`, {
  method: 'POST',
  headers: { apikey: ANON, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ id: 'test_' + Date.now(), rep_id: 'u_35f1ed05435a405b', month_key: '2099-01', target_revenue: 1000 }),
});
const mtBody = await mt.json().catch(() => null);
if (mt.status === 201) {
  console.log('✅ كتابة هدف شهري');
  await fetch(`${URL}/rest/v1/monthly_targets?id=eq.${mtBody[0].id}`, { method: 'DELETE', headers: { apikey: ANON, Authorization: 'Bearer ' + tok } });
  console.log('✅ حذف الهدف التجريبي');
} else {
  console.log('❌ كتابة هدف شهري:', mt.status, JSON.stringify(mtBody).slice(0, 200));
}
