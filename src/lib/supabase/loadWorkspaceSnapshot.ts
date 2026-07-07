import { getSupabase } from '@/lib/supabase/client';
import { ensureSupabaseSession } from '@/lib/supabase/session';
import {
  isFullCrmRole as isFullCrmRoleShared,
  isRep as isRepShared,
  isProductionManager as isProductionRoleShared,
  isAccountant as isAccountantRoleShared,
} from '@/lib/auth/roles';
import type {
  Lead,
  User,
  ManualCustomer,
  Expense,
  PriceQuote,
  ManualJournalEntry,
  MonthlyTarget,
  AuditEvent,
  ShootBooking,
  EquipmentBooking,
  MeetingBooking,
  AttendanceRecord,
} from '@/app/context/DataContext';
import { fetchAllLeadsFromSupabase } from '@/lib/supabase/fetchAllLeads';
import {
  mapLeadFromRow,
  mapUserListFromRow,
  mapManualCustomerFromRow,
  mapExpenseFromRow,
  mapPriceQuoteFromRow,
  mapManualJournalFromRow,
  mapAccountingPolicyFromRow,
  mapClosedMonthFromRow,
  mapMonthlyTargetFromRow,
  mapCustodySettingsMap,
  mapAuditFromRow,
  mapDocJsonRow,
  mapAttendanceFromRow,
  mapInvoiceRowRaw,
} from '@/lib/supabase/postgrestMappers';

export type SupabaseWorkspaceSnapshot = {
  leadsList: Lead[];
  /** false = فشل جلب الليدز — لا تستبدل القائمة المحلية بمصفوفة فارغة */
  leadsFetchOk: boolean;
  rawUsers: User[];
  customers: ManualCustomer[];
  invsRaw: Record<string, unknown>[];
  exps: Expense[];
  quotes: PriceQuote[];
  pol: ReturnType<typeof mapAccountingPolicyFromRow>;
  journals: ManualJournalEntry[];
  closedM: string[];
  targets: MonthlyTarget[];
  custodyMap: Record<string, string> | null;
  auditList: AuditEvent[];
  custodyList: unknown[];
  shootList: ShootBooking[];
  equipList: EquipmentBooking[];
  meetList: MeetingBooking[];
  workspaceDoc: Record<string, unknown>;
  attendanceRec: AttendanceRecord[];
};

type SbRead = PromiseLike<{ data: unknown; error: { message: string } | null }>;

async function rows<T>(
  promise: SbRead,
  map: (r: Record<string, unknown>) => T,
): Promise<T[]> {
  try {
    const { data, error } = await Promise.resolve(promise);
    if (error) {
      console.warn('[supabase workspace]', error.message);
      return [];
    }
    if (!Array.isArray(data)) return [];
    return data.map((x) => map(x as Record<string, unknown>));
  } catch (e) {
    console.warn('[supabase workspace]', e);
    return [];
  }
}

async function singleDocRows<T>(
  promise: SbRead,
): Promise<T[]> {
  try {
    const { data, error } = await Promise.resolve(promise);
    if (error) {
      console.warn('[supabase workspace]', error.message);
      return [];
    }
    if (!Array.isArray(data)) return [];
    const out: T[] = [];
    for (const row of data) {
      const doc = mapDocJsonRow<T>(row as Record<string, unknown>);
      if (doc) out.push(doc);
    }
    return out;
  } catch (e) {
    console.warn('[supabase workspace]', e);
    return [];
  }
}

export type WorkspaceViewer = { id: string; role: User['role']; isTeamLeader?: boolean };

export type WorkspaceFetchOptions = {
  /** للمالك/مدير المبيعات — يُحمَّل باقي الـ Workspace أولاً ثم الليدز في الخلفية */
  skipLeads?: boolean;
};

const INVOICES_LIST_SELECT =
  'id,customer_code,lead_id,customer_name,amount,vat_rate,vat_amount,total_amount,cost_center,status,date,record_origin,price_quote_id,paid_amount,remaining_amount,next_due_date,collections_json';

const USERS_LIST_SELECT =
  'id,email,name,role,base_salary,skills_json,stats_json,created_at,updated_at,is_team_leader,team_leader_id';

const EXPENSES_LIST_SELECT =
  'id,title,category,amount,vat_rate,vat_amount,total_amount,cost_center,status,approval_status,approved_by,vendor,note,date,submitted_by_id,submitted_by_name,payment_method';

const QUOTES_LIST_SELECT =
  'id,lead_id,customer_name,title,amount,vat_rate,vat_amount,total_amount,cost_center,note,created_by_id,created_by_name,created_at,status,production_assigned_id,production_assigned_name,priced_by_id,priced_by_name,priced_at,pricing_note,approved_by,approved_at,invoice_id,payment_schedule_json,initial_payment,client_payments_json,client_accepted_at,client_rejected_at,client_rejection_note,company_margin_percent,production_cost_amount,line_items_json';

const MANUAL_CUSTOMERS_LIST_SELECT =
  'id,customer_code,name,company,phone,email,source_label,created_at,created_by_id,created_by_name,created_by_role';

const AUDIT_LIST_SELECT =
  'id,action,entity_type,entity_id,actor_id,actor_name,details,created_at';

const ATTENDANCE_LIST_SELECT = 'id,rep_id,type,source,created_at';

const MONTHLY_TARGETS_LIST_SELECT =
  'rep_id,leads_target,revenue_target,calls_target,daily_calls_target,weekly_calls_target,commission_percent';

const CLOSED_MONTHS_LIST_SELECT = 'month_key';

const CUSTODY_SETTINGS_LIST_SELECT = 'custody_account_map_json';

// تفويض للمصدر الموحّد في @/lib/auth/roles — نفس المنطق تماماً، مصدر واحد للحقيقة.
function isFullCrmRole(role?: User['role']): boolean {
  return isFullCrmRoleShared(role);
}

function isRepRole(role?: User['role']): boolean {
  return isRepShared(role);
}

function isProductionRole(role?: User['role']): boolean {
  return isProductionRoleShared(role);
}

function isAccountantRole(role?: User['role']): boolean {
  return isAccountantRoleShared(role);
}

export async function fetchSupabaseWorkspaceSnapshot(
  viewer?: WorkspaceViewer,
  options?: WorkspaceFetchOptions,
): Promise<SupabaseWorkspaceSnapshot> {
  // انتظر جاهزية الجلسة قبل إطلاق ~17 استعلاماً — يمنع «permission denied» عند أول تحميل.
  await ensureSupabaseSession();
  const sb = getSupabase();
  const role = viewer?.role;
  const uid = viewer?.id?.trim() || '';

  const needLeads = isFullCrmRole(role) || isRepRole(role) || isAccountantRole(role);
  const needFinance = isFullCrmRole(role) || isAccountantRole(role);
  const needBookings = !isAccountantRole(role);
  const needAttendance = isFullCrmRole(role) || isAccountantRole(role);
  const needAudit = isFullCrmRole(role) || isAccountantRole(role);
  const needCustodyFunds = !isRepRole(role);
  const needCustomers = isFullCrmRole(role) || isAccountantRole(role);
  const needCustodySettings = needFinance || isProductionRole(role);
  const needQuotes = isFullCrmRole(role) || isAccountantRole(role) || isProductionRole(role);
  const skipLeads = Boolean(options?.skipLeads);

  const [
    leadsResult,
    rawUsers,
    customers,
    invsRaw,
    exps,
    quotes,
    polRow,
    journals,
    closedRows,
    targets,
    custodyRow,
    auditList,
    custodyDocs,
    shootRows,
    equipRows,
    meetRows,
    wsRow,
    attendanceRec,
  ] = await Promise.all([
    needLeads && !skipLeads
      ? (async (): Promise<{ list: Lead[]; ok: boolean }> => {
          try {
            const scopeToOwn = isRepRole(role) && uid && !viewer?.isTeamLeader;
            const list = await fetchAllLeadsFromSupabase(
              sb,
              scopeToOwn ? { assignedToId: uid } : undefined,
            );
            return { list, ok: true };
          } catch (e) {
            console.warn('[supabase workspace] leads fetch failed', e);
            return { list: [], ok: false };
          }
        })()
      : Promise.resolve({ list: [] as Lead[], ok: true }),
    rows(
      sb.from('users').select(USERS_LIST_SELECT).order('name', { ascending: true }),
      mapUserListFromRow,
    ),
    needCustomers
      ? rows(
          sb.from('manual_customers').select(MANUAL_CUSTOMERS_LIST_SELECT).order('created_at', { ascending: false }),
          mapManualCustomerFromRow,
        )
      : Promise.resolve([] as ManualCustomer[]),
    needFinance
      ? (async () => {
          const { data, error } = await sb
            .from('invoices')
            .select(INVOICES_LIST_SELECT)
            .order('date', { ascending: false });
          if (error) {
            console.warn('[supabase workspace]', error.message);
            return [];
          }
          return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
        })()
      : Promise.resolve([] as Record<string, unknown>[]),
    needFinance
      ? rows(
          sb.from('expenses').select(EXPENSES_LIST_SELECT).order('date', { ascending: false }),
          mapExpenseFromRow,
        )
      : Promise.resolve([] as Expense[]),
    needQuotes
      ? (async () => {
          let q = sb
            .from('price_quotes')
            .select(QUOTES_LIST_SELECT)
            .order('created_at', { ascending: false });
          if (isProductionRole(role) && uid) {
            q = q.or(
              `production_assigned_id.eq.${uid},priced_by_id.eq.${uid},created_by_id.eq.${uid}`,
            );
          }
          const { data, error } = await q;
          if (error) {
            console.warn('[supabase workspace] quotes', error.message);
            return [] as PriceQuote[];
          }
          return Array.isArray(data)
            ? data.map((r) => mapPriceQuoteFromRow(r as Record<string, unknown>))
            : [];
        })()
      : Promise.resolve([] as PriceQuote[]),
    needFinance
      ? (async () => {
          const { data, error } = await sb.from('accounting_policy').select('*').eq('id', 'default').maybeSingle();
          if (error) {
            console.warn('[supabase workspace]', error.message);
            return null;
          }
          return data ? mapAccountingPolicyFromRow(data as Record<string, unknown>) : null;
        })()
      : Promise.resolve(null),
    needFinance
      ? rows(
          sb.from('manual_journal_entries').select('*').order('date', { ascending: false }).limit(500),
          mapManualJournalFromRow,
        )
      : Promise.resolve([] as ManualJournalEntry[]),
    needFinance
      ? rows(sb.from('closed_months').select(CLOSED_MONTHS_LIST_SELECT), mapClosedMonthFromRow)
      : Promise.resolve([] as string[]),
    needFinance
      ? rows(sb.from('monthly_targets').select(MONTHLY_TARGETS_LIST_SELECT), mapMonthlyTargetFromRow)
      : Promise.resolve([] as MonthlyTarget[]),
    needCustodySettings
      ? (async () => {
          const { data, error } = await sb
            .from('custody_settings')
            .select(CUSTODY_SETTINGS_LIST_SELECT)
            .limit(1)
            .maybeSingle();
          if (error) {
            console.warn('[supabase workspace]', error.message);
            return null;
          }
          return data ? mapCustodySettingsMap(data as Record<string, unknown>) : null;
        })()
      : Promise.resolve(null),
    needAudit
      ? rows(
          sb.from('audit_events').select(AUDIT_LIST_SELECT).order('created_at', { ascending: false }).limit(500),
          mapAuditFromRow,
        )
      : Promise.resolve([] as AuditEvent[]),
    needCustodyFunds
      ? singleDocRows<Record<string, unknown>>(
          sb.from('custody_funds').select('id,doc_json,updated_at').order('updated_at', { ascending: false }),
        )
      : Promise.resolve([] as Record<string, unknown>[]),
    needBookings
      ? singleDocRows<ShootBooking>(
          sb.from('shoot_bookings').select('id,doc_json,updated_at').order('updated_at', { ascending: false }),
        )
      : Promise.resolve([] as ShootBooking[]),
    needBookings
      ? singleDocRows<EquipmentBooking>(
          sb.from('equipment_bookings').select('id,doc_json,updated_at').order('updated_at', { ascending: false }),
        )
      : Promise.resolve([] as EquipmentBooking[]),
    needBookings
      ? singleDocRows<MeetingBooking>(
          sb.from('meeting_bookings').select('id,doc_json,updated_at').order('updated_at', { ascending: false }),
        )
      : Promise.resolve([] as MeetingBooking[]),
    (async () => {
      const { data, error } = await sb.from('workspace_state').select('doc_json').eq('id', 'default').maybeSingle();
      if (error) {
        console.warn('[supabase workspace]', error.message);
        return {};
      }
      const doc = (data as { doc_json?: unknown } | null)?.doc_json;
      return doc && typeof doc === 'object' ? (doc as Record<string, unknown>) : {};
    })(),
    needAttendance
      ? rows(
          sb.from('attendance_records').select(ATTENDANCE_LIST_SELECT).order('created_at', { ascending: false }).limit(2000),
          mapAttendanceFromRow,
        )
      : Promise.resolve([] as AttendanceRecord[]),
  ]);

  const leadsList = leadsResult.list;
  const leadsFetchOk = leadsResult.ok;

  const closedMonthsClean = closedRows.filter((k) => {
    if (typeof k !== 'string' || !/^\d{4}-\d{2}$/.test(k)) return false;
    const m = Number(k.slice(5, 7));
    return m >= 1 && m <= 12;
  });

  return {
    leadsList,
    leadsFetchOk,
    rawUsers,
    customers,
    invsRaw,
    exps,
    quotes,
    pol: polRow,
    journals,
    closedM: closedMonthsClean,
    targets,
    custodyMap: custodyRow,
    auditList,
    custodyList: custodyDocs,
    shootList: shootRows,
    equipList: equipRows,
    meetList: meetRows,
    workspaceDoc: wsRow,
    attendanceRec,
  };
}

/** تصفية البيانات المحمّلة حسب الدور — يقلّل تسريب CRM في وضع Supabase المباشر */
export function filterWorkspaceSnapshotForViewer(
  snap: SupabaseWorkspaceSnapshot,
  viewer: WorkspaceViewer,
): SupabaseWorkspaceSnapshot {
  const uid = String(viewer.id).trim();
  if (viewer.role === 'مندوب') {
    const teamIds = viewer.isTeamLeader
      ? new Set<string>(
          [uid, ...snap.rawUsers.filter((u) => u.teamLeaderId === uid).map((u) => u.id)],
        )
      : null;
    const inScope = (assignedTo?: string): boolean => {
      const a = String(assignedTo || '').trim();
      if (!teamIds) return a === uid;
      return !a || teamIds.has(a);
    };
    const myLeadIds = new Set(
      snap.leadsList.filter((l) => inScope(l.assignedTo)).map((l) => l.id),
    );
    return {
      ...snap,
      leadsList: snap.leadsList.filter((l) => inScope(l.assignedTo)),
      quotes: snap.quotes.filter((q) => String(q.createdById || '').trim() === uid),
      invsRaw: snap.invsRaw.filter((raw) => myLeadIds.has(String((raw as { lead_id?: string }).lead_id || ''))),
      rawUsers: snap.rawUsers.map((u) =>
        u.id === uid ? u : { ...u, email: undefined, baseSalary: undefined },
      ),
    };
  }
  if (viewer.role === 'مدير إنتاج') {
    return {
      ...snap,
      quotes: snap.quotes.filter(
        (q) =>
          String(q.productionAssignedId || '').trim() === uid ||
          String(q.pricedById || '').trim() === uid,
      ),
      shootList: snap.shootList.filter(
        (b) => String(b.productionAssignedId || '').trim() === uid,
      ),
      invsRaw: [],
    };
  }
  if (viewer.role === 'محاسب') {
    const approvedLeadIds = new Set(
      snap.invsRaw
        .filter((raw) => String((raw as { record_origin?: string }).record_origin || '') === 'عرض_سعر_معتمد')
        .map((raw) => String((raw as { lead_id?: string }).lead_id || ''))
        .filter((id) => id && id !== 'manual'),
    );
    return {
      ...snap,
      leadsList: snap.leadsList.filter((l) => approvedLeadIds.has(l.id)),
      quotes: snap.quotes.filter((q) => q.status === 'مكتمل' || Boolean(q.invoiceId)),
      rawUsers: snap.rawUsers.map((u) => ({ ...u, baseSalary: undefined })),
    };
  }
  return snap;
}

export { mapInvoiceRowRaw };
