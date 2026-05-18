import type { TFunction } from 'i18next';
import type { User } from '@/app/context/DataContext';

export function getNavLabelKey(tabId: string, role: User['role']): string {
  if (role === 'مندوب') {
    if (tabId === 'dashboard') return 'nav.repDashboard';
    if (tabId === 'leads') return 'nav.repLeads';
    if (tabId === 'performance') return 'nav.repPerformance';
  }
  if (role === 'محاسب') {
    if (tabId === 'accountant') return 'nav.accountantInvoices';
    if (tabId === 'leads') return 'nav.accountantLeads';
  }
  if (role === 'مدير مبيعات') {
    if (tabId === 'team-performance') return 'nav.managerTeam';
    if (tabId === 'leads') return 'nav.managerLeads';
  }
  return `nav.${tabId}`;
}

export function getNavLabel(tabId: string, role: User['role'], t: TFunction): string {
  return t(getNavLabelKey(tabId, role));
}
