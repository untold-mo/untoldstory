import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchWorkspaceStateSb, patchWorkspaceStateSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** مستند جزئي من الخادم (مفاتيح عليا فقط) */
export type WorkspaceStateDoc = Record<string, unknown>;

export async function fetchWorkspaceStateApi(): Promise<WorkspaceStateDoc> {
  if (isSupabaseDirectMode()) return fetchWorkspaceStateSb();
  const r = await fetch(`${getApiBaseUrl()}/api/workspace-state`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch workspace state');
  const data = await r.json();
  return data.workspace && typeof data.workspace === 'object' ? data.workspace : {};
}

export async function patchWorkspaceStateApi(patch: WorkspaceStateDoc): Promise<WorkspaceStateDoc> {
  if (isSupabaseDirectMode()) return patchWorkspaceStateSb(patch);
  const r = await fetch(`${getApiBaseUrl()}/api/workspace-state`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch workspace state');
  return data.workspace && typeof data.workspace === 'object' ? data.workspace : {};
}
