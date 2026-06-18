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

async function fetchLeadPage(
  sb: SupabaseClient,
  from: number,
  options?: { assignedToId?: string },
): Promise<Lead[]> {
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
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((r) => mapLeadListFromRow(r as Record<string, unknown>));
}

/** جلب كل الليدز — صفحات متوازية للمالك (بدل ~24ث تسلسلي → ~6ث) */
export async function fetchAllLeadsFromSupabase(
  sb: SupabaseClient,
  options?: { assignedToId?: string },
): Promise<Lead[]> {
  let countQ = sb.from('leads').select('id', { count: 'exact', head: true });
  if (options?.assignedToId) {
    countQ = countQ.eq('assigned_to_id', options.assignedToId);
  }
  const { count, error: countErr } = await countQ;
  if (countErr) throw new Error(countErr.message);
  const total = count ?? 0;
  if (total === 0) return [];

  const pageCount = Math.ceil(total / LEADS_PAGE_SIZE);
  const pageIndexes = Array.from({ length: pageCount }, (_, i) => i);

  const fetchPageSafe = async (pageIdx: number): Promise<Lead[]> => {
    const from = pageIdx * LEADS_PAGE_SIZE;
    try {
      return await fetchLeadPage(sb, from, options);
    } catch (e) {
      console.warn(`[leads] page ${pageIdx} failed, retrying…`, e);
      await new Promise((r) => setTimeout(r, 600));
      return fetchLeadPage(sb, from, options);
    }
  };

  const pages = await Promise.all(pageIndexes.map((i) => fetchPageSafe(i)));
  const merged = pages.flat();
  merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return merged;
}

/** ليدز مهمة للتنبيهات فقط — بدون جلب آلاف الصفوف للمالك */
export async function fetchLeadsNotificationSubset(
  sb: SupabaseClient,
  options?: { assignedToId?: string },
): Promise<Lead[]> {
  if (options?.assignedToId) {
    return fetchAllLeadsFromSupabase(sb, options);
  }
  const now = new Date().toISOString();
  const [overdueRes, unassignedRes, slaRes] = await Promise.all([
    sb
      .from('leads')
      .select(LEADS_LIST_SELECT)
      .lt('follow_up_at', now)
      .not('status', 'eq', 'مغلق - فوز')
      .not('status', 'eq', 'مغلق - خسارة')
      .limit(400),
    sb
      .from('leads')
      .select(LEADS_LIST_SELECT)
      .is('assigned_to_id', null)
      .not('status', 'eq', 'مغلق - فوز')
      .not('status', 'eq', 'مغلق - خسارة')
      .limit(400),
    sb
      .from('leads')
      .select(LEADS_LIST_SELECT)
      .neq('sla_status', 'مستقر')
      .not('status', 'eq', 'مغلق - فوز')
      .not('status', 'eq', 'مغلق - خسارة')
      .limit(200),
  ]);

  const byId = new Map<string, Lead>();
  for (const res of [overdueRes, unassignedRes, slaRes]) {
    if (res.error || !Array.isArray(res.data)) continue;
    for (const row of res.data) {
      const lead = mapLeadListFromRow(row as Record<string, unknown>);
      byId.set(lead.id, lead);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function fetchUnassignedOpenLeadsCount(sb: SupabaseClient): Promise<number> {
  const { count, error } = await sb
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .is('assigned_to_id', null)
    .not('status', 'eq', 'مغلق - فوز')
    .not('status', 'eq', 'مغلق - خسارة');
  if (error) return 0;
  return count ?? 0;
}
