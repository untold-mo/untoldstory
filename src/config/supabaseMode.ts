/**
 * وضع «Supabase مباشرة»: الواجهة تستخدم Auth + PostgREST من المتصفح (بدون Express).
 * يتطلّب تشغيل SQL في لوحة Supabase (مجلد supabase/sql) وتفعيل Email في Authentication.
 */
export function isSupabaseDirectMode(): boolean {
  const on = String(import.meta.env.VITE_USE_SUPABASE || '').trim() === '1';
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return on && Boolean(url) && Boolean(key);
}

/** مرجع المشروع من VITE_SUPABASE_URL (مثل abcde من https://abcde.supabase.co) */
export function getSupabaseProjectRef(): string | null {
  try {
    const raw = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
    if (!raw) return null;
    const host = new URL(raw).hostname.toLowerCase();
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** رابط لوحة Supabase → Authentication → Users (إضافة مستخدم دخول) */
export function getSupabaseDashboardAuthUsersUrl(): string | null {
  const ref = getSupabaseProjectRef();
  return ref ? `https://supabase.com/dashboard/project/${ref}/auth/users` : null;
}

/** رابط Table Editor (اختر جدول public ثم users) */
export function getSupabaseDashboardEditorUrl(): string | null {
  const ref = getSupabaseProjectRef();
  return ref ? `https://supabase.com/dashboard/project/${ref}/editor` : null;
}

/** رابط SQL Editor */
export function getSupabaseDashboardSqlUrl(): string | null {
  const ref = getSupabaseProjectRef();
  return ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : null;
}
