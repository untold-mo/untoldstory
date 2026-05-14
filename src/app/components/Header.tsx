import { Bell, Search, User, LogOut, Film, Settings, Menu } from "lucide-react";
import { useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

interface HeaderProps {
  role: string;
  onMenuClick?: () => void;
}

export default function Header({ role, onMenuClick }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    navigate("/auth");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return "صاحب الشركة";
      case "sales-manager": return "مدير مبيعات";
      case "sales-rep": return "مندوب مبيعات";
      case "accountant": return "المحاسب";
      default: return role;
    }
  };

  return (
    <header className="h-20 bg-[#18181B] border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 max-w-xl pr-0 md:pr-4 hidden sm:block">
          <div className="relative group">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500 transition-colors group-focus-within:text-[#6366F1]">
              <Search className="h-4 w-4 md:h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="البحث..."
              className="block w-full rounded-xl bg-[#09090B] border border-zinc-700 py-2 md:py-2.5 pr-8 md:pr-10 pl-3 text-white text-xs md:text-sm focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer">
          <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
            <Bell className="h-5 w-5" />
          </div>
          <span className="absolute top-2 left-2 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#18181B]"></span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-zinc-800 transition-all"
          >
            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold text-white">أحمد علي</p>
              <p className="text-[11px] text-[#6366F1] font-medium">{getRoleLabel(role)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg">
              <User className="h-6 w-6" />
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <Motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 mt-3 w-56 rounded-xl bg-[#18181B] border border-zinc-800 p-2 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-zinc-800 mb-2">
                  <p className="text-xs text-zinc-500 mb-1">بيانات الحساب</p>
                  <p className="text-sm font-medium text-white">admin@production.com</p>
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all text-sm">
                  <Settings className="h-4 w-4" />
                  <span>إعدادات الملف الشخصي</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل خروج</span>
                </button>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
