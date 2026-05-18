import { useMemo, useState } from 'react';
import {
  Users,
  Briefcase,
  Wrench,
  BarChart3,
  Phone,
  Receipt,
  Wallet,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useData, type User } from '../context/DataContext';
import TeamPage from './TeamPage';
import ProductionPage from './ProductionPage';
import EquipmentPage from './EquipmentPage';
import AnalyticsPage from './AnalyticsPage';
import CallsPage from './CallsPage';
import InvoicesPage from './InvoicesPage';
import ExpensesPage from './ExpensesPage';
import SettingsPage from './SettingsPage';
import LeadsPage from './LeadsPage';

type LinkedViewId =
  | 'team'
  | 'production'
  | 'equipment'
  | 'analytics'
  | 'calls'
  | 'invoices'
  | 'expenses'
  | 'settings'
  | 'leads';

const ALL_TABS: { id: LinkedViewId; label: string; icon: typeof Users; roles: User['role'][] }[] = [
  { id: 'team', label: 'الفريق', icon: Users, roles: ['مالك', 'مدير مبيعات'] },
  { id: 'production', label: 'الإنتاج', icon: Briefcase, roles: ['مالك', 'مدير إنتاج'] },
  { id: 'equipment', label: 'المعدات', icon: Wrench, roles: ['مالك', 'مدير إنتاج'] },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3, roles: ['مالك', 'مدير مبيعات'] },
  { id: 'calls', label: 'المكالمات', icon: Phone, roles: ['مالك', 'مدير مبيعات', 'مندوب'] },
  { id: 'invoices', label: 'الفواتير', icon: Receipt, roles: ['مالك', 'محاسب'] },
  { id: 'expenses', label: 'المصروفات', icon: Wallet, roles: ['مالك', 'محاسب', 'مدير إنتاج'] },
  { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['مالك'] },
  { id: 'leads', label: 'الليدز', icon: UserCircle2, roles: ['مالك', 'مدير مبيعات', 'مندوب'] },
];

export default function PageViewsHub() {
  const { currentUser } = useData();
  const tabs = useMemo(
    () => (currentUser ? ALL_TABS.filter((t) => t.roles.includes(currentUser.role)) : []),
    [currentUser],
  );
  const [view, setView] = useState<LinkedViewId>(() => tabs[0]?.id ?? 'team');

  if (!currentUser) return null;
  if (tabs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#080B13] p-8 text-center text-zinc-500 text-sm">
        لا توجد عروض إضافية متاحة لصلاحيتك.
      </div>
    );
  }

  const safeView = tabs.some((t) => t.id === view) ? view : tabs[0].id;

  return (
    <div className="flex flex-col gap-4 min-h-0 font-['Cairo']" dir="rtl">
      <div className="shrink-0 rounded-2xl border border-white/10 bg-[#0c101a] p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = safeView === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  on
                    ? 'bg-[#7C6BFF] text-white shadow-lg shadow-[#7C6BFF]/25'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-[60vh] rounded-2xl border border-white/10 bg-[#080B13] overflow-auto">
        {safeView === 'team' && <TeamPage />}
        {safeView === 'production' && <ProductionPage />}
        {safeView === 'equipment' && <EquipmentPage />}
        {safeView === 'analytics' && <AnalyticsPage />}
        {safeView === 'calls' && <CallsPage />}
        {safeView === 'invoices' && <InvoicesPage />}
        {safeView === 'expenses' && <ExpensesPage />}
        {safeView === 'settings' && <SettingsPage />}
        {safeView === 'leads' && <LeadsPage />}
      </div>
    </div>
  );
}
