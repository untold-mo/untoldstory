import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchAuditEventsSb, postAuditEventSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchAuditEventsApi(): Promise<import('@/app/context/DataContext').AuditEvent[]> {
  if (isSupabaseDirectMode()) return fetchAuditEventsSb();
  const r = await fetch(`${getApiBaseUrl()}/api/audit-events`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch audit events');
  const data = await r.json();
  return Array.isArray(data.events) ? data.events : [];
}

export async function postAuditEventApi(
  payload: Omit<import('@/app/context/DataContext').AuditEvent, 'id' | 'createdAt' | 'actorId' | 'actorName'>
): Promise<import('@/app/context/DataContext').AuditEvent> {
  if (isSupabaseDirectMode()) return postAuditEventSb(payload);
  const r = await fetch(`${getApiBaseUrl()}/api/audit-events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'post audit event');
  return data.event as import('@/app/context/DataContext').AuditEvent;
}
