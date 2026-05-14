import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, User, Lock, Mail } from "lucide-react";
import { motion as Motion } from "motion/react";

export default function AuthPage() {
  const [role, setRole] = useState("owner");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would use Supabase Auth
    // For now, we navigate to the selected dashboard
    localStorage.setItem("user_role", role);
    navigate(`/${role}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] p-4">
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-[#18181B] p-8 border border-zinc-800 shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-[#6366F1] rounded-xl flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">تسجيل الدخول</h2>
          <p className="text-zinc-400">نظام إدارة شركة الإنتاج المتكامل</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                defaultValue="admin@production.com"
                className="block w-full rounded-lg bg-[#09090B] border border-zinc-700 py-3 pr-10 pl-3 text-white focus:border-[#6366F1] focus:ring-[#6366F1] transition-colors"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                placeholder="كلمة المرور"
                defaultValue="password123"
                className="block w-full rounded-lg bg-[#09090B] border border-zinc-700 py-3 pr-10 pl-3 text-white focus:border-[#6366F1] focus:ring-[#6366F1] transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 block pr-1">الدور (لغرض التجربة)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full rounded-lg bg-[#09090B] border border-zinc-700 py-3 px-4 text-white focus:border-[#6366F1] focus:ring-[#6366F1] transition-colors"
              >
                <option value="owner">صاحب الشركة (Owner)</option>
                <option value="sales-manager">مدير المبيعات (Sales Manager)</option>
                <option value="sales-rep">مندوب مبيعات (Sales Rep)</option>
                <option value="accountant">محاسب (Accountant)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#6366F1] py-3 text-white font-semibold hover:bg-[#5254E2] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#09090B] transition-all"
          >
            دخول النظام
          </button>
        </form>
      </Motion.div>
    </div>
  );
}
