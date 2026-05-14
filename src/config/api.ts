/** عنوان باك اند Express (تطوير: غالباً localhost:4000) */
export function getApiBaseUrl(): string {
  const u = import.meta.env.VITE_API_URL?.trim();
  if (u) return u.replace(/\/+$/, '');
  return 'http://localhost:4000';
}
