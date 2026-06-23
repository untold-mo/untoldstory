import { toast } from 'sonner';
import type { Lead, User } from '@/app/context/DataContext';
import { NAV_INTENT_EVENT } from '@/lib/inboundLeadToasts';

const NAV_INTENT_KEY = 'prod_system_nav_intent';
const WON_STATUS = 'مغلق - فوز';

const statusByLeadId = new Map<string, string>();
let bootstrapped = false;

export function resetLeadWonToastState(): void {
  bootstrapped = false;
  statusByLeadId.clear();
}

function bootstrapLeadWonToasts(leads: Lead[]): void {
  for (const l of leads) statusByLeadId.set(l.id, l.status);
  bootstrapped = true;
}

function dispatchLeadWonNavIntent(leadId: string): void {
  try {
    localStorage.setItem(
      NAV_INTENT_KEY,
      JSON.stringify({
        tab: 'leads',
        leadsClient360Id: leadId,
        leadsStatusFilter: WON_STATUS,
      }),
    );
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAV_INTENT_EVENT));
  }
}

function notifyDesktopDealWon(title: string, body: string, tag: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (document.visibilityState !== 'hidden') return;
  try {
    const n = new Notification(title, { body, tag, lang: 'ar' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

function repNameForLead(lead: Lead, users: User[]): string {
  const rid = String(lead.assignedTo || '').trim();
  if (!rid) return '';
  return users.find((u) => u.id === rid)?.name || '';
}

/**
 * toast فوري للمالك ومدير المبيعات عند تحويل ليد إلى «مغلق - فوز»
 * (Realtime أو أي تحديث على leads — بدون رفريش)
 */
export function notifyLeadWonTransitions(
  leads: Lead[],
  users: User[],
  role: string | undefined,
): void {
  if (role !== 'مالك' && role !== 'مدير مبيعات') return;

  if (!bootstrapped) {
    bootstrapLeadWonToasts(leads);
    return;
  }

  const newlyWon: Lead[] = [];
  for (const l of leads) {
    const prev = statusByLeadId.get(l.id);
    statusByLeadId.set(l.id, l.status);
    if (l.status !== WON_STATUS) continue;
    if (prev === undefined) continue;
    if (prev === WON_STATUS) continue;
    newlyWon.push(l);
  }

  if (newlyWon.length === 0) return;

  const sorted = [...newlyWon].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (sorted.length === 1) {
    const lead = sorted[0]!;
    const rep = repNameForLead(lead, users);
    const budget =
      lead.budget > 0 ? ` — ${lead.budget.toLocaleString('ar-EG')} ج.م` : '';
    const repPart = rep ? ` (${rep})` : '';
    const msg = `🎉 صفقة مغلقة: ${lead.name}${lead.company ? ` — ${lead.company}` : ''}${budget}${repPart}`;
    toast.success(msg, {
      duration: 12_000,
      id: `lead-won-${lead.id}`,
      action: {
        label: 'عرض الليد',
        onClick: () => dispatchLeadWonNavIntent(lead.id),
      },
    });
    notifyDesktopDealWon('صفقة مغلقة', msg.replace(/^🎉\s*/, ''), `lead-won-${lead.id}`);
    return;
  }

  const lines = sorted
    .slice(0, 5)
    .map((l) => {
      const rep = repNameForLead(l, users);
      return `• ${l.name}${rep ? ` (${rep})` : ''}`;
    })
    .join('\n');
  const more = sorted.length > 5 ? `\n… و${sorted.length - 5} أخرى` : '';
  toast.success(`🎉 ${sorted.length} صفقات أُغلقت (فوز)`, {
    duration: 14_000,
    id: `lead-won-batch-${sorted[0]?.id || 'x'}`,
    description: `${lines}${more}`,
    action: {
      label: 'عرض الليدز',
      onClick: () => {
        try {
          localStorage.setItem(
            NAV_INTENT_KEY,
            JSON.stringify({ tab: 'leads', leadsStatusFilter: WON_STATUS }),
          );
          window.dispatchEvent(new Event(NAV_INTENT_EVENT));
        } catch {
          /* ignore */
        }
      },
    },
  });
  notifyDesktopDealWon(
    `${sorted.length} صفقات أُغلقت`,
    sorted.map((l) => l.name).slice(0, 3).join('، '),
    `lead-won-batch-${Date.now()}`,
  );
}
