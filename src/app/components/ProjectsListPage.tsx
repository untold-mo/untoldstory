import { AlertCircle, Briefcase, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  getProjectsDataAsync,
  addProject,
} from '@/lib/projects/projectStore';
import type { Project, ProjectStatus, ProjectsData } from '@/lib/projects/projectTypes';
import { useData } from '../context/DataContext';
import ProjectDetailPage from './ProjectDetailPage';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  'مفتوحة': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'تحت التنفيذ': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'منتهية': 'bg-zinc-800 text-zinc-400 border-zinc-700',
  'تحت التحصيل': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const PROJECT_STATUSES: ProjectStatus[] = ['مفتوحة', 'تحت التنفيذ', 'منتهية', 'تحت التحصيل'];
type ProjectSort = 'date_desc' | 'date_asc' | 'client' | 'code' | 'status';

export default function ProjectsListPage() {
  const { users, currentUser } = useData();
  const role = currentUser?.role;
  const isSalesRep = role === 'مندوب';
  const isTeamLeader = isSalesRep && Boolean(currentUser?.isTeamLeader);
  const canCreateProject = role === 'مالك' || role === 'محاسب';
  // معرّفات فريق التيم ليدر (نفسه + المندوبون التابعون له)
  const teamMemberIds = useMemo(() => {
    if (!isTeamLeader || !currentUser) return null;
    const ids = new Set<string>([currentUser.id]);
    users.forEach((u) => { if (u.teamLeaderId === currentUser.id) ids.add(u.id); });
    return ids;
  }, [isTeamLeader, currentUser, users]);
  const salesReps = useMemo(() => users.filter((u) => u.role === 'مندوب'), [users]);

  const emptyData: ProjectsData = { projects: [], revenues: [], expenses: [], custodies: [] };
  const [data, setData] = useState<ProjectsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', code: '', clientName: '', projectDate: '', startDate: '', expectedEndDate: '',
    status: 'مفتوحة' as ProjectStatus, managerName: '', productionManagerName: '', salesName: '', salesId: '', accountantName: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [sort, setSort] = useState<ProjectSort>('date_desc');
  const [monthFilter, setMonthFilter] = useState('');

  const refresh = useCallback(() => {
    setLoadError(null);
    return getProjectsDataAsync()
      .then((d) => { setData(d); setLoadError(null); })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'تعذر تحميل الشغلانات';
        setLoadError(msg);
        toast.error(msg);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getProjectsDataAsync()
      .then((d) => { if (!cancelled) { setData(d); setLoadError(null); } })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'تعذر تحميل الشغلانات';
        setLoadError(msg);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const alerts = useMemo(() => {
    const items: { type: 'revenue' | 'custody'; message: string }[] = [];
    const now = new Date();
    for (const r of data.revenues) {
      if (r.status === 'مستحق' && new Date(r.date) < now) {
        const projName = data.projects.find((p) => p.code === r.projectCode)?.name || r.projectCode;
        items.push({ type: 'revenue', message: `إيراد متأخر: ${r.amount.toLocaleString('ar-EG')} ج.م — ${projName} (${r.date})` });
      }
    }
    for (const c of data.custodies) {
      if (c.status !== 'تم تسويتها') {
        const daysDiff = Math.floor((now.getTime() - new Date(c.openDate).getTime()) / 86400000);
        if (daysDiff > 30) {
          items.push({ type: 'custody', message: `عهدة مفتوحة منذ ${daysDiff} يوم: ${c.code} — ${c.holderName} (${c.amount.toLocaleString('ar-EG')} ج.م)` });
        }
      }
    }
    return items;
  }, [data]);

  const projectDateOf = (p: Project) => p.projectDate || p.startDate || p.createdAt;

  // نطاق الرؤية حسب الدور: السيلز يرى شغلاناته، التيم ليدر يرى شغلانات فريقه، الباقي الكل
  const scopedProjects = useMemo(() => {
    if (!isSalesRep || !currentUser) return data.projects;
    if (teamMemberIds) return data.projects.filter((p) => p.salesId && teamMemberIds.has(p.salesId));
    return data.projects.filter((p) => p.salesId === currentUser.id);
  }, [data.projects, isSalesRep, teamMemberIds, currentUser]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = scopedProjects.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesMonth = !monthFilter || projectDateOf(p).slice(0, 7) === monthFilter;
      return matchesSearch && matchesStatus && matchesMonth;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'date_asc': return projectDateOf(a).localeCompare(projectDateOf(b));
        case 'client': return a.clientName.localeCompare(b.clientName, 'ar');
        case 'code': return a.code.localeCompare(b.code);
        case 'status': return a.status.localeCompare(b.status, 'ar');
        case 'date_desc':
        default: return projectDateOf(b).localeCompare(projectDateOf(a));
      }
    });
    return list;
  }, [data.projects, search, statusFilter, monthFilter, sort]);

  const handleAdd = async () => {
    if (saving) return;
    if (!form.name.trim() || !form.code.trim() || !form.clientName.trim()) {
      toast.error('أدخل اسم الشغلانة والكود واسم العميل');
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const created = await addProject({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        clientName: form.clientName.trim(),
        projectDate: form.projectDate || today,
        startDate: form.startDate || today,
        expectedEndDate: form.expectedEndDate || undefined,
        status: form.status,
        managerName: form.managerName.trim() || undefined,
        productionManagerName: form.productionManagerName.trim() || undefined,
        salesName: form.salesName.trim() || undefined,
        salesId: form.salesId || undefined,
        accountantName: form.accountantName.trim() || undefined,
        notes: form.notes.trim(),
      });
      setData((prev) => ({
        ...prev,
        projects: [created, ...prev.projects.filter((p) => p.id !== created.id)],
      }));
      void refresh();
      setShowAdd(false);
      setForm({
        name: '', code: '', clientName: '', projectDate: '', startDate: '', expectedEndDate: '',
        status: 'مفتوحة', managerName: '', productionManagerName: '', salesName: '', salesId: '', accountantName: '', notes: '',
      });
      toast.success('تم إنشاء الشغلانة بنجاح');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = selectedProjectId ? data.projects.find((p) => p.id === selectedProjectId) : null;

  if (selectedProject) {
    return <ProjectDetailPage project={selectedProject} onBack={() => { setSelectedProjectId(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">الشغلانات / المشاريع</h2>
          <p className="text-zinc-400">{isSalesRep ? 'الشغلانات المرتبطة بك — يمكنك إضافة تحديثات' : 'إدارة المشاريع والحركات المالية المرتبطة'}</p>
        </div>
        {canCreateProject && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20"
          >
            <Plus className="h-5 w-5" />
            شغلانة جديدة
          </button>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> تنبيهات ({alerts.length})</h3>
          {alerts.slice(0, 5).map((a, i) => (
            <p key={i} className="text-xs text-rose-300/80">• {a.message}</p>
          ))}
          {alerts.length > 5 && <p className="text-[10px] text-zinc-500">و {alerts.length - 5} تنبيهات أخرى...</p>}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PROJECT_STATUSES.map((s) => (
          <div key={s} className="bg-[#18181B] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <span className="text-zinc-400 font-medium">{s}</span>
            <span className="bg-zinc-800 text-white px-2.5 py-0.5 rounded-lg text-sm font-bold">
              {scopedProjects.filter((p) => p.status === s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Search + filters + sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود أو العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
          className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
          aria-label="فلتر الحالة"
        >
          <option value="all">كل الحالات</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
          aria-label="فلتر الشهر"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ProjectSort)}
          className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
          aria-label="ترتيب"
        >
          <option value="date_desc">الأحدث تاريخاً</option>
          <option value="date_asc">الأقدم تاريخاً</option>
          <option value="client">اسم العميل</option>
          <option value="code">كود الشغلانة</option>
          <option value="status">الحالة</option>
        </select>
        {(statusFilter !== 'all' || monthFilter) && (
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setMonthFilter(''); }}
            className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-2 rounded-lg border border-zinc-700"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {loadError && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-200/90">{loadError}</p>
          <button
            type="button"
            onClick={() => { setLoading(true); void refresh().finally(() => setLoading(false)); }}
            className="text-xs font-bold text-amber-300 hover:text-white px-3 py-1.5 rounded-lg border border-amber-500/30"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-12 text-center">
            <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-3 animate-pulse" />
            <p className="text-zinc-500">جاري تحميل الشغلانات…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-12 text-center">
            <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">{data.projects.length === 0 ? 'لا توجد شغلانات بعد — اضغط «شغلانة جديدة» وأدخل الاسم والكود واسم العميل' : 'لا توجد نتائج'}</p>
          </div>
        ) : (
          filtered.map((p) => {
            const projRevenues = data.revenues.filter((r) => r.projectCode === p.code);
            const projExpenses = data.expenses.filter((e) => e.projectCode === p.code);
            const totalRev = projRevenues.filter((r) => r.status === 'محصل').reduce((s, r) => s + r.amount, 0);
            const totalExp = projExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className="w-full text-right bg-[#18181B] border border-zinc-800 rounded-2xl p-5 hover:border-[#6366F1]/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-[#6366F1]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white group-hover:text-[#6366F1] transition-colors">{p.name}</p>
                      <p className="text-xs text-zinc-500">كود: {p.code} • عميل: {p.clientName}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">
                        📅 {projectDateOf(p).slice(0, 10)}
                        {p.expectedEndDate ? ` → ${p.expectedEndDate.slice(0, 10)}` : ''}
                        {p.managerName ? ` • مسؤول: ${p.managerName}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-zinc-500">
                  <span>إيرادات: <span className="text-emerald-400 font-bold">{totalRev.toLocaleString('ar-EG')}</span> ج.م</span>
                  <span>مصروفات: <span className="text-rose-400 font-bold">{totalExp.toLocaleString('ar-EG')}</span> ج.م</span>
                  <span>صافي: <span className={`font-bold ${totalRev - totalExp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{(totalRev - totalExp).toLocaleString('ar-EG')}</span> ج.م</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAdd && createPortal(
        <div className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#18181B] text-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">شغلانة جديدة</h3>
              <button type="button" onClick={() => !saving && setShowAdd(false)} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="h-5 w-5 text-zinc-400" /></button>
            </div>
            <p className="text-xs text-zinc-500 -mt-2">الحقول المطلوبة: اسم الشغلانة، الكود (فريد)، اسم العميل</p>
            <div className="grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
              <input placeholder="اسم الشغلانة *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2 w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
              <input placeholder="كود الشغلانة * (مثال: HK001)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
              <input placeholder="اسم العميل *" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
              <label className="text-[10px] text-zinc-500 font-bold col-span-2 -mb-2">تاريخ الشغلانة</label>
              <input type="date" value={form.projectDate} onChange={(e) => setForm({ ...form, projectDate: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" aria-label="تاريخ الشغلانة" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" aria-label="الحالة">
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="text-[10px] text-zinc-500 font-bold -mb-2">تاريخ البداية</label>
              <label className="text-[10px] text-zinc-500 font-bold -mb-2">الانتهاء المتوقع</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" aria-label="تاريخ البداية" />
              <input type="date" value={form.expectedEndDate} onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" aria-label="تاريخ الانتهاء المتوقع" />
              <input placeholder="المسؤول عن الشغلانة" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
              <input placeholder="مدير الإنتاج المسؤول" value={form.productionManagerName} onChange={(e) => setForm({ ...form, productionManagerName: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
              <select
                value={form.salesId}
                onChange={(e) => {
                  const id = e.target.value;
                  const rep = salesReps.find((u) => u.id === id);
                  setForm({ ...form, salesId: id, salesName: rep?.name || '' });
                }}
                className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
                aria-label="السيلز المسؤول"
              >
                <option value="">السيلز المسؤول (لربط الرؤية)</option>
                {salesReps.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input placeholder="المحاسب المسؤول" value={form.accountantName} onChange={(e) => setForm({ ...form, accountantName: e.target.value })} className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
              <input placeholder="ملاحظات عامة (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="col-span-2 w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setShowAdd(false)} className="px-4 py-2 text-zinc-400 font-bold text-sm disabled:opacity-50">إلغاء</button>
              <button type="button" disabled={saving} onClick={handleAdd} className="bg-[#6366F1] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#5254E2] transition-all disabled:opacity-60">{saving ? 'جاري الإنشاء…' : 'إنشاء'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
