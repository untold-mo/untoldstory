import {
  ArrowRight,
  Clock,
  DollarSign,
  FileText,
  KeyRound,
  Minus,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import {
  getEmployeeDeductions,
  addEmployeeDeduction,
  removeEmployeeDeduction,
  setEmployeeDeductionApproval,
  type EmployeeDeduction,
} from '@/lib/projects/projectStore';
import { uploadEmployeeAvatarSb } from '@/lib/supabase/avatarStorage';
import { isSupabaseDirectMode } from '@/config/supabaseMode';

function getMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function EmployeeProfilePage({
  employeeId,
  onClose,
}: {
  employeeId: string;
  onClose: () => void;
}) {
  const { users, attendanceRecords, currentUser, ownerSetEmployeePassword, updateEmployeeProfile } = useData();
  const employee = users.find((u) => u.id === employeeId);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const canEditPhoto =
    !!currentUser && (currentUser.role === 'مالك' || currentUser.role === 'مدير مبيعات');

  const handleAvatarFile = async (file: File | null) => {
    if (!file || !employee) return;
    if (!isSupabaseDirectMode()) { toast.error('رفع الصور متاح فقط في وضع الخادم (Supabase)'); return; }
    setAvatarUploading(true);
    try {
      const url = await uploadEmployeeAvatarSb(file, employee.id);
      const ok = await updateEmployeeProfile(employee.id, { avatar: url });
      if (ok) toast.success('تم تحديث صورة الموظف');
      else toast.error('تعذّر حفظ الصورة');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'تعذّر رفع الصورة');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRefreshData = () => {
    window.location.reload();
  };

  const [monthKey, setMonthKey] = useState(getMonthKey);
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [addType, setAddType] = useState<'خصم' | 'إذن' | 'إجازة' | 'مكافأة'>('خصم');
  const [addAmount, setAddAmount] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addJobTitle, setAddJobTitle] = useState('');
  const [addNotes, setAddNotes] = useState('');

  const refreshDeductions = (uid: string, mk: string) => {
    getEmployeeDeductions(uid, mk).then(setDeductions).catch(() => {});
  };

  useEffect(() => {
    if (employee) refreshDeductions(employee.id, monthKey);
  }, [employee?.id, monthKey]);

  const monthParts = monthKey.split('-');
  const monthYear = Number(monthParts[0]);
  const monthNum = Number(monthParts[1]);
  const monthLabel = new Date(monthYear, monthNum - 1).toLocaleDateString('ar-EG', {
    month: 'long',
    year: 'numeric',
  });

  const attendance = useMemo(() => {
    if (!employee) return { present: 0, late: 0, earlyLeave: 0, absent: 0, records: [] as typeof attendanceRecords };
    const monthRecords = attendanceRecords.filter((r) => {
      if (r.repId !== employee.id) return false;
      const d = new Date(r.createdAt);
      return d.getFullYear() === monthYear && d.getMonth() + 1 === monthNum;
    });
    const presentDays = new Set<string>();
    const lateDays = new Set<string>();
    const earlyLeaveDays = new Set<string>();
    for (const r of monthRecords) {
      const d = new Date(r.createdAt);
      const dayKey = d.toISOString().slice(0, 10);
      const mins = d.getHours() * 60 + d.getMinutes();
      if (r.type === 'in') {
        presentDays.add(dayKey);
        if (mins > 9 * 60 + 30) lateDays.add(dayKey); // تأخير بعد 9:30
      } else if (r.type === 'out') {
        if (mins < 17 * 60) earlyLeaveDays.add(dayKey); // انصراف مبكر قبل 5:00 م
      }
    }
    const workingDays = 26;
    const absent = Math.max(0, workingDays - presentDays.size);
    return {
      present: presentDays.size,
      late: lateDays.size,
      earlyLeave: earlyLeaveDays.size,
      absent,
      records: monthRecords,
    };
  }, [employee, attendanceRecords, monthYear, monthNum]);

  const financials = useMemo(() => {
    if (!employee) return { baseSalary: 0, totalDeductions: 0, totalPermissions: 0, totalBonuses: 0, totalLeaves: 0, latePenalty: 0, earlyLeavePenalty: 0, absentPenalty: 0, netSalary: 0 };
    const baseSalary = Number(employee.baseSalary) || 0;
    const latePenalty = attendance.late * 75;
    const earlyLeavePenalty = attendance.earlyLeave * 75;
    const absentPenalty = attendance.absent * (baseSalary / 26);
    // يُحسب المعتمد فقط في صافي المرتب
    const sumByType = (type: string) =>
      deductions
        .filter((d: EmployeeDeduction) => d.type === type && d.approved !== false)
        .reduce((sum: number, d: EmployeeDeduction) => sum + d.amount, 0);
    const manualDeductions = sumByType('خصم');
    const permissions = sumByType('إذن');
    const leaves = sumByType('إجازة');
    const bonuses = sumByType('مكافأة');
    const totalDeductions = latePenalty + earlyLeavePenalty + absentPenalty + manualDeductions + permissions + leaves;
    const netSalary = Math.max(0, baseSalary + bonuses - totalDeductions);
    return {
      baseSalary,
      totalDeductions,
      totalPermissions: permissions,
      totalBonuses: bonuses,
      totalLeaves: leaves,
      latePenalty: Math.round(latePenalty),
      earlyLeavePenalty: Math.round(earlyLeavePenalty),
      absentPenalty: Math.round(absentPenalty),
      netSalary: Math.round(netSalary),
    };
  }, [employee, attendance, deductions]);

  const handleMonthChange = (delta: number) => {
    const d = new Date(monthYear, monthNum - 1 + delta);
    const newKey = getMonthKey(d);
    setMonthKey(newKey);
  };

  const handleAddDeduction = async () => {
    if (!employee) return;
    const amount = Number(addAmount);
    if (!amount || amount <= 0) { toast.error('أدخل مبلغ صحيح'); return; }
    if (!addReason.trim()) { toast.error('أدخل السبب'); return; }
    try {
      await addEmployeeDeduction({
        userId: employee.id, monthKey, type: addType,
        amount, reason: addReason.trim(), date: new Date().toISOString().slice(0, 10),
        department: addDepartment.trim() || employee.role,
        jobTitle: addJobTitle.trim() || employee.role,
        notes: addNotes.trim() || undefined,
        approved: true,
      });
      refreshDeductions(employee.id, monthKey);
      setShowAddModal(false);
      setAddAmount('');
      setAddReason('');
      setAddDepartment('');
      setAddJobTitle('');
      setAddNotes('');
      toast.success(`تم إضافة ${addType} بنجاح`);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطأ'); }
  };

  const canResetPassword =
    currentUser &&
    employee &&
    employee.role !== 'مالك' &&
    employee.id !== currentUser.id &&
    (currentUser.role === 'مالك' ||
      (currentUser.role === 'مدير مبيعات' && employee.role === 'مندوب'));

  const handleResetPassword = async () => {
    if (!employee) return;
    setPwdSaving(true);
    const ok = await ownerSetEmployeePassword(employee.id, newPwd);
    setPwdSaving(false);
    if (ok) { setShowPwdModal(false); setNewPwd(''); }
  };

  const handleRemoveDeduction = async (id: string) => {
    if (!employee) return;
    try {
      await removeEmployeeDeduction(id, employee.id, monthKey);
      refreshDeductions(employee.id, monthKey);
      toast.success('تم الحذف');
    } catch { toast.error('تعذر الحذف'); }
  };

  const canApprove = currentUser?.role === 'مالك' || currentUser?.role === 'محاسب';

  const handleToggleApproval = async (d: EmployeeDeduction) => {
    if (!employee) return;
    try {
      await setEmployeeDeductionApproval(d.id, d.approved === false);
      refreshDeductions(employee.id, monthKey);
      toast.success(d.approved === false ? 'تم اعتماد الخصم' : 'تم إلغاء الاعتماد');
    } catch { toast.error('تعذر تحديث الاعتماد'); }
  };

  if (!employee) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <p>الموظف غير موجود</p>
        <button onClick={onClose} className="mt-4 text-[#6366F1] hover:underline text-sm">رجوع</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 group/avatar">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="h-14 w-14 rounded-2xl object-cover border border-zinc-700"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-xl font-bold text-white">
                {employee.name[0]}
              </div>
            )}
            {canEditPhoto && (
              <label
                title="تغيير صورة الموظف"
                className={`absolute inset-0 rounded-2xl flex items-center justify-center text-[9px] font-bold text-white bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer ${avatarUploading ? 'opacity-100 cursor-wait' : ''}`}
              >
                {avatarUploading ? '…' : '📷 تغيير'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={(e) => { void handleAvatarFile(e.target.files?.[0] || null); e.target.value = ''; }}
                />
              </label>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span>{employee.role}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>كود: {employee.id.slice(0, 8)}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>{employee.email || '—'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canResetPassword && (
            <button
              onClick={() => { setShowPwdModal(true); setNewPwd(''); }}
              title="تغيير كلمة المرور"
              className="p-2 hover:bg-amber-500/10 rounded-xl transition-all text-amber-400/70 hover:text-amber-300"
            >
              <KeyRound className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleRefreshData} title="تحديث البيانات" className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-[#6366F1]">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => handleMonthChange(-1)} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-all text-white">
          <ArrowRight className="h-4 w-4" />
        </button>
        <span className="text-lg font-bold text-white min-w-[160px] text-center">{monthLabel}</span>
        <button onClick={() => handleMonthChange(1)} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-all text-white">
          <ArrowRight className="h-4 w-4 rotate-180" />
        </button>
      </div>

      {/* Salary Info Card */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          بيانات المرتب
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="المرتب الأساسي" value={financials.baseSalary.toLocaleString('ar-EG')} unit="ج.م" color="text-white" />
          <StatCard label="المكافآت" value={financials.totalBonuses.toLocaleString('ar-EG')} unit="ج.م" color="text-emerald-400" />
          <StatCard label="إجمالي الخصومات" value={financials.totalDeductions.toLocaleString('ar-EG')} unit="ج.م" color="text-rose-400" />
          <StatCard label="الأذونات" value={financials.totalPermissions.toLocaleString('ar-EG')} unit="ج.م" color="text-amber-400" />
          <StatCard label="صافي المرتب" value={financials.netSalary.toLocaleString('ar-EG')} unit="ج.م" color="text-emerald-400" highlight />
        </div>
      </div>

      {/* Attendance Card */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#6366F1]" />
          الحضور والانصراف
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="أيام الحضور" value={String(attendance.present)} color="text-emerald-400" />
          <StatCard label="التأخير" value={String(attendance.late)} suffix={` (خصم ${financials.latePenalty.toLocaleString('ar-EG')} ج.م)`} color="text-amber-400" />
          <StatCard label="انصراف مبكر" value={String(attendance.earlyLeave)} suffix={` (خصم ${financials.earlyLeavePenalty.toLocaleString('ar-EG')} ج.م)`} color="text-orange-400" />
          <StatCard label="الغياب" value={String(attendance.absent)} suffix={` (خصم ${Math.round(financials.absentPenalty).toLocaleString('ar-EG')} ج.م)`} color="text-rose-400" />
          <StatCard label="الإجازات" value={String(deductions.filter((d) => d.type === 'إجازة').length)} color="text-sky-400" />
        </div>
      </div>

      {/* Deductions & Permissions */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            الخصومات والأذونات
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-[#6366F1] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#5254E2] transition-all"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>
        {deductions.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">لا توجد خصومات أو أذونات مسجلة لهذا الشهر</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {deductions.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 border ${
                    d.type === 'خصم' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : d.type === 'مكافأة' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : d.type === 'إجازة' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {d.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-bold truncate">{d.reason}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
                      <span>{d.date}</span>
                      {d.department && <span>• {d.department}</span>}
                      {d.jobTitle && d.jobTitle !== d.department && <span>• {d.jobTitle}</span>}
                    </div>
                    {d.notes && <p className="text-[10px] text-zinc-600 mt-0.5 truncate">📝 {d.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                      d.approved === false
                        ? 'bg-zinc-700/30 text-zinc-400 border-zinc-600'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {d.approved === false ? 'غير معتمد' : 'معتمد'}
                  </span>
                  <span className="text-sm font-bold text-white">{d.amount.toLocaleString('ar-EG')} ج.م</span>
                  {canApprove && (
                    <button
                      onClick={() => handleToggleApproval(d)}
                      className="text-[9px] font-bold px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all"
                    >
                      {d.approved === false ? 'اعتماد' : 'إلغاء'}
                    </button>
                  )}
                  <button onClick={() => handleRemoveDeduction(d.id)} className="p-1 text-zinc-600 hover:text-rose-400 transition-all">
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Summary */}
      <div className="bg-gradient-to-r from-[#6366F1]/10 to-emerald-500/10 border border-[#6366F1]/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">ملخص المرتب — {monthLabel}</h3>
        <div className="space-y-2 text-sm">
          <SummaryRow label="المرتب الأساسي" value={financials.baseSalary} />
          {financials.totalBonuses > 0 && <SummaryRow label="المكافآت" value={financials.totalBonuses} />}
          <SummaryRow label="خصم التأخير" value={-financials.latePenalty} negative />
          {financials.earlyLeavePenalty > 0 && <SummaryRow label="خصم الانصراف المبكر" value={-financials.earlyLeavePenalty} negative />}
          <SummaryRow label="خصم الغياب" value={-Math.round(financials.absentPenalty)} negative />
          {deductions.filter(d => d.type === 'خصم' && d.approved !== false).map(d => (
            <SummaryRow key={d.id} label={`خصم: ${d.reason}`} value={-d.amount} negative />
          ))}
          {deductions.filter(d => d.type === 'إذن' && d.approved !== false).map(d => (
            <SummaryRow key={d.id} label={`إذن: ${d.reason}`} value={-d.amount} negative />
          ))}
          {deductions.filter(d => d.type === 'إجازة' && d.approved !== false).map(d => (
            <SummaryRow key={d.id} label={`إجازة: ${d.reason}`} value={-d.amount} negative />
          ))}
          {deductions.filter(d => d.type === 'مكافأة' && d.approved !== false).map(d => (
            <SummaryRow key={d.id} label={`مكافأة: ${d.reason}`} value={d.amount} />
          ))}
          <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between font-bold text-base">
            <span className="text-white">صافي المرتب المستحق</span>
            <span className="text-emerald-400">{financials.netSalary.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </div>

      {/* Add Deduction Modal */}
      {showAddModal && createPortal(
        <div
          className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAddModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#18181B] text-white shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">إضافة بند مالي</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="h-5 w-5 text-zinc-400" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: 'خصم', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                { key: 'إذن', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                { key: 'إجازة', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
                { key: 'مكافأة', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setAddType(opt.key)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${addType === opt.key ? opt.cls : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                >
                  {opt.key}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 -mt-2">
              {addType === 'مكافأة' ? 'المكافأة تُضاف إلى صافي المرتب.' : 'يُخصم من صافي المرتب.'}
            </p>
            <input
              type="number"
              placeholder="المبلغ"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
            />
            <input
              type="text"
              placeholder="السبب"
              value={addReason}
              onChange={(e) => setAddReason(e.target.value)}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={`القسم (${employee.role})`}
                value={addDepartment}
                onChange={(e) => setAddDepartment(e.target.value)}
                className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              />
              <input
                type="text"
                placeholder={`الوظيفة (${employee.role})`}
                value={addJobTitle}
                onChange={(e) => setAddJobTitle(e.target.value)}
                className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              />
            </div>
            <textarea
              placeholder="ملاحظات (اختياري)"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-zinc-400 font-bold text-sm">إلغاء</button>
              <button
                onClick={handleAddDeduction}
                className="bg-[#6366F1] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#5254E2] transition-all"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {showPwdModal && createPortal(
        <div
          className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowPwdModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#18181B] text-white shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                تغيير كلمة مرور الموظف
              </h3>
              <button type="button" onClick={() => setShowPwdModal(false)} className="p-1 hover:bg-zinc-700 rounded-lg transition-all">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <p className="text-sm text-zinc-400">
              تعيين كلمة مرور جديدة لـ <span className="text-white font-bold">{employee.name}</span> ({employee.role})
            </p>
            {employee.email?.endsWith('@staff.internal') && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                ⚠️ هذا الموظف ليس له بريد إلكتروني حقيقي — عدّل بياناته أولاً وعيّن له بريد حقيقي ثم غيّر كلمة المرور.
              </p>
            )}
            <input
              type="password"
              placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              autoFocus
              disabled={employee.email?.endsWith('@staff.internal')}
            />
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowPwdModal(false)} className="px-4 py-2 text-zinc-400 font-bold hover:text-white transition-all text-sm">
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={pwdSaving || newPwd.length < 8 || Boolean(employee.email?.endsWith('@staff.internal'))}
                className="bg-amber-500 text-black px-5 py-2 rounded-xl font-bold hover:bg-amber-400 transition-all disabled:opacity-40 text-sm"
              >
                {pwdSaving ? 'جاري الحفظ…' : 'تعيين كلمة المرور'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function StatCard({ label, value, unit, color, suffix, highlight }: { label: string; value: string; unit?: string; color: string; suffix?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[#09090B] border border-zinc-800'}`}>
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value} {unit && <span className="text-xs text-zinc-500">{unit}</span>}
        {suffix && <span className="text-[10px] text-zinc-500 font-normal">{suffix}</span>}
      </p>
    </div>
  );
}

function SummaryRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className={negative && value < 0 ? 'text-rose-400' : 'text-white'}>
        {value < 0 ? `(${Math.abs(value).toLocaleString('ar-EG')})` : value.toLocaleString('ar-EG')} ج.م
      </span>
    </div>
  );
}
