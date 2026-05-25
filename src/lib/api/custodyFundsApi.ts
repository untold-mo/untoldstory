import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import {
  fetchCustodyFundsSb,
  createCustodyFundSb,
  putCustodyFundSb,
  deleteCustodyFundSb,
  promoteCustodyDraftsToOwnerSb,
} from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchCustodyFundsApi(): Promise<import('@/app/context/DataContext').CustodyFund[]> {
  if (isSupabaseDirectMode()) return (await fetchCustodyFundsSb()) as import('@/app/context/DataContext').CustodyFund[];
  const r = await fetch(`${getApiBaseUrl()}/api/custody-funds`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch custody funds');
  const data = await r.json();
  return Array.isArray(data.funds) ? data.funds : [];
}

export async function createCustodyFundApi(
  doc: import('@/app/context/DataContext').CustodyFund
): Promise<import('@/app/context/DataContext').CustodyFund> {
  if (isSupabaseDirectMode()) return (await createCustodyFundSb(doc)) as import('@/app/context/DataContext').CustodyFund;
  const r = await fetch(`${getApiBaseUrl()}/api/custody-funds`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ doc }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create custody fund');
  return data.fund as import('@/app/context/DataContext').CustodyFund;
}

export async function deleteCustodyFundApi(id: string): Promise<void> {
  if (isSupabaseDirectMode()) return deleteCustodyFundSb(id);
  const r = await fetch(`${getApiBaseUrl()}/api/custody-funds/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error('فشل حذف العهدة');
}

export async function putCustodyFundApi(
  doc: import('@/app/context/DataContext').CustodyFund
): Promise<import('@/app/context/DataContext').CustodyFund> {
  if (isSupabaseDirectMode()) return (await putCustodyFundSb(doc.id, doc)) as import('@/app/context/DataContext').CustodyFund;
  const r = await fetch(`${getApiBaseUrl()}/api/custody-funds/${encodeURIComponent(doc.id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ doc }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'put custody fund');
  return data.fund as import('@/app/context/DataContext').CustodyFund;
}

export async function promoteCustodyDraftsToOwnerApi(): Promise<number> {
  if (isSupabaseDirectMode()) return promoteCustodyDraftsToOwnerSb();
  const r = await fetch(`${getApiBaseUrl()}/api/custody-funds/actions/promote-drafts-to-owner`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'promote custody drafts');
  return Number(data.promoted) || 0;
}
