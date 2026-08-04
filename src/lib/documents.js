import { pb } from './pb.js';
import { currentCompanyId, currentUserId } from './auth.js';
import { computeTotals } from './money.js';
import { docType } from '../documents/docTypes.js';
import { addDays } from './format.js';

const DOCS = 'documents';
const ITEMS = 'document_items';
const SECTIONS = 'document_sections';

// ── Reading ─────────────────────────────────────────────────────────────────

export async function listDocuments({ type, status, customer, search = '', page = 1, perPage = 50 } = {}) {
  const company = currentCompanyId();
  const filters = [pb.filter('company = {:company}', { company })];

  if (type) filters.push(pb.filter('type = {:type}', { type }));
  if (customer) filters.push(pb.filter('customer = {:customer}', { customer }));
  if (Array.isArray(status) && status.length) {
    filters.push(`(${status.map((s) => pb.filter('status = {:s}', { s })).join(' || ')})`);
  } else if (typeof status === 'string' && status) {
    filters.push(pb.filter('status = {:status}', { status }));
  }
  if (search.trim()) {
    filters.push(pb.filter('customer.name ~ {:q}', { q: search.trim() }));
  }

  return pb.collection(DOCS).getList(page, perPage, {
    filter: filters.join(' && '),
    sort: '-created',
    expand: 'customer',
  });
}

/** A document with its customer, sections and items — everything the editor needs. */
export async function getDocumentBundle(id) {
  const doc = await pb.collection(DOCS).getOne(id, { expand: 'customer,project' });

  const [sections, items] = await Promise.all([
    pb.collection(SECTIONS).getFullList({
      filter: pb.filter('document = {:doc}', { doc: id }),
      sort: 'sort_order',
    }),
    pb.collection(ITEMS).getFullList({
      filter: pb.filter('document = {:doc}', { doc: id }),
      sort: 'sort_order',
      expand: 'section',
    }),
  ]);

  // Denormalise the section name onto each item. The template groups by name,
  // and doing it once here keeps the template free of lookup logic.
  const sectionsById = new Map(sections.map((s) => [s.id, s]));
  const decoratedItems = items.map((item) => ({
    ...item,
    section_name: item.section ? (sectionsById.get(item.section)?.name ?? '') : '',
  }));

  return {
    doc,
    customer: doc.expand?.customer ?? null,
    project: doc.expand?.project ?? null,
    sections,
    items: decoratedItems,
  };
}

// ── Writing ─────────────────────────────────────────────────────────────────

/**
 * Create a document. The number, status default, issue date and public token
 * are all allocated server-side by pb_hooks/main.pb.js — do not send them.
 */
export async function createDocument({ type, customer, project = null, ...rest }) {
  const config = docType(type);
  const company = currentCompanyId();

  const payload = {
    company,
    customer,
    project,
    type,
    status: 'draft',
    remove_vat: false,
    created_by: currentUserId(),
    ...rest,
  };

  if (config.hasDeposit && payload.deposit_percent == null) {
    payload.deposit_percent = config.defaultDepositPercent;
  }
  if (config.hasPaymentTerms && payload.payment_due_days == null) {
    payload.payment_due_days = config.defaultPaymentDueDays;
  }

  return pb.collection(DOCS).create(payload);
}

export async function updateDocument(id, data) {
  return pb.collection(DOCS).update(id, data);
}

export async function deleteDocument(id) {
  return pb.collection(DOCS).delete(id);
}

// ── Sections ────────────────────────────────────────────────────────────────
//
// Sections are real records with ids now. The legacy app stored the section as
// a plain string on each item, so renaming a section meant rewriting every
// item's `section` field — and missing one silently orphaned it. A rename is
// now a single update.

export async function addSection(documentId, name, sortOrder) {
  return pb.collection(SECTIONS).create({ document: documentId, name, sort_order: sortOrder });
}

export async function renameSection(sectionId, name) {
  return pb.collection(SECTIONS).update(sectionId, { name });
}

export async function removeSection(sectionId) {
  // Items keep their row; they just fall back to unsectioned.
  const orphans = await pb.collection(ITEMS).getFullList({
    filter: pb.filter('section = {:section}', { section: sectionId }),
  });
  await Promise.all(orphans.map((item) => pb.collection(ITEMS).update(item.id, { section: null })));
  return pb.collection(SECTIONS).delete(sectionId);
}

export async function reorderSections(sections) {
  return Promise.all(
    sections.map((section, index) =>
      pb.collection(SECTIONS).update(section.id, { sort_order: index })
    )
  );
}

// ── Items ───────────────────────────────────────────────────────────────────
//
// line_total is deliberately NOT sent — the server derives it on write so it
// cannot go stale.

export async function addItem(documentId, item, sortOrder) {
  return pb.collection(ITEMS).create({
    document: documentId,
    section: item.section || null,
    category: item.category,
    description: item.description,
    quantity: Number(item.quantity) || 0,
    unit: item.unit || '',
    unit_price: Number(item.unit_price) || 0,
    sort_order: sortOrder,
  });
}

export async function updateItem(itemId, data) {
  const payload = { ...data };
  delete payload.line_total; // server-owned
  return pb.collection(ITEMS).update(itemId, payload);
}

export async function removeItem(itemId) {
  return pb.collection(ITEMS).delete(itemId);
}

export async function reorderItems(items) {
  return Promise.all(
    items.map((item, index) => pb.collection(ITEMS).update(item.id, { sort_order: index }))
  );
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * Mark a document as sent and freeze what was sent.
 *
 * The snapshot matters: if you raise your carpentry day rate next year, an
 * estimate the customer accepted last year must still show the price they
 * agreed to. Everything the template needs is captured, so the document can be
 * re-rendered exactly as issued.
 */
export async function markSent(documentId) {
  const bundle = await getDocumentBundle(documentId);
  const config = docType(bundle.doc.type);

  const issuedAt = bundle.doc.issued_at ? new Date(bundle.doc.issued_at) : new Date();
  const patch = {
    status: 'sent',
    sent_at: new Date().toISOString(),
    snapshot: {
      captured_at: new Date().toISOString(),
      customer: bundle.customer,
      sections: bundle.sections,
      items: bundle.items,
      totals: computeTotals(bundle.items, {
        removeVat: bundle.doc.remove_vat,
        vatRate: bundle.doc.vat_rate ?? undefined,
        deduction: config.hasDeduction ? bundle.doc.deduction : 0,
        depositPercent: config.hasDeposit ? bundle.doc.deposit_percent : null,
      }),
    },
  };

  if (config.expiryDays && !bundle.doc.expires_at) {
    patch.expires_at = addDays(issuedAt, config.expiryDays).toISOString();
  }

  return pb.collection(DOCS).update(documentId, patch);
}

/** Pipeline transition: won / lost / no reply. */
export async function setPipelineStatus(documentId, status) {
  return pb.collection(DOCS).update(documentId, {
    status,
    responded_at: new Date().toISOString(),
  });
}

/**
 * Create a deposit invoice from an accepted estimate.
 *
 * Copies the estimate's line items as a single deposit line so the customer
 * sees "Deposit (30% of Estimate 0042)" rather than the full schedule again.
 * Emailing it automatically is phase 5 — this creates and links the document.
 */
export async function createDepositInvoice(estimateId) {
  const bundle = await getDocumentBundle(estimateId);
  const { doc, items } = bundle;

  if (doc.type !== 'estimate') {
    throw new Error('Deposit invoices can only be raised from an estimate.');
  }

  const percent = Number(doc.deposit_percent) || docType('estimate').defaultDepositPercent;
  const totals = computeTotals(items, {
    removeVat: doc.remove_vat,
    vatRate: doc.vat_rate ?? undefined,
    depositPercent: percent,
  });

  const invoice = await createDocument({
    type: 'invoice',
    customer: doc.customer,
    project: doc.project || null,
    parent_document: doc.id,
    is_deposit: true,
    deposit_percent: percent,
    site_address: doc.site_address,
    site_postcode: doc.site_postcode,
    // The deposit line is already the VAT-inclusive share, so don't re-apply VAT.
    remove_vat: true,
    notes: `Deposit invoice for Estimate ${String(doc.number).padStart(4, '0')}.`,
  });

  await addItem(
    invoice.id,
    {
      category: 'Deposit',
      description: `${percent}% deposit against Estimate ${String(doc.number).padStart(4, '0')}`,
      quantity: 1,
      unit: 'job',
      unit_price: totals.depositAmount,
    },
    0
  );

  return invoice;
}

/** Totals for a set of documents — used by the pipeline column headers. */
export function sumDocuments(documents) {
  return documents.reduce((sum, doc) => sum + (Number(doc.total) || 0), 0);
}
