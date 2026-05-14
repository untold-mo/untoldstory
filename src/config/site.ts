import { getApiBaseUrl } from './api';

/** Trim trailing slashes for origins; keep a single leading slash on paths. */
function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Canonical public URL of the SPA (e.g. https://app.example.com).
 * When set, OAuth callbacks and similar links use this instead of window.location.origin
 * (useful behind proxies, preview domains, or split front/back hosts).
 */
export function getAppPublicOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (fromEnv) return trimTrailingSlashes(fromEnv);
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * Base URL where `/api/integrations/auth/...` is served.
 * - Development: defaults to the SPA origin so Vite can proxy `/api/integrations` to port 8787.
 * - Production: defaults to `VITE_API_URL` so OAuth runs on the same deployed Express API (HTTPS).
 * Override anytime with `VITE_OAUTH_API_ORIGIN`.
 */
export function getOAuthApiOrigin(): string {
  const fromEnv = import.meta.env.VITE_OAUTH_API_ORIGIN?.trim();
  if (fromEnv) return trimTrailingSlashes(fromEnv);
  if (import.meta.env.PROD) return trimTrailingSlashes(getApiBaseUrl());
  return getAppPublicOrigin();
}
