/**
 * فحص دخان لقواعد القيود اليدوية (double-entry) — يجب أن يبقى متطابقاً منطقياً مع:
 *   src/lib/accounting/validateManualJournalLines.ts
 */
function validateManualJournalLines(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    return { ok: false, error: 'يُشترط سطران على الأقل في القيد' };
  }
  let debitSum = 0;
  let creditSum = 0;
  const normalized = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || typeof line !== 'object') {
      return { ok: false, error: `بند ${i + 1}: شكل غير صالح` };
    }
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    if (debit < 0 || credit < 0) {
      return { ok: false, error: `بند ${i + 1}: لا تُسمح بالمبالغ السالبة` };
    }
    if (debit > 0 && credit > 0) {
      return { ok: false, error: `بند ${i + 1}: إما مدين أو دائن في نفس السطر` };
    }
    if (debit === 0 && credit === 0) {
      return { ok: false, error: `بند ${i + 1}: مبلغ فارغ` };
    }
    debitSum += debit;
    creditSum += credit;
    normalized.push(line);
  }
  if (debitSum <= 0 || creditSum <= 0) {
    return { ok: false, error: 'إجمالي المدين والدائن يجب أن يكون موجباً' };
  }
  if (Math.abs(debitSum - creditSum) > 0.01) {
    return { ok: false, error: 'القيد غير متزن (المدين يجب أن يساوي الدائن)' };
  }
  return { ok: true, lines: normalized };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function getMonthKey(isoDate) {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthKeyRegexOk(mk) {
  return typeof mk === 'string' && /^\d{4}-\d{2}$/.test(mk);
}

/** يطابق تصفية postCloseMonthSb / لقطة الـ workspace */
function monthKeyValidForAccounting(mk) {
  if (!monthKeyRegexOk(mk)) return false;
  const m = Number(mk.slice(5, 7));
  return m >= 1 && m <= 12;
}

function main() {
  const okLines = [
    { accountCode: '1000', debit: 100, credit: 0, costCenter: 'عام' },
    { accountCode: '2000', debit: 0, credit: 100, costCenter: 'عام' },
  ];
  const r1 = validateManualJournalLines(okLines);
  assert(r1.ok === true, 'قيد متزن يجب أن يمر');

  const r2 = validateManualJournalLines([{ debit: 50, credit: 0 }]);
  assert(r2.ok === false, 'سطر واحد يجب أن يرفض');

  const r3 = validateManualJournalLines([
    { debit: 100, credit: 0 },
    { debit: 0, credit: 99 },
  ]);
  assert(r3.ok === false, 'قيد غير متزن يجب أن يرفض');

  const r4 = validateManualJournalLines([
    { debit: 100, credit: 50 },
    { debit: 0, credit: 50 },
  ]);
  assert(r4.ok === false, 'مدين+دائن في نفس السطر يجب أن يرفض');

  const mk = getMonthKey('2026-06-15T12:00:00.000Z');
  assert(monthKeyRegexOk(mk), `getMonthKey يجب أن يُرجع YYYY-MM، حصل: ${mk}`);

  assert(monthKeyRegexOk('2026-12'), 'مفتاح شهر صالح');
  assert(!monthKeyRegexOk('2026-1'), 'يجب رفض شهر بدون رقمين');
  assert(!monthKeyRegexOk('26-01'), 'يجب رفض سنة ليست أربعة أرقام');
  assert(!monthKeyRegexOk(''), 'فارغ مرفوض');
  assert(!monthKeyValidForAccounting('2026-13'), 'الشهر 13 يجب رفضه');
  assert(monthKeyValidForAccounting('2026-01'), 'يناير صالح');

  console.log('[accounting] كل فحوصات القيود ومفاتيح الأشهر نجحت.');
}

try {
  main();
} catch (e) {
  console.error('[accounting] فشل:', e instanceof Error ? e.message : e);
  process.exit(1);
}
