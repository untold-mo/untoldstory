/**
 * بوابة مركزية لجاهزية جلسة Supabase.
 *
 * السبب الجذري لمشكلة «البيانات مش بتظهر / permission denied» المتكررة:
 * بعد إعادة تحميل الصفحة يقرأ عميل Supabase الجلسة المحفوظة من localStorage
 * ويجدّد التوكن بشكل *غير متزامن*. أي استعلام PostgREST يُطلَق في هذه النافذة
 * القصيرة يذهب بدون توكن صالح فترفضه سياسات RLS ("permission denied" / "JWT").
 *
 * الحل: كل محمّلات البيانات تنتظر هذه البوابة قبل أول `.from()`.
 *
 * إضافي بالكامل: لو الجلسة جاهزة (الحالة الشائعة بعد أول تحميل) يرجع فوراً
 * بدون أي تأخير، فلا يغيّر أي سلوك قائم — فقط يمنع سباق النافذة الأولى.
 */
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { getSupabase } from '@/lib/supabase/client';

let inFlight: Promise<boolean> | null = null;

async function pollForSession(maxWaitMs: number): Promise<boolean> {
  const s = getSupabase();
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    const { data } = await s.auth.getSession();
    if (data.session?.access_token) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

/**
 * ينتظر توفّر توكن جلسة صالح قبل إطلاق طلبات Supabase.
 * @returns true لو الجلسة جاهزة، false لو انتهت المهلة بدون جلسة.
 */
export async function ensureSupabaseSession(maxWaitMs = 3000): Promise<boolean> {
  // خارج وضع Supabase المباشر لا توجد جلسة نحتاج انتظارها — لا شيء نفعله.
  if (!isSupabaseDirectMode()) return true;

  // مسار سريع: لو التوكن جاهز بالفعل نرجع فوراً بدون أي انتظار (الحالة الشائعة).
  try {
    const { data } = await getSupabase().auth.getSession();
    if (data.session?.access_token) return true;
  } catch {
    /* نكمل للانتظار */
  }

  // نافذة السباق: نوحّد كل المنادين المتزامنين على انتظار واحد.
  if (!inFlight) {
    inFlight = pollForSession(maxWaitMs).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
