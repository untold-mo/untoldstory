/** توحيد أرقام الجوال — مصر (01…) + دولي (+971… / +44…) */

export function normalizeLeadPhone(raw: string | number | null | undefined): string {
  if (raw == null || raw === '') return '';
  let s = String(raw).trim();
  if (!s) return '';

  if (/^\d+\.?\d*e\+\d+$/i.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) s = String(Math.round(n));
  }

  const hadPlus = s.startsWith('+') || s.includes('+');
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';

  // مصر محلي: 01xxxxxxxxx
  if (digits.length === 11 && digits.startsWith('01')) return digits;

  // مصر بدون صفر: 10xxxxxxxxx
  if (digits.length === 10 && digits.startsWith('1')) return `0${digits}`;

  // مصر دولي: 20 + 10xxxxxxxxx
  if (digits.startsWith('20') && digits.length === 12 && digits[2] === '1') {
    return `0${digits.slice(2)}`;
  }

  // دولي أو رقم طويل — احتفظ بـ + للوضوح
  if (digits.length >= 8 && digits.length <= 15) {
    if (hadPlus || digits.length > 11 || !digits.startsWith('0')) {
      return `+${digits}`;
    }
    return digits;
  }

  if (digits.length >= 7 && digits.length <= 15) return digits;
  return digits.slice(0, 15);
}

export function isValidLeadPhone(raw: string | number | null | undefined): boolean {
  const normalized = normalizeLeadPhone(raw);
  if (!normalized) return false;
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** للمقارنة عند كشف التكرار */
export function leadPhoneDigitsKey(raw: string | number | null | undefined): string {
  return normalizeLeadPhone(raw).replace(/\D/g, '');
}

export function isLikelySpreadsheetPhoneNumber(n: number): boolean {
  if (!Number.isFinite(n) || n <= 0) return false;
  const rounded = Math.round(n);
  const len = String(rounded).length;
  return len >= 7 && len <= 15;
}

/** @deprecated use normalizeLeadPhone */
export const normalizeSpreadsheetPhone = normalizeLeadPhone;
