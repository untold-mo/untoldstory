import i18n from '@/i18n';

export function st(key: string, opts?: Record<string, unknown>): string {
  return String(i18n.t(`sysNotify.${key}`, opts));
}

export function stMore(count: number): string {
  return st('moreItems', { count });
}

export function dateLocale(): string {
  return i18n.language === 'en' ? 'en-US' : 'ar-EG';
}

export function currencyLabel(): string {
  return String(i18n.t('common.currency'));
}
