import React, { useMemo, useState } from 'react';
import { MinusCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useAppDirection } from '../hooks/useAppDirection';

type Props = {
  monthKey: string;
  /** محاسب: عرض فقط */
  readOnly?: boolean;
  compact?: boolean;
};

export function PayrollSalesDiscountsPanel({ monthKey, readOnly = false, compact = false }: Props) {
  const { t } = useTranslation();
  const { dateLocale } = useAppDirection();
  const currency = t('common.currency');
  const {
    currentUser,
    users,
    payrollSalesDiscounts,
    addPayrollSalesDiscount,
    removePayrollSalesDiscount,
    isPayrollApproved,
  } = useData();

  const canManage =
    !readOnly &&
    (currentUser?.role === 'مالك' || currentUser?.role === 'مدير إنتاج') &&
    !isPayrollApproved(monthKey);

  const salesReps = useMemo(
    () => users.filter((u) => u.role === 'مندوب'),
    [users],
  );

  const monthDiscounts = useMemo(
    () =>
      payrollSalesDiscounts
        .filter((d) => d.monthKey === monthKey)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payrollSalesDiscounts, monthKey],
  );

  const monthTotal = useMemo(
    () => monthDiscounts.reduce((s, d) => s + Math.max(0, Number(d.amount) || 0), 0),
    [monthDiscounts],
  );

  const [repId, setRepId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!canManage) return;
    const rid = repId.trim();
    const amt = Math.max(0, Math.round(Number(amount) || 0));
    const rsn = reason.trim();
    if (!rid) {
      toast.error(t('payrollDiscount.pickRep'));
      return;
    }
    if (amt <= 0) {
      toast.error(t('payrollDiscount.amountRequired'));
      return;
    }
    if (!rsn) {
      toast.error(t('payrollDiscount.reasonRequired'));
      return;
    }
    setBusy(true);
    try {
      const ok = await addPayrollSalesDiscount({ repId: rid, monthKey, amount: amt, reason: rsn });
      if (!ok) {
        toast.error(t('payrollDiscount.saveFailed'));
        return;
      }
      toast.success(t('payrollDiscount.added'));
      setAmount('');
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`bg-[#0B1020]/70 border border-amber-500/25 rounded-2xl ${compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className={`font-black text-zinc-100 ${compact ? 'text-sm' : 'text-base'}`}>
            {t('payrollDiscount.title')}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">{t('payrollDiscount.subtitle', { month: monthKey })}</p>
        </div>
        <span className="text-xs font-black text-amber-300">
          {t('payrollDiscount.monthTotal', {
            total: monthTotal.toLocaleString(dateLocale),
            currency,
          })}
        </span>
      </div>

      {isPayrollApproved(monthKey) && (
        <p className="text-xs text-emerald-300/90">{t('payrollDiscount.monthLocked')}</p>
      )}

      {canManage && (
        <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-5'}`}>
          <select
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="bg-[#0F1528] border border-white/15 rounded-xl px-3 py-2 text-sm md:col-span-2"
          >
            <option value="">{t('payrollDiscount.pickRep')}</option>
            {salesReps.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('payrollDiscount.amountPh')}
            className="bg-[#0F1528] border border-white/15 rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('payrollDiscount.reasonPh')}
            className="bg-[#0F1528] border border-white/15 rounded-xl px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="button"
            disabled={busy || salesReps.length === 0}
            onClick={() => void handleAdd()}
            className="flex items-center justify-center gap-1 bg-amber-500 text-slate-950 rounded-xl px-3 py-2 text-sm font-black disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {t('payrollDiscount.addBtn')}
          </button>
        </div>
      )}

      {salesReps.length === 0 && canManage && (
        <p className="text-xs text-zinc-500">{t('payrollDiscount.noSalesReps')}</p>
      )}

      <div className={`overflow-y-auto custom-scrollbar ${compact ? 'max-h-36' : 'max-h-48'} space-y-2`}>
        {monthDiscounts.length === 0 ? (
          <p className="text-xs text-zinc-500">{t('payrollDiscount.empty')}</p>
        ) : (
          monthDiscounts.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-[#0F1528]/80 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-100">{d.repName}</p>
                <p className="text-rose-300 font-black text-sm mt-0.5">
                  −{Number(d.amount).toLocaleString(dateLocale)} {currency}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{d.reason}</p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {t('payrollDiscount.byLine', {
                    name: d.createdByName,
                    date: new Date(d.createdAt).toLocaleString(dateLocale),
                  })}
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      if (!window.confirm(t('payrollDiscount.confirmDelete'))) return;
                      setBusy(true);
                      try {
                        const ok = await removePayrollSalesDiscount(d.id);
                        if (!ok) toast.error(t('payrollDiscount.deleteFailed'));
                        else toast.info(t('payrollDiscount.deleted'));
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                  className="p-2 rounded-lg text-rose-300 hover:bg-rose-500/10"
                  title={t('common.delete')}
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
