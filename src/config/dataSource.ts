import { isSupabaseDirectMode } from '@/config/supabaseMode';

/**
 * أي build إنتاج (Hostinger 등) بدون تشغيل `local` يُفهم أن البيانات من الباك اند.
 * للمحلي بدون سيرفر: VITE_DATA_SOURCE=local في `.env.local`
 *
 * وضع Supabase المباشر (Auth + PostgREST) يُعامل كسيرفر بيانات دائماً حتى لو كان
 * VITE_DATA_SOURCE=local — وإلا تُحمّل واجهة الديمو من localStorage بينما الطلبات تذهب لـSupabase.
 */
export function isServerDataMode(): boolean {
  if (isSupabaseDirectMode()) return true;
  const v = String(import.meta.env.VITE_DATA_SOURCE || '').trim().toLowerCase();
  if (v === 'server') return true;
  if (v === 'local' || v === 'offline' || v === 'demo') return false;
  return Boolean(import.meta.env.PROD);
}
