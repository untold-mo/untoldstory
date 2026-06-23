import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseDirectMode } from '@/config/supabaseMode';
import { assertAllowedSupabaseProject, createGuardedFetch } from '@/lib/supabase/supabaseGuard';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseDirectMode()) {
    throw new Error('Supabase غير مفعّل: عيّن VITE_USE_SUPABASE=1 والمفاتيح في .env.local');
  }
  if (!client) {
    const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
    const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
    assertAllowedSupabaseProject(url);
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: createGuardedFetch(),
      },
    });
  }
  return client;
}
