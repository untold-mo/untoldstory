import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import {
  fetchEquipmentBookingsSb,
  createEquipmentBookingSb,
  patchEquipmentBookingSb,
  deleteEquipmentBookingSb,
} from '@/lib/supabase/directApiSb';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchEquipmentBookingsApi(): Promise<
  import('@/app/context/DataContext').EquipmentBooking[]
> {
  if (isSupabaseDirectMode()) {
    const list = await fetchEquipmentBookingsSb();
    if (!Array.isArray(list)) throw new Error('fetch equipment bookings: missing or invalid bookings array');
    return list as import('@/app/context/DataContext').EquipmentBooking[];
  }
  const r = await fetch(`${getApiBaseUrl()}/api/equipment-bookings`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch equipment bookings');
  let data: unknown;
  try {
    data = await r.json();
  } catch {
    throw new Error('fetch equipment bookings: malformed json');
  }
  if (!data || typeof data !== 'object') throw new Error('fetch equipment bookings: invalid body');
  const bookings = (data as { bookings?: unknown }).bookings;
  if (!Array.isArray(bookings)) {
    throw new Error('fetch equipment bookings: missing or invalid bookings array');
  }
  return bookings as import('@/app/context/DataContext').EquipmentBooking[];
}

export async function createEquipmentBookingApi(
  row: import('@/app/context/DataContext').EquipmentBooking
): Promise<import('@/app/context/DataContext').EquipmentBooking> {
  if (isSupabaseDirectMode()) {
    return (await createEquipmentBookingSb({ ...row } as Record<string, unknown>)) as import('@/app/context/DataContext').EquipmentBooking;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/equipment-bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(row),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create equipment booking');
  return data.booking as import('@/app/context/DataContext').EquipmentBooking;
}

export async function deleteEquipmentBookingApi(id: string): Promise<void> {
  if (isSupabaseDirectMode()) {
    return deleteEquipmentBookingSb(id);
  }
  const r = await fetch(`${getApiBaseUrl()}/api/equipment-bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'delete equipment booking');
  }
}

export async function patchEquipmentBookingApi(
  id: string,
  patch: Partial<import('@/app/context/DataContext').EquipmentBooking>
): Promise<import('@/app/context/DataContext').EquipmentBooking> {
  if (isSupabaseDirectMode()) {
    return (await patchEquipmentBookingSb(id, patch as Record<string, unknown>)) as import('@/app/context/DataContext').EquipmentBooking;
  }
  const r = await fetch(`${getApiBaseUrl()}/api/equipment-bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch equipment booking');
  return data.booking as import('@/app/context/DataContext').EquipmentBooking;
}
