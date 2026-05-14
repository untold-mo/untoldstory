import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchMonthlyTargetsSb, patchMonthlyTargetSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchMonthlyTargetsApi(): Promise<
  import('@/app/context/DataContext').MonthlyTarget[]
> {
  if (isSupabaseDirectMode()) return fetchMonthlyTargetsSb();
  const r = await fetch(`${getApiBaseUrl()}/api/monthly-targets`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch monthly targets');
  const data = await r.json();
  return Array.isArray(data.targets) ? data.targets : [];
}

export async function patchMonthlyTargetApi(
  repId: string,
  patch: Partial<Omit<import('@/app/context/DataContext').MonthlyTarget, 'repId'>>
): Promise<import('@/app/context/DataContext').MonthlyTarget> {
  if (isSupabaseDirectMode()) return patchMonthlyTargetSb(repId, patch);
  const r = await fetch(`${getApiBaseUrl()}/api/monthly-targets/${encodeURIComponent(repId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch monthly target');
  return data.target as import('@/app/context/DataContext').MonthlyTarget;
}
