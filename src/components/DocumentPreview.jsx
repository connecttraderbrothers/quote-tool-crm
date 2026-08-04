import { previewHtml } from '../lib/pdf.js';

/**
 * On-screen preview modal.
 *
 * The markup comes from the same renderer that produces the PDF, so what is
 * shown here and what the customer receives cannot diverge. Rendered into an
 * iframe rather than a div so the document's own CSS (which is written for a
 * standalone page, including `*` resets) can't bleed into the app chrome.
 */
export default function DocumentPreview({ bundle, company, onClose, onDownload, downloading }) {
  if (!bundle) return null;

  const html = previewHtml({
    doc: bundle.doc,
    customer: bundle.customer,
    items: bundle.items,
    sections: bundle.sections,
    company,
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Preview</strong>
          <button className="close-x" onClick={onClose} aria-label="Close preview">&times;</button>
        </div>
        <div className="modal-body">
          <iframe
            title="Document preview"
            srcDoc={html}
            style={{ width: '100%', height: '70vh', border: 'none', background: '#f5f5f5' }}
          />
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onDownload} disabled={downloading}>
            {downloading ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
