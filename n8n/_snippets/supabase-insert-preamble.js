// يُنسخ بداية عقدة «Insert into Supabase» في workflows الليدز (n8n Code node)
async function resolveSupabase() {
  let url = '';
  let key = '';
  try {
    const sb = await this.getCredentials('supabaseApi');
    url = String(sb.host || sb.url || '').replace(/\/$/, '');
    key = String(sb.serviceRole || sb.serviceRoleKey || '').trim();
  } catch (_) {}
  if (!url) url = String($env.SUPABASE_URL || '').replace(/\/$/, '');
  if (!key) key = String($env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) {
    throw new Error(
      'ربط Supabase: في عقدة Insert اختر Credential من نوع Supabase API (Host + Service Role)، أو عيّن Environment.',
    );
  }
  return { url, key };
}
const { url: SUPABASE_URL, key: KEY } = await resolveSupabase.call(this);
const sd = $getWorkflowStaticData('global');
const ASSIGNED = sd.defaultAssignedToId || $env.DEFAULT_ASSIGNED_TO_ID || null;
