/** يظهر تذكير «كشف المرتبات غير معتمد» فقط بعد بدء مسار الرواتب فعلياً (حضور أو اعتمادات/طلبات). */
export function operationalBaselineForPayrollReminder(args: {
  attendanceRecordsCount: number;
  payrollApprovalsCount: number;
  payrollApprovalRequestsCount: number;
}): boolean {
  return (
    args.attendanceRecordsCount > 0 ||
    args.payrollApprovalsCount > 0 ||
    args.payrollApprovalRequestsCount > 0
  );
}

/** تنبيه «مستهدف المكالمات» يُقاس فقط عند وجود ليدز مفتوحة مسندة لمندوبين. */
export function hasAssignedActiveSalesLead(leads: { assignedTo?: string; status: string }[]): boolean {
  return leads.some(
    (l) => Boolean(l.assignedTo) && l.status !== 'مغلق - فوز' && l.status !== 'مغلق - خسارة'
  );
}
