async function resolveLinkedInToken() {
  try {
    const li = await this.getCredentials('linkedInOAuth2Api');
    const t = String(li.oauthTokenData?.access_token || li.accessToken || li.access_token || '').trim();
    if (t) return t;
  } catch (_) {}
  try {
    const h = await this.getCredentials('httpHeaderAuth');
    let v = String(h.value || h.headerValue || '').trim();
    if (v.toLowerCase().startsWith('bearer ')) v = v.slice(7).trim();
    if (v) return v;
  } catch (_) {}
  const sd = $getWorkflowStaticData('global');
  if (sd.linkedInAccessToken) return String(sd.linkedInAccessToken).trim();
  return '';
}
const TOKEN = await resolveLinkedInToken.call(this);
const MAX = Math.min(120, Math.max(1, Number($getWorkflowStaticData('global').linkedInMaxPerRun || 80)));
if (!TOKEN) {
  throw new Error('ربط LinkedIn: Credentials → LinkedIn OAuth2 على عقدة Fetch LinkedIn Leads (أو Header Auth Bearer)');
}

const staticData = $getWorkflowStaticData('global');
if (!Array.isArray(staticData.processedLinkedInIds)) staticData.processedLinkedInIds = [];
const processed = new Set(staticData.processedLinkedInIds);

async function liGet(url) {
  return await this.helpers.httpRequest({
    method: 'GET',
    url,
    headers: { Authorization: `Bearer ${TOKEN}`, 'X-Restli-Protocol-Version': '2.0.0' },
    json: true,
    timeout: 60000,
  });
}

function extractStrings(el) {
  const out = [];
  function walk(n, d) {
    if (d > 12 || n == null) return;
    if (typeof n === 'string') {
      const t = n.trim();
      if (t) out.push(t);
      return;
    }
    if (Array.isArray(n)) {
      for (const x of n) walk(x, d + 1);
      return;
    }
    if (typeof n !== 'object') return;
    for (const v of Object.values(n)) {
      if (v && (typeof v === 'object' || typeof v === 'string')) walk(v, d + 1);
    }
  }
  walk(el, 0);
  return out;
}

function parseStrings(strings) {
  let email = '';
  let phone = '';
  let fullName = '';
  for (const s of strings) {
    if (!email && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(s)) email = s.trim().toLowerCase();
    else if (!phone && /^[\d+\-().\s]{7,}$/.test(s.replace(/\s/g, ''))) phone = s.replace(/\s+/g, '').trim();
    else if (!fullName && s.length > 2 && !/^\d+$/.test(s) && !s.includes('@')) fullName = s.trim();
  }
  if (!fullName && strings[0]) fullName = strings[0].trim();
  return { email, phone, fullName };
}

const out = [];
let graphErrors = 0;
let accountsRes;
try {
  accountsRes = await liGet.call(
    this,
    'https://api.linkedin.com/v2/adAccountsV2?q=search&search.type=ENTERPRISE&search.status=ACTIVE&count=15',
  );
} catch (e) {
  throw new Error(`LinkedIn API: ${e.message}. تأكد من OAuth وصلاحية r_ads_reporting`);
}

const accounts = accountsRes.elements || [];
for (const acct of accounts.slice(0, 8)) {
  const acctId = acct.id != null ? String(acct.id) : null;
  const acctName = acct.name || acct.localizedName || acctId || 'حساب إعلانات';
  if (!acctId) continue;
  const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${acctId}`);
  let formsRes;
  try {
    formsRes = await liGet.call(
      this,
      `https://api.linkedin.com/v2/adLeadGenForms?q=account&account=${accountUrn}&count=25`,
    );
  } catch {
    graphErrors += 1;
    continue;
  }
  for (const form of formsRes.elements || []) {
    const formId = form.id != null ? String(form.id) : null;
    const formName = form.name || form.localizedName || formId || 'نموذج';
    if (!formId) continue;
    const formUrn = encodeURIComponent(`urn:li:leadGenForm:${formId}`);
    let respRes;
    try {
      respRes = await liGet.call(
        this,
        `https://api.linkedin.com/v2/adLeadGenResponses?q=form&form=${formUrn}&count=50`,
      );
    } catch {
      graphErrors += 1;
      continue;
    }
    for (const row of respRes.elements || []) {
      if (out.length >= MAX) break;
      const rowId = row.id != null ? String(row.id) : `${formId}-${out.length}`;
      if (processed.has(rowId)) continue;
      const parsed = parseStrings(extractStrings(row));
      let email = (parsed.email || '').toLowerCase().trim();
      let phone = (parsed.phone || '').replace(/\s+/g, '').trim();
      const name = ((parsed.fullName || '').trim() || 'عميل إعلان').slice(0, 200);
      const company = (acctName || '—').slice(0, 200);
      if (!email && !phone) email = `lead-${rowId}@linkedin-lead.local`;
      if (!phone) phone = '01000000000';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = `lead-${rowId}@linkedin-lead.local`;
      const createdAt =
        row.submittedAt != null ? new Date(Number(row.submittedAt)).toISOString() : new Date().toISOString();
      out.push({
        linkedin_response_id: rowId,
        name,
        company,
        phone,
        email,
        source: 'linkedin',
        account_name: acctName,
        form_name: formName,
        created_time: createdAt,
      });
      processed.add(rowId);
    }
    if (out.length >= MAX) break;
  }
  if (out.length >= MAX) break;
}

staticData.processedLinkedInIds = Array.from(processed).slice(-1500);

if (out.length === 0) {
  return [
    {
      json: {
        _summary: true,
        fetched: 0,
        graph_errors: graphErrors,
        accounts: accounts.length,
        message: accounts.length === 0 ? 'No LinkedIn ad accounts for this token.' : 'No new LinkedIn leads in this run.',
      },
    },
  ];
}
return out.map((item) => ({ json: item }));
