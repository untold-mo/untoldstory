import { Landmark, Minus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  getEstimatedAssets,
  addEstimatedAsset,
  removeEstimatedAsset,
  type EstimatedAsset,
} from '@/lib/projects/projectStore';

export default function EstimatedAssetsPage() {
  const [assets, setAssets] = useState<EstimatedAsset[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', value: '', date: '', notes: '', status: 'نشط' });

  const refresh = () => { getEstimatedAssets().then(setAssets).catch(() => {}); };
  useEffect(() => { refresh(); }, []);

  const totalValue = assets.reduce((s, a) => s + a.value, 0);

  const handleAdd = async () => {
    const val = Number(form.value);
    if (!form.name.trim() || !val || val <= 0) { toast.error('أدخل اسم الأصل والقيمة'); return; }
    try {
      await addEstimatedAsset({
        name: form.name.trim(), type: form.type.trim() || 'أخرى', value: val,
        date: form.date || new Date().toISOString().slice(0, 10), notes: form.notes.trim(), status: form.status,
      });
      refresh();
      setShowAdd(false);
      setForm({ name: '', type: '', value: '', date: '', notes: '', status: 'نشط' });
      toast.success('تم إضافة الأصل');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطأ'); }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeEstimatedAsset(id);
      refresh();
      toast.success('تم حذف الأصل');
    } catch { toast.error('تعذر الحذف'); }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">الأصول التقديرية</h2>
          <p className="text-zinc-400">أصول الشركة التقديرية لحساب المركز المالي</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
          <Plus className="h-5 w-5" /> إضافة أصل
        </button>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-purple-500/10 to-[#6366F1]/10 border border-purple-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-purple-400" />
          <div>
            <p className="text-sm text-zinc-400">إجمالي الأصول التقديرية</p>
            <p className="text-2xl font-bold text-purple-300">{totalValue.toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>
        <span className="text-sm text-zinc-500">{assets.length} أصل</span>
      </div>

      {/* List */}
      {assets.length === 0 ? (
        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-12 text-center">
          <Landmark className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">لا توجد أصول مسجلة</p>
        </div>
      ) : (
        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-zinc-800">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                <div>
                  <p className="text-sm font-bold text-white">{a.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                    <span>{a.type}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span>{a.date}</span>
                    {a.notes && <><span className="h-1 w-1 rounded-full bg-zinc-700" /><span>{a.notes}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-purple-300">{a.value.toLocaleString('ar-EG')} ج.م</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${a.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>{a.status}</span>
                  <button onClick={() => handleRemove(a.id)} className="p-1 text-zinc-600 hover:text-rose-400 transition-all">
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && createPortal(
        <div className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#18181B] text-white shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">إضافة أصل تقديري</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-zinc-700 rounded-lg"><X className="h-5 w-5 text-zinc-400" /></button>
            </div>
            <input placeholder="اسم الأصل *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
            <input placeholder="نوع الأصل (سيارة، عقار...)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
            <input type="number" placeholder="القيمة التقديرية *" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
            <input placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-[#09090B] border border-zinc-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none">
              <option value="نشط">نشط</option>
              <option value="مُباع">مُباع</option>
              <option value="مستهلك">مستهلك</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-zinc-400 font-bold text-sm">إلغاء</button>
              <button onClick={handleAdd} className="bg-purple-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-purple-400 transition-all">إضافة</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
