import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchAttendanceRecordsSb, postAttendanceRecordSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchAttendanceRecordsApi(): Promise<
  import('@/app/context/DataContext').AttendanceRecord[]
> {
  if (isSupabaseDirectMode()) return fetchAttendanceRecordsSb();
  const r = await fetch(`${getApiBaseUrl()}/api/attendance-records`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch attendance');
  const data = await r.json();
  return Array.isArray(data.records) ? data.records : [];
}

export async function postAttendanceRecordApi(
  rec: import('@/app/context/DataContext').AttendanceRecord
): Promise<import('@/app/context/DataContext').AttendanceRecord> {
  if (isSupabaseDirectMode()) {
    return postAttendanceRecordSb({
      id: rec.id,
      repId: rec.repId,
      type: rec.type,
      source: rec.source,
      createdAt: rec.createdAt,
    });
  }
  const r = await fetch(`${getApiBaseUrl()}/api/attendance-records`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      id: rec.id,
      repId: rec.repId,
      type: rec.type,
      source: rec.source,
      createdAt: rec.createdAt,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'post attendance');
  return data.record as import('@/app/context/DataContext').AttendanceRecord;
}
