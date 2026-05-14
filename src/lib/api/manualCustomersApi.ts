import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import {
  fetchManualCustomersSb,
  createManualCustomerSb,
  patchManualCustomerSb,
  deleteManualCustomerSb,
} from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchManualCustomersApi(): Promise<
  import('@/app/context/DataContext').ManualCustomer[]
> {
  if (isSupabaseDirectMode()) return fetchManualCustomersSb();
  const r = await fetch(`${getApiBaseUrl()}/api/manual-customers`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch manual customers');
  const data = await r.json();
  return Array.isArray(data.customers) ? data.customers : [];
}

export async function createManualCustomerApi(payload: {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  sourceLabel?: string;
  customerCode?: string;
}): Promise<import('@/app/context/DataContext').ManualCustomer> {
  if (isSupabaseDirectMode()) return createManualCustomerSb(payload);
  const r = await fetch(`${getApiBaseUrl()}/api/manual-customers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create customer');
  return data.customer as import('@/app/context/DataContext').ManualCustomer;
}

export async function patchManualCustomerApi(
  id: string,
  patch: Partial<{
    name: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    sourceLabel: string | null;
    customerCode: string | null;
  }>
): Promise<import('@/app/context/DataContext').ManualCustomer> {
  if (isSupabaseDirectMode()) return patchManualCustomerSb(id, patch);
  const r = await fetch(`${getApiBaseUrl()}/api/manual-customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch customer');
  return data.customer as import('@/app/context/DataContext').ManualCustomer;
}

export async function deleteManualCustomerApi(id: string): Promise<void> {
  if (isSupabaseDirectMode()) return deleteManualCustomerSb(id);
  const r = await fetch(`${getApiBaseUrl()}/api/manual-customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'delete customer');
}
