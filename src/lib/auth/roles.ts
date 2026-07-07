/**
 * مصدر واحد للحقيقة لأدوار النظام وصلاحياتها.
 *
 * السبب: كانت الأدوار تُقارَن كنصوص عربية ثابتة في ~379 موضعاً
 * (role === 'مالك' …) عبر الكود. أي تغيير في الصلاحيات كان يتطلب
 * مطاردة كل هذه المواضع — فيُنسى بعضها وترجع المشكلة.
 *
 * من الآن: استعمل الثوابت والدوال هنا. المقارنة النصية المباشرة يجب
 * أن تُستبدل تدريجياً باستدعاء هذه الدوال (بدون كسر: نفس المنطق تماماً).
 */

/** أدوار النظام كثوابت — بدل النصوص المتناثرة */
export const ROLES = {
  OWNER: 'مالك',
  SALES_MANAGER: 'مدير مبيعات',
  REP: 'مندوب',
  ACCOUNTANT: 'محاسب',
  PRODUCTION_MANAGER: 'مدير إنتاج',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** كل الأدوار كمصفوفة (لعمليات الفحص/التكرار) */
export const ALL_ROLES: AppRole[] = [
  ROLES.OWNER,
  ROLES.SALES_MANAGER,
  ROLES.REP,
  ROLES.ACCOUNTANT,
  ROLES.PRODUCTION_MANAGER,
];

// ============== فاحصات الدور المفردة ==============
export const isOwner = (r?: string | null): boolean => r === ROLES.OWNER;
export const isSalesManager = (r?: string | null): boolean => r === ROLES.SALES_MANAGER;
export const isRep = (r?: string | null): boolean => r === ROLES.REP;
export const isAccountant = (r?: string | null): boolean => r === ROLES.ACCOUNTANT;
export const isProductionManager = (r?: string | null): boolean => r === ROLES.PRODUCTION_MANAGER;

// ============== فاحصات مركّبة (تعكس المنطق القائم) ==============

/** مالك أو مدير مبيعات — رؤية CRM كاملة (بلا دور = يُعامل كصلاحية كاملة). */
export const isFullCrmRole = (r?: string | null): boolean =>
  !r || r === ROLES.OWNER || r === ROLES.SALES_MANAGER;

/** من يرى الجانب المالي: المالك والمحاسب. */
export const isFinanceRole = (r?: string | null): boolean =>
  r === ROLES.OWNER || r === ROLES.ACCOUNTANT;

/** قيادة (اطّلاع إداري): المالك ومدير المبيعات. */
export const isLeadershipRole = (r?: string | null): boolean =>
  r === ROLES.OWNER || r === ROLES.SALES_MANAGER;

/** هل الدور ضمن قائمة مسموح بها. */
export const roleIn = (r: string | null | undefined, allowed: readonly string[]): boolean =>
  !!r && allowed.includes(r);
