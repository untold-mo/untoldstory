import { config } from 'dotenv';
config({ path: '.env.migrate' });
import pg from 'pg';
const connStr = process.env.NEW_DIRECT_URL.replace(/\?.*$/, '');
const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();

// الأعمدة المتوقعة لكل جدول (من postgrestMappers.ts + directApiSb.ts)
const expected = {
  leads: ['id','email','name','phone','company','source','status','assigned_to_id','created_by_id','score','sla_status','timeline_json','follow_up_at','loss_reason_code','created_at','updated_at','source_label','company_size','budget'],
  users: ['id','email','name','role','avatar','base_salary','skills_json','stats_json','is_team_leader','team_leader_id','created_at','updated_at'],
  price_quotes: ['id','lead_id','title','amount','total_amount','vat_rate','vat_amount','production_cost_amount','company_margin_percent','initial_payment','cost_center','status','created_by_id','created_by_name','priced_by_id','priced_by_name','production_assigned_id','production_assigned_name','note','pricing_note','approved_at','approved_by','client_accepted_at','client_rejected_at','client_rejection_note','payment_schedule_json','client_payments_json','invoice_id','line_items_json','created_at','updated_at'],
  invoices: ['id','lead_id','price_quote_id','customer_name','amount','paid_amount','remaining_amount','payment_method','next_due_date','status','record_origin','collections_json','lines_json','date','created_at','updated_at'],
  expenses: ['id','amount','category','vendor','description','date','submitted_by_id','submitted_by_name','status','created_at','updated_at'],
  monthly_targets: ['id','rep_id','month_key','leads_target','revenue_target','calls_target','daily_calls_target','weekly_calls_target','created_at','updated_at'],
  audit_events: ['id','action','entity_type','entity_id','actor_id','actor_name','details','created_at'],
  workspace_state: ['id','doc_json','updated_at'],
  accounting_policy: ['id','policy_notes','allowed_cost_centers_json','min_amount_highlight','updated_at'],
  custody_settings: ['id','custody_account_map_json','updated_at'],
  manual_customers: ['id','customer_code','name','company','phone','email','created_at','updated_at'],
  manual_journal_entries: ['id','date','type','amount','description','cost_center','created_at'],
  projects: ['id','title','description','status','created_at','updated_at'],
};

let hasIssues = false;
for (const [table, cols] of Object.entries(expected)) {
  const { rows } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table]);
  const existing = new Set(rows.map(r => r.column_name));
  const missing = cols.filter(c => !existing.has(c));
  if (missing.length > 0) {
    console.log(`❌ ${table}: ناقص ${missing.join(', ')}`);
    hasIssues = true;
  } else {
    console.log(`✅ ${table}`);
  }
}
if (!hasIssues) console.log('\nكل الأعمدة موجودة ✅');
await client.end();
