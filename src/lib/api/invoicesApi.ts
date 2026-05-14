import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchInvoicesSb, createInvoiceSb, patchInvoiceSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchInvoicesApi(): Promise<import('@/app/context/DataContext').Invoice[]> {
  if (isSupabaseDirectMode()) return fetchInvoicesSb();
  const r = await fetch(`${getApiBaseUrl()}/api/invoices`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch invoices');
  const data = await r.json();
  return Array.isArray(data.invoices) ? data.invoices : [];
}

export async function createInvoiceApi(
  payload: Partial<import('@/app/context/DataContext').Invoice> & {
    customerName: string;
    amount: number;
    status: import('@/app/context/DataContext').Invoice['status'];
    date?: string;
    collections?: import('@/app/context/DataContext').InvoiceCollection[];
  }
): Promise<import('@/app/context/DataContext').Invoice> {
  if (isSupabaseDirectMode()) return createInvoiceSb(payload);
  const r = await fetch(`${getApiBaseUrl()}/api/invoices`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create invoice');
  return data.invoice as import('@/app/context/DataContext').Invoice;
}

export async function patchInvoiceApi(
  id: string,
  patch: Partial<Omit<import('@/app/context/DataContext').Invoice, 'nextDueDate'>> & {
    collections?: import('@/app/context/DataContext').InvoiceCollection[];
    nextDueDate?: string | null;
  }
): Promise<import('@/app/context/DataContext').Invoice> {
  if (isSupabaseDirectMode()) return patchInvoiceSb(id, patch);
  const body: Record<string, unknown> = { ...patch };
  if (patch.collections) {
    body.collections = patch.collections;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/invoices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch invoice');
  return data.invoice as import('@/app/context/DataContext').Invoice;
}
