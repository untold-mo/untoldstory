import { useTranslation } from 'react-i18next';

export function useAppDirection() {
  const { i18n } = useTranslation();
  const lang: 'ar' | 'en' = i18n.language === 'en' ? 'en' : 'ar';
  const isRtl = lang === 'ar';
  return {
    lang,
    isRtl,
    dir: isRtl ? ('rtl' as const) : ('ltr' as const),
    dateLocale: lang === 'en' ? 'en-US' : 'ar-EG',
  };
}
