/// <reference path="../pb_data/types.d.ts" />
//
// PDF rendering — replaces PDFShift.
//
// The browser renders the document HTML (one template, src/documents/template.js)
// and POSTs it here. This route forwards it to Gotenberg on the private Docker
// network, stores the returned PDF against the document record, and returns the
// file URL.
//
// Why proxy instead of calling Gotenberg from the browser:
//   - Gotenberg stays unpublished. Nothing outside the Docker network reaches it.
//   - The request is authenticated by PocketBase, so only logged-in staff can
//     burn CPU rendering PDFs.
//   - The PDF is archived against the document, so you can re-send exactly what
//     the customer received.
//
// Why the HTML comes from the browser rather than being rendered here: keeping
// one copy of the template. Rendering server-side would mean a second
// implementation, which is precisely the bug that plagued the legacy app
// (preview and PDF drifting apart). Phase 5's unattended deposit-invoice email
// will need a server-side render — at that point share this template by loading
// it through the JSVM's require() rather than writing a second one.
//
// GOTENBERG_URL is read from the environment; defaults to the compose service name.

const GOTENBERG_URL = $os.getenv('GOTENBERG_URL') || 'http://gotenberg:3000';

/** Build a multipart/form-data body containing a single index.html part. */
function buildMultipart(html) {
  const boundary = '----omega' + $security.randomString(24);
  const body =
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="files"; filename="index.html"\r\n' +
    'Content-Type: text/html\r\n\r\n' +
    html +
    `\r\n--${boundary}--\r\n`;
  return { boundary: boundary, body: body };
}

routerAdd('POST', '/api/omega/render-pdf', (e) => {
  const auth = e.auth;
  if (!auth) {
    throw new UnauthorizedError('Authentication required.');
  }

  const data = new DynamicModel({ documentId: '', html: '' });
  e.bindBody(data);

  if (!data.documentId || !data.html) {
    throw new BadRequestError('documentId and html are required.');
  }

  // Enforce tenancy: you can only render a document belonging to your company.
  const doc = e.app.findRecordById('documents', data.documentId);
  if (doc.get('company') !== auth.get('company')) {
    throw new ForbiddenError('Document belongs to another company.');
  }

  const multipart = buildMultipart(data.html);

  const res = $http.send({
    url: `${GOTENBERG_URL}/forms/chromium/convert/html`,
    method: 'POST',
    body: multipart.body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${multipart.boundary}`,
    },
    timeout: 60,
  });

  if (res.statusCode !== 200) {
    throw new ApiError(502, `PDF renderer returned ${res.statusCode}`, null);
  }

  // Archive the PDF against the document.
  const filename = `${doc.get('type')}-${doc.get('number')}.pdf`;
  const file = $filesystem.fileFromBytes(res.body, filename);
  doc.set('pdf', file);
  e.app.saveNoValidate(doc);

  const saved = e.app.findRecordById('documents', data.documentId);
  return e.json(200, {
    pdf: saved.get('pdf'),
    url: `/api/files/documents/${saved.id}/${saved.get('pdf')}`,
  });
});
