import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getProjectsDataAsync, updateRevenue } from '@/lib/projects/projectStore';
import type { ProjectsData } from '@/lib/projects/projectTypes';
import { toast } from 'sonner';
import { exportToCsv } from '@/lib/projects/exportCsv';

export default function GeneralRevenuesPage() {
  const [data, setData] = useState<ProjectsData>({ projects: [], revenues: [], expenses: [], custodies: [] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'محصل' | 'مستحق' | 'متأخر'>('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const refresh = () => { getProjectsDataAsync().then(setData).catch(() => {}); };
  useEffect(() => { refresh(); }, []);

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    data.projects.forEach((p) => map.set(p.code, p.name));
    return map;
  }, [data.projects]);

  const filtered = useMemo(() => {
    let list = data.revenues;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (projectFilter !== 'all') list = list.filter((r) => r.projectCode === projectFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) =>
      r.projectCode.toLowerCase().includes(q) ||
      (projectNames.get(r.projectCode) || '').toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q),
    );
    return list;
  }, [data.revenues, statusFilter, projectFilter, search, projectNames]);

  const totalCollected = filtered.filter((r) => r.status === 'محصل').reduce((s, r) => s + r.amount, 0);
  const totalPending = filtered.filter((r) => r.status !== 'محصل').reduce((s, r) => s + r.amount, 0);

  const handleExport = () => {
    exportToCsv('إيرادات_عامة', ['الشغلانة', 'القيمة', 'التاريخ', 'الحالة', 'طريقة التحصيل', 'ملاحظات'],
      filtered.map((r) => [`${r.projectCode} ${projectNames.get(r.projectCode) || ''}`, String(r.amount), r.date, r.status, r.collectionMethod, r.notes]),
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">الإيرادات العامة</h2>
          <p className="text-zinc-400">جميع الإيرادات من كل الشغلانات</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all">
          <Download className="h-4 w-4" /> تصدير CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white">
          <option value="all">كل الحالات</option>
          <option value="محصل">محصل</option>
          <option value="مستحق">مستحق</option>
          <option value="متأخر">متأخر</option>
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white">
          <option value="all">كل الشغلانات</option>
          {data.projects.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400">إيرادات محصلة</span>
          <span className="text-lg font-bold text-emerald-400">{totalCollected.toLocaleString('ar-EG')} ج.م</span>
        </div>
        <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400">إيرادات مستحقة</span>
          <span className="text-lg font-bold text-amber-400">{totalPending.toLocaleString('ar-EG')} ج.م</span>
        </div>
      </div>

      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold border-b border-zinc-800">
                <th className="px-4 py-3">الشغلانة</th>
                <th className="px-4 py-3">القيمة</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">طريقة التحصيل</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">لا توجد إيرادات</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className={`hover:bg-zinc-800/30 transition-colors ${r.status !== 'محصل' ? 'bg-amber-500/[0.03]' : ''}`}>
                  <td className="px-4 py-3 text-zinc-300">{r.projectCode} <span className="text-zinc-600 text-[10px]">{projectNames.get(r.projectCode)}</span></td>
                  <td className="px-4 py-3 text-white font-bold">{r.amount.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${r.status === 'محصل' ? 'bg-emerald-500/10 text-emerald-400' : r.status === 'متأخر' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{r.collectionMethod || '—'}</td>
                  <td className="px-4 py-3">
                    {r.status !== 'محصل' && (
                      <button onClick={() => { updateRevenue(r.id, { status: 'محصل' }).then(() => { refresh(); toast.success('تم تأكيد التحصيل'); }); }}
                        className="text-[10px] text-emerald-400 hover:underline font-bold">تأكيد التحصيل</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
