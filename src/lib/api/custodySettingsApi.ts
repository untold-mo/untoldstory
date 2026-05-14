import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchCustodySettingsSb, patchCustodySettingsSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchCustodySettingsApi(): Promise<
  import('@/app/context/DataContext').CustodyAccountByCategory
> {
  if (isSupabaseDirectMode()) {
    const m = await fetchCustodySettingsSb();
    return m as import('@/app/context/DataContext').CustodyAccountByCategory;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/custody-settings`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch custody settings');
  const data = await r.json();
  return (data.custodyAccountByCategory || {}) as import('@/app/context/DataContext').CustodyAccountByCategory;
}

export async function patchCustodySettingsApi(
  custodyAccountByCategory: import('@/app/context/DataContext').CustodyAccountByCategory
): Promise<import('@/app/context/DataContext').CustodyAccountByCategory> {
  if (isSupabaseDirectMode()) {
    const m = await patchCustodySettingsSb({ custodyAccountByCategory });
    return m as import('@/app/context/DataContext').CustodyAccountByCategory;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/custody-settings`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ custodyAccountByCategory }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch custody settings');
  return (data.custodyAccountByCategory || {}) as import('@/app/context/DataContext').CustodyAccountByCategory;
}
