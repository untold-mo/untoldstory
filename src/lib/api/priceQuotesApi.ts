import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchPriceQuotesSb, createPriceQuoteSb, patchPriceQuoteSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchPriceQuotesApi(): Promise<import('@/app/context/DataContext').PriceQuote[]> {
  if (isSupabaseDirectMode()) return fetchPriceQuotesSb();
  const r = await fetch(`${getApiBaseUrl()}/api/price-quotes`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch price quotes');
  const data = await r.json();
  return Array.isArray(data.quotes) ? data.quotes : [];
}

export async function createPriceQuoteApi(
  payload: Omit<
    import('@/app/context/DataContext').PriceQuote,
    | 'createdAt'
    | 'status'
    | 'approvedBy'
    | 'approvedAt'
    | 'invoiceId'
    | 'createdById'
    | 'createdByName'
  > & { id?: string }
): Promise<import('@/app/context/DataContext').PriceQuote> {
  if (isSupabaseDirectMode()) return createPriceQuoteSb(payload);
  const r = await fetch(`${getApiBaseUrl()}/api/price-quotes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create price quote');
  return data.quote as import('@/app/context/DataContext').PriceQuote;
}

export async function patchPriceQuoteApi(
  id: string,
  patch: Partial<{
    status: import('@/app/context/DataContext').PriceQuote['status'];
    approvedBy: string;
    approvedAt: string;
    invoiceId: string;
  }>
): Promise<import('@/app/context/DataContext').PriceQuote> {
  if (isSupabaseDirectMode()) return patchPriceQuoteSb(id, patch);
  const r = await fetch(`${getApiBaseUrl()}/api/price-quotes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch price quote');
  return data.quote as import('@/app/context/DataContext').PriceQuote;
}
