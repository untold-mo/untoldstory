import { useNavigate, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  Film, 
  Camera, 
  TrendingUp, 
  CreditCard, 
  Receipt, 
  Settings, 
  LogOut,
  Target,
  BarChart3,
  ListTodo,
  PhoneCall
} from "lucide-react";
import { motion as Motion } from "motion/react";

interface NavItem {
  name: string;
  path: string;
  icon: any;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: "لوحة التحكم", path: "/owner", icon: LayoutDashboard, roles: ["owner"] },
  { name: "لوحة التحكم", path: "/sales-manager", icon: LayoutDashboard, roles: ["sales-manager"] },
  { name: "لوحة التحكم", path: "/sales-rep", icon: LayoutDashboard, roles: ["sales-rep"] },
  { name: "لوحة التحكم", path: "/accountant", icon: LayoutDashboard, roles: ["accountant"] },
  
  { name: "فريق العمل", path: "/owner/team", icon: Users, roles: ["owner"] },
  { name: "إدارة المبيعات", path: "/sales-manager/leads", icon: Target, roles: ["sales-manager"] },
  { name: "فريق المبيعات", path: "/sales-manager/team", icon: Users, roles: ["sales-manager"] },
  
  { name: "الليدز الخاصة بي", path: "/sales-rep/leads", icon: Target, roles: ["sales-rep"] },
  { name: "المكالمات", path: "/sales-rep/calls", icon: PhoneCall, roles: ["sales-rep"] },
  
  { name: "الفواتير", path: "/accountant/invoices", icon: CreditCard, roles: ["accountant"] },
  { name: "المصروفات", path: "/accountant/expenses", icon: Receipt, roles: ["accountant"] },
  
  { name: "جلسات الإنتاج", path: "/owner/production", icon: Film, roles: ["owner"] },
  { name: "المعدات", path: "/owner/equipment", icon: Camera, roles: ["owner"] },
  { name: "تحليلات الأداء", path: "/owner/analytics", icon: BarChart3, roles: ["owner"] },
  
  { name: "الإعدادات", path: "/settings", icon: Settings, roles: ["owner", "sales-manager", "sales-rep", "accountant"] },
];

export default function Sidebar({ role, isMobile }: { role: string; isMobile?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    navigate("/auth");
  };

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const sidebarClasses = isMobile 
    ? "flex flex-col w-full bg-[#18181B] h-full transition-all"
    : "hidden md:flex flex-col w-64 bg-[#18181B] border-l border-zinc-800 h-screen transition-all shadow-2xl shrink-0";

  return (
    <div className={sidebarClasses}>
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-[#6366F1] rounded-lg flex items-center justify-center shrink-0">
          <Film className="h-6 w-6 text-white" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-xl font-bold text-white truncate">برودكشن</h1>
          <p className="text-[10px] text-zinc-500 font-medium">نظام الإدارة المتكامل</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? "bg-[#6366F1]/10 text-[#6366F1] font-semibold shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-[#6366F1]" : "text-zinc-500 group-hover:text-zinc-300"}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>تسجيل خروج</span>
        </button>
      </div>
    </div>
  );
}
