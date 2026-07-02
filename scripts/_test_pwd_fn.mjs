import { config } from 'dotenv';
config({ path: 'D:/تنفيذ الطلب/.env.migrate' });
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
async function callFn(tok, payload) {
  const r = await fetch(URL + '/functions/v1/set-employee-password', {
    method: 'POST',
    headers: { apikey: ANON, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: r.status, body: await r.text() };
}

const tok = await login('admin@untold.com', 'UntoldAccess2026!');
const usersRes = await fetch(URL + '/rest/v1/users?email=eq.mohamed_amr@globaluntoldstory.com&select=id,email,role', {
  headers: { apikey: ANON, Authorization: 'Bearer ' + tok },
});
const users = await usersRes.json();
console.log('استعلام hatim:', usersRes.status, JSON.stringify(users));
const hatim = users[0];
if (!hatim) process.exit(1);

const r1 = await callFn(tok, { targetUserId: hatim.id, email: hatim.email, password: 'TestPwd@9999' });
console.log('1) مالك يغير باسورد مندوب:', r1.status, r1.status === 200 ? '✅' : r1.body);

try { await login('mohamed_amr@globaluntoldstory.com', 'TestPwd@9999'); console.log('2) دخول بالباسورد الجديد: ✅'); }
catch (e) { console.log('2) ❌', e.message); }

const r2 = await callFn(tok, { targetUserId: hatim.id, email: hatim.email, password: 'Untold@2026!' });
console.log('3) إرجاع الباسورد الأصلي:', r2.status, r2.status === 200 ? '✅' : r2.body);
try { await login('mohamed_amr@globaluntoldstory.com', 'Untold@2026!'); console.log('4) دخول بالباسورد الأصلي: ✅'); }
catch (e) { console.log('4) ❌', e.message); }

const tokMgr = await login('amin@globaluntoldstory.com', 'Untold@2026!');
const r3 = await callFn(tokMgr, { targetUserId: hatim.id, email: hatim.email, password: 'Untold@2026!' });
console.log('5) مدير مبيعات يغير باسورد مندوب:', r3.status, r3.status === 200 ? '✅' : r3.body);

const acc = await fetch(URL + '/rest/v1/users?role=eq.' + encodeURIComponent('محاسب') + '&select=id,email&limit=1', {
  headers: { apikey: ANON, Authorization: 'Bearer ' + tokMgr },
}).then(r => r.json());
if (acc[0]) {
  const r4 = await callFn(tokMgr, { targetUserId: acc[0].id, email: acc[0].email, password: 'Hack@12345' });
  console.log('6) مدير مبيعات يحاول باسورد محاسب:', r4.status, r4.status === 403 ? 'مرفوض ✅' : '⚠️ ' + r4.body);
} else console.log('6) مدير المبيعات لا يرى المحاسب في users (RLS) — سيُختبر عبر المالك');

const tokRep = await login('mohamed_amr@globaluntoldstory.com', 'Untold@2026!');
const r5 = await callFn(tokRep, { targetUserId: hatim.id, email: hatim.email, password: 'Hack@12345' });
console.log('7) مندوب يحاول يغير باسورد:', r5.status, r5.status === 403 ? 'مرفوض ✅' : '⚠️ ' + r5.body);
