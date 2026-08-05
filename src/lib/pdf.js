import { pb, IS_DEMO } from './pb.js';
import { renderDocument, documentFilename } from '../documents/template.js';

/**
 * Render a document to PDF and download it.
 *
 * The HTML comes from the same template that draws the on-screen preview, so
 * the two cannot disagree. It is POSTed to PocketBase, which forwards it to
 * Gotenberg on the private network and archives the result against the
 * document record.
 *
 * Note the button is passed in explicitly. The legacy download functions read
 * the implicit global `event` to find their own button, which only worked when
 * called straight from an inline onclick and broke the moment you called them
 * any other way.
 */
export async function downloadDocumentPdf({ doc, customer, items, sections, company }) {
  const html = renderDocument({ doc, customer, items, sections, company, standalone: true });

  // Demo mode has no Gotenberg. Hand the identical HTML to the browser's own
  // print dialog instead — "Save as PDF" there produces the same layout, so the
  // document can still be checked end to end without a backend.
  if (IS_DEMO) {
    printHtml(html);
    return { demo: true };
  }

  const result = await pb.send('/api/omega/render-pdf', {
    method: 'POST',
    body: { documentId: doc.id, html },
  });

  // Fetch the archived PDF through the authenticated file endpoint and save it.
  const fileToken = await pb.files.getToken();
  const url = pb.files.getUrl({ id: doc.id, collectionId: 'documents' }, result.pdf, { token: fileToken });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download the generated PDF (${response.status}).`);
  const blob = await response.blob();

  triggerDownload(blob, documentFilename(doc, customer));
  return result;
}

/** Open the rendered document in a print window (demo-mode PDF fallback). */
function printHtml(html) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Allow pop-ups for this site to print the document.');
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // Give the logo a moment to load so it isn't missing from the printed page.
  setTimeout(() => printWindow.print(), 500);
}

function triggerDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
    document.body.removeChild(anchor);
  }, 100);
}

/** Preview HTML for the on-page modal — same renderer, fragment mode. */
export function previewHtml({ doc, customer, items, sections, company }) {
  return renderDocument({ doc, customer, items, sections, company, standalone: false });
}
