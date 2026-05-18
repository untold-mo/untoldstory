export type LeadSourceFilter =
  | 'all'
  | 'facebook'
  | 'instagram'
  | 'google'
  | 'linkedin'
  | 'email'
  | 'manual';

/** Canonical slug stored in DB (facebook, instagram, google, …). */
export function normalizeLeadSource(source: string | null | undefined): string {
  const s = String(source || '').trim().toLowerCase();
  if (!s) return 'other';
  if (s === 'facebook' || s === 'fb') return 'facebook';
  if (s === 'instagram' || s === 'ig') return 'instagram';
  if (s === 'google') return 'google';
  if (s === 'linkedin') return 'linkedin';
  if (s === 'email') return 'email';
  if (s === 'يدوي' || s === 'manual') return 'manual';
  if (/فيسبوك|facebook|lead\s*ads|meta-lead|facebook\s*leads/.test(s)) return 'facebook';
  if (/إنستجرام|instagram|\binsta\b/.test(s)) return 'instagram';
  if (/google|جوجل|google\s*ads|google\s*sheet/.test(s)) return 'google';
  if (/linkedin|لينكد/.test(s)) return 'linkedin';
  if (/email|بريد|inbox|leads\s*inbox/.test(s)) return 'email';
  return s;
}

export function leadMatchesSourceFilter(
  source: string | null | undefined,
  filter: LeadSourceFilter,
): boolean {
  if (filter === 'all') return true;
  return normalizeLeadSource(source) === filter;
}

export function leadSourceDisplayLabel(source: string | null | undefined): string {
  const n = normalizeLeadSource(source);
  switch (n) {
    case 'facebook':
      return 'Facebook';
    case 'instagram':
      return 'Instagram';
    case 'google':
      return 'Google';
    case 'linkedin':
      return 'LinkedIn';
    case 'email':
      return 'Email';
    case 'manual':
      return 'يدوي';
    default:
      return source?.trim() || '—';
  }
}

export function isAutoImportedLeadSource(source: string | null | undefined): boolean {
  const n = normalizeLeadSource(source);
  return n === 'facebook' || n === 'instagram' || n === 'google' || n === 'linkedin' || n === 'email';
}
