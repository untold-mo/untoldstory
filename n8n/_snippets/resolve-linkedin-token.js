// بداية عقدة Fetch LinkedIn Leads
async function resolveLinkedInToken() {
  try {
    const li = await this.getCredentials('linkedInOAuth2Api');
    const t = String(
      li.oauthTokenData?.access_token || li.accessToken || li.access_token || '',
    ).trim();
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
