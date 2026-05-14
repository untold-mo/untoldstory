import React, { useMemo, useState } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { db } from '../../../../lib/db';
import { SeoDataScopeBanner } from '../SeoDataScopeBanner';
import type { Keyword, KeywordIntent } from '../../../../lib/db/mock-data';

type ResearchRow = {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: KeywordIntent;
  opportunityScore: number;
  position: number;
};

const intentClass: Record<KeywordIntent, string> = {
  informational: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  transactional: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  commercial: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  navigational: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300',
};

const difficultyClass = (value: number) =>
  value <= 30 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : value <= 60 ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300';

const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const inferIntent = (keyword: string): KeywordIntent => {
  const k = keyword.toLowerCase();
  if (/best|top|vs|compare|agency|company|cost|price/.test(k)) return 'commercial';
  if (/hire|service|book|near me|contact/.test(k)) return 'transactional';
  if (/brand|official|login/.test(k)) return 'navigational';
  return 'informational';
};

const expandSeed = (seed: string): string[] => [
  seed,
  `best ${seed}`,
  `${seed} in cairo`,
  `${seed} egypt 2024`,
  `how to choose ${seed}`,
];

const SeoKeywordsPage = () => {
  const [seedText, setSeedText] = useState('video production egypt\nproduction company cairo');
  const [location, setLocation] = useState('Egypt');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResearchRow[]>([]);
  const [trackedKeywords, setTrackedKeywords] = useState<Keyword[]>([]);

  const runResearch = async () => {
    const seeds = seedText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (seeds.length === 0) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const generated = seeds
      .flatMap((seed) => expandSeed(seed))
      .filter((kw, idx, arr) => arr.indexOf(kw) === idx)
      .map((kw, idx) => {
        const searchVolume = randomRange(120, 5600);
        const difficulty = randomRange(18, 82);
        const cpc = Number((Math.random() * 3 + 0.2).toFixed(2));
        const intent = inferIntent(kw);
        const opportunityScore = Math.max(1, Math.min(100, Math.round((searchVolume / 80) - difficulty + cpc * 12)));
        return {
          id: `rk-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          keyword: kw,
          searchVolume,
          difficulty,
          cpc,
          intent,
          opportunityScore,
          position: randomRange(6, 70),
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    setResults(generated);
    setLoading(false);
  };

  const addTracked = async (row: ResearchRow) => {
    const created = await db.keywords.create({
      projectId: '1',
      keyword: row.keyword,
      searchVolume: row.searchVolume,
      difficulty: row.difficulty,
      cpc: row.cpc,
      intent: row.intent,
      position: row.position,
    });
    setTrackedKeywords((prev) => [created, ...prev.filter((k) => k.id !== created.id)]);
  };

  const trackedTable = useMemo(
    () =>
      trackedKeywords.map((k) => ({
        ...k,
        trend: k.position <= 10 ? 'ضمن أعلى 10' : k.position <= 20 ? 'في نمو' : 'يحتاج عملاً',
      })),
    [trackedKeywords]
  );

  return (
    <div className="min-h-screen bg-[#070C18] text-white p-6 md:p-8 space-y-6" dir="rtl">
      <SeoDataScopeBanner />
      <div>
        <h1 className="text-2xl font-black">بحث الكلمات المفتاحية</h1>
        <p className="text-sm text-zinc-400 mt-1">استخرج فرص الكلمات المفتاحية وابدأ تتبعها مباشرة</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <label className="text-sm font-bold">كلمات البذرة (سطر لكل كلمة)</label>
        <textarea
          value={seedText}
          onChange={(e) => setSeedText(e.target.value)}
          className="w-full min-h-[120px] bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm"
          placeholder="video production egypt"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="Egypt">مصر</option>
            <option value="Saudi Arabia">السعودية</option>
            <option value="UAE">الإمارات</option>
            <option value="Global">عالمي</option>
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="English">English</option>
            <option value="Arabic">العربية</option>
          </select>
          <button
            onClick={runResearch}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-black disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
            {loading ? 'جاري التحليل…' : 'بحث عن الكلمات'}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">الموقع: {location} — اللغة: {language}</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="font-black mb-3">النتائج</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right">
            <thead>
              <tr className="bg-[#0b1020]/90">
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الكلمة</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الحجم</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الصعوبة</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">CPC</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">النية</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">الفرصة</th>
                <th className="p-3 text-[10px] uppercase tracking-widest text-zinc-400">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {results.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  <td className="p-3 text-sm font-bold text-zinc-200">{row.keyword}</td>
                  <td className="p-3 text-sm text-zinc-300">{row.searchVolume.toLocaleString()}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full ${row.difficulty <= 30 ? 'bg-emerald-400' : row.difficulty <= 60 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${Math.min(100, row.difficulty)}%` }} />
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${difficultyClass(row.difficulty)}`}>{row.difficulty}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-zinc-300">${row.cpc}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] capitalize ${intentClass[row.intent]}`}>{row.intent}</span>
                  </td>
                  <td className="p-3 text-sm font-black text-indigo-300">{row.opportunityScore}</td>
                  <td className="p-3">
                    <button onClick={() => addTracked(row)} className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black inline-flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      إضافة
                    </button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">لا توجد نتائج بعد. نفّذ البحث أولاً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="font-black mb-3">الكلمات المتتبّعة</h3>
        <div className="space-y-2">
          {trackedTable.map((k) => (
            <div key={k.id} className="bg-[#0f172a]/70 border border-white/10 rounded-xl p-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-zinc-200">{k.keyword}</p>
                <p className="text-[11px] text-zinc-500">الحجم: {k.searchVolume.toLocaleString()} — الترتيب: {k.position}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[11px] font-black ${k.trend === 'ضمن أعلى 10' ? 'bg-emerald-500/20 text-emerald-300' : k.trend === 'في نمو' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {k.trend}
              </span>
            </div>
          ))}
          {trackedTable.length === 0 && <p className="text-sm text-zinc-500">لا توجد كلمات متتبّعة بعد.</p>}
        </div>
      </div>
    </div>
  );
};

export default SeoKeywordsPage;

