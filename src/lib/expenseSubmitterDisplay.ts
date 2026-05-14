import type { Expense, User } from '@/app/context/DataContext';

/** اسم مقدّم الطلب: من المصروف أو من `users` عند وجود `submittedById` فقط */
export function expenseSubmitterDisplay(exp: Expense, users: User[]): string | undefined {
  const stored = typeof exp.submittedByName === 'string' ? exp.submittedByName.trim() : '';
  if (stored) return stored;
  if (!exp.submittedById) return undefined;
  const u = users.find((x) => x.id === exp.submittedById);
  const fromProfile = typeof u?.name === 'string' ? u.name.trim() : '';
  if (fromProfile) return fromProfile;
  const em = typeof u?.email === 'string' ? u.email.trim().toLowerCase() : '';
  if (em.includes('@')) return em.slice(0, em.indexOf('@'));
  return undefined;
}
