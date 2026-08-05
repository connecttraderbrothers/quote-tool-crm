# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**OMEGA** — a CRM and document tool for Trader Brothers Ltd, a building/trade firm.
It produces client-facing paperwork (estimates, invoices, statements), tracks customers,
and follows estimates through a won/lost/no-reply pipeline.

| Document | Purpose | Output |
| --- | --- | --- |
| **Estimate** | Priced quote, deposit terms, 30-day expiry | `Estimate_####_Client.pdf` |
| **Invoice** | Payment terms, bank details, post-VAT deductions | `Invoice_####_Client.pdf` |
| **Statement** | Statement of work, 31-day expiry | `Statement_####_Client.pdf` |

The app was rebuilt from a static single-page tool into a database-backed CRM. The
original is preserved in `legacy/` — see [Legacy](#legacy).

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18 + Vite, plain CSS, React Router |
| Backend | PocketBase (SQLite + auth + REST + JS hooks) |
| PDF | Gotenberg (self-hosted headless Chromium) |
| Hosting | Oracle Cloud ARM VM → Coolify; frontend on Cloudflare Pages |

```bash
npm install
npm run demo     # no backend, no login — sample data in memory
npm run dev      # Vite on :5173, proxies /api to PocketBase on :8090
npm run build
npm test         # smoke test — totals, escaping, template invariants
npm run seed:admin   # create the first company + owner login in PocketBase

# PocketBase locally
./pocketbase serve --dir ./pocketbase/pb_data --hooksDir ./pocketbase/pb_hooks
```

### Demo mode

`npm run demo` (Vite `--mode demo`, which loads `.env.demo` → `VITE_DEMO=true`)
swaps the PocketBase client for an in-memory stand-in in `src/lib/demoClient.js`
and starts signed in. Everything above the `pb` seam is the real code — real
screens, real template, real totals — so it is a genuine way to work on the UI
without a server.

Two things to keep true when touching it:

- **It is dev-only by construction.** `IS_DEMO` in `src/lib/pb.js` is
  `import.meta.env.DEV && VITE_DEMO === 'true'`, a compile-time constant, so the
  demo client is tree-shaken out of production builds. `demoClient.js` also
  throws if it is ever evaluated in a `PROD` build. Demo mode has **no
  authentication at all** — it must never be reachable in a deployed app.
- **`demoClient.js` mirrors the server hooks** (line totals, document totals,
  numbering) so the UI doesn't appear broken offline. That is a deliberate
  duplication for the demo only. If you change a rule in
  `pocketbase/pb_hooks/main.pb.js`, change it here too — or the demo will quietly
  disagree with production.

In demo mode "Download PDF" opens the browser print dialog with the same HTML,
since there is no Gotenberg.

Full deployment runbook: [`deploy/README.md`](deploy/README.md).

## Layout

```
src/
  lib/
    pb.js          PocketBase client (or the demo shim) + error formatting
    demoClient.js  In-memory stand-in for PocketBase — dev only
    demoData.js    Sample company, customers, estimates, invoice
    auth.js        useAuth hook, current company/user, roles
    money.js       VAT_RATE and computeTotals — THE money source of truth
    rates.js       Trade rates, category order, category options — ONE copy
    format.js      escapeHtml, dates, customer refs, padNumber
    customers.js   Customer CRUD
    documents.js   Document/section/item CRUD, lifecycle, deposit invoices
    pdf.js         Render + download via the PocketBase PDF route
  documents/
    docTypes.js    Per-type config — the parameterisation of the three tools
    template.js    THE document template (preview AND PDF)
  components/      LineItemForm, LineItemsTable, SectionManager, DocumentPreview, StatusBadge
  screens/         Login, Dashboard, Pipeline, Customers, CustomerProfile, DocumentList, DocumentEditor

pocketbase/
  collections.json Importable schema (Admin UI → Settings → Import collections)
  pb_hooks/
    main.pb.js     Line totals, document totals, numbering, activity log
    pdf.pb.js      Authenticated Gotenberg proxy

deploy/            docker-compose.yml + the OCI/Coolify runbook
scripts/
  seed-admin.mjs   Creates the first company + owner login
legacy/            The original static app, kept for reference
test/smoke.mjs     Dependency-free assertions on the calculation and template
```

## The three rules that matter most

### 1. One template, two outputs

`src/documents/template.js` renders **both** the on-screen preview and the PDF.
`standalone: false` returns a fragment for the modal; `standalone: true` wraps it in a
full `<!DOCTYPE html>` document for Gotenberg.

The legacy app kept two hand-maintained copies of every document's markup, which drifted
constantly — the preview and the downloaded PDF disagreed. **Never reintroduce a second
copy.** `npm test` asserts the two outputs share a byte-identical body.

### 2. One code path for three document types

Estimate, invoice and statement are the same code. Everything that genuinely differs
lives in `src/documents/docTypes.js` as data: banner text, expiry days, notes lines, and
feature flags (`hasDeposit`, `hasBankDetails`, `hasDeduction`, `hasPaymentTerms`,
`tracksPipeline`).

To change behaviour for one type, add or adjust a flag there — do not branch on
`doc.type` in components. The legacy app had three copy-pasted files and every bug had to
be fixed three times, which in practice meant it wasn't.

### 3. The server owns money and numbering

`pocketbase/pb_hooks/main.pb.js` derives on write:

- **`line_total`** from `quantity × unit_price`. Never send it from the client.
- **Document totals** (`subtotal`, `vat_amount`, `total`, `amount_due`) recomputed
  whenever items change. Denormalised so the pipeline can sum without loading items.
- **`number`** allocated inside a transaction from `document_counters`.

The frontend mirror is `src/lib/money.js` (`computeTotals`) for instant UI feedback. If
you change a rule, change it in **both** — they must agree.

## Data model

```
companies ─┬─ users (auth: company, role owner|admin|staff)
           ├─ customers ─── projects
           ├─ documents ─┬─ document_sections
           │             ├─ document_items
           │             └─ payments
           ├─ people (employees / subcontractors)
           ├─ activity
           └─ document_counters
```

- **One `documents` table** with a `type` discriminator, not three. Converting an
  estimate to a deposit invoice is a row copy (`createDepositInvoice`).
- **Sections are records with ids.** Items reference `section` by id. Renaming is one
  update — the legacy version stored the section as a string on each item, so a rename
  meant rewriting every item and missing one orphaned it silently.
- **`snapshot`** freezes what was sent when a document is marked sent. If rates change
  later, an accepted estimate still shows the agreed price.
- **`customers.ref`** (e.g. `JOHSMI4821`) is generated once at creation and stored,
  with a unique index on `(company, ref)`. The legacy version regenerated a random
  suffix on every keystroke, so the ID on a saved PDF matched nothing.

### Multi-tenancy

Every collection scopes to `@request.auth.company` via PocketBase API rules. Queries also
filter by company client-side — belt and braces, so a misconfigured rule shows nothing
rather than another company's data. **Any new collection needs its API rules set**;
PocketBase defaults to locked, so a missing rule fails closed.

## Business rules

- **VAT is 20%**, defined once as `VAT_RATE` in `src/lib/money.js` and defaulted in the
  hooks. Per-company override via `companies.vat_rate`; per-document via
  `documents.remove_vat`.
- **Deposit defaults to 30%** (estimates only), calculated on the VAT-inclusive total.
- **Deductions apply after VAT** (invoices only).
- Estimates expire in 30 days, statements in 31.
- **Trade rates** are "Edinburgh 2025 standard". A rate of `0` means "no standard rate";
  it's omitted from the hint.
- Document numbers are 4-digit zero-padded, per company **and** per type.

## Conventions

- **Modern JS**: ES modules, `const`/`let`, arrow functions, async/await. The legacy ES5
  style (`var`, globals, inline `onclick`) is confined to `legacy/`.
- **Escape everything** interpolated into template HTML via `escapeHtml` /
  `escapeMultiline` in `src/lib/format.js`. Document text now comes from a shared
  database, so unescaped interpolation is a stored-XSS vector, not just a broken row.
- **Errors** surface through `errorMessage(err)` into an `.error-banner`. Don't use
  `alert()` / `confirm()` in new code — `window.prompt` survives in `SectionManager` only.
- **Currency** via `money()`; dates via `formatDate` (en-GB).
- PocketBase filters use `pb.filter()` with bound parameters, never string concatenation.

## PDF generation

The browser renders HTML from `template.js` and POSTs it to `/api/omega/render-pdf`.
That route (`pocketbase/pb_hooks/pdf.pb.js`) authenticates the caller, checks the document
belongs to their company, forwards to Gotenberg on the private Docker network, archives
the PDF against the document, and returns the file.

Gotenberg is **not** published — no host port. The old PDFShift integration and its
committed API key are gone; nothing secret reaches the browser now.

Note the direction of travel: HTML is rendered client-side deliberately, to keep one
template. Phase 5's unattended deposit-invoice email needs a server-side render — share
this template through the JSVM rather than writing a second one.

## Testing

`npm test` runs `test/smoke.mjs` — no framework, no dependencies. It covers the totals
maths (VAT, remove-VAT, post-VAT deduction, deposit), HTML escaping, and the
preview/PDF-parity invariant. **Add a case here when you touch money or the template.**

Beyond that, verification is manual:

1. Sign in → dashboard loads with stats.
2. Create a customer; confirm the reference is generated and persists on reload.
3. Raise an estimate; confirm it gets the next number.
4. Pick a trade; confirm the rate hint appears and price auto-fills; toggle rate types.
5. Add sections and items; confirm grouping, with unsectioned first.
6. Edit a row inline; confirm the line total and the document total both update.
7. Toggle Remove VAT; confirm the VAT row disappears and the total drops.
8. Preview, then download; confirm they match.
9. Mark sent → mark won → raise the deposit invoice; confirm it links to the estimate.
10. Open the pipeline; confirm the estimate is in the right column with the right value.

## Known gaps

- **PDF import is not ported.** `legacy/statement.js` (`parseTbPdfItems`) reconstructs
  line items from PDF text by position — it keys off the exact
  `Description Qty Unit price Total price` header, column order, and bold category/section
  rows. `template.js` reproduces that layout faithfully so historical PDFs remain
  parseable, but nothing in the new app calls the parser yet.
- **No service worker**, so the PWA manifest doesn't make it installable/offline yet.
- **Phase 5 not built**: deposit-invoice *email*, signed accept/decline links (the
  `public_token` field exists and is populated), and Capacitor packaging.
- **`react-router-dom` carries an open advisory** with no patched release — the
  high-severity item is SSR-hydration-specific and this is a client-only SPA. Recheck
  when a fix ships.
- Company logo is still hotlinked from GitHub `?raw=true`; move it into PocketBase
  storage so PDFs don't depend on GitHub being up.

## Legacy

`legacy/` holds the original static app: three copy-pasted tool files, two PDF
generators, an empty `invoice.js` (the Invoice tool never worked), and a committed
PDFShift key. It is not served or built. Keep it until the PDF importer is ported, then
delete it — git history has it.

**That key must be treated as compromised** and rotated at PDFShift regardless; it was
public in the repo. Nothing in the new code path uses it.

## Git workflow

Feature branches; push with `git push -u origin <branch>`. Do not open a pull request
unless explicitly asked.
