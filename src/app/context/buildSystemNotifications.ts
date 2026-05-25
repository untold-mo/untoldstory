import { isAutoImportedLeadSource } from '@/lib/leadSource';
import { currencyLabel, dateLocale, st, stMore } from '@/lib/sysNotifyT';
import { getMonthKey } from './dateMonthKey';
import { hasAssignedActiveSalesLead, operationalBaselineForPayrollReminder } from './notificationGates';
import type {
  CustodyFund,
  EquipmentBooking,
  Expense,
  Invoice,
  Lead,
  LeadIngestionSettings,
  MeetingBooking,
  MonthlyTarget,
  PayrollApproval,
  PayrollApprovalRequest,
  FinancialPeriodReopenRequest,
  PersonalTodo,
  PriceQuote,
  SlaEscalationSettings,
  ShootBooking,
  SystemNotification,
  User,
} from './DataContext';

export type BuildSystemNotificationsInput = {
  leads: Lead[];
  users: User[];
  expenses: Expense[];
  invoices: Invoice[];
  payrollApprovals: PayrollApproval[];
  payrollApprovalRequests: PayrollApprovalRequest[];
  financialReopenRequests: FinancialPeriodReopenRequest[];
  monthlyTargets: MonthlyTarget[];
  shootBookings: ShootBooking[];
  equipmentBookings: EquipmentBooking[];
  meetingBookings: MeetingBooking[];
  priceQuotes: PriceQuote[];
  custodyFunds: CustodyFund[];
  leadIngestionSettings: LeadIngestionSettings;
  slaEscalationSettings: SlaEscalationSettings;
  attendanceRecordsCount: number;
  /** مهام شخصية لكل مستخدم (تظهر للمعني مباشرة في الجرس) */
  personalTodosByUserId?: Record<string, PersonalTodo[]>;
};

/** تجميع تنبيهات النظام من حالة الـ CRM (وحدة منفصلة عن DataContext لتقليل حجم الملف). */
export function buildSystemNotifications(input: BuildSystemNotificationsInput): SystemNotification[] {
  const {
    leads,
    users,
    expenses,
    invoices,
    payrollApprovals,
    payrollApprovalRequests,
    financialReopenRequests,
    monthlyTargets,
    shootBookings,
    equipmentBookings,
    meetingBookings,
    priceQuotes,
    custodyFunds,
    leadIngestionSettings,
    slaEscalationSettings,
    attendanceRecordsCount,
    personalTodosByUserId = {},
  } = input;

  const isPayrollApproved = (monthKey: string) => payrollApprovals.some((p) => p.monthKey === monthKey);
  const payrollReminderBaseline = operationalBaselineForPayrollReminder({
    attendanceRecordsCount,
    payrollApprovalsCount: payrollApprovals.length,
    payrollApprovalRequestsCount: payrollApprovalRequests.length,
  });
  const hasActiveAssignedLead = hasAssignedActiveSalesLead(leads);

    const now = new Date();
    const nowIso = now.toISOString();
    const monthKey = getMonthKey(nowIso);
    const out: SystemNotification[] = [];

    /** مهام مفتوحة لكل مستخدم — تصل للمعني فقط (موظف ← موظف عبر قائمة المستهدف) */
    for (const [uid, todos] of Object.entries(personalTodosByUserId || {})) {
      const open = (Array.isArray(todos) ? todos : []).filter((t) => !t.done).length;
      if (open === 0) continue;
      const u = users.find((x) => String(x.id).trim() === String(uid).trim());
      if (!u) continue;
      out.push({
        id: `n-open-personal-todos-${uid}`,
        level: 'medium',
        title: st('openPersonalTodos.title'),
        message: st('openPersonalTodos.message', { count: open }),
        createdAt: nowIso,
        targetRoles: [u.role],
        targetUserId: String(uid).trim(),
        entityType: 'system',
        navigateTab: 'home',
      });
    }

    const overdueFollowUps = leads.filter(l => {
      if (!l.followUpAt) return false;
      const ts = new Date(l.followUpAt).getTime();
      return ts < now.getTime() && l.status !== 'مغلق - فوز' && l.status !== 'مغلق - خسارة';
    });
    if (overdueFollowUps.length > 0) {
      const overdueFollowUpIds = overdueFollowUps.map((l) => l.id).filter(Boolean);
      out.push({
        id: `n-overdue-followups-${overdueFollowUps.length}`,
        level: 'high',
        title: st('overdueFollowupsTeam.title'),
        message: st('overdueFollowupsTeam.message', { count: overdueFollowUps.length }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'lead',
        queue: 'ops',
        navigateTab: 'leads',
        leadIds: overdueFollowUpIds,
      });
      const overdueByRep = users
        .filter((u) => u.role === 'مندوب')
        .map((rep) => ({
          rep,
          count: overdueFollowUps.filter((lead) => lead.assignedTo === rep.id).length,
        }))
        .filter((row) => row.count > 0);
      overdueByRep.forEach(({ rep, count }) => {
        const repLeadIds = overdueFollowUps
          .filter((lead) => lead.assignedTo === rep.id)
          .map((l) => l.id)
          .filter(Boolean);
        out.push({
          id: `n-overdue-followups-rep-${rep.id}-${count}`,
          level: 'high',
          title: st('overdueFollowupsMine.title'),
          message: st('overdueFollowupsMine.message', { count }),
          createdAt: nowIso,
          targetRoles: ['مندوب'],
          targetUserId: rep.id,
          entityType: 'lead',
          queue: 'ops',
          navigateTab: 'leads',
          leadIds: repLeadIds,
        });
      });
      users
        .filter((u) => u.role === 'مدير مبيعات')
        .forEach((mgr) => {
          const teamCount = overdueFollowUps.length;
          if (teamCount === 0) return;
          out.push({
            id: `n-overdue-followups-mgr-${mgr.id}-${teamCount}`,
            level: 'high',
            title: st('overdueFollowupsMgr.title'),
            message: st('overdueFollowupsMgr.message', { count: teamCount }),
            createdAt: nowIso,
            targetRoles: ['مدير مبيعات'],
            targetUserId: mgr.id,
            entityType: 'lead',
            navigateTab: 'leads',
            leadIds: overdueFollowUpIds,
          });
        });
    }

    const staleLeads = leads.filter((l) => {
      if (l.status === 'مغلق - فوز' || l.status === 'مغلق - خسارة') return false;
      const latestActivityAt = l.timeline[0]?.createdAt || l.updatedAt || l.createdAt;
      const ageMins = (now.getTime() - new Date(latestActivityAt).getTime()) / (1000 * 60);
      return ageMins >= slaEscalationSettings.criticalAfterMinutes;
    });
    if (staleLeads.length > 0) {
      out.push({
        id: `n-stale-escalation-${staleLeads.length}`,
        level: 'high',
        priority: 'critical',
        queue: 'ops',
        title: st('staleEscalation.title'),
        message: st('staleEscalation.message', { count: staleLeads.length }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'lead',
        navigateTab: 'leads',
        leadIds: staleLeads.map((l) => l.id).filter(Boolean),
      });
    }
    const autoReassignCandidates = leads.filter((l) => {
      if (!l.assignedTo) return false;
      if (l.status === 'مغلق - فوز' || l.status === 'مغلق - خسارة') return false;
      const latestActivityAt = l.timeline[0]?.createdAt || l.updatedAt || l.createdAt;
      const ageHours = (now.getTime() - new Date(latestActivityAt).getTime()) / (1000 * 60 * 60);
      return ageHours >= slaEscalationSettings.autoReassignAfterHours;
    });
    if (slaEscalationSettings.autoReassignAfterHours > 0 && autoReassignCandidates.length > 0) {
      out.push({
        id: `n-auto-reassign-candidates-${autoReassignCandidates.length}`,
        level: 'medium',
        title: st('autoReassign.title'),
        message: st('autoReassign.message', { count: autoReassignCandidates.length }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'lead',
        navigateTab: 'leads',
        leadIds: autoReassignCandidates.map((l) => l.id).filter(Boolean),
      });
    }

    const wonWithoutEvidence = leads.filter((l) => {
      if (l.status !== 'مغلق - فوز') return false;
      return !l.timeline.some((a) => Boolean(a.evidenceRef?.trim()));
    });
    if (wonWithoutEvidence.length > 0) {
      out.push({
        id: `n-archive-gap-${wonWithoutEvidence.length}`,
        level: 'medium',
        queue: 'ops',
        title: st('archiveGap.title'),
        message: st('archiveGap.message', { count: wonWithoutEvidence.length }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'lead',
        navigateTab: 'leads',
      });
    }

    const unassigned = leads.filter(l => !l.assignedTo && l.status !== 'مغلق - فوز' && l.status !== 'مغلق - خسارة');
    if (unassigned.length > 0) {
      out.push({
        id: `n-unassigned-${unassigned.length}`,
        level: 'medium',
        title: st('unassignedLeads.title'),
        message: st('unassignedLeads.message', { count: unassigned.length }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'lead',
        navigateTab: 'leads',
      });
    }

    /** تعيين ليد لمندوب/مدير مبيعات — آخر نشاط على الليد يبيّن التوجيه (حديثاً) */
    const ASSIGN_ACTION_RE = /تعيين المندوب|توزيع تلقائي/;
    const ASSIGN_MAX_MS = 14 * 24 * 60 * 60 * 1000;
    const leadsWithRecentAssignment = leads.filter((l) => {
      if (!l.assignedTo) return false;
      if (l.status === 'مغلق - فوز' || l.status === 'مغلق - خسارة') return false;
      const a = l.timeline?.[0];
      if (!a?.createdAt || !a?.action) return false;
      if (!ASSIGN_ACTION_RE.test(String(a.action))) return false;
      return now.getTime() - new Date(a.createdAt).getTime() <= ASSIGN_MAX_MS;
    });
    const assignByUser = new Map<string, Lead[]>();
    for (const l of leadsWithRecentAssignment) {
      const rid = String(l.assignedTo || '').trim();
      if (!rid) continue;
      const arr = assignByUser.get(rid) || [];
      if (arr.length < 30) arr.push(l);
      assignByUser.set(rid, arr);
    }
    assignByUser.forEach((list, assigneeId) => {
      const u = users.find((x) => String(x.id).trim() === assigneeId);
      if (!u || (u.role !== 'مندوب' && u.role !== 'مدير مبيعات')) return;
      const lines = list
        .slice(0, 8)
        .map((l) =>
          st('assignLeadLine', { name: l.name, company: l.company ? ` — ${l.company}` : '' })
        )
        .join('\n');
      const more = list.length > 8 ? `\n${stMore(list.length - 8)}` : '';
      out.push({
        id: `n-lead-assigned-to-${assigneeId}-${list.length}`,
        level: 'high',
        title: st('leadAssigned.title', { count: list.length }),
        message: st('leadAssigned.message', { count: list.length, lines, more }),
        createdAt: nowIso,
        targetRoles: [u.role],
        targetUserId: assigneeId,
        entityType: 'lead',
        navigateTab: 'leads',
        leadIds: list.map((l) => l.id).filter(Boolean),
      });
    });

    const managerId =
      leadIngestionSettings.managerUserId
      || users.find((u) => u.role === 'مدير مبيعات')?.id
      || '';
    const pendingImported = leads.filter((l) => {
      if (l.status !== 'جديد') return false;
      if (l.source !== 'Facebook Leads API' && !isAutoImportedLeadSource(l.source)) return false;
      if (!l.assignedTo) return true;
      return Boolean(managerId) && l.assignedTo === managerId;
    });
    if (pendingImported.length > 0 && managerId) {
      out.push({
        id: `n-imported-manager-${pendingImported.length}`,
        level: 'high',
        title: st('importedLeads.title'),
        message: st('importedLeads.message', { count: pendingImported.length }),
        createdAt: nowIso,
        targetRoles: ['مدير مبيعات', 'مالك'],
        targetUserId: managerId,
        entityType: 'lead',
        navigateTab: 'leads',
      });
      out.push({
        id: `n-imported-owner-copy-${pendingImported.length}`,
        level: 'medium',
        title: st('importedLeadsOwnerCopy.title'),
        message: st('importedLeadsOwnerCopy.message', { count: pendingImported.length }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'lead',
        navigateTab: 'leads',
      });
    }

    const pendingExpRows = expenses.filter((e) => e.approvalStatus === 'قيد الاعتماد');
    if (pendingExpRows.length > 0) {
      out.push({
        id: `n-pending-expenses-owner-${pendingExpRows.length}`,
        level: 'high',
        title: st('pendingExpensesOwner.title'),
        message: st('pendingExpensesOwner.message', { count: pendingExpRows.length }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'approvals',
      });
      out.push({
        id: `n-pending-expenses-accountant-${pendingExpRows.length}`,
        level: 'medium',
        title: st('pendingExpensesAccountant.title'),
        message: st('pendingExpensesAccountant.message', { count: pendingExpRows.length }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'system',
        navigateTab: 'accountant',
      });
    }

    /** مقدّم المصروف يعرف أن طلبه ما زال بانتظار الاعتماد */
    const expBySubmitter = new Map<string, Expense[]>();
    for (const e of pendingExpRows.filter((ex) => String(ex.submittedById || '').trim())) {
      const sid = String(e.submittedById).trim();
      const arr = expBySubmitter.get(sid) || [];
      if (arr.length < 20) arr.push(e);
      expBySubmitter.set(sid, arr);
    }
    expBySubmitter.forEach((list, submitterId) => {
      const u = users.find((x) => String(x.id).trim() === submitterId);
      if (!u) return;
      const cur = currencyLabel();
      const loc = dateLocale();
      const lines = list
        .slice(0, 6)
        .map((ex) =>
          st('expenseLine', {
            title: ex.title,
            amount: (ex.totalAmount ?? ex.amount).toLocaleString(loc),
            currency: cur,
          })
        )
        .join('\n');
      const more = list.length > 6 ? `\n${stMore(list.length - 6)}` : '';
      const expNav =
        u.role === 'مدير إنتاج' ? 'production' : u.role === 'محاسب' ? 'accountant' : u.role === 'مالك' ? 'approvals' : 'home';
      out.push({
        id: `n-expense-pending-submitter-${submitterId}-${list.length}`,
        level: 'medium',
        title: st('expensePendingSubmitter.title', { count: list.length }),
        message: st('expensePendingSubmitter.message', { lines, more }),
        createdAt: nowIso,
        targetRoles: [u.role],
        targetUserId: submitterId,
        entityType: 'system',
        navigateTab: expNav,
      });
    });

    const expenseOutcomeWindow = 14 * 24 * 60 * 60 * 1000;
    expenses
      .filter((e) => (e.approvalStatus === 'معتمد' || e.approvalStatus === 'مرفوض') && String(e.submittedById || '').trim())
      .filter((e) => now.getTime() - new Date(e.date).getTime() <= expenseOutcomeWindow)
      .forEach((e) => {
        const sid = String(e.submittedById).trim();
        const u = users.find((x) => String(x.id).trim() === sid);
        if (!u) return;
        const expNav =
          u.role === 'مدير إنتاج' ? 'production' : u.role === 'محاسب' ? 'accountant' : u.role === 'مالك' ? 'approvals' : 'home';
        const approved = e.approvalStatus === 'معتمد';
        out.push({
          id: `n-expense-outcome-${e.id}-${e.approvalStatus}`,
          level: approved ? 'low' : 'medium',
          title: st(approved ? 'expenseApproved.title' : 'expenseRejected.title'),
          message: st(approved ? 'expenseApproved.message' : 'expenseRejected.message', {
            title: e.title,
            amount: (e.totalAmount ?? e.amount).toLocaleString(dateLocale()),
            currency: currencyLabel(),
          }),
          createdAt: nowIso,
          targetRoles: [u.role],
          targetUserId: sid,
          entityType: 'system',
          navigateTab: expNav,
        });
      });

    const pendingProdClaims = shootBookings.filter((b) => b.financialStatus === 'بانتظار_تنفيذ_محاسب').length
      + equipmentBookings.filter((b) => b.financialStatus === 'بانتظار_تنفيذ_محاسب').length
      + meetingBookings.filter((b) => b.financialStatus === 'بانتظار_تنفيذ_محاسب').length;
    if (pendingProdClaims > 0) {
      out.push({
        id: `n-prod-claims-${pendingProdClaims}`,
        level: 'high',
        title: st('prodClaims.title'),
        message: st('prodClaims.message', { count: pendingProdClaims }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'system',
        navigateTab: 'bookings',
      });
    }

    /** طلبات «قيد المراجعة» كانت خارج التنبيهات — المالك/مدير المبيعات يحتاجان يكونوا على علم قبل الاعتماد. */
    const pendingShootReviews = shootBookings.filter((b) => b.status === 'قيد المراجعة');
    if (pendingShootReviews.length > 0) {
      const lines = pendingShootReviews
        .slice(0, 8)
        .map((b) =>
          st('shootReviewLine', {
            customer: b.customerName,
            date: b.date,
            time: b.time,
            rep: b.repName,
          })
        )
        .join('\n');
      const more =
        pendingShootReviews.length > 8 ? `\n${stMore(pendingShootReviews.length - 8)}` : '';
      out.push({
        id: `n-shoot-pending-batch-${pendingShootReviews.length}`,
        level: pendingShootReviews.some((b) => b.financialStatus === 'بانتظار_اعتماد_مالك')
          ? 'high'
          : 'medium',
        title: st('shootPendingReview.title', { count: pendingShootReviews.length }),
        message: st('shootPendingReview.message', { lines, more }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'system',
        navigateTab: 'bookings',
      });
    }
    const shootPendingByRep = new Map<string, ShootBooking[]>();
    pendingShootReviews.forEach((b) => {
      const rid = String(b.repId || '').trim();
      if (!rid) return;
      const arr = shootPendingByRep.get(rid) || [];
      arr.push(b);
      shootPendingByRep.set(rid, arr);
    });
    shootPendingByRep.forEach((list, repId) => {
      const u = users.find((x) => String(x.id).trim() === repId);
      if (!u || u.role !== 'مندوب') return;
      const shootMyLines = list
        .slice(0, 6)
        .map((b) =>
          st('shootMyLine', { customer: b.customerName, date: b.date, time: b.time })
        )
        .join('\n');
      const shootMyMore = list.length > 6 ? `\n${stMore(list.length - 6)}` : '';
      out.push({
        id: `n-shoot-pending-my-${repId}-${list.length}`,
        level: 'medium',
        title: st('shootPendingMy.title', { count: list.length }),
        message: st('shootPendingMy.message', { lines: shootMyLines, more: shootMyMore }),
        createdAt: nowIso,
        targetRoles: ['مندوب'],
        targetUserId: repId,
        entityType: 'system',
        navigateTab: 'bookings',
      });
    });
    const pendingShootFinanceOwner = pendingShootReviews.filter((b) => b.financialStatus === 'بانتظار_اعتماد_مالك');
    if (pendingShootFinanceOwner.length > 0) {
      out.push({
        id: `n-shoot-finance-owner-${pendingShootFinanceOwner.length}`,
        level: 'high',
        title: st('shootFinanceOwner.title', { count: pendingShootFinanceOwner.length }),
        message: st('shootFinanceOwner.message', { count: pendingShootFinanceOwner.length }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'bookings',
      });
    }

    const pendingEquipmentReviews = equipmentBookings.filter((b) => b.status === 'قيد المراجعة');
    if (pendingEquipmentReviews.length > 0) {
      out.push({
        id: `n-equipment-pending-batch-${pendingEquipmentReviews.length}`,
        level: 'medium',
        title: st('equipmentPending.title', { count: pendingEquipmentReviews.length }),
        message: st('equipmentPending.message', {
          lines: pendingEquipmentReviews
            .slice(0, 6)
            .map((b) => st('equipmentLine', { equipment: b.equipmentName, customer: b.customerName }))
            .join('\n'),
        }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'system',
        navigateTab: 'bookings',
      });
    }
    const equipPendingByRep = new Map<string, EquipmentBooking[]>();
    pendingEquipmentReviews.forEach((b) => {
      const rid = String(b.repId || '').trim();
      if (!rid) return;
      const arr = equipPendingByRep.get(rid) || [];
      arr.push(b);
      equipPendingByRep.set(rid, arr);
    });
    equipPendingByRep.forEach((list, repId) => {
      const u = users.find((x) => String(x.id).trim() === repId);
      if (!u || u.role !== 'مندوب') return;
      const equipMyLines = list
        .slice(0, 6)
        .map((b) => st('equipmentLine', { equipment: b.equipmentName, customer: b.customerName }))
        .join('\n');
      const equipMyMore = list.length > 6 ? `\n${stMore(list.length - 6)}` : '';
      out.push({
        id: `n-equipment-pending-my-${repId}-${list.length}`,
        level: 'medium',
        title: st('equipmentPendingMy.title', { count: list.length }),
        message: st('equipmentPendingMy.message', { lines: equipMyLines, more: equipMyMore }),
        createdAt: nowIso,
        targetRoles: ['مندوب'],
        targetUserId: repId,
        entityType: 'system',
        navigateTab: 'bookings',
      });
    });

    const pendingMeetingReviews = meetingBookings.filter((b) => (b.status || 'معتمد') === 'قيد المراجعة');
    if (pendingMeetingReviews.length > 0) {
      out.push({
        id: `n-meeting-pending-batch-${pendingMeetingReviews.length}`,
        level: 'medium',
        title: st('meetingPending.title', { count: pendingMeetingReviews.length }),
        message: st('meetingPending.message', {
          lines: pendingMeetingReviews
            .slice(0, 6)
            .map((b) => st('meetingLine', { title: b.title, date: b.date }))
            .join('\n'),
        }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'system',
        navigateTab: 'bookings',
      });
    }
    const meetingPendingByRep = new Map<string, MeetingBooking[]>();
    pendingMeetingReviews.forEach((b) => {
      const rid = String(b.repId || '').trim();
      if (!rid) return;
      const arr = meetingPendingByRep.get(rid) || [];
      arr.push(b);
      meetingPendingByRep.set(rid, arr);
    });
    meetingPendingByRep.forEach((list, repId) => {
      const u = users.find((x) => String(x.id).trim() === repId);
      if (!u || u.role !== 'مندوب') return;
      const meetMyLines = list
        .slice(0, 6)
        .map((b) => st('meetingLine', { title: b.title, date: b.date }))
        .join('\n');
      const meetMyMore = list.length > 6 ? `\n${stMore(list.length - 6)}` : '';
      out.push({
        id: `n-meeting-pending-my-${repId}-${list.length}`,
        level: 'medium',
        title: st('meetingPendingMy.title', { count: list.length }),
        message: st('meetingPendingMy.message', { lines: meetMyLines, more: meetMyMore }),
        createdAt: nowIso,
        targetRoles: ['مندوب'],
        targetUserId: repId,
        entityType: 'system',
        navigateTab: 'bookings',
      });
    });

    const invoicesWithBalance = invoices.filter((inv) => (inv.remainingAmount ?? 0) > 0);
    const overdueInstallments = invoicesWithBalance.filter((inv) => inv.nextDueDate && new Date(inv.nextDueDate).getTime() < now.getTime());
    if (overdueInstallments.length > 0) {
      out.push({
        id: `n-invoice-overdue-installments-${overdueInstallments.length}`,
        level: 'high',
        title: st('invoiceOverdue.title'),
        message: st('invoiceOverdue.message', { count: overdueInstallments.length }),
        createdAt: nowIso,
        targetRoles: ['محاسب', 'مالك'],
        entityType: 'invoice',
        navigateTab: 'accountant',
      });
    }
    const dueSoonInstallments = invoicesWithBalance.filter((inv) => {
      if (!inv.nextDueDate) return false;
      const diff = new Date(inv.nextDueDate).getTime() - now.getTime();
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 3;
    });
    if (dueSoonInstallments.length > 0) {
      out.push({
        id: `n-invoice-due-soon-installments-${dueSoonInstallments.length}`,
        level: 'medium',
        title: st('invoiceDueSoon.title'),
        message: st('invoiceDueSoon.message', { count: dueSoonInstallments.length }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'invoice',
        navigateTab: 'accountant',
      });
    }

    const pendingPriceQuotes = priceQuotes.filter(q => q.status === 'قيد اعتماد المالك').length;
    if (pendingPriceQuotes > 0) {
      out.push({
        id: `n-pending-quotes-${pendingPriceQuotes}`,
        level: 'high',
        title: st('pendingQuotes.title'),
        message: st('pendingQuotes.message', { count: pendingPriceQuotes }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'approvals',
      });
      out.push({
        id: `n-pending-quotes-manager-copy-${pendingPriceQuotes}`,
        level: 'medium',
        title: st('pendingQuotesManagerCopy.title'),
        message: st('pendingQuotesManagerCopy.message', { count: pendingPriceQuotes }),
        createdAt: nowIso,
        targetRoles: ['مدير مبيعات'],
        entityType: 'system',
        navigateTab: 'leads',
      });
    }

    /** عروض معتمدة من المالك — المندوب يقدّمها للعميل */
    const quotesAwaitingClient = priceQuotes.filter((q) => q.status === 'معتمد' && q.createdById);
    const quotesByCreator = new Map<string, PriceQuote[]>();
    quotesAwaitingClient.forEach((q) => {
      const cid = String(q.createdById).trim();
      if (!cid) return;
      const arr = quotesByCreator.get(cid) || [];
      if (arr.length < 15) arr.push(q);
      quotesByCreator.set(cid, arr);
    });
    quotesByCreator.forEach((list, creatorId) => {
      const u = users.find((x) => String(x.id).trim() === creatorId);
      if (!u || (u.role !== 'مندوب' && u.role !== 'مدير مبيعات')) return;
      const quoteClientLines = list
        .slice(0, 5)
        .map((q) => st('quoteLine', { title: q.title, customer: q.customerName }))
        .join('\n');
      const quoteClientMore = list.length > 5 ? `\n${stMore(list.length - 5)}` : '';
      out.push({
        id: `n-quote-awaiting-client-${creatorId}-${list.length}`,
        level: 'high',
        title: st('quotesAwaitingClient.title', { count: list.length }),
        message: st('quotesAwaitingClient.message', { lines: quoteClientLines, more: quoteClientMore }),
        createdAt: nowIso,
        targetRoles: [u.role],
        targetUserId: creatorId,
        entityType: 'lead',
        navigateTab: 'leads',
      });
    });

    const pendingPricingByPm = new Map<string, number>();
    const ownerRevisionByPm = new Map<string, number>();
    priceQuotes.forEach((q) => {
      if (q.status !== 'بانتظار التسعير' || !q.productionAssignedId) return;
      const k = String(q.productionAssignedId).trim();
      if (!k) return;
      pendingPricingByPm.set(k, (pendingPricingByPm.get(k) || 0) + 1);
      if (/طلب تعديل من المالك/.test(q.pricingNote || '')) {
        ownerRevisionByPm.set(k, (ownerRevisionByPm.get(k) || 0) + 1);
      }
    });
    pendingPricingByPm.forEach((count, pmId) => {
      const rev = ownerRevisionByPm.get(pmId) || 0;
      out.push({
        id: `n-quote-pending-pricing-${pmId}`,
        level: 'high',
        priority: rev > 0 ? 'critical' : 'normal',
        title: st(rev > 0 ? 'quotePricingRevision.title' : 'quotePricingPending.title'),
        message:
          rev > 0
            ? st('quotePricingRevision.message', { count, revision: rev })
            : st('quotePricingPending.message', { count }),
        createdAt: nowIso,
        targetRoles: ['مدير إنتاج'],
        targetUserId: pmId,
        entityType: 'system',
        navigateTab: 'production',
      });
    });

    const workOrdersByPm = new Map<string, number>();
    shootBookings.forEach((b) => {
      if (!b.workOrderFromQuote || b.status === 'مكتمل' || b.status === 'مرفوض') return;
      const pmId = String(b.productionAssignedId || '').trim();
      if (!pmId) return;
      workOrdersByPm.set(pmId, (workOrdersByPm.get(pmId) || 0) + 1);
    });
    workOrdersByPm.forEach((count, pmId) => {
      out.push({
        id: `n-quote-work-order-${pmId}`,
        level: 'high',
        title: st('quoteWorkOrders.title', { count }),
        message: st('quoteWorkOrders.message'),
        createdAt: nowIso,
        targetRoles: ['مدير إنتاج'],
        targetUserId: pmId,
        entityType: 'system',
        navigateTab: 'bookings',
      });
    });

    const recentQuoteDecisions = priceQuotes
      .filter((q) => q.status === 'معتمد' || q.status === 'مرفوض')
      .filter((q) => q.approvedAt && (now.getTime() - new Date(q.approvedAt).getTime()) <= 1000 * 60 * 60 * 24 * 14);
    recentQuoteDecisions.forEach((q) => {
      const creator = users.find((u) => String(u.id).trim() === String(q.createdById || '').trim());
      if (!creator) return;
      const qApproved = q.status === 'معتمد';
      out.push({
        id: `n-quote-result-creator-${q.id}`,
        level: qApproved ? 'low' : 'medium',
        title: st(qApproved ? 'quoteApprovedForClient.title' : 'quoteRejectedByOwner.title'),
        message: st(qApproved ? 'quoteApprovedForClient.message' : 'quoteRejectedByOwner.message', {
          title: q.title,
          customer: q.customerName,
        }),
        createdAt: nowIso,
        targetRoles: [creator.role],
        targetUserId: creator.id,
        entityType: 'system',
        entityId: q.id,
        navigateTab: 'leads',
      });
      if (creator.role === 'مندوب') {
        const mgr = users.find((u) => u.role === 'مدير مبيعات');
        if (mgr) {
          out.push({
            id: `n-quote-result-manager-copy-${q.id}`,
            level: qApproved ? 'low' : 'medium',
            title: st(qApproved ? 'quoteApprovedTeam.title' : 'quoteRejectedTeam.title'),
            message: st(qApproved ? 'quoteApprovedTeam.message' : 'quoteRejectedTeam.message', {
              creator: q.createdByName,
              title: q.title,
            }),
            createdAt: nowIso,
            targetRoles: ['مدير مبيعات'],
            targetUserId: mgr.id,
            entityType: 'system',
            entityId: q.id,
            navigateTab: 'leads',
          });
        }
      }
    });

    if (payrollReminderBaseline && !isPayrollApproved(monthKey)) {
      out.push({
        id: `n-payroll-${monthKey}`,
        level: 'medium',
        title: st('payrollNotApproved.title'),
        message: st('payrollNotApproved.message', { month: monthKey }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'approvals',
      });
      out.push({
        id: `n-payroll-accountant-${monthKey}`,
        level: 'medium',
        title: st('payrollNotApprovedAccountant.title'),
        message: st('payrollNotApprovedAccountant.message', { month: monthKey }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'system',
        navigateTab: 'accountant',
      });
    }
    const pendingPayrollRequest = payrollApprovalRequests.find(
      (r) => r.monthKey === monthKey && r.status === 'بانتظار_اعتماد_المالك'
    );
    if (pendingPayrollRequest) {
      out.push({
        id: `n-payroll-request-owner-${pendingPayrollRequest.id}`,
        level: 'high',
        title: st('payrollRequestOwner.title'),
        message: st('payrollRequestOwner.message', {
          month: monthKey,
          amount: pendingPayrollRequest.claimsSummary.totalEstimatedAmount.toLocaleString(dateLocale()),
          currency: currencyLabel(),
        }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'approvals',
      });
      if (pendingPayrollRequest.requestedById) {
        out.push({
          id: `n-payroll-request-accountant-${pendingPayrollRequest.id}`,
          level: 'medium',
          title: st('payrollRequestAccountant.title'),
          message: st('payrollRequestAccountant.message', { month: monthKey }),
          createdAt: nowIso,
          targetRoles: ['محاسب'],
          targetUserId: pendingPayrollRequest.requestedById,
          entityType: 'system',
          navigateTab: 'accountant',
        });
      }
    }

    const pendingMonthReopen = financialReopenRequests.filter((r) => r.status === 'بانتظار_اعتماد_المالك');
    pendingMonthReopen.forEach((r) => {
      out.push({
        id: `n-month-reopen-owner-${r.id}`,
        level: 'high',
        title: st('monthReopenOwner.title'),
        message: st('monthReopenOwner.message', {
          month: r.monthKey,
          reason: r.reason || st('monthReopenDefaultReason'),
        }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'approvals',
      });
      if (r.requestedById) {
        out.push({
          id: `n-month-reopen-requester-${r.id}`,
          level: 'medium',
          title: st('monthReopenRequester.title'),
          message: st('monthReopenRequester.message', { month: r.monthKey }),
          createdAt: nowIso,
          targetRoles: ['محاسب'],
          targetUserId: r.requestedById,
          entityType: 'system',
          navigateTab: 'accountant',
        });
      }
    });

    const monthNow = getMonthKey(nowIso);
    const repsBehindCalls = users
      .filter(u => u.role === 'مندوب')
      .filter((rep) => {
        const target = monthlyTargets.find(t => t.repId === rep.id);
        const callsTarget = target?.callsTarget ?? 80;
        const assignedLeads = leads.filter(l => l.assignedTo === rep.id);
        const callsCount = assignedLeads.reduce((sum, lead) => {
          const interactionsThisMonth = lead.timeline.filter((a) => {
            if (a.userId !== rep.id) return false;
            if (getMonthKey(a.createdAt) !== monthNow) return false;
            return /(مكالمة|اتصال|واتساب|تواصل|لم يرد)/.test(a.action);
          }).length;
          return sum + interactionsThisMonth;
        }, 0);
        return callsCount < callsTarget;
      });
    if (hasActiveAssignedLead && repsBehindCalls.length > 0) {
      out.push({
        id: `n-calls-gap-${repsBehindCalls.length}`,
        level: 'low',
        title: st('callsTargetGap.title'),
        message: st('callsTargetGap.message', { count: repsBehindCalls.length }),
        createdAt: nowIso,
        targetRoles: ['مالك', 'مدير مبيعات'],
        entityType: 'user',
        navigateTab: 'team-performance',
      });
    }

    const recentThreshold = Date.now() - 1000 * 60 * 60 * 24 * 30;
    shootBookings
      .filter(b => b.status === 'معتمد' || b.status === 'مرفوض')
      .filter(b => new Date(b.createdAt).getTime() >= recentThreshold)
      .forEach((b) => {
        const shootOk = b.status === 'معتمد';
        out.push({
          id: `n-shoot-${b.id}-${b.status}`,
          level: shootOk ? 'low' : 'medium',
          title: st(shootOk ? 'shootApproved.title' : 'shootRejected.title'),
          message: st(shootOk ? 'shootApproved.message' : 'shootRejected.message', {
            customer: b.customerName,
            date: b.date,
            time: b.time,
          }),
          createdAt: nowIso,
          targetRoles: ['مندوب'],
          targetUserId: b.repId,
          entityType: 'system',
          entityId: b.id,
          navigateTab: 'bookings',
        });
      });

    equipmentBookings
      .filter(b => b.status === 'معتمد' || b.status === 'مرفوض')
      .filter(b => new Date(b.createdAt).getTime() >= recentThreshold)
      .forEach((b) => {
        const eqOk = b.status === 'معتمد';
        out.push({
          id: `n-eq-${b.id}-${b.status}`,
          level: eqOk ? 'low' : 'medium',
          title: st(eqOk ? 'equipmentApproved.title' : 'equipmentRejected.title'),
          message: st(eqOk ? 'equipmentApproved.message' : 'equipmentRejected.message', {
            equipment: b.equipmentName,
            quantity: b.quantity,
            customer: b.customerName,
          }),
          createdAt: nowIso,
          targetRoles: ['مندوب'],
          targetUserId: b.repId,
          entityType: 'system',
          entityId: b.id,
          navigateTab: 'bookings',
        });
      });

    meetingBookings
      .filter((b) => b.status === 'معتمد' || b.status === 'مرفوض')
      .filter((b) => new Date(b.createdAt).getTime() >= recentThreshold)
      .forEach((b) => {
        const meetOk = b.status === 'معتمد';
        out.push({
          id: `n-meeting-${b.id}-${b.status}`,
          level: meetOk ? 'low' : 'medium',
          title: st(meetOk ? 'meetingApproved.title' : 'meetingRejected.title'),
          message: st(meetOk ? 'meetingApproved.message' : 'meetingRejected.message', {
            title: b.title,
            date: b.date,
            time: b.startTime,
          }),
          createdAt: nowIso,
          targetRoles: ['مندوب'],
          targetUserId: b.repId,
          entityType: 'system',
          entityId: b.id,
          navigateTab: 'bookings',
        });
      });

    const custodyPendingOwner = custodyFunds.filter((c) => c.status === 'طلب_بانتظار_المالك');
    const custodyLoc = dateLocale();
    const custodyCur = currencyLabel();
    custodyPendingOwner.slice(0, 8).forEach((c) => {
      out.push({
        id: `n-custody-owner-row-${c.id}`,
        level: 'high',
        title: st('custodyNewRequest.title'),
        message: st('custodyNewRequest.message', {
          title: c.title,
          amount: c.totalAmount.toLocaleString(custodyLoc),
          currency: custodyCur,
          manager: c.productionManagerName,
        }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        entityId: c.id,
        navigateTab: 'approvals',
      });
    });
    if (custodyPendingOwner.length > 0) {
      const lines = custodyPendingOwner
        .slice(0, 6)
        .map((c) =>
          st('custodyOwnerLine', {
            title: c.title,
            amount: c.totalAmount.toLocaleString(custodyLoc),
            currency: custodyCur,
            manager: c.productionManagerName,
          })
        )
        .join('\n');
      const more = custodyPendingOwner.length > 6 ? `\n${stMore(custodyPendingOwner.length - 6)}` : '';
      out.push({
        id: `n-custody-owner-${custodyPendingOwner.length}`,
        level: 'high',
        title: st('custodyPendingOwner.title', { count: custodyPendingOwner.length }),
        message: st('custodyPendingOwner.message', { lines, more }),
        createdAt: nowIso,
        targetRoles: ['مالك'],
        entityType: 'system',
        navigateTab: 'approvals',
      });
    }

    const custodyPay = custodyFunds.filter((c) => c.status === 'بانتظار_دفع_محاسب');
    custodyPay.slice(0, 8).forEach((c) => {
      out.push({
        id: `n-custody-pay-row-${c.id}`,
        level: 'high',
        title: st('custodyApprovedAwaitingPay.title'),
        message: st('custodyApprovedAwaitingPay.message', {
          title: c.title,
          amount: c.totalAmount.toLocaleString(custodyLoc),
          currency: custodyCur,
          manager: c.productionManagerName,
        }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'system',
        entityId: c.id,
        navigateTab: 'accountant',
      });
    });
    if (custodyPay.length > 0) {
      const payLines = custodyPay
        .slice(0, 5)
        .map((c) =>
          st('custodyPayLine', {
            title: c.title,
            amount: c.totalAmount.toLocaleString(custodyLoc),
            currency: custodyCur,
          })
        )
        .join('\n');
      const payMore = custodyPay.length > 5 ? `\n${stMore(custodyPay.length - 5)}` : '';
      out.push({
        id: `n-custody-pay-${custodyPay.length}`,
        level: 'high',
        title: st('custodyAwaitingPayment.title', { count: custodyPay.length }),
        message: st('custodyAwaitingPayment.message', { lines: payLines, more: payMore }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'system',
        navigateTab: 'accountant',
      });
    }

    const custodySettle = custodyFunds.filter((c) => c.status === 'تسوية_بانتظار_محاسب');
    if (custodySettle.length > 0) {
      const settleLines = custodySettle
        .slice(0, 5)
        .map((c) => {
          const spent = c.spendLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
          return st('custodySettleLine', {
            title: c.title,
            spent: spent.toLocaleString(custodyLoc),
            total: c.totalAmount.toLocaleString(custodyLoc),
            currency: custodyCur,
          });
        })
        .join('\n');
      const settleMore = custodySettle.length > 5 ? `\n${stMore(custodySettle.length - 5)}` : '';
      out.push({
        id: `n-custody-settle-${custodySettle.length}`,
        level: 'high',
        title: st('custodySettlementPending.title', { count: custodySettle.length }),
        message: st('custodySettlementPending.message', { lines: settleLines, more: settleMore }),
        createdAt: nowIso,
        targetRoles: ['محاسب'],
        entityType: 'system',
        navigateTab: 'accountant',
      });
    }
    const activeCustodyForLong = custodyFunds.filter((c) => {
      if (c.status !== 'نشطة') return false;
      const receivedAt = c.receivedAt || c.paymentAt || c.approvedAt || c.createdAt;
      if (!receivedAt) return false;
      const ageDays = (now.getTime() - new Date(receivedAt).getTime()) / (1000 * 60 * 60 * 24);
      return ageDays >= 7;
    });
    if (activeCustodyForLong.length > 0) {
      out.push({
        id: `n-custody-long-active-${activeCustodyForLong.length}`,
        level: 'medium',
        title: st('custodyLongActive.title'),
        message: st('custodyLongActive.message', { count: activeCustodyForLong.length }),
        createdAt: nowIso,
        targetRoles: ['محاسب', 'مالك'],
        entityType: 'system',
        navigateTab: 'accountant',
      });
      const longByPm = new Map<string, CustodyFund[]>();
      activeCustodyForLong.forEach((c) => {
        if (!c.productionManagerId) return;
        const arr = longByPm.get(c.productionManagerId) || [];
        arr.push(c);
        longByPm.set(c.productionManagerId, arr);
      });
      longByPm.forEach((list, pmId) => {
        out.push({
          id: `n-custody-long-active-pm-${pmId}`,
          level: 'medium',
          title: st('custodyLongActivePm.title', { count: list.length }),
          message: st('custodyLongActivePm.message', { count: list.length }),
          createdAt: nowIso,
          targetRoles: ['مدير إنتاج'],
          targetUserId: pmId,
          entityType: 'system',
          navigateTab: 'production',
        });
      });
    }

    /** حجوزات بانتظار تنفيذ الإنتاج (بعد اعتماد مالي) */
    const prodExecShoot = shootBookings.filter((b) => b.financialStatus === 'بانتظار_تنفيذ_إنتاج');
    const prodExecEquip = equipmentBookings.filter((b) => b.financialStatus === 'بانتظار_تنفيذ_إنتاج');
    const prodExecMeet = meetingBookings.filter((b) => b.financialStatus === 'بانتظار_تنفيذ_إنتاج');
    const prodExecTotal = prodExecShoot.length + prodExecEquip.length + prodExecMeet.length;
    if (prodExecTotal > 0) {
      out.push({
        id: `n-prod-exec-pending-${prodExecTotal}`,
        level: 'high',
        title: st('prodExecPending.title', { count: prodExecTotal }),
        message: st('prodExecPending.message', {
          shoot: prodExecShoot.length,
          equipment: prodExecEquip.length,
          meetings: prodExecMeet.length,
        }),
        createdAt: nowIso,
        targetRoles: ['مدير إنتاج'],
        entityType: 'system',
        navigateTab: 'bookings',
      });
    }

    const readyByPm = new Map<string, CustodyFund[]>();
    custodyFunds.filter((c) => c.status === 'جاهزة_للاستلام' && c.productionManagerId).forEach((c) => {
      const list = readyByPm.get(c.productionManagerId) || [];
      list.push(c);
      readyByPm.set(c.productionManagerId, list);
    });
    readyByPm.forEach((list, pmId) => {
      list.slice(0, 8).forEach((c) => {
        out.push({
          id: `n-custody-ready-row-${c.id}`,
          level: 'high',
          title: st('custodyReadyForPickup.title'),
          message: st('custodyReadyForPickup.message', {
            title: c.title,
            amount: c.totalAmount.toLocaleString(custodyLoc),
            currency: custodyCur,
            method: c.paymentMethod ? st('custodyPaymentMethod', { method: c.paymentMethod }) : '',
          }),
          createdAt: nowIso,
          targetRoles: ['مدير إنتاج'],
          targetUserId: pmId,
          entityType: 'system',
          entityId: c.id,
          navigateTab: 'production',
        });
      });
      const readyLines = list
        .slice(0, 8)
        .map((c) =>
          st('custodyPayLine', {
            title: c.title,
            amount: c.totalAmount.toLocaleString(custodyLoc),
            currency: custodyCur,
          })
        )
        .join('\n');
      const readyMore = list.length > 8 ? `\n${stMore(list.length - 8)}` : '';
      out.push({
        id: `n-custody-ready-${pmId}`,
        level: 'high',
        title: st('custodyReadyBatch.title', { count: list.length }),
        message: st('custodyReadyBatch.message', { lines: readyLines, more: readyMore }),
        createdAt: nowIso,
        targetRoles: ['مدير إنتاج'],
        targetUserId: pmId,
        entityType: 'system',
        navigateTab: 'production',
      });
    });

    const rejByPm = new Map<string, CustodyFund[]>();
    custodyFunds.filter((c) => c.status === 'مرفوض_طلب' && c.productionManagerId).forEach((c) => {
      const list = rejByPm.get(c.productionManagerId) || [];
      list.push(c);
      rejByPm.set(c.productionManagerId, list);
    });
    rejByPm.forEach((list, pmId) => {
      out.push({
        id: `n-custody-rej-${pmId}`,
        level: 'medium',
        title: st('custodyRejected.title', { count: list.length }),
        message: st('custodyRejected.message', {
          lines: list
            .slice(0, 6)
            .map((c) =>
              st('custodyRejectedLine', {
                title: c.title,
                reason: c.requestRejectReason ? ` — ${c.requestRejectReason}` : '',
              })
            )
            .join('\n'),
        }),
        createdAt: nowIso,
        targetRoles: ['مدير إنتاج'],
        targetUserId: pmId,
        entityType: 'system',
        navigateTab: 'production',
      });
    });

    return out
      .map((n) => ({
        ...n,
        queue: n.queue || 'ops',
        priority: n.priority || (n.level === 'high' ? 'critical' : 'normal'),
      }))
      .sort((a, b) => {
        const pa = a.priority === 'critical' ? 0 : 1;
        const pb = b.priority === 'critical' ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

}
