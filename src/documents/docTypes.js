// The parameterisation that replaces three copy-pasted tools.
//
// Estimate, Invoice and Statement were three near-identical files distinguished
// only by an identifier prefix (items/invoiceItems/statementItems,
// addItem/addInvoiceItem/addStatementItem, and so on). Every bug fix had to be
// applied three times, and in practice wasn't.
//
// They are one code path now. Everything that genuinely differs between the
// three document types is data in this file.

export const DOC_TYPES = {
  estimate: {
    type: 'estimate',
    label: 'Estimate',
    plural: 'Estimates',
    // Banner text printed on the document
    banner: 'Estimate for',
    filenamePrefix: 'Estimate',
    numberLabel: 'Estimate #',
    // Days until the document expires; null = no expiry line
    expiryDays: 30,
    expiryLabel: 'Expiry Date',
    // Feature flags — these are the only real behavioural differences
    hasDeposit: true,
    hasPaymentTerms: false,
    hasBankDetails: false,
    hasDeduction: false,
    hasStatusBadge: false,
    // Sales pipeline applies to estimates only
    tracksPipeline: true,
    defaultDepositPercent: 30,
    notes: (ctx) => [
      'Estimate valid for 30 days',
      `Payment of ${ctx.depositPercent}% is required to secure start date`,
      'Parking to be supplied by customer',
      'Any additional work to be charged accordingly',
    ],
    footerNoun: 'estimate',
  },

  invoice: {
    type: 'invoice',
    label: 'Invoice',
    plural: 'Invoices',
    banner: 'Invoice for',
    filenamePrefix: 'Invoice',
    numberLabel: 'Invoice #',
    expiryDays: null,
    // Invoices show a due date derived from payment_due_days instead
    dueDateLabel: 'Due Date',
    hasDeposit: false,
    hasPaymentTerms: true,
    hasBankDetails: true,
    hasDeduction: true,
    hasStatusBadge: true,
    tracksPipeline: false,
    defaultPaymentDueDays: 30,
    notes: null, // invoices use the payment-terms block instead
    footerNoun: 'invoice',
  },

  statement: {
    type: 'statement',
    label: 'Statement',
    plural: 'Statements',
    banner: 'Statement for',
    filenamePrefix: 'Statement',
    numberLabel: 'Statement #',
    expiryDays: 31,
    expiryLabel: 'Expiry Date',
    hasDeposit: false,
    hasPaymentTerms: false,
    hasBankDetails: false,
    hasDeduction: false,
    hasStatusBadge: false,
    tracksPipeline: false,
    notes: () => [
      'Statement includes all works from accepted estimate/s',
      'Statement also includes all payment made.',
    ],
    footerNoun: 'statement',
  },
};

export const DOC_TYPE_LIST = Object.values(DOC_TYPES);

export function docType(type) {
  const config = DOC_TYPES[type];
  if (!config) throw new Error(`Unknown document type: ${type}`);
  return config;
}

// ── Status ──────────────────────────────────────────────────────────────────
//
// One status field across all three types. Estimates use the pipeline states
// (sent → accepted/declined/no_reply); invoices use the payment states.

export const DOC_STATUS = {
  draft:     { value: 'draft',     label: 'Draft',      tone: 'grey' },
  sent:      { value: 'sent',      label: 'Sent',       tone: 'blue' },
  accepted:  { value: 'accepted',  label: 'Won',        tone: 'green' },
  declined:  { value: 'declined',  label: 'Lost',       tone: 'red' },
  no_reply:  { value: 'no_reply',  label: 'No Reply',   tone: 'amber' },
  expired:   { value: 'expired',   label: 'Expired',    tone: 'grey' },
  part_paid: { value: 'part_paid', label: 'Part Paid',  tone: 'amber' },
  paid:      { value: 'paid',      label: 'Paid',       tone: 'green' },
};

/** Statuses offered for a given document type. */
export function statusesFor(type) {
  if (type === 'invoice') {
    return ['draft', 'sent', 'part_paid', 'paid'].map((s) => DOC_STATUS[s]);
  }
  if (type === 'estimate') {
    return ['draft', 'sent', 'accepted', 'declined', 'no_reply', 'expired'].map((s) => DOC_STATUS[s]);
  }
  return ['draft', 'sent'].map((s) => DOC_STATUS[s]);
}

/** The three columns of the estimate pipeline board, plus everything awaiting a reply. */
export const PIPELINE_COLUMNS = [
  { key: 'sent',     title: 'Awaiting Reply', statuses: ['sent'] },
  { key: 'accepted', title: 'Won',            statuses: ['accepted'] },
  { key: 'declined', title: 'Lost',           statuses: ['declined'] },
  { key: 'no_reply', title: 'No Reply',       statuses: ['no_reply', 'expired'] },
];
