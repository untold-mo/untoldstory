import React, { useMemo, useState } from 'react';
import { ChevronDown, Download, FileText, Printer, Sparkles } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mockGSCData } from '../../../../lib/db/mock-data';
import { SeoDataScopeBanner } from '../SeoDataScopeBanner';

type ReportSection = {
  id: string;
  title: string;
  open: boolean;
};

const SeoReportsPage = () => {
  const [sections, setSections] = useState<ReportSection[]>([
    { id: 'summary', title: 'ملخص تنفيذي', open: true },
    { id: 'traffic', title: 'نظرة على الزيارات', open: true },
    { id: 'rankings', title: 'ترتيب الكلمات', open: true },
    { id: 'health', title: 'الصحة التقنية', open: true },
    { id: 'content', title: 'أداء المحتوى', open: true },
    { id: 'backlinks', title: 'نشاط الروابط الخلفية', open: true },
    { id: 'recommendations', title: 'توصيات الشهر القادم', open: true },
  ]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const trend = useMemo(
    () =>
      mockGSCData.trend.map((point) => ({
        ...point,
        label: new Date(point.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      })),
    []
  );

  const toggle = (id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, open: !s.open } : s)));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setGeneratedAt(new Date());
    setIsGenerating(false);
  };

  const exportHtml = () => {
    const html = `
      <html dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>SEO Monthly Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1, h2 { margin-bottom: 8px; }
          .card { border:1px solid #ddd; border-radius: 8px; padding: 10px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>SEO Report</h1>
        <p>Generated: ${generatedAt ? generatedAt.toLocaleString('en-US') : new Date().toLocaleString('en-US')}</p>
        <div class="card"><h2>Executive Summary</h2><p>Organic clicks improving with stable CTR and stronger ranking spread in top 10.</p></div>
        <div class="card"><h2>Technical Health</h2><p>Health score remains in needs-improvement range. Priority: meta + speed fixes.</p></div>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-report-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">تقارير SEO</h1>
          <p className="text-sm text-zinc-400 mt-1">تقرير شهري تنفيذي بالأداء والمخاطر والتوصيات</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-black inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'جاري الإنشاء…' : 'إنشاء التقرير'}
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-zinc-200 text-sm font-black inline-flex items-center gap-2">
            <Printer className="w-4 h-4" />
            تصدير PDF
          </button>
          <button onClick={exportHtml} className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-zinc-200 text-sm font-black inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير HTML
          </button>
        </div>
      </div>

      {generatedAt && (
        <p className="text-xs text-zinc-500">
          آخر إنشاء:
          {' '}
          {generatedAt.toLocaleString('ar-EG')}
        </p>
      )}

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <button onClick={() => toggle(section.id)} className="w-full p-4 flex items-center justify-between text-right">
              <span className="font-black inline-flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-300" />
                {section.title}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${section.open ? 'rotate-180' : ''}`} />
            </button>
            {section.open && (
              <div className="px-4 pb-4 text-sm text-zinc-300">
                {section.id === 'summary' && (
                  <div className="space-y-2">
                    <p>الأداء العضوي يميل للتحسن مقارنة بالشهر الماضي.</p>
                    <p>النقرات: {mockGSCData.totalClicks.toLocaleString()} — متوسط الترتيب: {mockGSCData.avgPosition}</p>
                  </div>
                )}
                {section.id === 'traffic' && (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #334155' }} />
                        <Line type="monotone" dataKey="clicks" stroke="#34d399" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="impressions" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {section.id === 'rankings' && <p>ملخص الأكثر صعوداً وهبوطاً يظهر بعد دورات تحديث الترتيب.</p>}
                {section.id === 'health' && <p>درجة الصحة التقنية مستقرة مع حاجة لتحسين اكتمال الميتا والأداء.</p>}
                {section.id === 'content' && <p>تحسّن إنتاج المحتوى مع متوسط أعلى لـ E-E-A-T وتجميع أفضل للمواضيع التجارية.</p>}
                {section.id === 'backlinks' && <p>التواصل لبناء الروابط نشط مع مزيج جيد بين «تم التواصل» و«مكتسب».</p>}
                {section.id === 'recommendations' && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-indigo-100">
                    أولوية للصفحات عالية النية، تحسين LCP لأهم صفحات الهبوط، وتوسيع التواصل لنطاقات DR أعلى من 40.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeoReportsPage;

