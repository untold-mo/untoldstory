import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Link2, Mail, ShieldCheck } from 'lucide-react';
import { db } from '../../../../lib/db';
import { SeoDataScopeBanner } from '../SeoDataScopeBanner';
import type { Backlink, BacklinkStatus } from '../../../../lib/db/mock-data';

const drClass = (dr: number) =>
  dr <= 30 ? 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300' : dr <= 60 ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-amber-500/20 border-amber-500/30 text-amber-300';

const typeClass = (type: Backlink['type']) => {
  if (type === 'broken_link') return 'bg-rose-500/20 border-rose-500/30 text-rose-300';
  if (type === 'guest_post') return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
  if (type === 'resource_page') return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
  return 'bg-purple-500/20 border-purple-500/30 text-purple-300';
};

const statusClass = (status: BacklinkStatus) => {
  if (status === 'acquired') return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
  if (status === 'contacted') return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300';
  if (status === 'new') return 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300';
  return 'bg-rose-500/20 border-rose-500/30 text-rose-300';
};

const SeoBacklinksPage = () => {
  const [rows, setRows] = useState<Backlink[]>([]);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = async () => {
    const data = await db.backlinks.getByProject('1');
    setRows(data);
    const draft: Record<string, string> = {};
    data.forEach((row) => {
      draft[row.id] = row.notes || '';
    });
    setNotesDraft(draft);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const contacted = rows.filter((r) => r.status === 'contacted').length;
    const acquired = rows.filter((r) => r.status === 'acquired').length;
    const avgDr = total > 0 ? Math.round(rows.reduce((sum, r) => sum + r.domainRating, 0) / total) : 0;
    return { total, contacted, acquired, avgDr };
  }, [rows]);

  const setStatus = async (id: string, status: BacklinkStatus) => {
    await db.backlinks.updateStatus(id, status);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div>
        <h1 className="text-2xl font-black">الروابط الخلفية</h1>
        <p className="text-sm text-zinc-400 mt-1">إدارة فرص الروابط الخارجية ومتابعة التواصل</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">إجمالي الفرص</p>
          <p className="text-2xl font-black text-zinc-100 mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">تم التواصل</p>
          <p className="text-2xl font-black text-indigo-300 mt-1">{stats.contacted}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">مكتسب</p>
          <p className="text-2xl font-black text-emerald-300 mt-1">{stats.acquired}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-zinc-400">متوسط DR</p>
          <p className="text-2xl font-black text-amber-300 mt-1">{stats.avgDr}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right">
            <thead>
              <tr className="bg-[#0b1020]/90">
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">النطاق</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">DR</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">النوع</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">تقدير الزيارات</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الحالة</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">ملاحظات</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  <td className="p-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-200 inline-flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-cyan-300" />
                        {row.sourceDomain}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 truncate max-w-[240px]">{row.sourceUrl || 'لا يوجد رابط بعد'}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-black ${drClass(row.domainRating)}`}>{row.domainRating}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-black ${typeClass(row.type)}`}>{row.type}</span>
                  </td>
                  <td className="p-3 text-sm text-zinc-300">{row.trafficEstimate.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-black ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="p-3">
                    <input
                      value={notesDraft[row.id] || ''}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      placeholder="ملاحظات التواصل…"
                      className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {row.status === 'new' && (
                        <button
                          onClick={() => setStatus(row.id, 'contacted')}
                          className="px-2 py-1 rounded-lg text-[11px] font-black bg-indigo-500 text-white inline-flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          تم التواصل
                        </button>
                      )}
                      {row.status === 'contacted' && (
                        <button
                          onClick={() => setStatus(row.id, 'acquired')}
                          className="px-2 py-1 rounded-lg text-[11px] font-black bg-emerald-500 text-slate-950 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          تم الاكتساب
                        </button>
                      )}
                      {row.status === 'acquired' && (
                        <span className="px-2 py-1 rounded-lg text-[11px] font-black bg-emerald-500/20 text-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          مكتمل
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">لا توجد فرص روابط خلفية.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeoBacklinksPage;

