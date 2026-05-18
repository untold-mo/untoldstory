import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fetchCode = readFileSync(join(root, 'n8n/_snippets/fetch-linkedin-leads-body.js'), 'utf8');
const insertCode = readFileSync(join(root, 'n8n/meta-leads-to-supabase.workflow.json'), 'utf8');
const metaInsertMatch = insertCode.match(/"name": "Insert into Supabase"[\s\S]*?"jsCode": "([\s\S]*?)"\s*,\s*"id": "code-insert-supabase"/);
let insertJs = metaInsertMatch ? metaInsertMatch[1].replace(/\\n/g, '\n') : '';
insertJs = insertJs
  .replace(/ev-meta-/g, 'ev-li-')
  .replace(/تكامل Meta/g, 'تكامل LinkedIn')
  .replace(/Meta Lead ID/g, 'LinkedIn Response')
  .replace(/lead\.meta_lead_id/g, 'lead.linkedin_response_id')
  .replace(/lead\.page_name/g, 'lead.account_name')
  .replace(/lead\.form_name/g, 'lead.form_name')
  .replace(/score: 55/g, 'score: 52');

const wf = {
  name: 'LinkedIn Lead Gen → Supabase (linkedin)',
  nodes: [
    {
      parameters: {
        content:
          '## ترتيب الإعداد\n\n### 0) Supabase API\nHost + Service Role → عقدة **Insert into Supabase**\n\n### 4) LinkedIn Lead Gen\n**Credentials → LinkedIn OAuth2 API** → Connect\n(صلاحيات: r_ads_reporting على تطبيق LinkedIn Developers)\n\nعقدة **Fetch LinkedIn Leads** → نفس الـ Credential\n\n**Workflow → Static Data** (اختياري):\n`{"linkedInMaxPerRun":80,"defaultAssignedToId":"u_xxx"}`\n\nManual → Active',
        height: 400,
        width: 520,
        color: 3,
      },
      id: 'sticky-linkedin-setup',
      name: 'Setup (اقرأني)',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [-320, -160],
    },
    {
      parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } },
      id: 'trigger-schedule-li',
      name: 'Every 15 minutes',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [240, 0],
    },
    {
      parameters: {},
      id: 'trigger-manual-li',
      name: 'Manual',
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [240, 200],
    },
    {
      parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: fetchCode },
      id: 'code-fetch-linkedin',
      name: 'Fetch LinkedIn Leads',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [520, 100],
      credentials: {
        linkedInOAuth2Api: { id: 'CONFIGURE_IN_N8N', name: 'LinkedIn account' },
      },
    },
    {
      parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: insertJs },
      id: 'code-insert-li-supabase',
      name: 'Insert into Supabase',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [800, 100],
      credentials: {
        supabaseApi: { id: 'CONFIGURE_IN_N8N', name: 'Supabase — Untold Story' },
      },
    },
  ],
  connections: {
    'Every 15 minutes': { main: [[{ node: 'Fetch LinkedIn Leads', type: 'main', index: 0 }]] },
    Manual: { main: [[{ node: 'Fetch LinkedIn Leads', type: 'main', index: 0 }]] },
    'Fetch LinkedIn Leads': { main: [[{ node: 'Insert into Supabase', type: 'main', index: 0 }]] },
  },
  pinData: {},
  settings: { executionOrder: 'v1' },
  staticData: null,
  tags: [{ name: 'leads' }, { name: 'linkedin' }, { name: 'supabase' }],
  triggerCount: 1,
  meta: { templateCredsSetupCompleted: true },
};

writeFileSync(join(root, 'n8n/linkedin-leads-to-supabase.workflow.json'), JSON.stringify(wf, null, 2) + '\n');
console.log('Wrote linkedin-leads-to-supabase.workflow.json');
