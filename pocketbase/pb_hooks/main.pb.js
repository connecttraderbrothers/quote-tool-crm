/// <reference path="../pb_data/types.d.ts" />
//
// OMEGA server-side rules.
//
// Everything in here exists because it must NOT be trusted to the browser:
//
//   1. line_total  — derived from quantity x unit_price on write. The legacy app
//                    stored a precomputed lineTotal that went stale whenever a
//                    code path changed quantity or price without recomputing.
//                    The server now owns it, so it cannot drift.
//
//   2. document totals — subtotal / VAT / total / amount_due are recomputed from
//                    the items whenever items change. They are denormalised onto
//                    the document so the pipeline board can sum won/lost values
//                    without loading every line item.
//
//   3. document number — allocated inside a transaction from document_counters.
//                    The legacy counter lived in localStorage and incremented on
//                    download, so two devices reliably produced two Estimate
//                    #0042s with no warning. This is the fix.
//
// API NOTE: written against the PocketBase v0.23+ hook API (`onRecordCreate`
// with `e.next()`). On older builds the equivalents are named
// `onRecordBeforeCreateRequest` / `onRecordBeforeUpdateRequest` and take no
// `e.next()` call. If hooks fail to load on boot, check your version first.

const DEFAULT_VAT_RATE = 0.2;

function round2(value) {
  const n = Number(value) || 0;
  return Math.round(n * 100) / 100;
}

// ── 1. Line totals ──────────────────────────────────────────────────────────

function applyLineTotal(record) {
  const qty = Number(record.get('quantity')) || 0;
  const price = Number(record.get('unit_price')) || 0;
  record.set('line_total', round2(qty * price));
}

onRecordCreate((e) => {
  applyLineTotal(e.record);
  e.next();
}, 'document_items');

onRecordUpdate((e) => {
  applyLineTotal(e.record);
  e.next();
}, 'document_items');

// ── 2. Document totals ──────────────────────────────────────────────────────

/**
 * Recompute and persist a document's money fields from its line items.
 * Uses the supplied app handle so it participates in the caller's transaction.
 */
function recomputeDocumentTotals(app, documentId) {
  if (!documentId) return;

  let doc;
  try {
    doc = app.findRecordById('documents', documentId);
  } catch (err) {
    return; // document already deleted — nothing to recompute
  }

  const items = app.findRecordsByFilter(
    'document_items',
    'document = {:doc}',
    '',
    0,
    0,
    { doc: documentId }
  );

  let subtotal = 0;
  for (const item of items) {
    const qty = Number(item.get('quantity')) || 0;
    const price = Number(item.get('unit_price')) || 0;
    subtotal += qty * price;
  }
  subtotal = round2(subtotal);

  const removeVat = !!doc.get('remove_vat');
  const rate = Number(doc.get('vat_rate')) || DEFAULT_VAT_RATE;
  const vat = removeVat ? 0 : round2(subtotal * rate);
  const total = round2(subtotal + vat);

  // Deduction applies AFTER VAT, and only on invoices.
  const deduction = doc.get('type') === 'invoice' ? round2(Number(doc.get('deduction')) || 0) : 0;
  const amountDue = round2(total - deduction);

  doc.set('subtotal', subtotal);
  doc.set('vat_amount', vat);
  doc.set('total', total);
  doc.set('amount_due', amountDue);

  // saveNoValidate avoids re-running validation (and this hook) on a
  // system-computed write.
  app.saveNoValidate(doc);
}

function recomputeFromItem(e) {
  const documentId = e.record.get('document');
  e.next();
  recomputeDocumentTotals(e.app, documentId);
}

onRecordAfterCreateSuccess(recomputeFromItem, 'document_items');
onRecordAfterUpdateSuccess(recomputeFromItem, 'document_items');
onRecordAfterDeleteSuccess(recomputeFromItem, 'document_items');

// A document's own VAT / deduction settings also affect its totals.
onRecordAfterUpdateSuccess((e) => {
  e.next();
  // Guard: only recompute when a money-affecting field actually changed,
  // otherwise the saveNoValidate above would loop.
  const original = e.record.original();
  const changed =
    original.get('remove_vat') !== e.record.get('remove_vat') ||
    original.get('vat_rate') !== e.record.get('vat_rate') ||
    original.get('deduction') !== e.record.get('deduction');
  if (changed) {
    recomputeDocumentTotals(e.app, e.record.id);
  }
}, 'documents');

// ── 3. Document numbering ───────────────────────────────────────────────────

/**
 * Allocate the next document number for (company, type).
 *
 * Runs inside the create transaction, so two simultaneous creates serialise
 * and get distinct numbers. The counter row stores the LAST USED number,
 * matching the semantics the legacy localStorage key had.
 */
function allocateNumber(app, companyId, type) {
  let counter;
  try {
    counter = app.findFirstRecordByFilter(
      'document_counters',
      'company = {:company} && type = {:type}',
      { company: companyId, type: type }
    );
  } catch (err) {
    counter = null;
  }

  if (!counter) {
    const collection = app.findCollectionByNameOrId('document_counters');
    counter = new Record(collection);
    counter.set('company', companyId);
    counter.set('type', type);
    counter.set('last_number', 0);
  }

  const next = (Number(counter.get('last_number')) || 0) + 1;
  counter.set('last_number', next);
  app.saveNoValidate(counter);
  return next;
}

onRecordCreate((e) => {
  const record = e.record;

  // Server owns the number. Ignore whatever the client sent.
  const companyId = record.get('company');
  const type = record.get('type');
  if (!companyId || !type) {
    throw new BadRequestError('company and type are required');
  }

  e.app.runInTransaction((txApp) => {
    record.set('number', allocateNumber(txApp, companyId, type));
  });

  if (!record.get('status')) record.set('status', 'draft');
  if (!record.get('issued_at')) record.set('issued_at', new DateTime());

  // Stable public token for the phase-5 accept/decline links.
  if (!record.get('public_token')) {
    record.set('public_token', $security.randomString(32));
  }

  e.next();
}, 'documents');

// ── 4. Activity log ─────────────────────────────────────────────────────────

function logActivity(app, doc, kind, summary) {
  try {
    const collection = app.findCollectionByNameOrId('activity');
    const entry = new Record(collection);
    entry.set('company', doc.get('company'));
    entry.set('customer', doc.get('customer'));
    entry.set('document', doc.id);
    entry.set('kind', kind);
    entry.set('summary', summary);
    app.saveNoValidate(entry);
  } catch (err) {
    // Activity logging must never block the underlying operation.
    console.log('activity log failed:', err);
  }
}

onRecordAfterUpdateSuccess((e) => {
  e.next();
  const before = e.record.original().get('status');
  const after = e.record.get('status');
  if (before !== after) {
    logActivity(e.app, e.record, 'status_changed', `Status changed from ${before} to ${after}`);
  }
}, 'documents');

onRecordAfterCreateSuccess((e) => {
  e.next();
  logActivity(e.app, e.record, 'created', `${e.record.get('type')} created`);
}, 'documents');
