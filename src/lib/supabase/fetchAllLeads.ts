import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '@/app/context/DataContext';
import { mapLeadListFromRow } from '@/lib/supabase/postgrestMappers';

const LEADS_PAGE_SIZE = 1000;

/**
 * أعمدة جلب القائمة — بدون timeline_json (ثقيل جداً مع آلاف الليدز).
 * التفاصيل الكاملة + السجل تُجلب عند فتح Client 360 عبر fetchLeadByIdSb.
 */
export const LEADS_LIST_SELECT =
  'id,customer_code,name,company,phone,email,status,assigned_to_id,budget,source,category,score,follow_up_at,sla_status,created_at,updated_at';

/** جلب كل الليدز — Supabase/PostgREST يحدّ النتائج بـ 1000 صف افتراضياً */
export async function fetchAllLeadsFromSupabase(
  sb: SupabaseClient,
  options?: { assignedToId?: string },
): Promise<Lead[]> {
  const all: Lead[] = [];
  let from = 0;

  while (true) {
    let q = sb
      .from('leads')
      .select(LEADS_LIST_SELECT)
      .order('created_at', { ascending: false })
      .range(from, from + LEADS_PAGE_SIZE - 1);
    if (options?.assignedToId) {
      q = q.eq('assigned_to_id', options.assignedToId);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data.map((r) => mapLeadListFromRow(r as Record<string, unknown>)));
    if (data.length < LEADS_PAGE_SIZE) break;
    from += LEADS_PAGE_SIZE;
  }

  return all;
}
