import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MoreVertical,
  Shield,
  Activity,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useData, User } from '../context/DataContext';

function roleBadgeClass(role: User['role']) {
  if (role === 'مالك') return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (role === 'مدير مبيعات') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (role === 'محاسب') return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  if (role === 'مدير إنتاج') return 'bg-teal-500/10 text-teal-400 border-teal-500/25';
  return 'bg-zinc-800 text-zinc-400 border-zinc-700';
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0]}${p[1][0]}`;
  return p[0]?.[0] ?? '?';
}

export default function TeamPage() {
  const { users, currentUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.role.includes(q),
    );
  }, [users, searchTerm]);

  const roleCards = useMemo(() => {
    const all = users.length;
    const admin = users.filter((u) => u.role === 'مالك' || u.role === 'مدير مبيعات').length;
    const sales = users.filter((u) => u.role === 'مندوب').length;
    const acct = users.filter((u) => u.role === 'محاسب' || u.role === 'مدير إنتاج').length;
    return [
      { label: 'الكل', count: all },
      { label: 'إدارة', count: admin },
      { label: 'مبيعات', count: sales },
      { label: 'حسابات وإنتاج', count: acct },
    ];
  }, [users]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">فريق العمل</h2>
          <p className="text-zinc-400">بيانات الموظفين من الخادم (قائمة المستخدمين)</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (currentUser?.role !== 'مالك') {
              toast.message('إضافة موظف متاحة للمالك من الواجهة الإنتاجية الرئيسية');
              return;
            }
            toast.message('لإضافة موظف استخدم تبويب الفريق / الموارد البشرية في النظام الرئيسي');
          }}
          className="flex items-center justify-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20"
        >
          <UserPlus className="h-5 w-5" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roleCards.map((role) => (
          <div
            key={role.label}
            className="bg-[#18181B] border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-[#6366F1]/50 transition-all cursor-default"
          >
            <span className="text-zinc-400 font-medium">{role.label}</span>
            <span className="bg-zinc-800 text-white px-2.5 py-0.5 rounded-lg text-sm font-bold group-hover:bg-[#6366F1] transition-all">
              {role.count}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="البحث عن موظف..."
              className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all">
              <Activity className="h-4 w-4" />
            </button>
            <button type="button" className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all">
              <Shield className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-800">
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">معلومات الاتصال</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    لا يوجد مستخدمون مطابقون للبحث.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white shadow-inner overflow-hidden">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(member.name)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{member.name}</p>
                          <p className="text-xs text-zinc-500">{member.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleBadgeClass(member.role)}`}>{member.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Users className="h-3 w-3 shrink-0" />
                          <span>معرّف: {member.id.slice(0, 8)}…</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span>{member.email || 'لا يوجد بريد'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#10B981]" />
                        <span className="text-xs text-zinc-400">مصدر البيانات: {member.authSource === 'database' ? 'قاعدة البيانات' : 'تجريبي'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button type="button" className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                        <MoreVertical className="h-4 w-4" />
                      </button>
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
