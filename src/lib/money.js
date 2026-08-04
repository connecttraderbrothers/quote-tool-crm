// Money and totals — the single source of truth.
//
// VAT used to be hardcoded as `subtotal * 0.20` in eight places across five
// files. It now lives here once. Everything (on-screen tables, previews, PDFs,
// the pipeline board) calls computeTotals so they can never disagree.

export const VAT_RATE = 0.20;

/** Round to 2dp without float drift, e.g. 1.005 -> 1.01 not 1.00. */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** Line total for a single item. Never trust a stored value — always derive. */
export function lineTotal(item) {
  return round2((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
}

/**
 * Totals for a document.
 *
 * @param items      array of { quantity, unit_price }
 * @param opts.removeVat   zero the VAT line
 * @param opts.vatRate     defaults to VAT_RATE
 * @param opts.deduction   subtracted AFTER VAT (invoice only)
 * @param opts.depositPercent  if set, also returns the deposit amount
 */
export function computeTotals(items = [], opts = {}) {
  const {
    removeVat = false,
    vatRate = VAT_RATE,
    deduction = 0,
    depositPercent = null,
  } = opts;

  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const vat = removeVat ? 0 : round2(subtotal * vatRate);
  const total = round2(subtotal + vat);
  const deductionAmount = round2(Math.max(0, Number(deduction) || 0));
  const amountDue = round2(total - deductionAmount);

  const result = { subtotal, vat, vatRate, total, deduction: deductionAmount, amountDue };

  if (depositPercent != null && depositPercent !== '') {
    const pct = Number(depositPercent) || 0;
    result.depositPercent = pct;
    result.depositAmount = round2(total * (pct / 100));
  }

  return result;
}

const GBP = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
});

/** Format as £1,234.56. Used everywhere including inside PDF HTML. */
export function money(n) {
  return GBP.format(Number(n) || 0);
}
