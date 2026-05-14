import { useState } from 'react';
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

const TABS: { id: LinkedViewId; label: string; icon: typeof Users }[] = [
  { id: 'team', label: 'الفريق', icon: Users },
  { id: 'production', label: 'الإنتاج', icon: Briefcase },
  { id: 'equipment', label: 'المعدات', icon: Wrench },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'calls', label: 'المكالمات', icon: Phone },
  { id: 'invoices', label: 'الفواتير', icon: Receipt },
  { id: 'expenses', label: 'المصروفات', icon: Wallet },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'leads', label: 'الليدز', icon: UserCircle2 },
];

export default function PageViewsHub() {
  const [view, setView] = useState<LinkedViewId>('team');

  return (
    <div className="flex flex-col gap-4 min-h-0 font-['Cairo']" dir="rtl">
      <div className="shrink-0 rounded-2xl border border-white/10 bg-[#0c101a] p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = view === t.id;
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
        {view === 'team' && <TeamPage />}
        {view === 'production' && <ProductionPage />}
        {view === 'equipment' && <EquipmentPage />}
        {view === 'analytics' && <AnalyticsPage />}
        {view === 'calls' && <CallsPage />}
        {view === 'invoices' && <InvoicesPage />}
        {view === 'expenses' && <ExpensesPage />}
        {view === 'settings' && <SettingsPage />}
        {view === 'leads' && <LeadsPage />}
      </div>
    </div>
  );
}
