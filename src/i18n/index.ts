import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

export type AppLanguage = 'ar' | 'en';

export const UI_LANG_STORAGE_KEY = 'prod_system_ui_lang';

export function readStoredLanguage(): AppLanguage {
  try {
    const v = localStorage.getItem(UI_LANG_STORAGE_KEY);
    if (v === 'en' || v === 'ar') return v;
  } catch {
    /* ignore */
  }
  return 'ar';
}

export function applyDocumentLanguage(lang: AppLanguage) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

const initialLang = typeof window !== 'undefined' ? readStoredLanguage() : 'ar';
applyDocumentLanguage(initialLang);

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export function setAppLanguage(lang: AppLanguage) {
  try {
    localStorage.setItem(UI_LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyDocumentLanguage(lang);
  void i18n.changeLanguage(lang);
}

export default i18n;
