import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchClosedMonthsSb, postCloseMonthSb, postReopenMonthSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchClosedMonthsApi(): Promise<string[]> {
  if (isSupabaseDirectMode()) return fetchClosedMonthsSb();
  const r = await fetch(`${getApiBaseUrl()}/api/closed-months`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch closed months');
  const data = await r.json();
  return Array.isArray(data.closedMonths) ? data.closedMonths : [];
}

export async function postCloseMonthApi(monthKey: string): Promise<string[]> {
  if (isSupabaseDirectMode()) return postCloseMonthSb(monthKey);
  const r = await fetch(`${getApiBaseUrl()}/api/closed-months/close`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ monthKey }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'close month');
  return Array.isArray(data.closedMonths) ? data.closedMonths : [];
}

export async function postReopenMonthApi(monthKey: string): Promise<string[]> {
  if (isSupabaseDirectMode()) return postReopenMonthSb(monthKey);
  const r = await fetch(`${getApiBaseUrl()}/api/closed-months/reopen`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ monthKey }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'reopen month');
  return Array.isArray(data.closedMonths) ? data.closedMonths : [];
}
