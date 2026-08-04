// The document template — ONE copy, used for both the on-screen preview and
// the PDF sent to the render service.
//
// Previously each tool kept two separate copies of its markup: preview*() built
// inline HTML with .class-preview suffixed CSS, and generate*HTML() built a full
// standalone document. They were maintained by hand and drifted, which is why
// the preview and the downloaded PDF disagreed. There is now one renderer and a
// `standalone` flag: false returns a fragment for the modal, true wraps it in a
// complete <!DOCTYPE html> document for the PDF service.
//
// LAYOUT WARNING: the legacy PDF importer (legacy/statement.js,
// parseTbPdfItems) reconstructs line items from PDF text by position. It keys
// off the exact "Description Qty Unit price Total price" header row, the column
// order, and the bold styling of category and section rows. That layout is
// reproduced faithfully below. If you restructure the table, historical PDFs
// stop importing.

import { computeTotals, lineTotal, money } from '../lib/money.js';
import { groupByCategory } from '../lib/rates.js';
import { escapeHtml, escapeMultiline, formatDate, padNumber, addDays } from '../lib/format.js';
import { docType } from './docTypes.js';

// Fallback company details, used when no company record has been loaded yet.
// The live values come from the `companies` collection — changing the phone
// number is now one database edit rather than editing five generator files.
export const DEFAULT_COMPANY = {
  name: 'TRADER BROTHERS LTD',
  address_line1: '8 Craigour Terrace',
  address_line2: 'Edinburgh, EH17 7PB',
  phone: '07931 810557',
  email: 'traderbrotherslimited@gmail.com',
  logo_url: 'https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true',
  bank_account_name: 'Trader Brothers Ltd',
  bank_sort_code: '04-06-05',
  bank_account_number: '24049254',
};

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
  .doc-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
  .company-info { flex: 1; }
  .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
  .company-name .highlight { background: linear-gradient(135deg, #bc9c22, #d4af37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .company-details { font-size: 11px; line-height: 1.6; color: #666; }
  .logo { width: 120px; height: auto; }
  .doc-header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
  .doc-banner { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 15px 20px; display: inline-block; font-weight: bold; font-size: 16px; color: white; }
  .status-badge { padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .status-unpaid { background: #fee; color: #c00; border: 1px solid #c00; }
  .status-partial { background: #fff8e7; color: #8a6d00; border: 1px solid #d4af37; }
  .status-paid { background: #efe; color: #0a0; border: 1px solid #0a0; }
  .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; gap: 100px; }
  .client-info, .doc-details { flex: 0 0 auto; }
  .info-row { font-size: 13px; line-height: 2; display: flex; align-items: center; }
  .info-label { color: #333; font-weight: bold; margin-right: 10px; min-width: 80px; }
  .info-value { color: #333; font-weight: normal; }
  .expiry-date, .due-date { background: linear-gradient(135deg, #bc9c22, #d4af37); padding: 5px 10px; display: inline-block; color: white; font-weight: normal; }
  .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
  .items-table thead { background: #f5f5f5; }
  .items-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
  .items-table th:nth-child(2), .items-table th:nth-child(3), .items-table th:nth-child(4) { text-align: right; width: 100px; }
  .items-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
  .items-table td:nth-child(2), .items-table td:nth-child(3), .items-table td:nth-child(4) { text-align: right; }
  .category-row { background: #f9f9f9; font-weight: bold; color: #333; }
  .category-row td { padding: 10px 12px; border-bottom: 2px solid #ddd; }
  .section-row td { background: #d4af37; padding: 10px 12px; font-weight: bold; color: white; font-size: 13px; }
  .notes-section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #bc9c22; }
  .notes-section h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
  .notes-section ol { margin-left: 20px; font-size: 12px; line-height: 1.8; color: #666; }
  .extra-notes { margin-top: 15px; font-size: 12px; line-height: 1.8; color: #666; }
  .bottom-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 40px; margin-top: 30px; }
  .bank-details { font-size: 12px; line-height: 1.9; color: #444; }
  .bank-details h3 { font-size: 13px; margin-bottom: 8px; color: #333; }
  .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; flex: 1; }
  .totals-box { width: 300px; }
  .total-row { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; }
  .total-row.subtotal { border-top: 1px solid #ddd; }
  .total-row.vat { color: #666; }
  .total-row.final { background: linear-gradient(135deg, #bc9c22, #d4af37); color: white; font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 5px; }
  .deposit-line { margin-top: 10px; padding: 10px 15px; font-size: 12px; color: #5a4200; background: #fff8e7; border: 1px solid #d4af37; }
  .footer-note { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; font-style: italic; }
  .thank-you { margin-top: 15px; font-weight: bold; color: #333; font-size: 12px; }
  @media print { body { background: white; padding: 0; } .doc-container { box-shadow: none; padding: 20px; } }
`;

/** Company name with the second letter gold-gradiented, as in the original. */
function renderCompanyName(name) {
  const safe = escapeHtml(name);
  if (safe.length < 3) return safe;
  return `${safe.slice(0, 2)}<span class="highlight">${safe[2]}</span>${safe.slice(3)}`;
}

function renderItemRow(item) {
  return (
    '<tr>' +
    `<td>${escapeHtml(item.description)}</td>` +
    `<td>${escapeHtml(item.quantity)}</td>` +
    `<td>${money(item.unit_price)}</td>` +
    `<td>${money(lineTotal(item))}</td>` +
    '</tr>'
  );
}

/** Category-grouped rows, with a bold category header before each group. */
function renderItemsByCategory(items) {
  return groupByCategory(items)
    .map(
      ({ category, items: catItems }) =>
        `<tr class="category-row"><td colspan="4"><strong>${escapeHtml(category)}</strong></td></tr>` +
        catItems.map(renderItemRow).join('')
    )
    .join('');
}

/**
 * Table body. When sections exist, unsectioned items render first (matching the
 * legacy behaviour), then each section under a gold header, each internally
 * grouped by category.
 */
function renderTableBody(items, sections) {
  if (!sections || sections.length === 0) {
    return renderItemsByCategory(items);
  }

  let html = '';
  const unsectioned = items.filter((it) => !it.section_name);
  if (unsectioned.length > 0) html += renderItemsByCategory(unsectioned);

  for (const section of sections) {
    const sectionItems = items.filter((it) => it.section_name === section.name);
    if (sectionItems.length === 0) continue;
    html += `<tr class="section-row"><td colspan="4">${escapeHtml(section.name)}</td></tr>`;
    html += renderItemsByCategory(sectionItems);
  }
  return html;
}

function renderStatusBadge(status) {
  const map = {
    paid: { cls: 'status-paid', text: 'PAID' },
    part_paid: { cls: 'status-partial', text: 'PARTIALLY PAID' },
  };
  const badge = map[status] || { cls: 'status-unpaid', text: 'UNPAID' };
  return `<div class="status-badge ${badge.cls}">${badge.text}</div>`;
}

/**
 * Render a document to HTML.
 *
 * @param {object}  doc       document record
 * @param {object}  customer  customer record
 * @param {array}   items     line items
 * @param {array}   sections  [{ name, sort_order }]
 * @param {object}  company   company record (falls back to DEFAULT_COMPANY)
 * @param {boolean} standalone  true = full HTML document for the PDF service
 */
export function renderDocument({ doc, customer = {}, items = [], sections = [], company, standalone = false }) {
  const config = docType(doc.type);
  const co = { ...DEFAULT_COMPANY, ...(company || {}) };

  const issuedAt = doc.issued_at ? new Date(doc.issued_at) : new Date();
  const totals = computeTotals(items, {
    removeVat: doc.remove_vat,
    vatRate: doc.vat_rate ?? undefined,
    deduction: config.hasDeduction ? doc.deduction : 0,
    depositPercent: config.hasDeposit ? (doc.deposit_percent ?? config.defaultDepositPercent) : null,
  });

  // Right-hand info column: date, number, customer ref, then expiry or due date
  const infoRows = [
    ['Date:', escapeHtml(formatDate(issuedAt))],
    [`${config.numberLabel}:`, escapeHtml(padNumber(doc.number))],
    ['Customer ID:', escapeHtml(customer.ref || 'N/A')],
  ];

  let dateBadgeRow = '';
  if (config.expiryDays) {
    const expiry = doc.expires_at ? new Date(doc.expires_at) : addDays(issuedAt, config.expiryDays);
    dateBadgeRow =
      `<div class="info-row"><span class="info-label">${config.expiryLabel}:</span>` +
      `<span class="expiry-date">${escapeHtml(formatDate(expiry))}</span></div>`;
  } else if (config.hasPaymentTerms) {
    const days = doc.payment_due_days ?? config.defaultPaymentDueDays;
    const due = addDays(issuedAt, days);
    dateBadgeRow =
      `<div class="info-row"><span class="info-label">${config.dueDateLabel}:</span>` +
      `<span class="due-date">${escapeHtml(formatDate(due))}</span></div>`;
  }

  // Notes block — estimates and statements only; invoices use payment terms
  let notesBlock = '';
  const noteLines = config.notes
    ? config.notes({ depositPercent: doc.deposit_percent ?? config.defaultDepositPercent })
    : null;
  if (noteLines) {
    notesBlock =
      '<div class="notes-section"><h3>Notes:</h3><ol>' +
      noteLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('') +
      '</ol>' +
      (doc.notes ? `<div class="extra-notes"><strong>Additional Notes:</strong><br>${escapeMultiline(doc.notes)}</div>` : '') +
      '</div>';
  } else if (config.hasPaymentTerms) {
    const days = doc.payment_due_days ?? config.defaultPaymentDueDays;
    notesBlock =
      '<div class="notes-section"><h3>Payment Terms:</h3>' +
      `<p style="font-size:12px;color:#666;">Payment due within ${escapeHtml(days)} days from invoice date.</p>` +
      (doc.notes ? `<div class="extra-notes"><strong>Additional Notes:</strong><br>${escapeMultiline(doc.notes)}</div>` : '') +
      '</div>';
  }

  // Totals box
  let totalsRows =
    `<div class="total-row subtotal"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>`;
  if (!doc.remove_vat) {
    totalsRows += `<div class="total-row vat"><span>VAT (${Math.round(totals.vatRate * 100)}%)</span><span>${money(totals.vat)}</span></div>`;
  }
  if (config.hasDeduction && totals.deduction > 0) {
    totalsRows += `<div class="total-row subtotal"><span>Total</span><span>${money(totals.total)}</span></div>`;
    totalsRows += `<div class="total-row vat"><span>Deduction</span><span>-${money(totals.deduction)}</span></div>`;
    totalsRows += `<div class="total-row final"><span>Amount Due</span><span>${money(totals.amountDue)}</span></div>`;
  } else {
    totalsRows += `<div class="total-row final"><span>${config.hasDeduction ? 'Amount Due' : 'Total'}</span><span>${money(totals.total)}</span></div>`;
  }
  if (config.hasDeposit && totals.depositAmount > 0) {
    totalsRows += `<div class="deposit-line"><strong>Deposit (${escapeHtml(totals.depositPercent)}%):</strong> ${money(totals.depositAmount)}</div>`;
  }

  const totalsBlock = `<div class="totals-section"><div class="totals-box">${totalsRows}</div></div>`;

  const bankBlock = config.hasBankDetails
    ? '<div class="bank-details"><h3>Bank Details:</h3>' +
      `<p><strong>Account Name:</strong> ${escapeHtml(co.bank_account_name)}</p>` +
      `<p><strong>Sort Code:</strong> ${escapeHtml(co.bank_sort_code)}</p>` +
      `<p><strong>Account Number:</strong> ${escapeHtml(co.bank_account_number)}</p>` +
      '</div>'
    : '';

  // Invoices put bank details and totals side by side; the others just show totals
  const bottomBlock = bankBlock
    ? `<div class="bottom-section">${bankBlock}${totalsBlock}</div>`
    : totalsBlock;

  const body = `
    <div class="doc-container">
      <div class="header">
        <div class="company-info">
          <div class="company-name">${renderCompanyName(co.name)}</div>
          <div class="company-details">
            ${escapeHtml(co.address_line1)}<br>
            ${escapeHtml(co.address_line2)}<br>
            ${escapeHtml(co.phone)}<br>
            ${escapeHtml(co.email)}
          </div>
        </div>
        <div class="logo-container">
          <img src="${escapeHtml(co.logo_url)}" alt="${escapeHtml(co.name)} logo" class="logo">
        </div>
      </div>

      <div class="doc-header-section">
        <div class="doc-banner">${escapeHtml(config.banner)}</div>
        ${config.hasStatusBadge ? renderStatusBadge(doc.status) : ''}
      </div>

      <div class="info-section">
        <div class="client-info">
          <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${escapeHtml(customer.name || '[Client Name]')}</span></div>
          <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${escapeHtml(doc.site_address || customer.address || '[Project Address]')}</span></div>
          <div class="info-row"><span class="info-label">Postcode:</span><span class="info-value">${escapeHtml(doc.site_postcode || customer.postcode || 'N/A')}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${escapeHtml(customer.phone || 'N/A')}</span></div>
          ${customer.email ? `<div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(customer.email)}</span></div>` : ''}
        </div>
        <div class="doc-details">
          ${infoRows.map(([label, value]) => `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`).join('')}
          ${dateBadgeRow}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total price</th>
          </tr>
        </thead>
        <tbody>${renderTableBody(items, sections)}</tbody>
      </table>

      ${notesBlock}
      ${bottomBlock}

      <div class="footer-note">
        If you have any questions about this ${escapeHtml(config.footerNoun)}, please contact<br>
        us at ${escapeHtml(co.email)}, or ${escapeHtml(co.phone)}
        <div class="thank-you">Thank you for your business</div>
      </div>
    </div>`;

  if (!standalone) {
    // Fragment for the preview modal. Scoped so document CSS cannot leak into
    // the surrounding app chrome.
    return `<style>.omega-doc-preview { all: initial; }\n${STYLES}</style>${body}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.label)} - ${escapeHtml(co.name)}</title>
  <style>${STYLES}</style>
</head>
<body>${body}</body>
</html>`;
}

/** Download filename, e.g. Estimate_0042_John_Smith.pdf */
export function documentFilename(doc, customer) {
  const config = docType(doc.type);
  const safeName = String(customer?.name || 'Client').replace(/[^a-z0-9]/gi, '_');
  return `${config.filenamePrefix}_${padNumber(doc.number)}_${safeName}.pdf`;
}
