export function priceQuoteToJson(row) {
  return {
    id: row.id,
    leadId: row.leadId,
    customerName: row.customerName,
    title: row.title,
    amount: row.amount,
    vatRate: row.vatRate ?? undefined,
    vatAmount: row.vatAmount ?? undefined,
    totalAmount: row.totalAmount ?? undefined,
    costCenter: row.costCenter ?? undefined,
    note: row.note ?? undefined,
    createdById: row.createdById,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    approvedBy: row.approvedBy ?? undefined,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : undefined,
    invoiceId: row.invoiceId ?? undefined,
    companyMarginPercent: typeof row.companyMarginPercent === 'number' ? row.companyMarginPercent : undefined,
    productionCostAmount: typeof row.productionCostAmount === 'number' ? row.productionCostAmount : undefined,
  };
}
