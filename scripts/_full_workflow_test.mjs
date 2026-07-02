import { config } from 'dotenv';
config({ path: '.env.migrate' });

const URL = process.env.NEW_SUPABASE_URL;
const ANON = process.env.NEW_SUPABASE_ANON_KEY;

const pass = (msg) => console.log('  ✅', msg);
const fail = (msg) => console.log('  ❌', msg);

async function login(email, pwd) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pwd }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`فشل دخول ${email}: ${j.error_description || j.msg}`);
  return j.access_token;
}

async function q(token, table, params = '') {
  const r = await fetch(`${URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, Prefer: 'count=exact' },
  });
  const data = await r.json();
  const count = r.headers.get('content-range')?.split('/')[1];
  return { ok: r.status < 300 || r.status === 206, status: r.status, data, count: count ? parseInt(count) : (Array.isArray(data) ? data.length : 0) };
}

async function update(token, table, filter, body) {
  const r = await fetch(`${URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH', headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  return { ok: r.status === 200 || r.status === 204, status: r.status };
}

async function insert(token, table, body) {
  const r = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return { ok: r.status === 201, status: r.status, data };
}

// ── مالك ──────────────────────────────────────────────────
console.log('\n══════ مالك (khaled) ══════');
try {
  const tok = await login('admin@untold.com', 'UntoldAccess2026!');
  pass('تسجيل الدخول');

  const leads = await q(tok, 'leads', 'select=id,assigned_to_id&limit=5');
  leads.ok ? pass(`يشوف كل الليدز (${leads.count} ليد)`) : fail('مش قادر يشوف الليدز');

  const users = await q(tok, 'users', 'select=id,name,role&limit=20');
  users.ok ? pass(`يشوف كل الموظفين (${users.count} موظف)`) : fail('مش قادر يشوف الموظفين');

  // اختبار توزيع ليد على مندوب
  const reps = users.data?.filter(u => u.role === 'مندوب');
  const unassigned = await q(tok, 'leads', `select=id&assigned_to_id=is.null&limit=1`);
  if (unassigned.data?.[0] && reps?.[0]) {
    const assign = await update(tok, 'leads', `id=eq.${unassigned.data[0].id}`, { assigned_to_id: reps[0].id });
    assign.ok ? pass(`توزيع ليد على مندوب: تم تعيينه لـ ${reps[0].name || reps[0].id}`) : fail(`توزيع ليد فشل (${assign.status})`);
  }

  const inv = await q(tok, 'invoices', 'select=id,amount,status&limit=5');
  inv.ok ? pass(`يشوف الفواتير (${inv.count})`) : fail('فواتير ❌');

  const exp = await q(tok, 'expenses', 'select=id,amount&limit=5');
  exp.ok ? pass(`يشوف المصروفات (${exp.count})`) : fail('مصروفات ❌');

  const ws = await q(tok, 'workspace_state', 'select=id,doc_json');
  ws.ok ? pass('يشوف workspace_state') : fail('workspace ❌');

  const pq = await q(tok, 'price_quotes', 'select=id,status,line_items_json&limit=5');
  pq.ok ? pass(`يشوف عروض الأسعار (${pq.count})`) : fail('عروض أسعار ❌');

} catch(e) { fail(e.message); }

// ── مدير مبيعات ───────────────────────────────────────────
console.log('\n══════ مدير مبيعات (amin) ══════');
try {
  const tok = await login('amin@globaluntoldstory.com', 'Untold@2026!');
  pass('تسجيل الدخول');

  const leads = await q(tok, 'leads', 'select=id,assigned_to_id,status&limit=10');
  leads.ok ? pass(`يشوف كل الليدز (${leads.count})`) : fail('ليدز ❌');

  const users = await q(tok, 'users', 'select=id,name,role');
  users.ok ? pass(`يشوف الموظفين (${users.count})`) : fail('موظفين ❌');

  // توزيع ليد جديد على مندوب
  const reps = users.data?.filter(u => u.role === 'مندوب');
  const anyLead = await q(tok, 'leads', 'select=id&limit=1');
  if (anyLead.data?.[0] && reps?.[0]) {
    const assign = await update(tok, 'leads', `id=eq.${anyLead.data[0].id}`, { assigned_to_id: reps[0].id });
    assign.ok ? pass(`توزيع ليد على مندوب ✅`) : fail(`توزيع فشل (${assign.status})`);
  }

  const pq = await q(tok, 'price_quotes', 'select=id,status&limit=5');
  pq.ok ? pass(`يشوف عروض الأسعار (${pq.count})`) : fail('عروض ❌');

} catch(e) { fail(e.message); }

// ── مندوب ──────────────────────────────────────────────────
console.log('\n══════ مندوب (mohamed_amr) ══════');
try {
  const tok = await login('mohamed_amr@globaluntoldstory.com', 'Untold@2026!');
  pass('تسجيل الدخول');

  const myLeads = await q(tok, 'leads', 'select=id,assigned_to_id,status&limit=10');
  myLeads.ok ? pass(`يشوف ليدزه بس (${myLeads.count} ليد مخصص له)`) : fail('ليدز ❌');

  // محاولة يشوف ليدز حد تاني — المفروض يشوف 0
  const allLeads = await q(tok, 'leads', 'select=id&assigned_to_id=is.null&limit=5');
  allLeads.count === 0 ? pass('لا يشوف ليدز غير مخصصة له (RLS صح)') : fail(`يشوف ${allLeads.count} ليد مش بتاعه!`);

  // تحديث ليد بتاعه (حالة أو ملاحظة)
  if (myLeads.data?.[0]) {
    const upd = await update(tok, 'leads', `id=eq.${myLeads.data[0].id}`, { sla_status: 'مستقر' });
    upd.ok ? pass('يقدر يحدّث ليد مخصص له') : fail(`تحديث ليد فشل (${upd.status})`);
  }

  const self = await q(tok, 'users', 'select=id,name,role&limit=1');
  self.ok ? pass('يشوف بياناته الشخصية') : fail('بيانات شخصية ❌');

} catch(e) { fail(e.message); }

// ── محاسب ──────────────────────────────────────────────────
console.log('\n══════ محاسب (abdelrahman) ══════');
try {
  const tok = await login('abdelrahmanelhelaly@globaluntoldstory.com', 'Untold@2026!');
  pass('تسجيل الدخول');

  const inv = await q(tok, 'invoices', 'select=id,amount,status,record_origin&limit=10');
  inv.ok ? pass(`يشوف الفواتير (${inv.count})`) : fail('فواتير ❌');

  const exp = await q(tok, 'expenses', 'select=id,amount,category&limit=10');
  exp.ok ? pass(`يشوف المصروفات (${exp.count})`) : fail('مصروفات ❌');

  const pq = await q(tok, 'price_quotes', 'select=id,status,total_amount&limit=10');
  pq.ok ? pass(`يشوف عروض الأسعار (${pq.count})`) : fail('عروض ❌');

  const policy = await q(tok, 'accounting_policy', 'select=id,policy_notes');
  policy.ok ? pass('يشوف سياسة المحاسبة') : fail('سياسة محاسبة ❌');

  const mj = await q(tok, 'manual_journal_entries', 'select=id,amount,type&limit=5');
  mj.ok ? pass(`يشوف القيود اليدوية (${mj.count})`) : fail('قيود ❌');

  // المحاسب مش المفروض يعدّل ليدز
  const leadsWrite = await update(tok, 'leads', 'id=eq.fake', { status: 'جديد' });
  leadsWrite.ok ? fail('يقدر يعدل ليدز! (خطأ في RLS)') : pass('لا يقدر يعدل ليدز (RLS صح)');

} catch(e) { fail(e.message); }

// ── مدير إنتاج ─────────────────────────────────────────────
console.log('\n══════ مدير إنتاج (kamal) ══════');
try {
  const tok = await login('kamalel-menshawe@globaluntoldstory.com', 'Untold@2026!');
  pass('تسجيل الدخول');

  const pq = await q(tok, 'price_quotes', 'select=id,status,production_assigned_id&limit=10');
  pq.ok ? pass(`يشوف عروض الأسعار (${pq.count})`) : fail('عروض ❌');

  const exp = await q(tok, 'expenses', 'select=id,amount&limit=5');
  exp.ok ? pass(`يشوف المصروفات (${exp.count})`) : fail('مصروفات ❌');

  const leads = await q(tok, 'leads', 'select=id&limit=5');
  leads.ok ? pass(`يشوف ليدز عروضه (${leads.count})`) : fail('ليدز ❌');

} catch(e) { fail(e.message); }

console.log('\n══════ انتهى الاختبار ══════\n');
