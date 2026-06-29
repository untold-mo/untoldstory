import { Calculator, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getProjectsDataAsync, getEstimatedAssets } from '@/lib/projects/projectStore';
import type { ProjectsData } from '@/lib/projects/projectTypes';
import type { EstimatedAsset } from '@/lib/projects/projectStore';
import { useData } from '../context/DataContext';

export default function FinancialPositionPage() {
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<ProjectsData>({ projects: [], revenues: [], expenses: [], custodies: [] });
  const { users } = useData();
  const [assets, setAssets] = useState<EstimatedAsset[]>([]);

  useEffect(() => {
    getProjectsDataAsync().then(setData).catch(() => {});
    getEstimatedAssets().then(setAssets).catch(() => {});
  }, []);

  const report = useMemo(() => {
    const cutoff = new Date(cutoffDate + 'T23:59:59');

    const revenuesDue = data.revenues.filter((r) => new Date(r.date) <= cutoff);
    const collectedRevenue = revenuesDue.filter((r) => r.status === 'محصل').reduce((s, r) => s + r.amount, 0);
    const pendingRevenue = revenuesDue.filter((r) => r.status !== 'محصل').reduce((s, r) => s + r.amount, 0);

    const expensesBefore = data.expenses.filter((e) => new Date(e.date) <= cutoff);
    const directExpenses = expensesBefore.filter((e) => e.source === 'مباشر').reduce((s, e) => s + e.amount, 0);
    const custodyExpenses = expensesBefore.filter((e) => e.source === 'تسوية عهدة').reduce((s, e) => s + e.amount, 0);

    const openCustodies = data.custodies.filter((c) => c.status !== 'تم تسويتها' && new Date(c.openDate) <= cutoff);
    const openCustodyTotal = openCustodies.reduce((s, c) => s + c.amount, 0);
    const custodySpent = openCustodies.reduce((s, c) => s + c.settlementItems.filter((i) => new Date(i.date) <= cutoff).reduce((ss, i) => ss + i.amount, 0), 0);
    const custodyRemaining = openCustodyTotal - custodySpent;

    const totalSalaries = users.reduce((s, u) => s + (Number(u.baseSalary) || 0), 0);

    const totalFixedExpenses = totalSalaries;
    const totalExpenses = directExpenses + custodyExpenses;
    const netPosition = collectedRevenue - totalExpenses - totalFixedExpenses;
    const expectedBalance = collectedRevenue + pendingRevenue - totalExpenses - totalFixedExpenses;

    const totalAssets = assets.reduce((s, a) => s + a.value, 0);

    return {
      collectedRevenue, pendingRevenue,
      directExpenses, custodyExpenses, totalExpenses,
      totalFixedExpenses, totalSalaries,
      openCustodyTotal, custodyRemaining,
      netPosition, expectedBalance,
      totalAssets,
    };
  }, [cutoffDate, data, users, assets]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">كشف الحساب والمركز المالي</h2>
        <p className="text-zinc-400">الوضع المالي للشركة حتى تاريخ محدد</p>
      </div>

      {/* Date Picker */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-[#6366F1]" />
          <label className="text-sm text-zinc-400 font-bold">حتى تاريخ:</label>
          <input type="date" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)}
            className="bg-[#09090B] border border-zinc-700 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50" />
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" /> الإيرادات
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ReportCard label="إيرادات محصلة" value={report.collectedRevenue} color="text-emerald-400" />
          <ReportCard label="إيرادات مستحقة (لم تُحصَّل)" value={report.pendingRevenue} color="text-amber-400" />
        </div>
      </div>

      {/* Expenses Section */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-400" /> المصروفات
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportCard label="مصروفات مباشرة" value={report.directExpenses} color="text-rose-400" />
          <ReportCard label="مصروفات تسوية عُهد" value={report.custodyExpenses} color="text-amber-400" />
          <ReportCard label="مصروفات ثابتة (مرتبات)" value={report.totalFixedExpenses} color="text-orange-400" />
          <ReportCard label="إجمالي المصروفات" value={report.totalExpenses} color="text-rose-300" />
        </div>
      </div>

      {/* Custodies Section */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-400" /> العُهد
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ReportCard label="عُهد مفتوحة" value={report.openCustodyTotal} color="text-blue-400" />
          <ReportCard label="متبقي العُهد" value={report.custodyRemaining} color="text-blue-300" />
        </div>
      </div>

      {/* Assets */}
      {report.totalAssets > 0 && (
        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">الأصول التقديرية</h3>
          <ReportCard label="إجمالي الأصول التقديرية" value={report.totalAssets} color="text-purple-400" />
        </div>
      )}

      {/* Net Position */}
      <div className="bg-gradient-to-r from-[#6366F1]/10 to-emerald-500/10 border border-[#6366F1]/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-white" /> المركز المالي
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] text-zinc-500 font-bold mb-1">صافي المركز المالي</p>
            <p className={`text-2xl font-bold ${report.netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {report.netPosition.toLocaleString('ar-EG')} <span className="text-xs text-zinc-500">ج.م</span>
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">= إيرادات محصلة - إجمالي المصروفات - المصروفات الثابتة</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] text-zinc-500 font-bold mb-1">الرصيد المتوقع</p>
            <p className={`text-2xl font-bold ${report.expectedBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {report.expectedBalance.toLocaleString('ar-EG')} <span className="text-xs text-zinc-500">ج.م</span>
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">= صافي المركز + الإيرادات المستحقة</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-[#09090B] border border-zinc-800 p-4">
      <p className="text-[10px] text-zinc-500 font-bold mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('ar-EG')} <span className="text-xs text-zinc-500">ج.م</span></p>
    </div>
  );
}
