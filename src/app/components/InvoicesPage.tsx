import {
  Plus,
  Search,
  Download,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';

type InvFilter = 'الكل' | 'مدفوعة' | 'معلقة' | 'متأخرة';

function mapUiStatus(s: string): 'paid' | 'pending' | 'overdue' {
  if (s === 'مدفوع') return 'paid';
  if (s === 'متأخر') return 'overdue';
  return 'pending';
}

export default function InvoicesPage() {
  const { invoices } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<InvFilter>('الكل');

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'مدفوع');
    const pend = invoices.filter((i) => i.status === 'قيد الانتظار');
    const overdue = invoices.filter((i) => i.status === 'متأخر');
    const sumPaid = paid.reduce((s, i) => s + (i.paidAmount ?? i.totalAmount ?? i.amount), 0);
    const sumPend = pend.reduce((s, i) => s + (i.remainingAmount ?? 0), 0);
    const sumOver = overdue.reduce((s, i) => s + (i.remainingAmount ?? 0), 0);
    return { sumPaid, sumPend, sumOver };
  }, [invoices]);

  const rows = useMemo(() => {
    return invoices.map((inv) => ({
      id: inv.id,
      client: inv.customerName,
      amount: (inv.totalAmount ?? inv.amount + (inv.vatAmount || 0)).toLocaleString() + ' ج.م',
      date: new Date(inv.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      dueDate: inv.nextDueDate ? new Date(inv.nextDueDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '—',
      status: mapUiStatus(inv.status),
    }));
  }, [invoices]);

  const filtered = useMemo(() => {
    let r = rows;
    if (tab === 'مدفوعة') r = r.filter((x) => x.status === 'paid');
    else if (tab === 'معلقة') r = r.filter((x) => x.status === 'pending');
    else if (tab === 'متأخرة') r = r.filter((x) => x.status === 'overdue');
    const q = searchTerm.trim().toLowerCase();
    if (!q) return r;
    return r.filter((x) => x.id.toLowerCase().includes(q) || x.client.toLowerCase().includes(q));
  }, [rows, tab, searchTerm]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">الفواتير</h2>
          <p className="text-zinc-400">قائمة الفواتير من السياق (مزامنة الخادم عند التفعيل)</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center justify-center gap-2 bg-[#18181B] border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
            <Download className="h-4 w-4" />
            <span>تقرير</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
            <Plus className="h-5 w-5" />
            <span>فاتورة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="محصّل (مدفوع)" value={`${stats.sumPaid.toLocaleString()} ج.م`} icon={CheckCircle2} color="text-[#10B981]" bgColor="bg-[#10B981]/10" />
        <StatCard label="متبقّي (معلق)" value={`${stats.sumPend.toLocaleString()} ج.م`} icon={Clock} color="text-[#6366F1]" bgColor="bg-[#6366F1]/10" />
        <StatCard label="متأخرات" value={`${stats.sumOver.toLocaleString()} ج.م`} icon={AlertCircle} color="text-[#EF4444]" bgColor="bg-[#EF4444]/10" />
      </div>

      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة أو اسم العميل..."
              className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all">
              <Filter className="h-4 w-4" />
            </button>
            <div className="flex bg-[#09090B] p-1 rounded-xl border border-zinc-800">
              {(['الكل', 'مدفوعة', 'معلقة', 'متأخرة'] as InvFilter[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTab(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === type ? 'bg-[#6366F1] text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-800">
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">المبلغ</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">موعد الاستحقاق</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    لا توجد فواتير مطابقة.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-white font-mono">{inv.id}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{inv.client}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#6366F1]">{inv.amount}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{inv.date}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{inv.dueDate}</td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid'
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                            : inv.status === 'pending'
                              ? 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20'
                              : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 animate-pulse'
                        }`}
                      >
                        {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'بانتظار الدفع' : 'متأخرة'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <button type="button" className="p-2 text-zinc-500 hover:text-[#10B981] transition-all" title="واتساب">
                          <Send className="h-4 w-4" />
                        </button>
                        <button type="button" className="p-2 text-zinc-500 hover:text-white transition-all">
                          <Download className="h-4 w-4" />
                        </button>
                        <button type="button" className="p-2 text-zinc-500 hover:text-white transition-all">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bgColor }: { label: string; value: string; icon: typeof CheckCircle2; color: string; bgColor: string }) {
  return (
    <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl flex items-center gap-5">
      <div className={`h-12 w-12 ${bgColor} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <h4 className="text-xl font-bold text-white">{value}</h4>
      </div>
    </div>
  );
}
