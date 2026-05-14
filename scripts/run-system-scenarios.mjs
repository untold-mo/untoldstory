/**
 * اختبار دخان حي (اختياري): health، رفض الوصول بدون JWT، ومؤشر بعد تسجيل الدخول.
 *
 * المتغيرات:
 * - API_BASE_URL (افتراضي http://localhost:4000)
 * - SKIP_API_LIVE=1 يتخطى كل هذا ويخرج 0
 * - STRICT_API_LIVE=1 يفشل عند تعذّر الوصول؛ غير ذلك يخرج 0 مع تحذير
 * - E2E_EMAIL / E2E_PASSWORD لتشغيل GET بعد الدخول
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'system-scenarios.json'), 'utf8'));

const BASE = process.env.API_BASE_URL || 'http://localhost:4000'.replace(/\/+$/, '');
const SKIP = process.env.SKIP_API_LIVE === '1';
const STRICT = process.env.STRICT_API_LIVE === '1';
const EMAIL = process.env.E2E_EMAIL;
const PASS = process.env.E2E_PASSWORD;

const protectedPaths = scenarios.automatedSmoke.protectedGetExpect401;
const postLoginProbe = scenarios.automatedSmoke.postLoginProbePaths;

async function http(method, pathname, opts = {}) {
  const url = `${BASE}${pathname}`;
  const r = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });
  let json = {};
  try {
    json = await r.json();
  } catch {
    json = {};
  }
  return { status: r.status, json };
}

async function main() {
  if (SKIP) {
    console.log('[scenarios] SKIP_API_LIVE=1 — تخطي الفحص المباشر للـ API');
    return;
  }

  let reachable = false;
  try {
    const h = await http('GET', '/health');
    const okStates = scenarios.automatedSmoke.publicPathsExpectedJson[0]?.okStatuses || [200];
    reachable = okStates.includes(h.status);
    console.log(`[scenarios] GET /health → ${h.status}`, h.json.ok ? `(db:${h.json.db})` : '');
    if (!reachable && !STRICT) {
      console.warn('[scenarios] health غير بأكواد متوقعة للتشغيل — تخطّي الدخان الحي.');
      return;
    }
    if (!reachable && STRICT) {
      throw new Error('health لم يبحث بالحالة المتوقعة');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[scenarios] تعذّر الاتصال بالـ API على', BASE, '—', msg);
    if (STRICT) process.exit(1);
    return;
  }

  console.log('[scenarios] تأكيد 401 بدون Bearer لمسارات REST…');
  for (const p of protectedPaths) {
    try {
      const { status } = await http('GET', p.replace('GET ', '').trim());
      if (status !== 401)
        console.error(`[scenarios] ❌ المتوقع 401 بدون JWT لـ ${p} لكن ظهر ${status}`);
      else console.log(`[scenarios] OK 401 ${p}`);
    } catch (err) {
      console.error('[scenarios] طلب فشل', p, err);
      if (STRICT) process.exit(1);
    }
  }

  if (!EMAIL || !PASS) {
    console.log('[scenarios] بدون E2E_EMAIL/E2E_PASSWORD — تخطي خطوات ما بعد الدخول.');
    console.log('[scenarios] لمزيد من السيناريوهات اليدوية راجع scripts/system-scenarios.json');
    return;
  }

  console.log('[scenarios] محاولة تسجيل دخول E2E…');
  const login = await http('POST', '/auth/login', { body: { email: EMAIL, password: PASS } });
  if (login.status !== 200 || !login.json?.token) {
    console.error('[scenarios] فشل تسجيل الدخول:', login.status, login.json);
    process.exit(STRICT ? 1 : 0);
  }
  const token = login.json.token;
  const role = login.json.user?.role;
  console.log('[scenarios] مسجل بدور:', role || 'غير محدد');

  for (const line of postLoginProbe) {
    const pathOnly = line.replace(/^GET\s+/, '').trim();
    try {
      const r = await http('GET', pathOnly, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`[scenarios] ${line} → ${r.status}`);
      if (r.status >= 500) console.error('[scenarios] ⚠ خطأ خادم يستحق متابعة');
    } catch (e) {
      console.error('[scenarios]', pathOnly, e);
      if (STRICT) process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
