/** مشاريع Supabase القديمة/المُوقفة — لا تُستخدم في الإنتاج */
export const BLOCKED_SUPABASE_PROJECT_REFS = new Set(['hfbnysvmrqglccxswqfm', 'axkoidcmiqutdtcadfca']);

let quotaCooldownUntil = 0;
let quotaWarned = false;

export function getSupabaseProjectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function assertAllowedSupabaseProject(url: string): void {
  const ref = getSupabaseProjectRefFromUrl(url);
  if (ref && BLOCKED_SUPABASE_PROJECT_REFS.has(ref)) {
    throw new Error(
      'مشروع Supabase القديم موقوف (تجاوز egress). حدّث VITE_SUPABASE_URL في Vercel إلى المشروع الجديد.',
    );
  }
}

export function isSupabaseQuotaError(status: number, message?: string): boolean {
  const msg = String(message || '').toLowerCase();
  if (status === 402 || status === 546) return true;
  return (
    msg.includes('exceed_egress') ||
    msg.includes('egress_quota') ||
    msg.includes('payment required') ||
    msg.includes('quota')
  );
}

/** بعد خطأ حصة — أوقف طلبات متكررة لـ 30 دقيقة */
export function markSupabaseQuotaExceeded(): void {
  quotaCooldownUntil = Date.now() + 60 * 60 * 1000;
}

export function isSupabaseQuotaCooldown(): boolean {
  return Date.now() < quotaCooldownUntil;
}

export function shouldWarnSupabaseQuota(): boolean {
  if (quotaWarned) return false;
  quotaWarned = true;
  return true;
}

const QUOTA_COOLDOWN_MSG =
  'Supabase: تم تجاوز حد النقل — تم إيقاف الطلبات مؤقتاً لتجنب حظر الخدمة.';

/** قبل جلب ثقيل (آلاف الصفوف) — يمنع تكرار الطلبات أثناء cooldown */
export function assertSupabaseFetchAllowed(): void {
  if (isSupabaseQuotaCooldown()) {
    throw new Error(QUOTA_COOLDOWN_MSG);
  }
}

export function createGuardedFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    if (isSupabaseQuotaCooldown()) {
      throw new Error(QUOTA_COOLDOWN_MSG);
    }
    const res = await baseFetch(input, init);
    if (isSupabaseQuotaError(res.status)) {
      markSupabaseQuotaExceeded();
    }
    return res;
  };
}
