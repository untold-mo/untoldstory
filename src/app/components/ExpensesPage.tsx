import {
  TrendingDown,
  Plus,
  Search,
  Download,
  Filter,
  MoreVertical,
  ShoppingBag,
  Zap,
  Wrench,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useData, Expense } from '../context/DataContext';
import { expenseSubmitterDisplay } from '@/lib/expenseSubmitterDisplay';

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

function categoryIcon(cat: Expense['category']) {
  if (cat === 'معدات') return ShoppingBag;
  if (cat === 'إيجارات') return Zap;
  if (cat === 'تشغيل') return Wrench;
  return Truck;
}

export default function ExpensesPage() {
  const { expenses, users } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) => e.title.toLowerCase().includes(q) || e.category.includes(q));
  }, [expenses, searchTerm]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) || 0) + (e.totalAmount ?? e.amount));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [expenses]);

  const totalExp = useMemo(() => expenses.reduce((s, e) => s + (e.totalAmount ?? e.amount), 0), [expenses]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">المصروفات</h2>
          <p className="text-zinc-400">قائمة المصروفات من السياق</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center justify-center gap-2 bg-[#18181B] border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
            <Download className="h-4 w-4" />
            <span>تصدير</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
            <Plus className="h-5 w-5" />
            <span>إضافة مصروف</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#18181B] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="البحث في المصروفات..."
                className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-800">
                  <th className="px-4 py-4">المصروف</th>
                  <th className="px-4 py-4">الفئة</th>
                  <th className="px-4 py-4">المبلغ</th>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-4 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">
                      لا توجد مصروفات مطابقة.
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp) => {
                    const Icon = categoryIcon(exp.category);
                    const submitter = expenseSubmitterDisplay(exp, users);
                    return (
                      <tr key={exp.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-white">{exp.title}</span>
                          {submitter ? (
                            <span className="block text-[10px] text-zinc-500 mt-0.5">مقدّم الطلب: {submitter}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span className="text-xs text-zinc-400">{exp.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-[#EF4444]">
                          {(exp.totalAmount ?? exp.amount).toLocaleString()} ج.م
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-400">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                        <td className="px-4 py-4">
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg font-bold">
                            {exp.status} — {exp.approvalStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-left">
                          <button type="button" className="p-2 text-zinc-500 hover:text-white transition-all">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-8">تحليل الفئات</h3>
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" nameKey="name">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', textAlign: 'right' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-6">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-zinc-400 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0">{item.value.toLocaleString()} ج.م</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#18181B] to-[#111111] border border-red-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">إجمالي المصروفات</h3>
              <TrendingDown className="h-6 w-6 text-[#EF4444]" />
            </div>
            <h4 className="text-3xl font-bold text-white mb-2">{totalExp.toLocaleString()} ج.م</h4>
            <p className="text-zinc-500 text-sm">مجموع المبالغ في القائمة الحالية</p>
          </div>
        </div>
      </div>
    </div>
  );
}
