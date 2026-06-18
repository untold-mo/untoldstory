import type {
  Expense,
  Invoice,
  Lead,
  MonthlyTarget,
  User,
} from '@/app/context/DataContext';
import { isServerDataMode } from '@/config/dataSource';

const CACHE_KEY = 'prod_system_server_workspace_cache_v1';

export type ServerWorkspaceCache = {
  savedAt: number;
  leads: Lead[];
  users: User[];
  invoices: Invoice[];
  expenses: Expense[];
  monthlyTargets: MonthlyTarget[];
};

function trimLeadsForCache(leads: Lead[]): Lead[] {
  return leads.map((l) => ({
    ...l,
    timeline: Array.isArray(l.timeline) ? l.timeline.slice(0, 5) : [],
  }));
}

export function readServerWorkspaceCache(): ServerWorkspaceCache | null {
  if (typeof window === 'undefined' || !isServerDataMode()) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ServerWorkspaceCache>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.leads) || !Array.isArray(parsed.users)) return null;
    return {
      savedAt: Number(parsed.savedAt) || 0,
      leads: parsed.leads,
      users: parsed.users,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      monthlyTargets: Array.isArray(parsed.monthlyTargets) ? parsed.monthlyTargets : [],
    };
  } catch {
    return null;
  }
}

export function writeServerWorkspaceCache(data: Omit<ServerWorkspaceCache, 'savedAt'>): void {
  if (typeof window === 'undefined' || !isServerDataMode()) return;
  const payload: ServerWorkspaceCache = {
    ...data,
    savedAt: Date.now(),
    leads: trimLeadsForCache(data.leads),
  };
  const write = () => {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      /* quota — تجاهل */
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(write, { timeout: 4000 });
  } else {
    window.setTimeout(write, 0);
  }
}

export function clearServerWorkspaceCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function initialLeadsFromServerCache(): Lead[] {
  return readServerWorkspaceCache()?.leads ?? [];
}

export function initialUsersFromServerCache(): User[] | null {
  const users = readServerWorkspaceCache()?.users;
  return users && users.length > 0 ? users : null;
}

export function initialInvoicesFromServerCache(): Invoice[] {
  return readServerWorkspaceCache()?.invoices ?? [];
}

export function initialExpensesFromServerCache(): Expense[] {
  return readServerWorkspaceCache()?.expenses ?? [];
}

export function initialMonthlyTargetsFromServerCache(): MonthlyTarget[] | null {
  const targets = readServerWorkspaceCache()?.monthlyTargets;
  return targets && targets.length > 0 ? targets : null;
}
