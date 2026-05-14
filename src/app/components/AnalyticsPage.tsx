import { TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useMemo } from 'react';
import { useData, User } from '../context/DataContext';

const SOURCE_COLORS = ['#1877F2', '#EA4335', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6'];

export default function AnalyticsPage() {
  const { leads, invoices, users, monthlyTargets } = useData();

  const metrics = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'مدفوع');
    const totalRev = paid.reduce((s, i) => s + (i.totalAmount ?? i.amount + (i.vatAmount || 0)), 0);
    const pending = invoices.filter((i) => i.status === 'قيد الانتظار').reduce((s, i) => s + (i.remainingAmount ?? 0), 0);
    const overdue = invoices.filter((i) => i.status === 'متأخر').reduce((s, i) => s + (i.remainingAmount ?? 0), 0);
    const won = leads.filter((l) => l.status === 'مغلق - فوز').length;
    const openLeads = leads.filter((l) => l.status !== 'مغلق - فوز' && l.status !== 'مغلق - خسارة').length;
    const conv = openLeads + won > 0 ? ((won / (openLeads + won)) * 100).toFixed(1) : '0';
    const avgDeal = won > 0 ? Math.round(totalRev / Math.max(1, won)) : 0;
    return {
      totalRev,
      projects: leads.length,
      avgDeal,
      conv,
      pending,
      overdue,
    };
  }, [leads, invoices]);

  const revenueData = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const vals = new Map(keys.map((k) => [k, 0]));
    for (const inv of invoices) {
      if (inv.status !== 'مدفوع') continue;
      const d = new Date(inv.date);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!vals.has(ym)) continue;
      vals.set(ym, (vals.get(ym) || 0) + (inv.totalAmount ?? inv.amount + (inv.vatAmount || 0)));
    }
    const sumTarget = monthlyTargets.reduce((s, t) => s + (t.revenueTarget || 0), 0);
    const per = monthlyTargets.length ? Math.round(sumTarget / monthlyTargets.length) : 45000;
    return keys.map((ym) => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        name: d.toLocaleDateString('ar-EG', { month: 'short' }),
        value: Math.round(vals.get(ym) || 0),
        target: per,
      };
    });
  }, [invoices, monthlyTargets]);

  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const src = (l.source || 'غير محدد').trim() || 'غير محدد';
      map.set(src, (map.get(src) || 0) + 1);
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return arr.map(([name, value], i) => ({ name, value, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }));
  }, [leads]);

  const performanceData = useMemo(() => {
    const reps = users.filter((u: User) => u.role === 'مندوب');
    return reps.map((u) => {
      const assigned = leads.filter((l) => l.assignedTo === u.id);
      const won = assigned.filter((l) => l.status === 'مغلق - فوز').length;
      const conversion = assigned.length ? Math.round((won / assigned.length) * 100) : 0;
      const short = u.name.trim().split(/\s+/)[0] || u.name;
      return { name: short, leads: assigned.length, conversion };
    });
  }, [users, leads]);

  const totalLeadsSources = sourceData.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">تحليلات الأداء</h2>
          <p className="text-zinc-400">مشتق من الليدز والفواتير والمصروفات في السياق (بيانات الخادم عند التفعيل)</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center justify-center gap-2 bg-[#18181B] border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
            <Calendar className="h-4 w-4" />
            <span>آخر 6 أشهر (الفواتير المدفوعة)</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
            <Download className="h-4 w-4" />
            <span>تصدير (واجهة عرض)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="إيراد مدفوع (تقريبي)" value={`${metrics.totalRev.toLocaleString()} ج.م`} trend="+—" isPositive />
        <MetricCard title="عدد الليدز" value={String(metrics.projects)} trend="نشط" isPositive />
        <MetricCard title="متوسط قيمة صفقة (فوز)" value={`${metrics.avgDeal.toLocaleString()} ج.م`} trend="—" isPositive={metrics.avgDeal > 0} />
        <MetricCard title="نسبة فوز / ليدز نشطة+فوز" value={`${metrics.conv}%`} trend="—" isPositive={Number(metrics.conv) >= 10} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">إيراد الفواتير المدفوعة حسب الشهر</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', textAlign: 'right' }} />
                <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                <Line type="monotone" dataKey="target" stroke="#27272A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-8">مصادر الليدز</h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" nameKey="name">
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', textAlign: 'right' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalLeadsSources}</p>
                <p className="text-xs text-zinc-500">ليد إجمالي</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-6">
            {sourceData.map((source) => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                  <span className="text-sm text-zinc-400 font-medium truncate">{source.name}</span>
                </div>
                <span className="text-sm font-bold text-white shrink-0">{source.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-8">أداء مندوبي المبيعات</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', textAlign: 'right' }} />
              <Bar dataKey="leads" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={30} name="الليدز" />
              <Bar dataKey="conversion" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} name="نسبة الفوز %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, isPositive }: { title: string; value: string; trend: string; isPositive: boolean }) {
  return (
    <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col gap-1">
      <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{title}</span>
      <h4 className="text-2xl font-bold text-white my-1">{value}</h4>
      <div className={`flex items-center gap-1 text-[11px] font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        <span>{trend}</span>
      </div>
    </div>
  );
}
