export type ProjectStatus = 'مفتوحة' | 'تحت التنفيذ' | 'منتهية' | 'تحت التحصيل';

export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
  /** تاريخ الشغلانة — للترتيب في الصفحة والتقارير */
  projectDate?: string;
  startDate: string;
  /** تاريخ الانتهاء المتوقع */
  expectedEndDate?: string;
  status: ProjectStatus;
  /** المسؤولون عن الشغلانة (أسماء) */
  managerName?: string;
  productionManagerName?: string;
  salesName?: string;
  accountantName?: string;
  /** معرّف السيلز المسؤول — لربط الرؤية بالسيلز/التيم ليدر */
  salesId?: string;
  notes: string;
  createdAt: string;
}

/** تحديث تنفيذي على الشغلانة (يكتبه السيلز/التيم ليدر/الإنتاج) */
export interface ProjectUpdate {
  id: string;
  projectCode: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  note: string;
  createdAt: string;
}

export type RevenueStatus = 'محصل' | 'مستحق' | 'متأخر';

export interface ProjectRevenue {
  id: string;
  projectCode: string;
  amount: number;
  date: string;
  status: RevenueStatus;
  collectionMethod: string;
  notes: string;
  createdAt: string;
}

export const EXPENSE_CODES: Record<string, string> = {
  '111': 'طيران',
  '112': 'حجز فنادق',
  '113': 'انتقالات',
  '114': 'ضيافة',
  '115': 'تسويق',
  '116': 'معدات',
  '117': 'أجور يومية',
  '118': 'تصاريح',
  '119': 'أخرى',
};

export type ExpenseSource = 'مباشر' | 'تسوية عهدة';

export interface ProjectExpense {
  id: string;
  projectCode: string;
  expenseCode: string;
  expenseType: string;
  description: string;
  date: string;
  amount: number;
  source: ExpenseSource;
  custodyId?: string;
  notes: string;
  createdAt: string;
}

export type CustodyStatus = 'مفتوحة' | 'تحت التسوية' | 'تم تسويتها';

export interface ProjectCustody {
  id: string;
  code: string;
  projectCode: string;
  holderName: string;
  amount: number;
  openDate: string;
  description: string;
  status: CustodyStatus;
  notes: string;
  settlementItems: ProjectExpense[];
  createdAt: string;
}

export interface ProjectsData {
  projects: Project[];
  revenues: ProjectRevenue[];
  expenses: ProjectExpense[];
  custodies: ProjectCustody[];
}
