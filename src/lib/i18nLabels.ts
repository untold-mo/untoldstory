import type { TFunction } from 'i18next';
import type { LeadStatus, User } from '@/app/context/DataContext';

/** Display label for lead status (DB value stays Arabic). */
export function getLeadStatusLabel(status: string, t: TFunction): string {
  const key = `leadStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function getRoleLabel(role: User['role'], t: TFunction): string {
  const key = `roles.${role}`;
  const translated = t(key);
  return translated === key ? role : translated;
}

export function getDateLocale(lang: 'ar' | 'en'): string {
  return lang === 'en' ? 'en-US' : 'ar-EG';
}

export const LEAD_STATUS_VALUES: LeadStatus[] = [
  'جديد',
  'قيد التواصل',
  'عرض سعر',
  'تفاوض',
  'مغلق - فوز',
  'مغلق - خسارة',
];
