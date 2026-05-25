import type { Lead, SlaEscalationSettings, SystemNotification } from '@/app/context/DataContext';

export type LeadsNavIntent = {
  tab: 'leads';
  leadsAssignedFilter?: 'all' | 'mine' | 'unassigned';
  leadsStatusFilter?: 'الكل' | Lead['status'];
  leadsSourceFilter?: string;
  leadsOverdueOnly?: boolean;
  leadsRepUserId?: string;
  leadsClient360Id?: string;
  /** عرض الليدز المرتبطة بتنبيه معيّن فقط */
  leadsFocusIds?: string[];
};

export function isOpenLead(l: Lead): boolean {
  return l.status !== 'مغلق - فوز' && l.status !== 'مغلق - خسارة';
}

export function getFollowUpOverdueLeads(leads: Lead[]): Lead[] {
  const now = Date.now();
  return leads.filter((l) => {
    if (!l.followUpAt || !isOpenLead(l)) return false;
    return new Date(l.followUpAt).getTime() < now;
  });
}

export function getSlaAtRiskLeads(leads: Lead[]): Lead[] {
  return leads.filter(
    (l) => isOpenLead(l) && (l.slaStatus === 'متأخر' || l.slaStatus === 'حرج'),
  );
}

export function getStaleLeads(leads: Lead[], criticalAfterMinutes: number): Lead[] {
  const now = Date.now();
  return leads.filter((l) => {
    if (!isOpenLead(l)) return false;
    const latest = l.timeline[0]?.createdAt || l.updatedAt || l.createdAt;
    const ageMins = (now - new Date(latest).getTime()) / (1000 * 60);
    return ageMins >= criticalAfterMinutes;
  });
}

/** يحدد الليدز المستهدفة من التنبيه (معرّفات صريحة أو استنتاج من النص). */
export function resolveLeadIdsForNotification(
  n: Pick<SystemNotification, 'title' | 'message' | 'entityType' | 'entityId' | 'leadIds' | 'targetUserId'>,
  leads: Lead[],
  sla: SlaEscalationSettings,
): string[] {
  const explicit = Array.isArray(n.leadIds) ? n.leadIds.map((id) => String(id).trim()).filter(Boolean) : [];
  if (explicit.length) return [...new Set(explicit)];

  if (n.entityType === 'lead' && n.entityId) {
    const id = String(n.entityId).trim();
    return id ? [id] : [];
  }

  const text = `${n.title || ''} ${n.message || ''}`;
  let pool: Lead[] = [];

  if (/متابعات?\s*متأخر|follow[- ]?up|موعد\s*متابعة/i.test(text)) {
    pool = getFollowUpOverdueLeads(leads);
  } else if (/تصعيد|بدون\s*متابعة|stale|لم يتم تحديثها/i.test(text)) {
    pool = getStaleLeads(leads, sla.criticalAfterMinutes);
  } else if (/متأخر|حرج|مهدد|sla|at[- ]?risk|تنبيه/i.test(text)) {
    pool = getSlaAtRiskLeads(leads);
  }

  const targetUid = n.targetUserId ? String(n.targetUserId).trim() : '';
  if (targetUid) {
    pool = pool.filter((l) => String(l.assignedTo || '').trim() === targetUid);
  }

  return [...new Set(pool.map((l) => l.id).filter(Boolean))];
}

export function buildLeadsNavIntent(
  n: Pick<SystemNotification, 'title' | 'message' | 'entityType' | 'entityId' | 'leadIds' | 'targetUserId'>,
  leads: Lead[],
  sla: SlaEscalationSettings,
): LeadsNavIntent {
  const text = `${n.title || ''} ${n.message || ''}`;
  const intent: LeadsNavIntent = { tab: 'leads' };

  const focusIds = resolveLeadIdsForNotification(n, leads, sla);
  if (focusIds.length) {
    intent.leadsFocusIds = focusIds;
    intent.leadsOverdueOnly = true;
  }

  if (n.entityId && n.entityType === 'lead') {
    intent.leadsClient360Id = String(n.entityId).trim();
  } else if (focusIds.length === 1) {
    intent.leadsClient360Id = focusIds[0];
  }

  if (/غير\s*مسند|غير\s*موزع|تنتظر\s*توزيع|بدون\s*تعيين|القنوات\s*المربوطة|وارد/i.test(text)) {
    intent.leadsAssignedFilter = 'unassigned';
    intent.leadsStatusFilter = 'جديد';
  }
  if (/facebook|فيسبوك/i.test(text)) intent.leadsSourceFilter = 'facebook';
  else if (/instagram|إنستجرام|انستجرام/i.test(text)) intent.leadsSourceFilter = 'instagram';
  else if (/linkedin|لينكد/i.test(text)) intent.leadsSourceFilter = 'linkedin';
  else if (/gmail|email|بريد|إيميل/i.test(text)) intent.leadsSourceFilter = 'email';
  else if (/google|جوجل|sheet/i.test(text)) intent.leadsSourceFilter = 'google';

  if (!focusIds.length && /متأخر|متأخرة|تصعيد|حرج|مهدد|sla/i.test(text)) {
    intent.leadsOverdueOnly = true;
  }

  const targetUid = n.targetUserId ? String(n.targetUserId).trim() : '';
  if (targetUid) {
    intent.leadsRepUserId = targetUid;
  }

  return intent;
}
