# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**OMEGA** — a static, single-page web app (installable as a PWA) that Trader Brothers Ltd
uses to produce client-facing paperwork for building/trade jobs. It ships three tools:

| Tool | Purpose | Output |
| --- | --- | --- |
| **Quotation / Estimate** | Priced quote with deposit terms and a 30-day expiry | `Estimate_####_Client.pdf` |
| **Invoice** | Billing document with payment terms, bank details, deductions | `Invoice_####_Client.pdf` |
| **Statement** | Statement of work, imports items from the other two tools | `Statement_####_Client.pdf` |

Two more dashboard cards (Expense Tracker, Inventory Manager, Client Portal) are
placeholder "Coming Soon" tiles with no code behind them.

## Build, run, test

There is **no build system, no package manager, no dependency manifest, and no test
suite.** Do not add `package.json`, bundlers, or a framework unless explicitly asked.

To run it, serve the directory statically and open `index.html`:

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

Opening `index.html` via `file://` mostly works, but PDF download and PDF import will
fail (CORS / cross-origin `fetch`), so prefer the local server.

Verification is manual — see [Manual test checklist](#manual-test-checklist).

## File map and load order

Everything lives flat in the repo root. Scripts are plain `<script>` tags at the bottom
of `index.html` (lines 866-874) — **there are no modules, so load order is the
dependency graph**, and everything shares one global scope.

```
index.html            All five screens + inline matrix-rain canvas animation
  ├─ navigation.js         Screen switching (show*Tool / showDashboard / enterMatrix)
  ├─ pdf.js (CDN 3.11.174) PDF text extraction, used by both import paths
  ├─ script.js             ESTIMATE: state, rates, line items, sections, export
  ├─ pdf_generator.js      ESTIMATE: preview HTML, PDFShift call, PDFSHIFT_API_KEY
  ├─ invoice.js            INVOICE: EMPTY FILE — see "Known gaps" below
  ├─ invoice_pdfgen.js     INVOICE: preview + PDF HTML
  ├─ statement.js          STATEMENT: state, rates, items, sections, PDF/JSON import
  └─ statement_pdfgen.js   STATEMENT: preview + PDF HTML

styles.css     Shared tool-screen chrome (.container, .section, .form-grid, tables, modals)
dashboard.css  #dashboardScreen and tool cards only
splash.css     Splash screen and "Enter The Matrix" button only
manifest.json  PWA manifest (no service worker exists — the app is not offline-capable)
```

`pdf_generator.js` declares `const PDFSHIFT_API_KEY` at global scope. It loads before the
other generators, but they hardcode the key inline rather than reading it — see
[The PDFShift key](#the-pdfshift-key).

## Architecture

### Screens

`index.html` holds five sibling `<div>` screens: `#splashScreen`, `#dashboardScreen`,
`#quotationScreen`, `#invoiceScreen`, `#statementScreen`. `navigation.js` shows one and
sets the other four to `display: none`. There is no router, no history integration, and
no state preserved across screen switches (the globals simply persist).

### The three-tool parallel structure

The estimate, invoice, and statement tools are **near-identical copies of each other**,
distinguished only by an identifier prefix. This is the single most important thing to
understand before editing.

| Concept | Estimate | Invoice | Statement |
| --- | --- | --- | --- |
| Items array | `items` | `invoiceItems` | `statementItems` |
| Sections array | `estimateSections` | `invoiceSections` | `statementSections` |
| Active section | `activeEstimateSection` | — | `activeStatementSection` |
| Counter | `estimateNumber` | `invoiceNumber` | `statementNumber` |
| Edit cursor | `editingIndex` | — | `editingStatementIndex` |
| Rate table | `tradeRates` | — | `statementTradeRates` |
| Category order | `categoryOrder` | — | `statementCategoryOrder` |
| Add item | `addItem()` | `addInvoiceItem()` | `addStatementItem()` |
| Redraw table | `updateQuoteTable()` | `updateInvoiceTable()` | `updateStatementTable()` |
| Preview | `previewQuote()` | `previewInvoice()` | `previewStatement()` |
| Download | `downloadQuote()` | `downloadInvoice()` | `downloadStatement()` |
| DOM id prefix | none (`clientName`) | `invoice*` | `statement*` |
| Rate button class | `.rate-type-btn` | `.invoice-rate-btn` | `.statement-rate-btn` |

**A change to one tool almost always needs the same change in the other two.** When you
fix a bug in `script.js`, check `statement.js` for the same bug — they were copy-pasted.
`tradeRates`/`categoryOrder` in `script.js` and `statementTradeRates`/
`statementCategoryOrder` in `statement.js` are currently byte-for-byte identical and
must be kept in sync; the category lists must also match the three `<select>` blocks in
`index.html`.

### Line item shape

Every tool pushes this object into its items array:

```js
{
  category:    'Carpentry',   // trade name, or a free-text custom category
  description: 'Fit new door',
  quantity:    2,
  unit:        'hour' | 'day' | 'job' | <custom unit string>,
  unitPrice:   32,
  lineTotal:   64,            // precomputed = unitPrice * quantity, NOT derived at render
  section:     'Kitchen'      // '' when unsectioned
}
```

`lineTotal` is stored, not computed on read. Any code path that mutates `quantity` or
`unitPrice` must recompute `lineTotal` or totals silently go stale.

### Sections

Sections are an ordered array of plain strings. Items reference them by name (not by
index or id), so **renaming a section requires rewriting every item's `section` field**.
Items whose `section` is `''` render first under an "Unsectioned Items" header.

### Rendering

Tables are rebuilt wholesale by assigning a concatenated HTML string to
`tbody.innerHTML`. Rows carry `data-item-index` and inline editing swaps a row's
`innerHTML` for `<input>` fields. Note that values are interpolated into HTML without
escaping — a description containing `"` or `<` will corrupt the row markup. Preserve the
existing `data-item-index` lookup pattern (rows are not in array order once sections are
in play, so `rows[i]` is not `items[i]`).

## Business rules

- **VAT is 20%**, hardcoded as `subtotal * 0.20` in eight places across five files. Each
  tool has a "Remove VAT" checkbox (`removeVat` / `invoiceRemoveVat` /
  `statementRemoveVat`) that zeroes it.
- **Default deposit is 30%** (estimate only).
- **Trade rates** are labelled "Edinburgh 2025 standard trade rates". A rate of `0` means
  "no standard rate, user must type one" and is omitted from the rate hint.
- **Rate types** are `hourly` / `daily` / `job` / `custom`; `job` is the default.
  Selecting a trade auto-fills the unit price for the current rate type.
- **Customer IDs** are generated client-side from the name: first 3 chars of first name +
  first 3 of last name + a random 4-digit number (`JOHSMI4821`). Single-word names use
  the first 6 chars. They are not stable or unique — regenerating gives a different ID.
- **Document numbers** are 4-digit zero-padded and stored in `localStorage`:
  `traderBrosEstimateCount`, `traderBrosInvoiceCount`, `traderBrosStatementCount`. The
  stored value is the *last used* number; the displayed "next" number is stored + 1. It
  is incremented **only on successful PDF download**, not on preview. This is the only
  persisted state in the app — nothing else survives a reload.
- Estimates expire in 30 days, statements in 31.
- Company contact details, bank details, and terms are hardcoded into each PDF/preview
  HTML template. There is no shared config object — changing the phone number means
  editing every generator file.

## PDF generation

PDFs are produced by POSTing a **complete standalone HTML document** to the
[PDFShift](https://pdfshift.io) API (`https://api.pdfshift.io/v3/convert/pdf`), which
returns a PDF blob that is downloaded via a synthetic `<a download>` click.

Each tool therefore maintains **two separate copies of its document markup**:

- `preview*()` builds inline HTML for the on-page modal (`.class-preview` suffixed CSS).
- `generate*HTML()` builds the full `<!DOCTYPE html>` document sent to PDFShift.

**These are not shared.** A visual change must be applied to both, or the preview and the
downloaded PDF will disagree. This is the most common source of bugs in this codebase.

Two stylistic variants exist for building that markup: `pdf_generator.js` and
`invoice_pdfgen.js` use ES6 template literals; `statement_pdfgen.js` uses single-quoted
strings with trailing backslash line continuations. Match the file you are editing.

### The PDFShift key

A live PDFShift API key is committed to this repository — as a named constant in
`pdf_generator.js:2` and inline in the `fetch` calls in `invoice_pdfgen.js:278` and
`statement_pdfgen.js:423`. It is served to every visitor in plain JavaScript, so it is
already public and should be treated as compromised.

Do not copy it into new files. If asked to touch PDF generation, prefer reading the
shared `PDFSHIFT_API_KEY` constant, and flag to the user that the key should be rotated
and moved behind a server-side proxy. The free tier is 250 PDFs/month; a `429` means the
quota is spent.

## Import / export

Three interchange paths exist, and they use **different formats** — don't conflate them.

**1. `.tbdata.json` export** — `exportEstimateItems()` (and the missing
`exportInvoiceItems()`) download `{ source, number, items, sections }`. The Statement
tool's `importStatementJson()` reads these and **appends** to existing items.

**2. Embedded payload in estimate PDFs** — `generateCompleteHTML()` appends a
near-invisible 4pt `#f5f5f5` div containing:

```
OMEGA_IMPORT_V1_START<base64 of encodeURIComponent(JSON)>OMEGA_IMPORT_V1_END
```

`decodeOmegaImportPayload()` pulls this back out of extracted PDF text.
`applyEstimateImportData()` **replaces** all items and sections (after a `confirm()`).
Only the estimate tool writes and reads this format.

**3. Positional PDF scraping** — `parseTbPdfItems()` in `statement.js` reconstructs items
from pdf.js text runs when no embedded payload exists, grouping by y-coordinate with a
5-unit tolerance and detecting category/section headers via bold `fontName`. It is
tightly coupled to the generated PDF layout: **changing table markup, column order, the
`Description Qty Unit price Total price` header row, or the bold styling of section rows
will break it.** The existing comments there document hard-won fixes (per-page y-offsets,
`normalizeCategoryText()` absorbing Chromium's text-run splitting) — read them before
touching that code.

## Code conventions

Match the surrounding style; it is consistent and deliberately old-fashioned.

- **ES5 style**: `var` everywhere, `function` declarations, classic `for` loops, no
  arrow functions in the tool logic, no `class`, no modules. (A few `async`/`await` and
  template literals appear in `pdf_generator.js`; that is the exception.)
- **Global scope**: every function and variable is a global. New tool functions must be
  globals too, because HTML `onclick` attributes resolve against `window`.
- **Event wiring**: interaction is inline `onclick=` / `onchange=` in `index.html`.
  `addEventListener` is used only for input listeners, rate-type buttons, and drag-drop
  zones, registered at script load. Keep new buttons consistent with the file you're in.
- **User interaction** is `alert()` / `confirm()` / `prompt()`. There is no toast or
  validation-message system; don't introduce one incidentally.
- **Currency** is formatted `'£' + n.toFixed(2)` inline. Dates use `en-GB`.
- The three `download*()` functions read the implicit global `event` to find the button
  they were called from (`var downloadBtn = event.target`). This only works because they
  are invoked directly from an inline handler — do not call them programmatically or
  refactor the call sites without passing the button through.

## Known gaps

**`invoice.js` is an empty file (1 byte).** It was committed as a placeholder and never
filled in, so the Invoice tool is non-functional: its state layer does not exist
anywhere in the repo. `invoice_pdfgen.js` references `invoiceItems`, `invoiceSections`,
and `invoiceNumber`, none of which are ever declared, and these handlers wired up in
`index.html` are undefined:

- `addInvoiceItem()`, `updateInvoiceTable()`, `addInvoiceSection()`
- `editInvoiceNumber()`, `exportInvoiceItems()`, `closeInvoicePreview()`

Also missing: the invoice client-name → customer-ID listener, the trade-category change
handler, the `.invoice-rate-btn` rate-type wiring, and inline row edit/move/delete
functions. Clicking anything in the Invoice tool throws a `ReferenceError`.

If asked to fix or extend the Invoice tool, the intended approach is to write
`invoice.js` as a mirror of `script.js` using the `invoice*` names in the table above,
plus the invoice-only fields (`paymentDueDays`, `paymentStatus`, `invoiceDeduction` —
note the deduction applies *after* VAT).

Smaller issues worth knowing: no service worker despite the PWA manifest; the matrix
canvas `setInterval` in `index.html` runs forever even once hidden; logo and icon assets
are hotlinked from GitHub `?raw=true` URLs, so the app requires network access to render
correctly.

## Manual test checklist

After changing tool logic, exercise at least this path in a browser:

1. Enter The Matrix → dashboard → open the tool you changed.
2. Type a client name; confirm the Customer ID auto-fills.
3. Pick a trade category; confirm the standard-rate hint appears and the unit price
   auto-fills. Toggle hourly/day/job and confirm the price and label update.
4. Add two sections, add items into each, and confirm they group correctly under their
   headers with unsectioned items first.
5. Edit a row inline, save, and confirm the line total and subtotal both update.
6. Toggle "Remove VAT" and confirm the VAT row disappears and the total drops by 20%.
7. Preview, then download the PDF — confirm they look the same and the counter advances
   only after the download.
8. Re-import the downloaded PDF into the Statement tool and confirm items, categories,
   sections, and client info all come back intact.

## Git workflow

Development happens on feature branches; push with `git push -u origin <branch>`. Do not
open a pull request unless explicitly asked. Commit messages in the existing history are
terse ("Create script.js"); write clearer ones than that.
