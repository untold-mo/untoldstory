import { csvRowsToObjects, parseCsvText } from '@/lib/csv/parseCsvText';
import { normalizeLeadPhone } from '@/lib/leadPhone';

export type LinkedInCsvLeadRow = {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: 'linkedin';
  status: 'جديد';
  budget: number;
  companySize: 'صغير' | 'متوسط' | 'كبير';
  category: string;
  linkedinRowIndex: number;
};

export type LinkedInCsvParseResult = {
  rows: LinkedInCsvLeadRow[];
  skipped: number;
  errors: string[];
};

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseLinkedInLeadsCsv(fileText: string): LinkedInCsvParseResult {
  const matrix = parseCsvText(fileText);
  const objects = csvRowsToObjects(matrix);
  const rows: LinkedInCsvLeadRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  objects.forEach((raw, idx) => {
    const rowNum = idx + 2;
    const first = pick(raw, ['first_name', 'firstname', 'first', 'given_name']);
    const last = pick(raw, ['last_name', 'lastname', 'last', 'family_name', 'surname']);
    let name = pick(raw, ['full_name', 'fullname', 'name', 'lead_name', 'contact_name']);
    if (!name) name = [first, last].filter(Boolean).join(' ').trim();

    let email = normalizeEmail(
      pick(raw, [
        'email',
        'email_address',
        'work_email',
        'business_email',
        'emailaddress',
      ]),
    );
    let phone = normalizeLeadPhone(
      pick(raw, [
        'phone',
        'phone_number',
        'mobile',
        'mobile_phone',
        'work_phone',
        'phonenumber',
      ]),
    );
    let company = pick(raw, [
      'company',
      'company_name',
      'organization',
      'organisation',
      'business_name',
      'account_name',
    ]);
    const jobTitle = pick(raw, ['job_title', 'title', 'position']);
    if (!company && jobTitle) company = jobTitle;

    if (!name) name = company || 'عميل LinkedIn';
    if (!company) company = '—';

    if (!email && !phone) {
      skipped += 1;
      errors.push(`صف ${rowNum}: لا يوجد بريد أو جوال — تم تخطيه`);
      return;
    }

    if (!email) email = `linkedin-row-${rowNum}@lead.local`;
    if (!phone) phone = '01000000000';
    if (!isValidEmail(email)) email = `linkedin-row-${rowNum}@lead.local`;

    rows.push({
      name: name.slice(0, 200),
      company: company.slice(0, 200),
      phone,
      email,
      source: 'linkedin',
      status: 'جديد',
      budget: 0,
      companySize: 'صغير',
      category: 'إعلانات',
      linkedinRowIndex: rowNum,
    });
  });

  return { rows, skipped, errors };
}
