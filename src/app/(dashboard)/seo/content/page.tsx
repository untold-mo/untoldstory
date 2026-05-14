import React, { useEffect, useMemo, useState } from 'react';
import { Bot, FileText, Loader2, Sparkles } from 'lucide-react';
import { db } from '../../../../lib/db';
import { SeoDataScopeBanner } from '../SeoDataScopeBanner';
import type { ContentPiece, Keyword } from '../../../../lib/db/mock-data';

const statusClass = (status: ContentPiece['status']) =>
  status === 'published'
    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
    : status === 'review'
      ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
      : 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300';

const statusLabelAr = (status: ContentPiece['status']) =>
  status === 'published' ? 'منشور' : status === 'review' ? 'مراجعة' : 'مسودة';

const SeoContentPage = () => {
  const [contentRows, setContentRows] = useState<ContentPiece[]>([]);
  const [trackedKeywords, setTrackedKeywords] = useState<Keyword[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateKeywordId, setGenerateKeywordId] = useState('');
  const [generateWordCount, setGenerateWordCount] = useState(1400);
  const [generateLanguage, setGenerateLanguage] = useState<'English' | 'Arabic'>('English');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const [content, keywords] = await Promise.all([db.content.getByProject('1'), db.keywords.getByProject('1')]);
    setContentRows(content);
    setTrackedKeywords(keywords);
    if (!selectedId && content[0]) setSelectedId(content[0].id);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => contentRows.find((c) => c.id === selectedId) || null, [contentRows, selectedId]);

  useEffect(() => {
    if (!selected) {
      setMetaTitle('');
      setMetaDescription('');
      return;
    }
    setMetaTitle(selected.title);
    setMetaDescription(`Professional SEO article about ${selected.title}.`);
  }, [selected]);

  const eeatBreakdown = useMemo(() => {
    if (!selected) return { expertise: 0, experience: 0, authority: 0, trust: 0 };
    const base = selected.eeaTScore;
    return {
      expertise: Math.round(base * 100),
      experience: Math.round(Math.max(0, Math.min(100, base * 100 - 6))),
      authority: Math.round(Math.max(0, Math.min(100, base * 100 + 4))),
      trust: Math.round(Math.max(0, Math.min(100, base * 100 + 1))),
    };
  }, [selected]);

  const updateStatus = async (status: ContentPiece['status']) => {
    if (!selected) return;
    await db.content.updateStatus(selected.id, status);
    await load();
  };

  const generateNew = async () => {
    if (!generateKeywordId) return;
    const kw = trackedKeywords.find((k) => k.id === generateKeywordId);
    if (!kw) return;
    setGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const title =
      generateLanguage === 'Arabic'
        ? `دليل ${kw.keyword} لعام 2026`
        : `Complete Guide to ${kw.keyword} in 2026`;
    await db.content.create({
      projectId: '1',
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, ''),
      status: 'draft',
      wordCount: generateWordCount,
      eeaTScore: Number((0.6 + Math.random() * 0.3).toFixed(2)),
      createdAt: new Date(),
    });
    setGenerating(false);
    setIsGenerateOpen(false);
    setGenerateKeywordId('');
    await load();
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">محرّك المحتوى</h1>
          <p className="text-sm text-zinc-400 mt-1">إدارة المقالات وتحسين E-E-A-T ومتابعة حالة المحتوى</p>
        </div>
        <button onClick={() => setIsGenerateOpen(true)} className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-black inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          إنشاء جديد
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-2 max-h-[76vh] overflow-y-auto custom-scrollbar">
          {contentRows.map((row) => (
            <button
              key={row.id}
              onClick={() => setSelectedId(row.id)}
              className={`w-full text-right rounded-xl border p-3 transition-all ${selectedId === row.id ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 bg-[#0f172a]/50 hover:border-white/20'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-200 line-clamp-2">{row.title}</p>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${statusClass(row.status)}`}>{statusLabelAr(row.status)}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {row.wordCount.toLocaleString()} كلمة — E-E-A-T {(row.eeaTScore * 100).toFixed(0)}٪
              </p>
            </button>
          ))}
        </div>

        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          {!selected && <p className="text-sm text-zinc-500">اختر قطعة محتوى من القائمة.</p>}
          {selected && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">العنوان</label>
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">وصف الميتا</label>
                  <input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black inline-flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-300" />
                    معاينة المحتوى (للقراءة فقط)
                  </h3>
                  <select value={selected.status} onChange={(e) => updateStatus(e.target.value as ContentPiece['status'])} className="bg-[#0b1020] border border-white/10 rounded-lg px-2 py-1 text-xs">
                    <option value="draft">مسودة</option>
                    <option value="review">مراجعة</option>
                    <option value="published">منشور</option>
                  </select>
                </div>
                <div className="text-sm text-zinc-300 leading-7">
                  <p className="font-bold mb-2">{selected.title}</p>
                  <p>
                    هذه معاينة شكلية للنص. يمكن ربط محرّر كامل لاحقاً. المسار الحالي:
                    {' '}
                    <span className="text-indigo-300">{selected.slug}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a]/60 p-4">
                <h3 className="font-black mb-3">درجة E-E-A-T</h3>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-400" style={{ width: `${Math.round(selected.eeaTScore * 100)}%` }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="border border-white/10 rounded-lg p-2">الخبرة: <span className="font-black text-indigo-300">{eeatBreakdown.expertise}٪</span></div>
                  <div className="border border-white/10 rounded-lg p-2">التجربة: <span className="font-black text-indigo-300">{eeatBreakdown.experience}٪</span></div>
                  <div className="border border-white/10 rounded-lg p-2">السلطة: <span className="font-black text-indigo-300">{eeatBreakdown.authority}٪</span></div>
                  <div className="border border-white/10 rounded-lg p-2">الثقة: <span className="font-black text-indigo-300">{eeatBreakdown.trust}٪</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isGenerateOpen && (
        <div className="fixed inset-0 z-[260] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d1428] p-6 space-y-4">
            <h3 className="text-lg font-black inline-flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-300" />
              إنشاء محتوى جديد
            </h3>
            <div>
              <label className="text-xs text-zinc-400">الكلمة المفتاحية</label>
              <select value={generateKeywordId} onChange={(e) => setGenerateKeywordId(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm">
                <option value="">اختر كلمة متتبّعة</option>
                {trackedKeywords.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.keyword}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400">عدد الكلمات: {generateWordCount}</label>
              <input type="range" min={800} max={3000} step={100} value={generateWordCount} onChange={(e) => setGenerateWordCount(Number(e.target.value))} className="w-full mt-1" />
            </div>
            <div>
              <label className="text-xs text-zinc-400">اللغة</label>
              <select value={generateLanguage} onChange={(e) => setGenerateLanguage(e.target.value as 'English' | 'Arabic')} className="w-full mt-1 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm">
                <option value="English">الإنجليزية</option>
                <option value="Arabic">العربية</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setIsGenerateOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-200 text-sm font-bold">إلغاء</button>
              <button onClick={generateNew} disabled={generating || !generateKeywordId} className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-black disabled:opacity-60 inline-flex items-center gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'جاري الإنشاء…' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoContentPage;

