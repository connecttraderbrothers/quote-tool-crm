import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDocumentBundle, updateDocument, addItem, updateItem, removeItem, reorderItems,
  addSection, renameSection, removeSection, markSent, setPipelineStatus, createDepositInvoice,
} from '../lib/documents.js';
import { downloadDocumentPdf } from '../lib/pdf.js';
import { errorMessage } from '../lib/pb.js';
import { useAuth } from '../lib/auth.js';
import { docType, statusesFor } from '../documents/docTypes.js';
import { padNumber, formatDate } from '../lib/format.js';
import LineItemForm from '../components/LineItemForm.jsx';
import LineItemsTable from '../components/LineItemsTable.jsx';
import SectionManager from '../components/SectionManager.jsx';
import DocumentPreview from '../components/DocumentPreview.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * One editor for estimates, invoices and statements.
 *
 * This single screen replaces script.js + statement.js + the invoice.js that was
 * never written. Everything type-specific comes from docTypes.js, so a fix here
 * lands on all three at once.
 */
export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setBundle(await getDocumentBundle(id));
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load this document.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (error && !bundle) return <div className="error-banner">{error}</div>;
  if (!bundle) return null;

  const { doc, customer, items, sections } = bundle;
  const config = docType(doc.type);
  const locked = doc.status !== 'draft';

  async function run(action, failureMessage) {
    setBusy(true);
    setError('');
    try {
      await action();
      await reload();
    } catch (err) {
      setError(errorMessage(err, failureMessage));
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(itemId, direction) {
    const index = items.findIndex((i) => i.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    await run(() => reorderItems(next), 'Could not reorder items.');
  }

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      await downloadDocumentPdf({ doc, customer, items, sections, company });
      await reload();
    } catch (err) {
      setError(errorMessage(err, 'Could not generate the PDF. Check the renderer is running.'));
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeposit() {
    setBusy(true);
    try {
      const invoice = await createDepositInvoice(doc.id);
      navigate(`/document/${invoice.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not raise the deposit invoice.'));
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">
            {config.label} #{padNumber(doc.number)} <StatusBadge status={doc.status} />
          </div>
          <div className="page-sub">
            {customer ? <Link to={`/customers/${customer.id}`}>{customer.name}</Link> : 'No customer'}
            {' · '}
            {formatDate(doc.issued_at)}
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setShowPreview(true)} disabled={items.length === 0}>
            Preview
          </button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={items.length === 0 || downloading}>
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {locked && (
        <div className="card" style={{ borderColor: 'var(--gold-dim)' }}>
          This {config.footerNoun} has been sent. Editing it now will not change the copy the
          customer already has — the version they received is kept in the snapshot.
        </div>
      )}

      {/* ── Lifecycle actions ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Status</div>
        <div className="btn-row">
          {doc.status === 'draft' && (
            <button className="btn btn-primary" disabled={busy || items.length === 0}
              onClick={() => run(() => markSent(doc.id), 'Could not mark as sent.')}>
              Mark as Sent
            </button>
          )}

          {config.tracksPipeline && doc.status !== 'draft' && (
            <>
              <button className="btn btn-secondary" disabled={busy}
                onClick={() => run(() => setPipelineStatus(doc.id, 'accepted'), 'Could not update status.')}>
                Mark Won
              </button>
              <button className="btn btn-secondary" disabled={busy}
                onClick={() => run(() => setPipelineStatus(doc.id, 'declined'), 'Could not update status.')}>
                Mark Lost
              </button>
              <button className="btn btn-secondary" disabled={busy}
                onClick={() => run(() => setPipelineStatus(doc.id, 'no_reply'), 'Could not update status.')}>
                No Reply
              </button>
            </>
          )}

          {doc.type === 'estimate' && doc.status === 'accepted' && (
            <button className="btn btn-primary" disabled={busy} onClick={handleDeposit}>
              Raise {doc.deposit_percent ?? config.defaultDepositPercent}% Deposit Invoice
            </button>
          )}

          <select
            value={doc.status}
            disabled={busy}
            onChange={(e) => run(() => updateDocument(doc.id, { status: e.target.value }), 'Could not update status.')}
            style={{ width: 'auto' }}
          >
            {statusesFor(doc.type).map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Document settings ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">{config.label} Settings</div>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="site-address">Site Address</label>
            <input
              id="site-address"
              defaultValue={doc.site_address || customer?.address || ''}
              onBlur={(e) => run(() => updateDocument(doc.id, { site_address: e.target.value }), 'Could not save.')}
            />
          </div>
          <div className="field">
            <label htmlFor="site-postcode">Site Postcode</label>
            <input
              id="site-postcode"
              defaultValue={doc.site_postcode || customer?.postcode || ''}
              onBlur={(e) => run(() => updateDocument(doc.id, { site_postcode: e.target.value }), 'Could not save.')}
            />
          </div>

          {config.hasDeposit && (
            <div className="field">
              <label htmlFor="deposit">Deposit Percentage</label>
              <input
                id="deposit" type="number" min="0" max="100"
                defaultValue={doc.deposit_percent ?? config.defaultDepositPercent}
                onBlur={(e) => run(() => updateDocument(doc.id, { deposit_percent: Number(e.target.value) }), 'Could not save.')}
              />
            </div>
          )}

          {config.hasPaymentTerms && (
            <div className="field">
              <label htmlFor="due-days">Payment Due (Days)</label>
              <input
                id="due-days" type="number" min="0" max="365"
                defaultValue={doc.payment_due_days ?? config.defaultPaymentDueDays}
                onBlur={(e) => run(() => updateDocument(doc.id, { payment_due_days: Number(e.target.value) }), 'Could not save.')}
              />
            </div>
          )}

          {config.hasDeduction && (
            <div className="field">
              <label htmlFor="deduction">Deduction (£)</label>
              <input
                id="deduction" type="number" min="0" step="0.01"
                defaultValue={doc.deduction ?? 0}
                onBlur={(e) => run(() => updateDocument(doc.id, { deduction: Number(e.target.value) }), 'Could not save.')}
              />
              <div className="field-hint">Applied after VAT.</div>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            defaultValue={doc.notes || ''}
            onBlur={(e) => run(() => updateDocument(doc.id, { notes: e.target.value }), 'Could not save notes.')}
          />
        </div>

        <div className="checkbox-row">
          <input
            id="remove-vat" type="checkbox" defaultChecked={!!doc.remove_vat}
            onChange={(e) => run(() => updateDocument(doc.id, { remove_vat: e.target.checked }), 'Could not update VAT.')}
          />
          <label htmlFor="remove-vat" style={{ margin: 0 }}>Remove VAT from total</label>
        </div>
      </div>

      <SectionManager
        sections={sections}
        onAdd={(name) => run(() => addSection(doc.id, name, sections.length), 'Could not add section.')}
        onRename={(sectionId, name) => run(() => renameSection(sectionId, name), 'Could not rename section.')}
        onRemove={(sectionId) => run(() => removeSection(sectionId), 'Could not remove section.')}
      />

      <LineItemForm
        sections={sections}
        activeSection={activeSection}
        onActiveSectionChange={setActiveSection}
        busy={busy}
        onAdd={(item) => run(() => addItem(doc.id, item, items.length), 'Could not add item.')}
      />

      <LineItemsTable
        doc={doc}
        items={items}
        sections={sections}
        config={config}
        onUpdate={(itemId, data) => run(() => updateItem(itemId, data), 'Could not save the item.')}
        onDelete={(itemId) => run(() => removeItem(itemId), 'Could not delete the item.')}
        onMove={handleMove}
      />

      {showPreview && (
        <DocumentPreview
          bundle={bundle}
          company={company}
          downloading={downloading}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}
