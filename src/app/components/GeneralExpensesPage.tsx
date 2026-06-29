import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getProjectsDataAsync } from '@/lib/projects/projectStore';
import type { ProjectsData } from '@/lib/projects/projectTypes';
import { EXPENSE_CODES } from '@/lib/projects/projectTypes';
import { exportToCsv } from '@/lib/projects/exportCsv';

export default function GeneralExpensesPage() {
  const [data, setData] = useState<ProjectsData>({ projects: [], revenues: [], expenses: [], custodies: [] });
  useEffect(() => { getProjectsDataAsync().then(setData).catch(() => {}); }, []);
  const [search, setSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'مباشر' | 'تسوية عهدة'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    data.projects.forEach((p) => map.set(p.code, p.name));
    return map;
  }, [data.projects]);

  const filtered = useMemo(() => {
    let list = data.expenses;
    if (codeFilter !== 'all') list = list.filter((e) => e.expenseCode === codeFilter);
    if (sourceFilter !== 'all') list = list.filter((e) => e.source === sourceFilter);
    if (projectFilter !== 'all') list = list.filter((e) => e.projectCode === projectFilter);
    if (dateFrom) list = list.filter((e) => e.date >= dateFrom);
    if (dateTo) list = list.filter((e) => e.date <= dateTo);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) =>
      e.expenseType.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.projectCode.toLowerCase().includes(q) ||
      (projectNames.get(e.projectCode) || '').toLowerCase().includes(q),
    );
    return list;
  }, [data.expenses, codeFilter, sourceFilter, projectFilter, dateFrom, dateTo, search, projectNames]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const handleExport = () => {
    exportToCsv('مصروفات_عامة', ['كود', 'النوع', 'الوصف', 'الشغلانة', 'التاريخ', 'المبلغ', 'المصدر', 'كود العهدة'],
      filtered.map((e) => [e.expenseCode, e.expenseType, e.description, `${e.projectCode} ${projectNames.get(e.projectCode) || ''}`, e.date, String(e.amount), e.source, e.custodyId || '']),
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">المصروفات العامة</h2>
          <p className="text-zinc-400">جميع المصروفات من كل الشغلانات — مباشرة ومن تسوية العُهد</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all">
          <Download className="h-4 w-4" /> تصدير CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input type="text" placeholder="بحث بالنوع أو الوصف أو الشغلانة..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
        </div>
        <select value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white">
          <option value="all">كل الأكواد</option>
          {Object.entries(EXPENSE_CODES).map(([c, l]) => <option key={c} value={c}>{c} — {l}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white">
          <option value="all">كل المصادر</option>
          <option value="مباشر">مباشر</option>
          <option value="تسوية عهدة">تسوية عهدة</option>
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white">
          <option value="all">كل الشغلانات</option>
          {data.projects.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="من تاريخ" placeholder="من" className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="إلى تاريخ" placeholder="إلى" className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white" />
      </div>

      {/* Summary */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-zinc-400">{filtered.length} مصروف</span>
        <span className="text-lg font-bold text-rose-400">{total.toLocaleString('ar-EG')} ج.م</span>
      </div>

      {/* Table */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold border-b border-zinc-800">
                <th className="px-4 py-3">كود</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الوصف</th>
                <th className="px-4 py-3">الشغلانة</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">المبلغ</th>
                <th className="px-4 py-3">المصدر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">لا توجد مصروفات</td></tr>
              ) : filtered.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{e.expenseCode}</td>
                  <td className="px-4 py-3 text-white font-bold">{e.expenseType}</td>
                  <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-zinc-300">{e.projectCode} <span className="text-zinc-600 text-[10px]">{projectNames.get(e.projectCode)}</span></td>
                  <td className="px-4 py-3 text-zinc-400">{e.date}</td>
                  <td className="px-4 py-3 text-white font-bold">{e.amount.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${e.source === 'مباشر' ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {e.source}
                    </span>
                    {e.custodyId && <span className="text-[9px] text-zinc-600 block mt-0.5">عهدة: {e.custodyId.slice(0, 10)}</span>}
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
