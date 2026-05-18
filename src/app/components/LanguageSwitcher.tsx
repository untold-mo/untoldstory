import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { setAppLanguage, type AppLanguage } from '@/i18n';

type Props = {
  compact?: boolean;
  className?: string;
};

export function LanguageSwitcher({ compact = false, className = '' }: Props) {
  const { i18n, t } = useTranslation();
  const current = (i18n.language === 'en' ? 'en' : 'ar') as AppLanguage;

  const switchTo = (lang: AppLanguage) => {
    if (lang === current) return;
    setAppLanguage(lang);
    toast.success(t('language.switched'));
  };

  if (compact) {
    return (
      <div className={`inline-flex rounded-xl border border-white/15 bg-white/[0.04] p-0.5 ${className}`}>
        {(['ar', 'en'] as AppLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => switchTo(lang)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              current === lang ? 'bg-[#7C6BFF] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {lang === 'ar' ? 'ع' : 'EN'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs font-bold text-zinc-400 flex items-center gap-2">
        <Languages className="w-4 h-4" />
        {t('language.label')}
      </p>
      <div className="flex flex-wrap gap-2">
        {(['ar', 'en'] as AppLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => switchTo(lang)}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
              current === lang
                ? 'bg-[#7C6BFF] text-white shadow-lg shadow-[#7C6BFF]/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t(`language.${lang}`)}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{t('settings.languageHint')}</p>
    </div>
  );
}
