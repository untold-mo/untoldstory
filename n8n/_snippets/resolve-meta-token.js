// بداية عقدة Fetch Meta Leads
async function resolveMetaToken() {
  try {
    const fad = await this.getCredentials('facebookLeadAdsOAuth2Api');
    const t = String(
      fad.oauthTokenData?.access_token || fad.accessToken || fad.access_token || '',
    ).trim();
    if (t) return t;
  } catch (_) {}
  try {
    const fb = await this.getCredentials('facebookGraphApi');
    const t = String(fb.accessToken || fb.access_token || '').trim();
    if (t) return t;
  } catch (_) {}
  const sd = $getWorkflowStaticData('global');
  if (sd.metaAccessToken) return String(sd.metaAccessToken).trim();
  return String($env.META_PAGE_ACCESS_TOKEN || $env.META_ACCESS_TOKEN || '').trim();
}
const META_TOKEN = await resolveMetaToken.call(this);
