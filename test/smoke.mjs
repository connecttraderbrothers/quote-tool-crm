import { computeTotals, money, lineTotal } from '../src/lib/money.js';
import { renderDocument } from '../src/documents/template.js';
import { generateCustomerRef } from '../src/lib/format.js';

let pass = 0, fail = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      expected ${JSON.stringify(expected)}\n      actual   ${JSON.stringify(actual)}`}`);
};

const items = [
  { quantity: 2, unit_price: 32 },     // 64
  { quantity: 1, unit_price: 250 },    // 250
  { quantity: 0.5, unit_price: 45 },   // 22.50
];

// Totals: subtotal 336.50, VAT 67.30, total 403.80
const t = computeTotals(items);
check('subtotal', t.subtotal, 336.5);
check('vat @20%', t.vat, 67.3);
check('total', t.total, 403.8);

const noVat = computeTotals(items, { removeVat: true });
check('remove VAT zeroes vat', noVat.vat, 0);
check('remove VAT drops total to subtotal', noVat.total, 336.5);

// Deduction applies AFTER VAT (invoice rule)
const withDeduction = computeTotals(items, { deduction: 100 });
check('deduction after VAT', withDeduction.amountDue, 303.8);

// Deposit is a share of the VAT-inclusive total
const withDeposit = computeTotals(items, { depositPercent: 30 });
check('30% deposit of total', withDeposit.depositAmount, 121.14);

check('lineTotal derives', lineTotal({ quantity: 3, unit_price: 19.99 }), 59.97);
check('money formats GBP', money(403.8), '£403.80');

// Customer ref shape
const ref = generateCustomerRef('John Smith');
check('customer ref shape', /^JOHSMI\d{4}$/.test(ref), true);
check('single-word name ref', /^MADONN\d{4}$/.test(generateCustomerRef('Madonna')) || /^MADONN/.test(generateCustomerRef('Madonna')), true);

// Template renders and escapes
const doc = { id: 'x', type: 'estimate', number: 42, status: 'draft', remove_vat: false, deposit_percent: 30, issued_at: '2026-08-04T00:00:00Z' };
const customer = { name: 'John "Danger" Smith', ref: 'JOHSMI4821', address: '1 Test St', postcode: 'EH1 1AA', phone: '0131 000 0000' };
const rendered = renderDocument({
  doc, customer, sections: [],
  items: [{ category: 'Carpentry', description: 'Fit <script>alert(1)</script> door', quantity: 2, unit_price: 32 }],
  standalone: true,
});
check('template is a full document', rendered.startsWith('<!DOCTYPE html>'), true);
check('template escapes quotes in name', rendered.includes('John &quot;Danger&quot; Smith'), true);
check('template escapes script tag', !rendered.includes('<script>alert(1)</script>'), true);
check('template keeps scraper header row', rendered.includes('<th>Description</th>') && rendered.includes('<th>Unit price</th>'), true);
check('template shows estimate banner', rendered.includes('Estimate for'), true);
check('template shows deposit line', rendered.includes('Deposit (30%)'), true);

// Invoice variant: bank details + amount due
const invoiceHtml = renderDocument({
  doc: { ...doc, type: 'invoice', deduction: 50, status: 'sent' }, customer, sections: [],
  items: [{ category: 'Plumbing', description: 'Fix leak', quantity: 1, unit_price: 200 }],
  standalone: true,
});
check('invoice shows bank details', invoiceHtml.includes('Sort Code'), true);
check('invoice shows amount due', invoiceHtml.includes('Amount Due'), true);
check('invoice shows unpaid badge', invoiceHtml.includes('UNPAID'), true);
check('estimate has no bank details', !rendered.includes('Sort Code'), true);

// Preview and PDF share a body: strip the wrapper and compare
const previewFrag = renderDocument({ doc, customer, sections: [], items: [{ category: 'Carpentry', description: 'Fit door', quantity: 2, unit_price: 32 }], standalone: false });
const pdfFull = renderDocument({ doc, customer, sections: [], items: [{ category: 'Carpentry', description: 'Fit door', quantity: 2, unit_price: 32 }], standalone: true });
const body = (s) => s.slice(s.indexOf('<div class="doc-container">'), s.lastIndexOf('</div>'));
check('preview and PDF share identical body', body(previewFrag) === body(pdfFull), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
