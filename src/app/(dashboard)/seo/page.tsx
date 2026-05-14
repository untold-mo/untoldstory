import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Search, ShieldCheck, TrendingUp } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db } from '../../../lib/db';
import { mockGSCData } from '../../../lib/db/mock-data';
import { SeoDataScopeBanner } from './SeoDataScopeBanner';

type CounterCardProps = {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'emerald' | 'indigo' | 'amber' | 'rose';
};

const toneClass: Record<NonNullable<CounterCardProps['tone']>, string> = {
  emerald: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  indigo: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10',
  amber: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  rose: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
};

const CounterCard = ({ title, value, suffix = '', icon: Icon, tone = 'indigo' }: CounterCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const steps = 24;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(1, frame / steps);
      setDisplayValue(Math.round(value * progress));
      if (progress >= 1) window.clearInterval(timer);
    }, 20);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <div className={`rounded-2xl border p-4 ${toneClass[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold">{title}</p>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-black">
        {displayValue.toLocaleString()}
        {suffix}
      </p>
    </div>
  );
};

const SeoOverviewPage = () => {
  const [topKeywords, setTopKeywords] = useState(0);
  const [avgPosition, setAvgPosition] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [latestIssues, setLatestIssues] = useState<
    { type: string; severity: 'critical' | 'warning' | 'info'; title: string; fix: string }[]
  >([]);
  const [rankRows, setRankRows] = useState<
    { id: string; keyword: string; position: number; previous: number; change: number; intent: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      const projectId = '1';
      const keywords = await db.keywords.getByProject(projectId);
      const rankHistory = await db.rankings.getByProject(projectId);
      const latestAudit = await db.audits.getLatest(projectId);

      const top10 = keywords.filter((k) => k.position <= 10).length;
      const avgPos = keywords.length > 0 ? keywords.reduce((s, k) => s + k.position, 0) / keywords.length : 0;
      setTopKeywords(top10);
      setAvgPosition(Number(avgPos.toFixed(1)));
      setHealthScore(latestAudit?.score || 0);
      setLatestIssues((latestAudit?.issues || []).filter((i) => i.severity === 'critical'));

      const rows = keywords.map((k) => {
        const history = rankHistory
          .filter((h) => h.keywordId === k.id)
          .sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime());
        const current = history[0]?.position ?? k.position;
        const previous = history[1]?.position ?? current;
        return {
          id: k.id,
          keyword: k.keyword,
          position: current,
          previous,
          change: previous - current,
          intent: k.intent,
        };
      });
      setRankRows(rows.sort((a, b) => b.change - a.change).slice(0, 8));
    };
    load();
  }, []);

  const trend = useMemo(
    () =>
      mockGSCData.trend.map((point) => ({
        ...point,
        day: new Date(point.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      })),
    []
  );

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div>
        <h1 className="text-2xl font-black">نظرة عامة على SEO</h1>
        <p className="text-sm text-zinc-400 mt-1">لوحة متابعة الأداء العضوي والصحة التقنية للمشروع</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CounterCard title="نقرات عضوية" value={mockGSCData.totalClicks} icon={TrendingUp} tone="emerald" />
        <CounterCard title="كلمات ضمن أعلى 10" value={topKeywords} icon={Search} tone="indigo" />
        <CounterCard title="متوسط الترتيب" value={Math.round(avgPosition * 10)} suffix="" icon={BarChart3} tone="amber" />
        <CounterCard title="الصحة التقنية" value={healthScore} suffix="/100" icon={ShieldCheck} tone={healthScore < 60 ? 'rose' : 'emerald'} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="font-black mb-4">نقرات ومرات ظهور — آخر 14 يوماً</h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#34d399" />
              <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" />
              <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #334155' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#34d399" strokeWidth={2} dot={false} name="نقرات" />
              <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#60a5fa" strokeWidth={2} dot={false} name="مرات الظهور" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-black mb-4">تغيّرات الترتيب</h3>
          <div className="space-y-2">
            {rankRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 bg-[#0f172a]/60 border border-white/10 rounded-xl p-3">
                <div>
                  <p className="text-sm font-bold">{row.keyword}</p>
                  <p className="text-[11px] text-zinc-500">الحالي: {row.position} — السابق: {row.previous}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${
                    row.change > 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : row.change < 0
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-zinc-500/20 text-zinc-300'
                  }`}
                >
                  {row.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : row.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                  {row.change > 0 ? `+${row.change}` : row.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-black mb-4">مشكلات حرجة</h3>
          <div className="space-y-2">
            {latestIssues.map((issue, idx) => (
              <div key={`${issue.type}-${idx}`} className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-300" />
                  <p className="text-sm font-bold text-rose-200">{issue.title}</p>
                </div>
                <p className="text-xs text-zinc-300 mt-2">{issue.fix}</p>
              </div>
            ))}
            {latestIssues.length === 0 && <p className="text-sm text-zinc-500">لا توجد مشكلات حرجة في آخر تدقيق.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoOverviewPage;

