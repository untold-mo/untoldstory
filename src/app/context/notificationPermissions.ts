import type { SystemNotification, User } from './DataContext';

/** تبويبات كل دور — مصدر واحد للجرس والتنقل */
export const ROLE_TAB_ACCESS: Record<User['role'], string[]> = {
  مالك: ['home', 'approvals', 'owner-dash', 'team-performance', 'leads', 'accountant', 'settings', 'bookings', 'linked-views', 'seo'],
  'مدير مبيعات': ['home', 'dashboard', 'leads', 'team-performance', 'bookings', 'manager-reps', 'linked-views'],
  مندوب: ['home', 'dashboard', 'leads', 'performance', 'bookings', 'linked-views'],
  محاسب: ['home', 'accountant', 'leads', 'bookings', 'linked-views'],
  'مدير إنتاج': ['home', 'production', 'bookings', 'leads', 'linked-views'],
};

export function getAllowedTabsForRole(role: User['role']): string[] {
  return ROLE_TAB_ACCESS[role] || ['home'];
}

/** مثل getAllowedTabsForRole لكن يضيف تبويبات تيم ليدر (مندوب له صلاحيات موسّعة) */
export function getAllowedTabsForUser(user: Pick<User, 'role' | 'isTeamLeader'> | null | undefined): string[] {
  const base = getAllowedTabsForRole(user?.role || 'مندوب');
  if (user?.role === 'مندوب' && user?.isTeamLeader && !base.includes('team-performance')) {
    return [...base, 'team-performance'];
  }
  return base;
}

/**
 * هل يرى هذا المستخدم التنبيه؟
 * - إن وُجد targetUserId → للمعني فقط (مع احترام targetRoles إن وُجدت).
 * - إن لم يُحدَّد مستخدم → يظهر لكل من دوره ضمن targetRoles.
 */
export function canViewerSeeNotification(
  n: SystemNotification,
  viewerRole: User['role'],
  viewerUserId: string,
): boolean {
  const uid = String(viewerUserId || '').trim();
  const targetUid = n.targetUserId ? String(n.targetUserId).trim() : '';

  if (targetUid) {
    if (!uid || uid !== targetUid) return false;
    if (n.targetRoles?.length && !n.targetRoles.includes(viewerRole)) return false;
    return true;
  }

  if (n.targetRoles?.length) {
    return n.targetRoles.includes(viewerRole);
  }

  return true;
}

/** يعيد تبويباً ضمن صلاحيات الدور أو undefined */
export function resolveNotificationTabForRole(
  n: { navigateTab?: string; entityType?: SystemNotification['entityType']; title?: string; message?: string },
  allowedTabs: string[],
): string | undefined {
  if (n.navigateTab && allowedTabs.includes(n.navigateTab)) return n.navigateTab;

  const text = `${n.title || ''} ${n.message || ''}`;
  let candidates: string[] = [];

  if (n.entityType === 'lead') {
    candidates = ['leads', 'approvals', 'home'];
  } else if (n.entityType === 'invoice') {
    candidates = ['accountant', 'approvals', 'home'];
  } else if (n.entityType === 'user') {
    candidates = ['team-performance', 'manager-reps', 'settings', 'home'];
  } else if (/عهد|اعتماد|موافقة|بانتظار|طلب|تسعير|عرض\s*سعر/i.test(text)) {
    candidates = ['approvals', 'accountant', 'production', 'bookings', 'leads', 'home'];
  } else {
    candidates = ['home', 'approvals', 'accountant', 'leads', 'bookings', 'production'];
  }

  return candidates.find((t) => allowedTabs.includes(t));
}

/** يضبط navigateTab لما يكون التبويب الأصلي محظوراً على هذا الدور */
export function withRoleSafeNavigateTab(
  n: SystemNotification,
  role: User['role'],
): SystemNotification {
  const allowed = getAllowedTabsForRole(role);
  const tab = resolveNotificationTabForRole(n, allowed);
  if (tab && tab !== n.navigateTab) return { ...n, navigateTab: tab };
  if (n.navigateTab && !allowed.includes(n.navigateTab) && tab) return { ...n, navigateTab: tab };
  return n;
}

export function filterNotificationsForViewer(
  notifications: SystemNotification[],
  role: User['role'],
  userId: string,
): SystemNotification[] {
  const uid = String(userId || '').trim();
  if (!uid) return [];

  return notifications
    .filter((n) => canViewerSeeNotification(n, role, uid))
    .map((n) => withRoleSafeNavigateTab(n, role))
    /** لا نعرض تنبيهاً لا يملك المستخدم أي تبويب ذي صلة (لا يمكن فتحه) */
    .filter((n) => {
      if (!n.navigateTab) return true;
      return getAllowedTabsForRole(role).includes(n.navigateTab);
    });
}
