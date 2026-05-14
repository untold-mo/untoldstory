import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { getSupabase } from '@/lib/supabase/client';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** PATCH /auth/me/password — حساب المالك فقط؛ يتحقق من كلمة المرور الحالية ثم التحديث. */
export async function patchMyPasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  if (isSupabaseDirectMode()) {
    const sb = getSupabase();
    const { data: userData, error: userErr } = await sb.auth.getUser();
    const email = userData.user?.email?.trim().toLowerCase();
    if (userErr || !email) throw new Error('لا توجد جلسة نشطة');
    const { error: signErr } = await sb.auth.signInWithPassword({
      email,
      password: payload.currentPassword,
    });
    if (signErr) throw new Error('كلمة المرور الحالية غير صحيحة');
    const { error: upErr } = await sb.auth.updateUser({ password: payload.newPassword });
    if (upErr) throw new Error(upErr.message || 'تعذر تحديث كلمة المرور');
    return;
  }
  const r = await fetch(`${getApiBaseUrl()}/auth/me/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'تعذر تحديث كلمة المرور');
  }
}
