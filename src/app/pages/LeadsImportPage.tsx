import { useRef, useState } from 'react';
import { FileUp, Linkedin, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '@/app/context/DataContext';
import { importLeadsCsvApi } from '@/lib/api/leadsApi';
import { parseLinkedInLeadsCsv } from '@/lib/linkedinLeadsCsv';

const NAV_INTENT_KEY = 'prod_system_nav_intent';

export default function LeadsImportPage() {
  const { currentUser, refreshLeadsOnly } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [previewCount, setPreviewCount] = useState(0);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<
    ReturnType<typeof parseLinkedInLeadsCsv>['rows']
  >([]);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    created: number;
    skippedDuplicates: number;
    failed: number;
  } | null>(null);

  const canImport =
    currentUser?.role === 'مالك' || currentUser?.role === 'مدير مبيعات';

  const handleFile = async (file: File | null) => {
    setLastResult(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('يرجى اختيار ملف CSV فقط');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الملف 10MB');
      return;
    }
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseLinkedInLeadsCsv(text);
      setParsedRows(parsed.rows);
      setPreviewCount(parsed.rows.length);
      setParseErrors(parsed.errors.slice(0, 8));
      if (parsed.rows.length === 0) {
        toast.error('لم يُعثر على صفوف صالحة في الملف');
      } else {
        toast.success(`تم قراءة ${parsed.rows.length} ليد من الملف`);
      }
    } catch {
      toast.error('تعذر قراءة الملف');
      setParsedRows([]);
      setPreviewCount(0);
    }
  };

  const runImport = async () => {
    if (!canImport) {
      toast.error('صلاحية الاستيراد للمالك أو مدير المبيعات فقط');
      return;
    }
    if (parsedRows.length === 0) {
      toast.error('اختر ملف CSV صالح أولاً');
      return;
    }
    setUploading(true);
    try {
      const batchSize = 100;
      let totalCreated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      for (let i = 0; i < parsedRows.length; i += batchSize) {
        const chunk = parsedRows.slice(i, i + batchSize);
        const res = await importLeadsCsvApi({
          source: 'linkedin',
          leads: chunk,
        });
        totalCreated += res.created;
        totalSkipped += res.skippedDuplicates;
        totalFailed += res.failed;
      }

      setLastResult({
        created: totalCreated,
        skippedDuplicates: totalSkipped,
        failed: totalFailed,
      });

      if (totalCreated > 0) {
        toast.success(
          `تم استيراد ${totalCreated} ليد إلى Supabase (مصدر: linkedin)${totalSkipped ? ` — تخطي ${totalSkipped} مكرر` : ''}`,
        );
        try {
          await refreshLeadsOnly();
        } catch {
          /* ignore refresh errors */
        }
      } else {
        toast.warning(
          totalSkipped > 0
            ? 'لم يُضف ليد جديد — كل الصفوف مكررة أو غير صالحة'
            : 'لم يُستورد أي ليد',
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الاستيراد');
    } finally {
      setUploading(false);
    }
  };

  const goToLeads = () => {
    try {
      localStorage.setItem(NAV_INTENT_KEY, JSON.stringify({ tab: 'leads' }));
    } catch {
      /* ignore */
    }
    window.location.href = '/';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080B13] text-white flex items-center justify-center p-6" dir="rtl">
        <p className="text-zinc-400">يرجى تسجيل الدخول أولاً</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B13] text-slate-100 font-['Cairo']" dir="rtl">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Linkedin className="w-8 h-8 text-[#0A66C2]" />
              <h1 className="text-3xl font-black">استيراد ليدز LinkedIn (CSV)</h1>
            </div>
            <p className="text-sm text-zinc-400">
              ارفع تصدير Lead Gen من LinkedIn Campaign Manager. يُحفظ المصدر في Supabase كـ{' '}
              <span className="text-[#0A66C2] font-bold">linkedin</span> مع تجنب تكرار البريد أو الجوال.
            </p>
          </div>
          <button
            type="button"
            onClick={goToLeads}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold bg-white/10 border border-white/15 hover:bg-white/15"
          >
            العودة لليدز
          </button>
        </div>

        {!canImport && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            صلاحية الاستيراد متاحة للمالك ومدير المبيعات فقط.
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          disabled={!canImport || uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-zinc-700 hover:border-[#0A66C2]/60 rounded-3xl p-12 text-center transition-colors disabled:opacity-50"
        >
          <div className="w-20 h-20 bg-[#0A66C2]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileUp className="w-10 h-10 text-[#0A66C2]" />
          </div>
          <p className="text-lg font-bold mb-1">رفع ملف CSV من LinkedIn</p>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            {fileName || 'اضغط لاختيار الملف — حتى 10MB'}
          </p>
          {previewCount > 0 && (
            <p className="mt-4 text-emerald-400 text-sm font-bold">
              جاهز للاستيراد: {previewCount} صف
            </p>
          )}
        </button>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm text-blue-200 space-y-2">
          <p className="font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            أعمدة مدعومة (إنجليزي)
          </p>
          <p className="text-xs leading-relaxed text-blue-100/90">
            First Name, Last Name, Email Address, Phone Number, Company Name, Job Title — أو الاسم الكامل في عمود
            Name.
          </p>
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-100 space-y-1">
            {parseErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        {lastResult && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
            <p className="font-black text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              نتيجة الاستيراد
            </p>
            <p className="text-sm">تم الإضافة: {lastResult.created}</p>
            <p className="text-sm">مكرر (تخطي): {lastResult.skippedDuplicates}</p>
            <p className="text-sm">فشل: {lastResult.failed}</p>
          </div>
        )}

        <button
          type="button"
          disabled={!canImport || uploading || parsedRows.length === 0}
          onClick={() => void runImport()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#0A66C2] hover:bg-[#0958a8] text-white font-black disabled:opacity-50"
        >
          {uploading ? 'جاري الاستيراد إلى Supabase...' : 'استيراد إلى Supabase'}
          {!uploading && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
