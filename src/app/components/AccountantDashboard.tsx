import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Receipt, 
  FileText, 
  Download, 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { motion as Motion } from "motion/react";
import { useNavigate } from "react-router";

const invoices = [
  { id: "INV-001", client: "العربية للتجارة", amount: "12,500 ج.م", date: "9 مارس", status: "pending", type: "income" },
  { id: "INV-002", client: "Z-Tech Solutions", amount: "45,000 ج.م", date: "8 مارس", status: "paid", type: "income" },
  { id: "INV-003", client: "إيجار استوديو", amount: "5,000 ج.م", date: "7 مارس", status: "overdue", type: "expense" },
  { id: "INV-004", client: "رواتب الفريق", amount: "65,000 ج.م", date: "1 مارس", status: "paid", type: "expense" },
];

export default function AccountantDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">النظام المحاسبي</h2>
          <p className="text-zinc-400">إدارة الفواتير، المصروفات، والتقارير المالية</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-[#18181B] border border-zinc-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-zinc-800 transition-all">
            <Download className="h-5 w-5" />
            <span>تصدير Excel</span>
          </button>
          <button 
            onClick={() => navigate("/accountant/invoices")}
            className="flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20"
          >
            <Plus className="h-5 w-5" />
            <span>فاتورة جديدة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceCard title="دخل الشهر" value="125,400 ج.م" icon={TrendingUp} color="text-[#10B981]" bgColor="bg-[#10B981]/10" />
        <FinanceCard title="مصروفات الشهر" value="48,200 ج.م" icon={TrendingDown} color="text-[#EF4444]" bgColor="bg-[#EF4444]/10" />
        <FinanceCard title="مصاريف إعلانات" value="15,500 ج.م" icon={CreditCard} color="text-[#F59E0B]" bgColor="bg-[#F59E0B]/10" />
        <FinanceCard title="صافي الأرباح" value="77,200 ج.م" icon={DollarSign} color="text-[#6366F1]" bgColor="bg-[#6366F1]/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#6366F1]" /> الفواتير الأخيرة
            </h3>
            <div className="relative group max-w-xs">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
               <input 
                type="text" 
                placeholder="رقم الفاتورة..." 
                className="bg-[#09090B] border border-zinc-700 rounded-lg text-xs px-10 py-2 text-white outline-none focus:border-[#6366F1]"
               />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-medium uppercase">
                  <th className="py-4 pr-6">رقم الفاتورة</th>
                  <th className="py-4">العميل / البند</th>
                  <th className="py-4">المبلغ</th>
                  <th className="py-4">التاريخ</th>
                  <th className="py-4">الحالة</th>
                  <th className="py-4 pl-6 text-center">النوع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 pr-6">
                      <span className="text-sm font-bold text-white">{inv.id}</span>
                    </td>
                    <td className="py-4 text-sm text-zinc-400 font-medium">{inv.client}</td>
                    <td className="py-4 text-sm font-bold text-white">{inv.amount}</td>
                    <td className="py-4 text-xs text-zinc-500">{inv.date}</td>
                    <td className="py-4">
                       <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 pl-6 text-center">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                         inv.type === 'income' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                       }`}>
                         {inv.type === 'income' ? 'دخل' : 'صرف'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={() => navigate("/accountant/invoices")}
            className="w-full py-4 text-sm font-bold text-[#6366F1] hover:bg-[#6366F1]/5 transition-all border-t border-zinc-800"
          >
            مشاهدة جميع المعاملات
          </button>
        </div>

        <div className="space-y-6">
           <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#F59E0B]" /> فواتير معلقة
              </h3>
              <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold text-red-500">متأخر جداً</span>
                       <span className="text-xs font-bold text-white">5,000 ج.م</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">إيجار الاستوديو الرئيسي</h4>
                    <p className="text-[10px] text-zinc-500">استحقاق: 1 مارس (منذ 8 أيام)</p>
                 </div>
                 <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold text-[#F59E0B]">قريباً</span>
                       <span className="text-xs font-bold text-white">12,500 ج.م</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">فاتورة شركة العقارات</h4>
                    <p className="text-[10px] text-zinc-500">استحقاق: 10 مارس (غداً)</p>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 shadow-xl text-white">
              <h3 className="text-lg font-bold mb-4">ملخص الضرائب</h3>
              <p className="text-white/70 text-sm mb-6">إجمالي الضرائب المستحقة للربع الحالي (Q1)</p>
              <div className="flex items-center justify-between mb-4">
                 <span className="text-2xl font-bold">18,400 ج.م</span>
                 <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt className="h-6 w-6" />
                 </div>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-6">
                 <div className="h-full bg-white" style={{ width: '65%' }}></div>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-white text-[#6366F1] font-bold text-sm hover:bg-white/90 transition-all">
                تحميل الإقرار الضريبي
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <Motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl flex items-center gap-5"
    >
      <div className={`h-14 w-14 ${bgColor} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
        <Icon className={`h-7 w-7 ${color}`} />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-medium mb-1">{title}</p>
        <h4 className="text-lg font-bold text-white">{value}</h4>
      </div>
    </Motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    paid: { label: "مدفوع", class: "bg-[#10B981]/10 text-[#10B981]", icon: CheckCircle2 },
    pending: { label: "معلق", class: "bg-[#F59E0B]/10 text-[#F59E0B]", icon: Clock },
    overdue: { label: "متأخر", class: "bg-[#EF4444]/10 text-[#EF4444]", icon: AlertTriangle },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.class}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
