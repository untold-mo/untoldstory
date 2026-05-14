import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import {
  fetchMeetingBookingsSb,
  createMeetingBookingSb,
  patchMeetingBookingSb,
} from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchMeetingBookingsApi(): Promise<
  import('@/app/context/DataContext').MeetingBooking[]
> {
  if (isSupabaseDirectMode()) {
    const list = await fetchMeetingBookingsSb();
    if (!Array.isArray(list)) throw new Error('fetch meeting bookings: missing or invalid bookings array');
    return list as import('@/app/context/DataContext').MeetingBooking[];
  }
  const r = await fetch(`${getApiBaseUrl()}/api/meeting-bookings`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch meeting bookings');
  let data: unknown;
  try {
    data = await r.json();
  } catch {
    throw new Error('fetch meeting bookings: malformed json');
  }
  if (!data || typeof data !== 'object') throw new Error('fetch meeting bookings: invalid body');
  const bookings = (data as { bookings?: unknown }).bookings;
  if (!Array.isArray(bookings)) {
    throw new Error('fetch meeting bookings: missing or invalid bookings array');
  }
  return bookings as import('@/app/context/DataContext').MeetingBooking[];
}

export async function createMeetingBookingApi(
  row: import('@/app/context/DataContext').MeetingBooking
): Promise<import('@/app/context/DataContext').MeetingBooking> {
  if (isSupabaseDirectMode()) {
    return (await createMeetingBookingSb({ ...row } as Record<string, unknown>)) as import('@/app/context/DataContext').MeetingBooking;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/meeting-bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(row),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create meeting booking');
  return data.booking as import('@/app/context/DataContext').MeetingBooking;
}

export async function patchMeetingBookingApi(
  id: string,
  patch: Partial<import('@/app/context/DataContext').MeetingBooking>
): Promise<import('@/app/context/DataContext').MeetingBooking> {
  if (isSupabaseDirectMode()) {
    return (await patchMeetingBookingSb(id, patch as Record<string, unknown>)) as import('@/app/context/DataContext').MeetingBooking;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/meeting-bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch meeting booking');
  return data.booking as import('@/app/context/DataContext').MeetingBooking;
}
