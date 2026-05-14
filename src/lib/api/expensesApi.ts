import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchExpensesSb, createExpenseSb, patchExpenseSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchExpensesApi(): Promise<import('@/app/context/DataContext').Expense[]> {
  if (isSupabaseDirectMode()) return fetchExpensesSb();
  const r = await fetch(`${getApiBaseUrl()}/api/expenses`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch expenses');
  const data = await r.json();
  return Array.isArray(data.expenses) ? data.expenses : [];
}

export async function createExpenseApi(
  payload: Omit<import('@/app/context/DataContext').Expense, 'id' | 'date'> & {
    id?: string;
    date?: string;
  }
): Promise<import('@/app/context/DataContext').Expense> {
  if (isSupabaseDirectMode()) return createExpenseSb(payload);
  const r = await fetch(`${getApiBaseUrl()}/api/expenses`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create expense');
  return data.expense as import('@/app/context/DataContext').Expense;
}

export async function patchExpenseApi(
  id: string,
  patch: Partial<import('@/app/context/DataContext').Expense>
): Promise<import('@/app/context/DataContext').Expense> {
  if (isSupabaseDirectMode()) return patchExpenseSb(id, patch);
  const r = await fetch(`${getApiBaseUrl()}/api/expenses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch expense');
  return data.expense as import('@/app/context/DataContext').Expense;
}
