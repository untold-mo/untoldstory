import {
  ArrowRight,
  Banknote,
  Briefcase,
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  Shield,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type {
  Project,
  ProjectRevenue,
  ProjectExpense,
  ProjectCustody,
  RevenueStatus,
  ExpenseSource,
  CustodyStatus,
} from '@/lib/projects/projectTypes';
import { EXPENSE_CODES } from '@/lib/projects/projectTypes';
import {
  getProjectsDataAsync,
  addRevenue,
  updateRevenue,
  addExpense,
  addCustody,
  settleCustody,
  updateCustodyStatus,
  updateProject,
} from '@/lib/projects/projectStore';

type Modal = null | 'revenue' | 'expense' | 'custody' | 'settle';

const STATUS_COLORS: Record<string, string> = {
  'محصل': 'bg-emerald-500/10 text-emerald-400',
  'مستحق': 'bg-amber-500/10 text-amber-400',
  'متأخر': 'bg-rose-500/10 text-rose-400',
  'مفتوحة': 'bg-blue-500/10 text-blue-400',
  'تحت التسوية': 'bg-amber-500/10 text-amber-400',
  'تم تسويتها': 'bg-emerald-500/10 text-emerald-400',
};

export default function ProjectDetailPage({
  project: initialProject,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const [data, setData] = useState<import('@/lib/projects/projectTypes').ProjectsData>({ projects: [], revenues: [], expenses: [], custodies: [] });
  const [modal, setModal] = useState<Modal>(null);
  const [settleCustodyId, setSettleCustodyId] = useState<string | null>(null);

  const refresh = useCallback(() => { getProjectsDataAsync().then(setData).catch(() => {}); }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const project = data.projects.find((p) => p.id === initialProject.id) || initialProject;

  const revenues = useMemo(() => data.revenues.filter((r) => r.projectCode === project.code), [data.revenues, project.code]);
  const expenses = useMemo(() => data.expenses.filter((e) => e.projectCode === project.code), [data.expenses, project.code]);
  const custodies = useMemo(() => data.custodies.filter((c) => c.projectCode === project.code), [data.custodies, project.code]);

  const summary = useMemo(() => {
    const collectedRevenue = revenues.filter((r) => r.status === 'محصل').reduce((s, r) => s + r.amount, 0);
    const pendingRevenue = revenues.filter((r) => r.status !== 'محصل').reduce((s, r) => s + r.amount, 0);
    const directExpenses = expenses.filter((e) => e.source === 'مباشر').reduce((s, e) => s + e.amount, 0);
    const custodyExpenses = expenses.filter((e) => e.source === 'تسوية عهدة').reduce((s, e) => s + e.amount, 0);
    const totalExpenses = directExpenses + custodyExpenses;
    const openCustodies = custodies.filter((c) => c.status !== 'تم تسويتها');
    const openCustodyTotal = openCustodies.reduce((s, c) => s + c.amount, 0);
    const settledCustodyTotal = custodies.filter((c) => c.status === 'تم تسويتها').reduce((s, c) => s + c.amount, 0);
    const custodySpent = custodies.reduce((s, c) => s + c.settlementItems.reduce((ss, i) => ss + i.amount, 0), 0);
    const custodyRemaining = openCustodyTotal - openCustodies.reduce((s, c) => s + c.settlementItems.reduce((ss, i) => ss + i.amount, 0), 0);
    const netProfit = collectedRevenue - totalExpenses;
    const expectedProfit = collectedRevenue + pendingRevenue - totalExpenses;
    return { collectedRevenue, pendingRevenue, directExpenses, custodyExpenses, totalExpenses, openCustodyTotal, settledCustodyTotal, custodyRemaining, netProfit, expectedProfit };
  }, [revenues, expenses, custodies]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-all text-white">
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{project.name}</h2>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span>كود: {project.code}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>عميل: {project.clientName}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>{project.startDate}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={project.status}
            onChange={(e) => { updateProject(project.id, { status: e.target.value as Project['status'] }).then(() => refresh()); }}
            className="bg-[#09090B] border border-zinc-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
          >
            <option value="مفتوحة">مفتوحة</option>
            <option value="منتهية">منتهية</option>
            <option value="تحت التحصيل">تحت التحصيل</option>
          </select>
        </div>
      </div>

      {/* === الإيرادات === */}
      <Section title="الإيرادات" icon={TrendingUp} iconColor="text-emerald-400" onAdd={() => setModal('revenue')} count={revenues.length}>
        {revenues.length === 0 ? (
          <EmptyState text="لا توجد إيرادات مسجلة" />
        ) : (
          <div className="divide-y divide-zinc-800">
            {revenues.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 px-2">
                <div>
                  <p className="text-sm font-bold text-white">{r.amount.toLocaleString('ar-EG')} ج.م</p>
                  <p className="text-[10px] text-zinc-500">{r.date} {r.collectionMethod && `• ${r.collectionMethod}`}</p>
                  {r.notes && <p className="text-[10px] text-zinc-600 mt-0.5">{r.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                  {r.status !== 'محصل' && (
                    <button
                      onClick={() => { updateRevenue(r.id, { status: 'محصل' }).then(() => { refresh(); toast.success('تم تأكيد التحصيل'); }); }}
                      className="text-[10px] text-emerald-400 hover:underline font-bold"
                    >
                      تأكيد التحصيل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs pt-3 border-t border-zinc-800">
          <span className="text-zinc-400">محصل: <span className="text-emerald-400 font-bold">{summary.collectedRevenue.toLocaleString('ar-EG')}</span></span>
          <span className="text-zinc-400">مستحق: <span className="text-amber-400 font-bold">{summary.pendingRevenue.toLocaleString('ar-EG')}</span></span>
        </div>
      </Section>

      {/* === المصروفات === */}
      <Section title="المصروفات" icon={TrendingDown} iconColor="text-rose-400" onAdd={() => setModal('expense')} count={expenses.length}>
        {expenses.length === 0 ? (
          <EmptyState text="لا توجد مصروفات مسجلة" />
        ) : (
          <div className="divide-y divide-zinc-800">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 px-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">{e.expenseCode}</span>
                    <span className="text-xs font-bold text-white">{e.expenseType}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">{e.description} • {e.date}</p>
                  {e.custodyId && <p className="text-[10px] text-amber-500/70">من عهدة: {e.custodyId.slice(0, 12)}</p>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{e.amount.toLocaleString('ar-EG')} ج.م</p>
                  <p className={`text-[10px] ${e.source === 'مباشر' ? 'text-zinc-500' : 'text-amber-400'}`}>{e.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs pt-3 border-t border-zinc-800">
          <span className="text-zinc-400">مباشر: <span className="text-rose-400 font-bold">{summary.directExpenses.toLocaleString('ar-EG')}</span></span>
          <span className="text-zinc-400">تسوية عهد: <span className="text-amber-400 font-bold">{summary.custodyExpenses.toLocaleString('ar-EG')}</span></span>
          <span className="text-zinc-400">إجمالي: <span className="text-rose-300 font-bold">{summary.totalExpenses.toLocaleString('ar-EG')}</span></span>
        </div>
      </Section>

      {/* === العُهد === */}
      <Section title="العُهد" icon={Shield} iconColor="text-blue-400" onAdd={() => setModal('custody')} count={custodies.length}>
        {custodies.length === 0 ? (
          <EmptyState text="لا توجد عهد مسجلة" />
        ) : (
          <div className="divide-y divide-zinc-800">
            {custodies.map((c) => {
              const spent = c.settlementItems.reduce((s, i) => s + i.amount, 0);
              const remaining = c.amount - spent;
              return (
                <div key={c.id} className="py-3 px-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">{c.holderName} — {c.code}</p>
                      <p className="text-[10px] text-zinc-500">{c.description} • {c.openDate}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span>القيمة: <span className="text-white font-bold">{c.amount.toLocaleString('ar-EG')}</span></span>
                    <span>تم صرف: <span className="text-amber-400 font-bold">{spent.toLocaleString('ar-EG')}</span></span>
                    <span>متبقي: <span className="text-emerald-400 font-bold">{remaining.toLocaleString('ar-EG')}</span></span>
                    {c.status !== 'تم تسويتها' && (
                      <button
                        onClick={() => { setSettleCustodyId(c.id); setModal('settle'); }}
                        className="text-[#6366F1] hover:underline font-bold"
                      >
                        تسوية
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* === الملخص المالي === */}
      <div className="bg-gradient-to-r from-[#6366F1]/10 to-emerald-500/10 border border-[#6366F1]/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          الملخص المالي
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <SumCard label="إيرادات محصلة" value={summary.collectedRevenue} color="text-emerald-400" />
          <SumCard label="إيرادات مستحقة" value={summary.pendingRevenue} color="text-amber-400" />
          <SumCard label="مصروفات مباشرة" value={summary.directExpenses} color="text-rose-400" />
          <SumCard label="مصروفات تسوية عهد" value={summary.custodyExpenses} color="text-amber-400" />
          <SumCard label="إجمالي المصروفات" value={summary.totalExpenses} color="text-rose-300" />
          <SumCard label="عهد مفتوحة" value={summary.openCustodyTotal} color="text-blue-400" />
          <SumCard label="متبقي العهد" value={summary.custodyRemaining} color="text-blue-300" />
          <SumCard label="صافي الربح/الخسارة" value={summary.netProfit} color={summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} highlight />
          <SumCard label="صافي الربح المتوقع" value={summary.expectedProfit} color={summary.expectedProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
        </div>
      </div>

      {/* Modals */}
      {modal === 'revenue' && <AddRevenueModal projectCode={project.code} onClose={() => setModal(null)} onDone={() => { refresh(); setModal(null); }} />}
      {modal === 'expense' && <AddExpenseModal projectCode={project.code} onClose={() => setModal(null)} onDone={() => { refresh(); setModal(null); }} />}
      {modal === 'custody' && <AddCustodyModal projectCode={project.code} onClose={() => setModal(null)} onDone={() => { refresh(); setModal(null); }} />}
      {modal === 'settle' && settleCustodyId && <SettleCustodyModal custodyId={settleCustodyId} projectCode={project.code} onClose={() => { setModal(null); setSettleCustodyId(null); }} onDone={() => { refresh(); setModal(null); setSettleCustodyId(null); }} />}
    </div>
  );
}

/* ==================== Sub-components ==================== */

function Section({ title, icon: Icon, iconColor, onAdd, count, children }: { title: string; icon: typeof TrendingUp; iconColor: string; onAdd: () => void; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} /> {title}
          <span className="text-xs text-zinc-500 font-normal">({count})</span>
        </h3>
        <button onClick={onAdd} className="flex items-center gap-1 bg-[#6366F1] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#5254E2] transition-all">
          <Plus className="h-3 w-3" /> إضافة
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-zinc-500 text-center py-6">{text}</p>;
}

function SumCard({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-white/5 border border-white/10' : ''}`}>
      <p className="text-[10px] text-zinc-500 font-bold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value.toLocaleString('ar-EG')} <span className="text-xs text-zinc-500">ج.م</span></p>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#18181B] text-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="h-5 w-5 text-zinc-400" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const inputCls = "w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50";

/* ---- Add Revenue ---- */
function AddRevenueModal({ projectCode, onClose, onDone }: { projectCode: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ amount: '', date: '', status: 'مستحق' as RevenueStatus, method: '', notes: '' });
  const handle = () => {
    const amount = Number(f.amount);
    if (!amount || amount <= 0) { toast.error('أدخل قيمة الإيراد'); return; }
    addRevenue({ projectCode, amount, date: f.date || new Date().toISOString().slice(0, 10), status: f.status, collectionMethod: f.method, notes: f.notes });
    toast.success('تم إضافة الإيراد');
    onDone();
  };
  return (
    <ModalShell title="إضافة إيراد" onClose={onClose}>
      <input type="number" placeholder="قيمة الإيراد *" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} />
      <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} />
      <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as RevenueStatus })} className={inputCls}>
        <option value="محصل">محصل</option>
        <option value="مستحق">مستحق</option>
        <option value="متأخر">متأخر</option>
      </select>
      <input placeholder="طريقة التحصيل (اختياري)" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} className={inputCls} />
      <input placeholder="ملاحظات (اختياري)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} />
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-zinc-400 font-bold text-sm">إلغاء</button>
        <button onClick={handle} className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-all">إضافة</button>
      </div>
    </ModalShell>
  );
}

/* ---- Add Expense ---- */
function AddExpenseModal({ projectCode, onClose, onDone }: { projectCode: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ expenseCode: '111', description: '', date: '', amount: '', notes: '' });
  const handle = () => {
    const amount = Number(f.amount);
    if (!amount || amount <= 0) { toast.error('أدخل قيمة المصروف'); return; }
    addExpense({
      projectCode,
      expenseCode: f.expenseCode,
      expenseType: EXPENSE_CODES[f.expenseCode] || 'أخرى',
      description: f.description,
      date: f.date || new Date().toISOString().slice(0, 10),
      amount,
      source: 'مباشر',
      notes: f.notes,
    });
    toast.success('تم إضافة المصروف');
    onDone();
  };
  return (
    <ModalShell title="إضافة مصروف مباشر" onClose={onClose}>
      <select value={f.expenseCode} onChange={(e) => setF({ ...f, expenseCode: e.target.value })} className={inputCls}>
        {Object.entries(EXPENSE_CODES).map(([code, label]) => (
          <option key={code} value={code}>{code} — {label}</option>
        ))}
      </select>
      <input placeholder="وصف المصروف" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} />
      <input type="number" placeholder="القيمة *" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} />
      <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} />
      <input placeholder="ملاحظات (اختياري)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} />
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-zinc-400 font-bold text-sm">إلغاء</button>
        <button onClick={handle} className="bg-rose-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-rose-400 transition-all">إضافة</button>
      </div>
    </ModalShell>
  );
}

/* ---- Add Custody ---- */
function AddCustodyModal({ projectCode, onClose, onDone }: { projectCode: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ code: '', holderName: '', amount: '', openDate: '', description: '', notes: '' });
  const handle = () => {
    const amount = Number(f.amount);
    if (!f.code.trim() || !f.holderName.trim() || !amount || amount <= 0) { toast.error('أكمل البيانات المطلوبة'); return; }
    addCustody({
      code: f.code.trim(),
      projectCode,
      holderName: f.holderName.trim(),
      amount,
      openDate: f.openDate || new Date().toISOString().slice(0, 10),
      description: f.description,
      status: 'مفتوحة',
      notes: f.notes,
    });
    toast.success('تم فتح العهدة');
    onDone();
  };
  return (
    <ModalShell title="فتح عهدة جديدة" onClose={onClose}>
      <input placeholder="كود العهدة * (مثال: ADV-001)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className={inputCls} />
      <input placeholder="اسم صاحب العهدة *" value={f.holderName} onChange={(e) => setF({ ...f, holderName: e.target.value })} className={inputCls} />
      <input type="number" placeholder="قيمة العهدة *" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} />
      <input type="date" value={f.openDate} onChange={(e) => setF({ ...f, openDate: e.target.value })} className={inputCls} />
      <input placeholder="وصف العهدة" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} />
      <input placeholder="ملاحظات (اختياري)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} />
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-zinc-400 font-bold text-sm">إلغاء</button>
        <button onClick={handle} className="bg-blue-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-400 transition-all">فتح العهدة</button>
      </div>
    </ModalShell>
  );
}

/* ---- Settle Custody ---- */
function SettleCustodyModal({ custodyId, projectCode, onClose, onDone }: { custodyId: string; projectCode: string; onClose: () => void; onDone: () => void }) {
  const [items, setItems] = useState<{ expenseCode: string; description: string; amount: string; date: string }[]>([
    { expenseCode: '111', description: '', amount: '', date: '' },
  ]);

  const addItem = () => setItems([...items, { expenseCode: '111', description: '', amount: '', date: '' }]);
  const updateItem = (idx: number, patch: Partial<typeof items[0]>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handle = () => {
    const valid = items.filter((i) => Number(i.amount) > 0);
    if (valid.length === 0) { toast.error('أضف بند مصروف واحد على الأقل'); return; }
    try {
      settleCustody(
        custodyId,
        valid.map((i) => ({
          projectCode,
          expenseCode: i.expenseCode,
          expenseType: EXPENSE_CODES[i.expenseCode] || 'أخرى',
          description: i.description,
          date: i.date || new Date().toISOString().slice(0, 10),
          amount: Number(i.amount),
          notes: '',
        })),
      );
      toast.success('تمت تسوية العهدة وإنزال المصروفات');
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'خطأ');
    }
  };

  return (
    <ModalShell title="تسوية العهدة" onClose={onClose}>
      <p className="text-xs text-zinc-400">أضف بنود المصروفات التي تم صرفها من العهدة. كل بند سينزل كمصروف مستقل.</p>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {items.map((item, idx) => (
          <div key={idx} className="bg-[#09090B] border border-zinc-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold">بند {idx + 1}</span>
              {items.length > 1 && <button onClick={() => removeItem(idx)} className="text-rose-400 text-[10px] hover:underline">حذف</button>}
            </div>
            <select value={item.expenseCode} onChange={(e) => updateItem(idx, { expenseCode: e.target.value })} className={inputCls}>
              {Object.entries(EXPENSE_CODES).map(([code, label]) => (
                <option key={code} value={code}>{code} — {label}</option>
              ))}
            </select>
            <input placeholder="وصف" value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="القيمة *" value={item.amount} onChange={(e) => updateItem(idx, { amount: e.target.value })} className={inputCls} />
              <input type="date" value={item.date} onChange={(e) => updateItem(idx, { date: e.target.value })} className={inputCls} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-zinc-700 rounded-xl text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
        + إضافة بند آخر
      </button>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-zinc-400 font-bold text-sm">إلغاء</button>
        <button onClick={handle} className="bg-[#6366F1] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#5254E2] transition-all">تسوية وإنزال المصروفات</button>
      </div>
    </ModalShell>
  );
}
