/** تحقق double-entry للقيود اليدوية (متّسق مع api/src/lib/validateManualJournalLines.js) */
export function validateManualJournalLines(
  lines: unknown,
): { ok: true; lines: object[] } | { ok: false; error: string } {
  if (!Array.isArray(lines) || lines.length < 2) {
    return { ok: false, error: 'يُشترط سطران على الأقل في القيد' };
  }
  let debitSum = 0;
  let creditSum = 0;
  const normalized: object[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || typeof line !== 'object') {
      return { ok: false, error: `بند ${i + 1}: شكل غير صالح` };
    }
    const debit = Number((line as { debit?: unknown }).debit) || 0;
    const credit = Number((line as { credit?: unknown }).credit) || 0;
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
    normalized.push(line as object);
  }
  if (debitSum <= 0 || creditSum <= 0) {
    return { ok: false, error: 'إجمالي المدين والدائن يجب أن يكون موجباً' };
  }
  if (Math.abs(debitSum - creditSum) > 0.01) {
    return { ok: false, error: 'القيد غير متزن (المدين يجب أن يساوي الدائن)' };
  }
  return { ok: true, lines: normalized };
}
