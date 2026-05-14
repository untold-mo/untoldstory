import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchAccountingPolicySb, patchAccountingPolicySb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchAccountingPolicyApi(): Promise<
  import('@/app/context/DataContext').AccountingPolicy
> {
  if (isSupabaseDirectMode()) {
    const p = await fetchAccountingPolicySb();
    if (!p) throw new Error('سياسة محاسبة غير متاحة');
    return p;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/accounting-policy`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch accounting policy');
  const data = await r.json();
  return data.policy as import('@/app/context/DataContext').AccountingPolicy;
}

export async function patchAccountingPolicyApi(
  patch: Partial<import('@/app/context/DataContext').AccountingPolicy>
): Promise<import('@/app/context/DataContext').AccountingPolicy> {
  if (isSupabaseDirectMode()) return patchAccountingPolicySb(patch);
  const r = await fetch(`${getApiBaseUrl()}/api/accounting-policy`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch accounting policy');
  return data.policy as import('@/app/context/DataContext').AccountingPolicy;
}
