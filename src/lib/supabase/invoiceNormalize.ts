import type { Invoice } from '@/app/context/DataContext';
import { mapInvoiceRowRaw } from '@/lib/supabase/postgrestMappers';

/** يطابق منطق normalizeInvoice داخل DataContext لصف قادم من DB أو JSON */
export function normalizeInvoiceFromRow(raw: Record<string, unknown>): Invoice {
  const r = mapInvoiceRowRaw(raw) as Record<string, unknown>;
  const amount = Number(r.amount) || 0;
  const vatRate = typeof r.vatRate === 'number' ? r.vatRate : 14;
  const vatAmount = typeof r.vatAmount === 'number' ? r.vatAmount : Math.round(amount * (vatRate / 100));
  const totalAmount = typeof r.totalAmount === 'number' ? r.totalAmount : amount + vatAmount;
  const paidAmountRaw =
    typeof r.paidAmount === 'number' ? r.paidAmount : r.status === 'مدفوع' ? totalAmount : 0;
  const paidAmount = Math.max(0, Math.min(totalAmount, paidAmountRaw));
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  return {
    ...(r as unknown as Invoice),
    leadId: typeof r.leadId === 'string' ? r.leadId : '',
    customerCode: r.customerCode ? String(r.customerCode) : undefined,
    amount,
    vatRate,
    vatAmount,
    totalAmount,
    paidAmount,
    remainingAmount,
    nextDueDate: typeof r.nextDueDate === 'string' ? r.nextDueDate : undefined,
    collections: Array.isArray(r.collections) ? (r.collections as Invoice['collections']) : [],
  };
}
