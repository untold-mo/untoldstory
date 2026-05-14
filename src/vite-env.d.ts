/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** SPA canonical URL without trailing slash, e.g. https://untoldstories.example.com */
  readonly VITE_PUBLIC_APP_URL?: string;
  /** Express API origin for login and REST, e.g. http://localhost:4000 */
  readonly VITE_API_URL?: string;
  /** `server` = ليدز/فريق من API، بدون بيانات تجريبية محلية */
  readonly VITE_DATA_SOURCE?: string;
  /** `1` = الواجهة تتصل بـ Supabase مباشرة (Auth + PostgREST) بدل Express عند ضبط URL والمفتاح */
  readonly VITE_USE_SUPABASE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** API host for OAuth start routes; omit if same-origin as the app */
  readonly VITE_OAUTH_API_ORIGIN?: string;
  /** Vite asset base path, always start and end with / (e.g. / or /app/) */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
