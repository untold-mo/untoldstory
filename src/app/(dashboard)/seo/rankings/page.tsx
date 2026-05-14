import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db } from '../../../../lib/db';
import { SeoDataScopeBanner } from '../SeoDataScopeBanner';
import type { Keyword, RankHistoryPoint } from '../../../../lib/db/mock-data';

type FilterMode = 'all' | 'improved' | 'dropped' | 'top10' | 'top3';

type RankingRow = {
  id: string;
  keywordId: string;
  keyword: string;
  current: number;
  previous: number;
  change: number;
  bestEver: number;
  url: string;
  lastUpdated: Date;
  history: RankHistoryPoint[];
};

const SeoRankingsPage = () => {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);

  const load = async () => {
    const keywords = await db.keywords.getByProject('1');
    const history = await db.rankings.getByProject('1');
    const table = keywords.map((kw: Keyword) => {
      const h = history
        .filter((x) => x.keywordId === kw.id)
        .sort((a, b) => new Date(a.trackedAt).getTime() - new Date(b.trackedAt).getTime());
      const current = h[h.length - 1]?.position ?? kw.position;
      const previous = h[h.length - 2]?.position ?? current;
      const bestEver = Math.min(current, ...h.map((x) => x.position));
      return {
        id: kw.id,
        keywordId: kw.id,
        keyword: kw.keyword,
        current,
        previous,
        change: previous - current,
        bestEver,
        url: `https://theuntoldstory.com/seo/${kw.keyword.replace(/\s+/g, '-')}`,
        lastUpdated: h[h.length - 1]?.trackedAt ? new Date(h[h.length - 1].trackedAt) : new Date(),
        history: h,
      };
    });
    setRows(table.sort((a, b) => a.current - b.current));
  };

  useEffect(() => {
    load();
  }, []);

  const refreshRankings = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setRows((prev) =>
      prev.map((row) => {
        const delta = Math.round((Math.random() - 0.5) * 6);
        const next = Math.max(1, row.current - delta);
        const updatedHistory = [
          ...row.history,
          {
            id: `rh-${Math.random().toString(36).slice(2, 8)}`,
            keywordId: row.keywordId,
            projectId: '1',
            position: next,
            trackedAt: new Date(),
          },
        ].slice(-30);
        return {
          ...row,
          previous: row.current,
          current: next,
          change: row.current - next,
          bestEver: Math.min(row.bestEver, next),
          lastUpdated: new Date(),
          history: updatedHistory,
        };
      })
    );
    setLoading(false);
  };

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'improved':
        return rows.filter((r) => r.change > 0);
      case 'dropped':
        return rows.filter((r) => r.change < 0);
      case 'top10':
        return rows.filter((r) => r.current <= 10);
      case 'top3':
        return rows.filter((r) => r.current <= 3);
      default:
        return rows;
    }
  }, [rows, filter]);

  const selected = useMemo(() => rows.find((r) => r.keywordId === selectedKeywordId) || null, [rows, selectedKeywordId]);

  const historyChart = useMemo(() => {
    if (!selected) return [];
    const sorted = [...selected.history].sort((a, b) => new Date(a.trackedAt).getTime() - new Date(b.trackedAt).getTime());
    return sorted.map((h) => ({
      date: new Date(h.trackedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      position: h.position,
    }));
  }, [selected]);

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">الترتيب في البحث</h1>
          <p className="text-sm text-zinc-400 mt-1">متابعة ترتيب الكلمات وتطورها اليومي</p>
        </div>
        <button
          onClick={refreshRankings}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-black inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'جاري التحديث…' : 'تحديث الترتيب'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ['all', 'الكل'],
          ['improved', 'تحسّن'],
          ['dropped', 'تراجع'],
          ['top10', 'أعلى 10'],
          ['top3', 'أعلى 3'],
        ] as Array<[FilterMode, string]>).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black ${filter === id ? 'bg-indigo-500 text-white' : 'bg-[#0f172a] border border-white/10 text-zinc-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-right">
            <thead>
              <tr className="bg-[#0b1020]/90">
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الكلمة</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الحالي</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">السابق</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">التغيّر</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">أفضل ترتيب</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الرابط</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">آخر تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRows.map((row) => (
                <tr key={row.id} onClick={() => setSelectedKeywordId(row.keywordId)} className="hover:bg-white/[0.03] cursor-pointer">
                  <td className="p-3 text-sm font-bold text-zinc-200">{row.keyword}</td>
                  <td className="p-3 text-sm text-zinc-300">{row.current}</td>
                  <td className="p-3 text-sm text-zinc-400">{row.previous}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${
                        row.change > 0 ? 'bg-emerald-500/20 text-emerald-300' : row.change < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-500/20 text-zinc-300'
                      }`}
                    >
                      {row.change > 0 ? <TrendingUp className="w-3 h-3" /> : row.change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {row.change > 0 ? `+${row.change}` : row.change < 0 ? `${row.change}` : '—'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-indigo-300 font-black">{row.bestEver}</td>
                  <td className="p-3 text-xs text-cyan-300 truncate max-w-[240px]">{row.url}</td>
                  <td className="p-3 text-xs text-zinc-500">{row.lastUpdated.toLocaleString('ar-EG')}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">لا توجد كلمات مطابقة للفلتر الحالي.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[270] bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl h-full bg-[#0d1428] border-r border-white/10 p-5 space-y-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">{selected.keyword}</h3>
                <p className="text-xs text-zinc-500 mt-1">تاريخ الترتيب خلال 30 يوماً</p>
              </div>
              <button onClick={() => setSelectedKeywordId(null)} className="px-2 py-1 rounded-lg bg-white/10 text-zinc-200 text-xs">إغلاق</button>
            </div>
            <div className="h-[280px] rounded-2xl border border-white/10 bg-[#0b1020]/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChart}>
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" reversed domain={[1, 'dataMax + 5']} />
                  <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #334155' }} />
                  <Line type="monotone" dataKey="position" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoRankingsPage;

