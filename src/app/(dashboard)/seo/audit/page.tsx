import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, PlayCircle, ShieldCheck } from 'lucide-react';
import { db } from '../../../../lib/db';
import { SeoDataScopeBanner } from '../SeoDataScopeBanner';
import type { AuditIssue, AuditRecord } from '../../../../lib/db/mock-data';

const steps = ['فحص وسوم الميتا…', 'تحليل السرعة…', 'التحقق من العناوين…', 'فحص المخطط…', 'إعداد التقرير…'];

const statusClass = (status: 'good' | 'needs-improvement' | 'poor') =>
  status === 'good' ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' : status === 'needs-improvement' ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' : 'text-rose-300 bg-rose-500/15 border-rose-500/30';

const severityClass = (severity: AuditIssue['severity']) =>
  severity === 'critical' ? 'text-rose-300 bg-rose-500/15 border-rose-500/30' : severity === 'warning' ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' : 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';

const scoreColor = (score: number) => (score < 50 ? '#f43f5e' : score <= 75 ? '#f59e0b' : '#10b981');

const SeoAuditPage = () => {
  const [url, setUrl] = useState('https://theuntoldstory.com');
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [latestAudit, setLatestAudit] = useState<AuditRecord | null>(null);
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const loadAudits = async () => {
    const rows = await db.audits.getByProject('1');
    setLatestAudit(rows[0] || null);
    setHistory(rows.slice(0, 5));
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const groupedIssues = useMemo(() => {
    const rows = latestAudit?.issues || [];
    return {
      critical: rows.filter((i) => i.severity === 'critical'),
      warning: rows.filter((i) => i.severity === 'warning'),
      info: rows.filter((i) => i.severity === 'info'),
    };
  }, [latestAudit]);

  const runAudit = async () => {
    if (!url.trim()) return;
    setRunning(true);
    setStepIndex(0);

    for (let i = 0; i < steps.length; i += 1) {
      // Simulate crawl progress
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStepIndex(i);
    }

    const baseline = (await db.audits.getLatest('1')) || null;
    if (baseline) {
      const randomized: AuditRecord = {
        ...baseline,
        id: `AUD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        url: url.trim(),
        crawledAt: new Date(),
        score: Math.max(35, Math.min(96, baseline.score + Math.round((Math.random() - 0.5) * 10))),
        coreWebVitals: {
          ...baseline.coreWebVitals,
          lcp: { ...baseline.coreWebVitals.lcp, value: Number((baseline.coreWebVitals.lcp.value + (Math.random() - 0.5) * 0.4).toFixed(2)) },
          fid: { ...baseline.coreWebVitals.fid, value: Math.max(10, Math.round(baseline.coreWebVitals.fid.value + (Math.random() - 0.5) * 12)) },
          cls: { ...baseline.coreWebVitals.cls, value: Number(Math.max(0.01, baseline.coreWebVitals.cls.value + (Math.random() - 0.5) * 0.03).toFixed(2)) },
          ttfb: { ...baseline.coreWebVitals.ttfb, value: Math.max(120, Math.round(baseline.coreWebVitals.ttfb.value + (Math.random() - 0.5) * 80)) },
          mobileScore: Math.max(30, Math.min(99, baseline.coreWebVitals.mobileScore + Math.round((Math.random() - 0.5) * 8))),
          desktopScore: Math.max(40, Math.min(100, baseline.coreWebVitals.desktopScore + Math.round((Math.random() - 0.5) * 6))),
        },
      };
      setLatestAudit(randomized);
      setHistory((prev) => [randomized, ...prev].slice(0, 5));
    }

    setRunning(false);
    setStepIndex(-1);
  };

  const score = latestAudit?.score || 0;
  const scoreStroke = scoreColor(score);

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div>
        <h1 className="text-2xl font-black">تدقيق تقني</h1>
        <p className="text-sm text-zinc-400 mt-1">فحص تقني شامل للموقع مع نتائج Core Web Vitals وخطة إصلاح</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={runAudit}
            disabled={running}
            className="px-4 py-2 rounded-xl text-sm font-black bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-60 inline-flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {running ? 'جاري التشغيل…' : 'تشغيل التدقيق'}
          </button>
        </div>
        {running && (
          <div className="mt-4 space-y-2">
            {steps.map((step, idx) => (
              <div key={step} className={`text-sm rounded-lg px-3 py-2 border ${idx <= stepIndex ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' : 'border-white/10 bg-white/[0.02] text-zinc-500'}`}>
                {step}
              </div>
            ))}
          </div>
        )}
      </div>

      {latestAudit && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex flex-col items-center justify-center">
              <p className="text-sm text-zinc-400 mb-2">درجة التدقيق</p>
              <svg width="180" height="180" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={scoreStroke}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 314} 314`}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="64" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700">
                  {score}
                </text>
              </svg>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-black mb-3 inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                مقاييس الويب الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="border border-white/10 rounded-xl p-3">
                  <p className="text-zinc-400">LCP</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-black">{latestAudit.coreWebVitals.lcp.value}s</p>
                    <span className={`px-2 py-0.5 rounded border text-xs ${statusClass(latestAudit.coreWebVitals.lcp.status)}`}>{latestAudit.coreWebVitals.lcp.status}</span>
                  </div>
                </div>
                <div className="border border-white/10 rounded-xl p-3">
                  <p className="text-zinc-400">FID</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-black">{latestAudit.coreWebVitals.fid.value}ms</p>
                    <span className={`px-2 py-0.5 rounded border text-xs ${statusClass(latestAudit.coreWebVitals.fid.status)}`}>{latestAudit.coreWebVitals.fid.status}</span>
                  </div>
                </div>
                <div className="border border-white/10 rounded-xl p-3">
                  <p className="text-zinc-400">CLS</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-black">{latestAudit.coreWebVitals.cls.value}</p>
                    <span className={`px-2 py-0.5 rounded border text-xs ${statusClass(latestAudit.coreWebVitals.cls.status)}`}>{latestAudit.coreWebVitals.cls.status}</span>
                  </div>
                </div>
                <div className="border border-white/10 rounded-xl p-3">
                  <p className="text-zinc-400">TTFB</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-black">{latestAudit.coreWebVitals.ttfb.value}ms</p>
                    <span className={`px-2 py-0.5 rounded border text-xs ${statusClass(latestAudit.coreWebVitals.ttfb.status)}`}>{latestAudit.coreWebVitals.ttfb.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {(['critical', 'warning', 'info'] as const).map((group) => {
              const rows = groupedIssues[group];
              const groupTitle = group === 'critical' ? 'حرج' : group === 'warning' ? 'تحذيرات' : 'معلومات';
              return (
                <div key={group} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="font-black mb-3">{groupTitle}</h3>
                  <div className="space-y-2">
                    {rows.map((issue, idx) => {
                      const issueId = `${group}-${idx}`;
                      const open = expandedIssue === issueId;
                      return (
                        <div key={issueId} className="border border-white/10 rounded-xl p-3">
                          <button className="w-full text-right flex items-center justify-between gap-2" onClick={() => setExpandedIssue(open ? null : issueId)}>
                            <div className="flex items-center gap-2">
                              {issue.severity === 'critical' ? <AlertCircle className="w-4 h-4 text-rose-300" /> : issue.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-300" /> : <CheckCircle2 className="w-4 h-4 text-cyan-300" />}
                              <p className="text-sm font-bold">{issue.title}</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded border ${severityClass(issue.severity)}`}>{issue.severity}</span>
                          </div>
                          {open && <p className="text-xs text-zinc-300 mt-3">طريقة الإصلاح: {issue.fix}</p>}
                        </div>
                      );
                    })}
                    {rows.length === 0 && <p className="text-sm text-zinc-500">لا توجد عناصر.</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-black mb-3">سجل التدقيق (آخر 5)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
              {history.map((audit) => (
                <div key={audit.id} className="border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-zinc-400">{new Date(audit.crawledAt).toLocaleString('ar-EG')}</p>
                  <p className="text-xl font-black mt-1" style={{ color: scoreColor(audit.score) }}>{audit.score}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">{audit.url}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SeoAuditPage;

