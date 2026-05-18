import { getApiBaseUrl } from '@/config/api';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { fetchLeadsSb } from '@/lib/supabase/directApiSb';
import { supabaseCreateLead, supabaseDeleteLead, supabasePatchLead } from '@/lib/supabase/leadsRepo';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('prod_system_jwt');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchLeadsApi(): Promise<import('@/app/context/DataContext').Lead[]> {
  if (isSupabaseDirectMode()) return fetchLeadsSb();
  const r = await fetch(`${getApiBaseUrl()}/api/leads`, { headers: authHeaders() });
  if (!r.ok) throw new Error('fetch leads');
  const data = await r.json();
  return Array.isArray(data.leads) ? data.leads : [];
}

export async function createLeadApi(payload: {
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  budget: number;
  companySize: string;
  source: string;
  category: string;
  score: number;
  slaStatus: string;
  customerCode?: string;
  assignedTo?: string;
  /** أنشطة أولية (استيراد/مزامنة) — يُعاد ربطها بالليد على الخادم */
  timeline?: import('@/app/context/DataContext').Activity[];
}): Promise<import('@/app/context/DataContext').Lead> {
  if (isSupabaseDirectMode()) return supabaseCreateLead(payload);
  const { timeline, ...core } = payload;
  const body: Record<string, unknown> = { ...core };
  if (Array.isArray(timeline) && timeline.length > 0) {
    body.timeline = timeline.map((a) => ({
      id: a.id,
      action: a.action,
      note: a.note,
      userId: a.userId,
      userName: a.userName,
      createdAt: a.createdAt,
      channelType: a.channelType,
      evidenceType: a.evidenceType,
      evidenceRef: a.evidenceRef,
      durationSeconds: a.durationSeconds,
      qaStatus: a.qaStatus,
      qaReviewedById: a.qaReviewedById,
      qaReviewedByName: a.qaReviewedByName,
      qaReviewedAt: a.qaReviewedAt,
      qaComment: a.qaComment,
    }));
  }
  const r = await fetch(`${getApiBaseUrl()}/api/leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'create lead');
  return data.lead as import('@/app/context/DataContext').Lead;
}

export async function patchLeadApi(
  id: string,
  patch: Partial<{
    status: string;
    assignedTo: string | null;
    followUpAt: string | null;
    lossReasonCode: string | null;
    budget: number;
    slaStatus: string;
    score: number;
    note: string;
    appendActivity: {
      action: string;
      note?: string;
      channelType?: 'call' | 'chat' | 'other';
      evidenceType?: 'recording' | 'chat_export' | 'link' | 'note_only';
      evidenceRef?: string;
      durationSeconds?: number;
      qaStatus?: 'pending';
    };
    reviewActivity: {
      activityId: string;
      decision: 'approved' | 'rejected';
      comment?: string;
    };
  }>
): Promise<import('@/app/context/DataContext').Lead> {
  if (isSupabaseDirectMode()) return supabasePatchLead(id, patch);
  const r = await fetch(`${getApiBaseUrl()}/api/leads/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'patch lead');
  return data.lead as import('@/app/context/DataContext').Lead;
}

export async function deleteLeadApi(id: string): Promise<void> {
  if (isSupabaseDirectMode()) return supabaseDeleteLead(id);
  const r = await fetch(`${getApiBaseUrl()}/api/leads/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (r.status === 204) return;
  const data = await r.json().catch(() => ({}));
  const msg = typeof data.error === 'string' ? data.error : 'delete lead';
  const err = new Error(msg) as Error & { status?: number };
  err.status = r.status;
  throw err;
}

export async function syncRealMetaLeadsApi(body: {
  routeToManagerId?: string | null;
  max?: number;
}): Promise<{
  ok?: boolean;
  code?: string;
  created: number;
  leads: import('@/app/context/DataContext').Lead[];
  skippedDuplicates?: number;
  graphErrors?: number;
  messageAr?: string;
}> {
  if (isSupabaseDirectMode()) {
    return { ok: false, code: 'supabase_only', created: 0, leads: [], messageAr: 'سحب إعلانات ميتا الحقيقي يعمل عند تشغيل خادم API مع قاعدة البيانات.' };
  }
  const r = await fetch(`${getApiBaseUrl()}/api/leads/sync-meta-ads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return {
      ok: false,
      code: data.code || 'http_error',
      created: 0,
      leads: [],
      messageAr: typeof data.messageAr === 'string' ? data.messageAr : typeof data.error === 'string' ? data.error : 'meta_sync_failed',
    };
  }
  return {
    ok: data.ok !== false,
    code: data.code,
    created: Number(data.created) || 0,
    leads: Array.isArray(data.leads) ? data.leads : [],
    skippedDuplicates: Number(data.skippedDuplicates) || 0,
    graphErrors: Number(data.graphErrors) || 0,
    messageAr: typeof data.messageAr === 'string' ? data.messageAr : undefined,
  };
}

export async function syncRealLinkedInLeadsApi(body: {
  routeToManagerId?: string | null;
  max?: number;
}): Promise<{
  ok?: boolean;
  code?: string;
  created: number;
  leads: import('@/app/context/DataContext').Lead[];
  skippedDuplicates?: number;
  graphErrors?: number;
  messageAr?: string;
}> {
  if (isSupabaseDirectMode()) {
    return {
      ok: false,
      code: 'supabase_only',
      created: 0,
      leads: [],
      messageAr: 'سحب لينكد إن الحقيقي يعمل عند تشغيل خادم API مع قاعدة البيانات.',
    };
  }
  const r = await fetch(`${getApiBaseUrl()}/api/leads/sync-linkedin-leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return {
      ok: false,
      code: data.code || 'http_error',
      created: 0,
      leads: [],
      messageAr: typeof data.messageAr === 'string' ? data.messageAr : typeof data.error === 'string' ? data.error : 'linkedin_sync_failed',
    };
  }
  return {
    ok: data.ok !== false,
    code: data.code,
    created: Number(data.created) || 0,
    leads: Array.isArray(data.leads) ? data.leads : [],
    skippedDuplicates: Number(data.skippedDuplicates) || 0,
    graphErrors: Number(data.graphErrors) || 0,
    messageAr: typeof data.messageAr === 'string' ? data.messageAr : undefined,
  };
}

export async function syncRealGoogleAdsLeadsApi(body: {
  routeToManagerId?: string | null;
  max?: number;
}): Promise<{
  ok?: boolean;
  code?: string;
  created: number;
  leads: import('@/app/context/DataContext').Lead[];
  skippedDuplicates?: number;
  graphErrors?: number;
  messageAr?: string;
}> {
  if (isSupabaseDirectMode()) {
    return {
      ok: false,
      code: 'supabase_only',
      created: 0,
      leads: [],
      messageAr: 'سحب Google Ads الحقيقي يعمل عند تشغيل خادم API مع قاعدة البيانات.',
    };
  }
  const r = await fetch(`${getApiBaseUrl()}/api/leads/sync-google-ads-leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return {
      ok: false,
      code: data.code || 'http_error',
      created: 0,
      leads: [],
      messageAr: typeof data.messageAr === 'string' ? data.messageAr : typeof data.error === 'string' ? data.error : 'google_ads_sync_failed',
    };
  }
  return {
    ok: data.ok !== false,
    code: data.code,
    created: Number(data.created) || 0,
    leads: Array.isArray(data.leads) ? data.leads : [],
    skippedDuplicates: Number(data.skippedDuplicates) || 0,
    graphErrors: Number(data.graphErrors) || 0,
    messageAr: typeof data.messageAr === 'string' ? data.messageAr : undefined,
  };
}

export type ImportCsvLeadInput = {
  name: string;
  company: string;
  phone: string;
  email: string;
  status?: string;
  budget?: number;
  companySize?: string;
  category?: string;
  score?: number;
  linkedinRowIndex?: number;
};

/** استيراد دفعة ليدز من CSV إلى Supabase/الخادم مع تجنب التكرار (بريد/جوال). */
export async function importLeadsCsvApi(payload: {
  source: string;
  leads: ImportCsvLeadInput[];
  routeToManagerId?: string | null;
}): Promise<{
  ok: boolean;
  created: number;
  skippedDuplicates: number;
  failed: number;
  leads: import('@/app/context/DataContext').Lead[];
  messageAr?: string;
}> {
  if (isSupabaseDirectMode()) {
    const { supabaseImportLeadsCsv } = await import('@/lib/supabase/leadsRepo');
    return supabaseImportLeadsCsv(payload);
  }
  const r = await fetch(`${getApiBaseUrl()}/api/leads/import-csv`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'import csv');
  return {
    ok: Boolean(data.ok),
    created: Number(data.created) || 0,
    skippedDuplicates: Number(data.skippedDuplicates) || 0,
    failed: Number(data.failed) || 0,
    leads: Array.isArray(data.leads) ? data.leads : [],
    messageAr: typeof data.messageAr === 'string' ? data.messageAr : undefined,
  };
}

/** استيراد تجريبي لقناة خارجية (مسار خادم واحد). لا يستبدل تكامل Meta/Google الحقيقي. */
export async function demoChannelIngestApi(payload: {
  channel: 'facebook' | 'linkedin' | 'google' | 'email';
  count: number;
  routeToManagerId?: string | null;
  accountRef?: string;
  /** سطر المصدر المعروض للمستخدم (قناة + حساب) */
  sourceDisplay?: string;
}): Promise<{
  demo: boolean;
  created: number;
  skippedDuplicates: number;
  leads: import('@/app/context/DataContext').Lead[];
  noticeAr?: string;
}> {
  if (isSupabaseDirectMode()) {
    throw new Error('استيراد القنوات التجريبي غير متصل بـ Supabase من الواجهة');
  }
  const r = await fetch(`${getApiBaseUrl()}/api/leads/demo-channel-ingest`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'demo ingest');
  return {
    demo: Boolean(data.demo),
    created: Number(data.created) || 0,
    skippedDuplicates: Number(data.skippedDuplicates) || 0,
    leads: Array.isArray(data.leads) ? data.leads : [],
    noticeAr: typeof data.noticeAr === 'string' ? data.noticeAr : undefined,
  };
}
