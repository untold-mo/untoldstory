import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Film, 
  Camera, 
  Users,
  ChevronRight,
  Plus
} from "lucide-react";
import { motion as Motion } from "motion/react";
import { useNavigate } from "react-router";
import { useData } from "../context/DataContext";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const data = [
  { name: "يناير", revenue: 45000, expenses: 24000 },
  { name: "فبراير", revenue: 52000, expenses: 28000 },
  { name: "مارس", revenue: 48000, expenses: 26000 },
];

const sessions = [
  { id: 1, title: "تصوير إعلان شركة العقارات", date: "9 مارس", time: "10:00 ص", status: "scheduled", location: "الشيخ زايد" },
  { id: 2, title: "جلسة تصوير فاشون", date: "10 مارس", time: "02:00 م", status: "scheduled", location: "استوديو 1" },
  { id: 3, title: "مونتاج فيلم قصير", date: "11 مارس", time: "11:00 ص", status: "in_progress", location: "مكتب المونتاج" },
];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { leads, users } = useData();

  const totalRevenue = leads.reduce((acc, l) => (l.status === 'مغلق - فوز' ? acc + l.budget : acc), 0);
  const potentialRevenue = leads.reduce((acc, l) => acc + l.budget, 0);
  const conversionRate =
    leads.length > 0 ? ((leads.filter((l) => l.status === 'مغلق - فوز').length / leads.length) * 100).toFixed(1) : 0;

  const sourcesMap = leads.reduce((acc: Record<string, number>, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(sourcesMap).map(([name, value]: [string, number]) => ({
    name,
    value: Math.round((value / leads.length) * 100),
    color: name === 'Facebook' ? '#1877F2' : name === 'Instagram' ? '#E4405F' : name === 'Website' ? '#10B981' : '#6366F1',
  }));

  const teamPerformance = users
    .filter((t) => t.role === 'مندوب')
    .map((rep) => {
      const repLeads = leads.filter((l) => l.assignedTo === rep.id);
      const closed = repLeads.filter((l) => l.status === 'مغلق - فوز').length;
    return {
      name: rep.name,
      leads: repLeads.length,
      conversion: repLeads.length > 0 ? `${((closed / repLeads.length) * 100).toFixed(0)}%` : '0%',
      points: repLeads.length * 50 + closed * 200,
      status: 'online'
    };
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">مرحباً بك، أحمد!</h2>
          <p className="text-zinc-400">نظرة عامة على أداء شركتك لهذا الشهر</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate("/owner/production")}
            className="flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20"
          >
            <Plus className="h-5 w-5" />
            <span>مشروع جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="إيرادات محققة" value={`${totalRevenue.toLocaleString()} ج.م`} trend="+12.5%" icon={DollarSign} color="text-[#10B981]" bgColor="bg-[#10B981]/10" />
        <KPICard title="إيرادات محتملة" value={`${potentialRevenue.toLocaleString()} ج.م`} trend="-5.2%" icon={TrendingDown} color="text-zinc-400" bgColor="bg-zinc-800/50" />
        <KPICard title="عدد الليدز" value={leads.length.toString()} trend="+18.4%" icon={Target} color="text-[#6366F1]" bgColor="bg-[#6366F1]/10" />
        <KPICard title="معدل التحويل" value={`${conversionRate}%`} trend="+2.1%" icon={TrendingUp} color="text-[#F59E0B]" bgColor="bg-[#F59E0B]/10" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">نمو الإيرادات</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" id="owner-revenue-container">
              <LineChart data={data} id="owner-revenue-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A", borderRadius: "12px", textAlign: "right" }}
                  itemStyle={{ color: "#6366F1" }}
                />
                <Line key="revenue-line" type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: "#6366F1" }} activeDot={{ r: 6 }} />
                <Line key="expenses-line" type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: "#EF4444" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-8">مصادر الليدز</h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%" id="owner-sources-container">
              <PieChart id="owner-sources-chart">
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" nameKey="name">
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-pie-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A", borderRadius: "12px", textAlign: "right" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-zinc-500">إجمالي المصادر</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-6">
            {pieData.map((source: any) => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-sm text-zinc-400">{source.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance & Production Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">أداء فريق المبيعات</h3>
            <button 
              onClick={() => navigate("/owner/team")}
              className="text-[#6366F1] text-sm font-medium hover:underline"
            >عرض الكل</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-medium uppercase">
                  <th className="pb-4 pr-2">الموظف</th>
                  <th className="pb-4">الليدز</th>
                  <th className="pb-4">معدل التحويل</th>
                  <th className="pb-4">النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {teamPerformance.map((person) => (
                  <tr key={person.name} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-8 w-8 rounded-lg bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                            {person.name.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-[#18181B] ${person.status === 'online' ? 'bg-[#10B981]' : 'bg-zinc-500'}`}></span>
                        </div>
                        <span className="text-sm font-medium text-white">{person.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-zinc-400">{person.leads}</td>
                    <td className="py-4 text-sm font-semibold text-[#10B981]">{person.conversion}</td>
                    <td className="py-4 text-sm font-bold text-[#6366F1]">{person.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">جدول الإنتاج</h3>
            <button 
              onClick={() => navigate("/owner/production")}
              className="text-[#6366F1] text-sm font-medium hover:underline"
            >المفكرة الكاملة</button>
          </div>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex gap-4 p-4 rounded-xl bg-[#09090B] border border-zinc-800 hover:border-zinc-700 transition-all group">
                <div className="h-12 w-12 rounded-lg bg-[#6366F1]/10 flex flex-col items-center justify-center text-[#6366F1] shrink-0">
                  <span className="text-xs font-bold leading-none">{session.date.split(' ')[0]}</span>
                  <span className="text-[10px] font-medium opacity-70">{session.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-sm font-bold text-white mb-1 truncate">{session.title}</h4>
                  <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> {session.time}</span>
                    <span className="flex items-center gap-1"><Film className="h-3 w-3" /> {session.location}</span>
                  </div>
                </div>
                <div className="flex items-center">
                   <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                     session.status === 'in_progress' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-zinc-800 text-zinc-500'
                   }`}>
                     {session.status === 'in_progress' ? 'جاري الآن' : 'مجدول'}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, color, bgColor }: any) {
  const isPositive = trend.startsWith('+');
  return (
    <Motion.div 
      whileHover={{ y: -4 }}
      className="bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl flex items-center gap-5"
    >
      <div className={`h-14 w-14 ${bgColor} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon className={`h-7 w-7 ${color}`} />
      </div>
      <div>
        <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-xl font-bold text-white">{value}</h4>
          <span className={`text-[11px] font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {trend}
          </span>
        </div>
      </div>
    </Motion.div>
  );
}
