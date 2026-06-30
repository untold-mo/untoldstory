import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@/app/context/DataContext';
import { mapUserFromRow } from '@/lib/supabase/postgrestMappers';

const PROFILE_SELECT =
  'id,email,name,role,avatar,base_salary,skills_json,stats_json,created_at,updated_at,is_team_leader,team_leader_id';

export type AuthProfileResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'missing' | 'rls' | 'network' | 'timeout'; message: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** جلب صف الموظف بعد Auth — مع إعادة محاولة عند بطء Supabase */
export async function fetchAuthUserProfile(
  sb: SupabaseClient,
  email: string,
  options?: { attempts?: number; timeoutMs?: number },
): Promise<AuthProfileResult> {
  const em = email.trim().toLowerCase();
  const attempts = Math.max(1, options?.attempts ?? 3);
  const timeoutMs = options?.timeoutMs ?? 12_000;

  let lastErr: string | null = null;

  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(800 * i);
    try {
      const query = sb.from('users').select(PROFILE_SELECT).eq('email', em).maybeSingle();
      const { data, error } = await Promise.race([
        query,
        new Promise<{ data: null; error: { message: string } }>((_, reject) =>
          window.setTimeout(() => reject(new Error('timeout')), timeoutMs),
        ),
      ]);
      if (error) {
        lastErr = error.message;
        continue;
      }
      if (!data) {
        return {
          ok: false,
          reason: 'missing',
          message:
            'الدخول لـ Supabase نجح، لكن مفيش صف في جدول الموظفين (public.users) بنفس البريد، أو الـ RLS رفض القراءة.',
        };
      }
      return { ok: true, user: mapUserFromRow(data as Record<string, unknown>) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastErr = msg;
      if (msg === 'timeout') continue;
    }
  }

  const isTimeout = lastErr === 'timeout';
  return {
    ok: false,
    reason: isTimeout ? 'timeout' : 'network',
    message: isTimeout
      ? 'السيرفر بطيء جداً (غالباً بسبب ضغط Supabase). انتظر دقيقة وحاول تاني، أو افتح نافذة خاصة.'
      : `تعذر قراءة ملف الموظف من قاعدة البيانات${lastErr ? `: ${lastErr}` : ''}. حاول مرة أخرى.`,
  };
}
