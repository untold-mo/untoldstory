/** إزالة مفاتيح دليل البدء القديمة بعد إلغاء الميزة من الواجهة. */
export function clearLegacyOnboardingStorageKeys(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('prod_system_onboarding_seen_')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
