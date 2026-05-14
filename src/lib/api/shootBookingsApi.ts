import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchShootBookingsSb, createShootBookingSb, patchShootBookingSb } from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchShootBookingsApi(): Promise<import('@/app/context/DataContext').ShootBooking[]> {
  if (isSupabaseDirectMode()) {
    const list = await fetchShootBookingsSb();
    if (!Array.isArray(list)) throw new Error('fetch shoot bookings: missing or invalid bookings array');
    return list as import('@/app/context/DataContext').ShootBooking[];
  }
  const r = await fetch(`${getApiBaseUrl()}/api/shoot-bookings`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch shoot bookings');
  let data: unknown;
  try {
    data = await r.json();
  } catch {
    throw new Error('fetch shoot bookings: malformed json');
  }
  if (!data || typeof data !== 'object') throw new Error('fetch shoot bookings: invalid body');
  const bookings = (data as { bookings?: unknown }).bookings;
  if (!Array.isArray(bookings)) {
    /** كان يُحوَّل إلى [] فيُعتبر «نجاحاً» فيمسح الجدولة في الواجهة رغم أن الاستجابة لا تخصّ حجوزات صالحة. */
    throw new Error('fetch shoot bookings: missing or invalid bookings array');
  }
  return bookings as import('@/app/context/DataContext').ShootBooking[];
}

export async function createShootBookingApi(
  row: import('@/app/context/DataContext').ShootBooking
): Promise<import('@/app/context/DataContext').ShootBooking> {
  if (isSupabaseDirectMode()) {
    const booking = (await createShootBookingSb({ ...row } as Record<string, unknown>)) as
      | import('@/app/context/DataContext').ShootBooking
      | undefined;
    if (!booking?.id?.trim()) throw new Error('استجابة الخادم لا تحتوي حجزاً صالحاً — تحقق من حفظ الطلب على السيرفر');
    return booking;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/shoot-bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(row),
  });
  const data = (await r.json().catch(() => ({}))) as {
    error?: string;
    detail?: string;
    booking?: import('@/app/context/DataContext').ShootBooking;
  };
  if (!r.ok) {
    const base = typeof data.error === 'string' ? data.error : 'create shoot booking';
    const detail = typeof data.detail === 'string' && data.detail.trim() ? data.detail.trim() : '';
    throw new Error(detail ? `${base} (${detail})` : base);
  }
  const booking = data.booking as import('@/app/context/DataContext').ShootBooking | undefined;
  if (
    booking == null ||
    typeof booking !== 'object' ||
    typeof booking.id !== 'string' ||
    booking.id.trim() === ''
  ) {
    throw new Error('استجابة الخادم لا تحتوي حجزاً صالحاً — تحقق من حفظ الطلب على السيرفر');
  }
  return booking;
}

export async function patchShootBookingApi(
  id: string,
  patch: Partial<import('@/app/context/DataContext').ShootBooking>
): Promise<import('@/app/context/DataContext').ShootBooking> {
  if (isSupabaseDirectMode()) {
    return (await patchShootBookingSb(id, patch as Record<string, unknown>)) as import('@/app/context/DataContext').ShootBooking;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/shoot-bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch shoot booking');
  return data.booking as import('@/app/context/DataContext').ShootBooking;
}
