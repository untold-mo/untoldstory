import { toast } from 'sonner';
import type { Lead } from '@/app/context/DataContext';
import {
  isAutoImportedLeadSource,
  leadSourceDisplayLabel,
  leadMatchesSourceFilter,
  type LeadSourceFilter,
} from '@/lib/leadSource';

export const NAV_INTENT_EVENT = 'prod-system-nav-intent';
const NAV_INTENT_KEY = 'prod_system_nav_intent';

const seenIds = new Set<string>();
let bootstrapped = false;

export function resetInboundLeadToastState(): void {
  bootstrapped = false;
  seenIds.clear();
}

export function bootstrapInboundLeadToasts(leads: Lead[]): void {
  for (const l of leads) seenIds.add(l.id);
  bootstrapped = true;
}

function dispatchLeadsNavIntent(sourceFilter?: LeadSourceFilter): void {
  const intent: Record<string, unknown> = {
    tab: 'leads',
    leadsAssignedFilter: 'unassigned',
    leadsStatusFilter: 'جديد',
  };
  if (sourceFilter && sourceFilter !== 'all') {
    intent.leadsSourceFilter = sourceFilter;
  }
  try {
    localStorage.setItem(NAV_INTENT_KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAV_INTENT_EVENT));
  }
}

function sourceFilterForLead(source: string | undefined): LeadSourceFilter | undefined {
  const channels: LeadSourceFilter[] = ['facebook', 'instagram', 'google', 'linkedin', 'email'];
  for (const ch of channels) {
    if (leadMatchesSourceFilter(source, ch)) return ch;
  }
  return undefined;
}

/** إشعار toast للمالك ومدير المبيعات عند وصول ليدز تلقائية جديدة */
export function notifyNewInboundLeads(leads: Lead[], role: string | undefined): void {
  if (role !== 'مالك' && role !== 'مدير مبيعات') return;

  if (!bootstrapped) {
    bootstrapInboundLeadToasts(leads);
    return;
  }

  const incoming = leads.filter((l) => !seenIds.has(l.id) && isAutoImportedLeadSource(l.source));
  if (incoming.length === 0) return;

  const sorted = [...incoming].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const l of sorted) seenIds.add(l.id);

  if (sorted.length === 1) {
    const lead = sorted[0]!;
    const srcFilter = sourceFilterForLead(lead.source);
    toast.success(`ليد وارد من ${leadSourceDisplayLabel(lead.source)}: ${lead.name}`, {
      duration: 10_000,
      action: {
        label: 'توزيع الآن',
        onClick: () => dispatchLeadsNavIntent(srcFilter),
      },
    });
    return;
  }

  toast.success(
    `${sorted.length} ليدز واردة جديدة من القنوات (فيسبوك، إنستجرام، لينكد إن، إيميل، جوجل)`,
    {
      duration: 12_000,
      action: {
        label: 'عرض غير الموزّع',
        onClick: () => dispatchLeadsNavIntent(),
      },
    },
  );
}
