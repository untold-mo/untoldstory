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
import { useTranslation } from 'react-i18next';
import { useData, type User } from '../context/DataContext';
import { useAppDirection } from '../hooks/useAppDirection';
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

const ALL_TABS: { id: LinkedViewId; labelKey: string; icon: typeof Users; roles: User['role'][] }[] = [
  { id: 'team', labelKey: 'pageViewsHub.team', icon: Users, roles: ['مالك', 'مدير مبيعات'] },
  { id: 'production', labelKey: 'pageViewsHub.production', icon: Briefcase, roles: ['مالك', 'مدير إنتاج'] },
  { id: 'equipment', labelKey: 'pageViewsHub.equipment', icon: Wrench, roles: ['مالك', 'مدير إنتاج'] },
  { id: 'analytics', labelKey: 'pageViewsHub.analytics', icon: BarChart3, roles: ['مالك', 'مدير مبيعات'] },
  { id: 'calls', labelKey: 'pageViewsHub.calls', icon: Phone, roles: ['مالك', 'مدير مبيعات', 'مندوب'] },
  { id: 'invoices', labelKey: 'pageViewsHub.invoices', icon: Receipt, roles: ['مالك', 'محاسب'] },
  { id: 'expenses', labelKey: 'pageViewsHub.expenses', icon: Wallet, roles: ['مالك', 'محاسب', 'مدير إنتاج'] },
  { id: 'settings', labelKey: 'pageViewsHub.settings', icon: Settings, roles: ['مالك'] },
  { id: 'leads', labelKey: 'pageViewsHub.leads', icon: UserCircle2, roles: ['مالك', 'مدير مبيعات', 'مندوب'] },
];

export default function PageViewsHub() {
  const { t } = useTranslation();
  const { dir } = useAppDirection();
  const { currentUser } = useData();
  const tabs = useMemo(
    () => (currentUser ? ALL_TABS.filter((tab) => tab.roles.includes(currentUser.role)) : []),
    [currentUser],
  );
  const [view, setView] = useState<LinkedViewId>(() => tabs[0]?.id ?? 'team');

  if (!currentUser) return null;
  if (tabs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#080B13] p-8 text-center text-zinc-500 text-sm">
        {t('pageViewsHub.empty')}
      </div>
    );
  }

  const safeView = tabs.some((tab) => tab.id === view) ? view : tabs[0].id;

  return (
    <div className="flex flex-col gap-4 min-h-0 font-['Cairo']" dir={dir}>
      <div className="shrink-0 rounded-2xl border border-white/10 bg-[#0c101a] p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const on = safeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  on
                    ? 'bg-[#7C6BFF] text-white shadow-lg shadow-[#7C6BFF]/25'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(tab.labelKey)}
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
