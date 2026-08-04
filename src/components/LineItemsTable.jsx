import { Fragment, useState } from 'react';
import { money, lineTotal, computeTotals } from '../lib/money.js';
import { groupByCategory, CATEGORY_OPTIONS } from '../lib/rates.js';

/**
 * Line items table with inline editing.
 *
 * Rows are keyed by record id. The legacy version rebuilt the whole tbody as an
 * HTML string and had to carry a data-item-index attribute, because once
 * sections were in play `rows[i]` no longer matched `items[i]` — a footgun that
 * caused edits to land on the wrong row. Keys remove that entirely.
 */
export default function LineItemsTable({ doc, items, sections, config, onUpdate, onDelete, onMove }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const totals = computeTotals(items, {
    removeVat: doc.remove_vat,
    vatRate: doc.vat_rate ?? undefined,
    deduction: config.hasDeduction ? doc.deduction : 0,
    depositPercent: config.hasDeposit ? doc.deposit_percent : null,
  });

  function startEdit(item) {
    setEditingId(item.id);
    setDraft({
      category: item.category,
      description: item.description,
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(item) {
    const quantity = parseFloat(draft.quantity);
    const unitPrice = parseFloat(draft.unit_price);
    if (!draft.description.trim() || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return;
    }
    await onUpdate(item.id, {
      category: draft.category,
      description: draft.description.trim(),
      quantity,
      unit_price: unitPrice,
      // line_total is deliberately omitted — the server derives it.
    });
    cancelEdit();
  }

  function renderRows(rowItems) {
    return groupByCategory(rowItems).flatMap(({ category, items: catItems }) => [
      <tr className="row-category" key={`cat-${category}-${catItems[0].id}`}>
        <td colSpan={6}>{category}</td>
      </tr>,
      ...catItems.map((item) => {
        const isEditing = editingId === item.id;
        const index = items.findIndex((i) => i.id === item.id);

        if (isEditing) {
          return (
            <tr key={item.id}>
              <td>
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {[...new Set([draft.category, ...CATEGORY_OPTIONS.map((o) => o.value)])].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </td>
              <td className="text-center">
                <input
                  type="number" step="0.1" min="0.1" style={{ width: 80 }}
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                />
              </td>
              <td className="text-right">
                <input
                  type="number" step="0.01" min="0" style={{ width: 100 }}
                  value={draft.unit_price}
                  onChange={(e) => setDraft({ ...draft, unit_price: e.target.value })}
                />
              </td>
              <td className="text-right">
                {money((parseFloat(draft.quantity) || 0) * (parseFloat(draft.unit_price) || 0))}
              </td>
              <td className="text-center">
                <div className="btn-row">
                  <button className="btn btn-sm btn-primary" onClick={() => saveEdit(item)}>Save</button>
                  <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              </td>
            </tr>
          );
        }

        return (
          <tr key={item.id}>
            <td>{item.category}</td>
            <td>{item.description}</td>
            <td className="text-center">{item.quantity}</td>
            <td className="text-right">{money(item.unit_price)}</td>
            <td className="text-right"><strong>{money(lineTotal(item))}</strong></td>
            <td className="text-center">
              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn-sm btn-secondary" disabled={index === 0} onClick={() => onMove(item.id, -1)}>↑</button>
                <button className="btn btn-sm btn-secondary" disabled={index === items.length - 1} onClick={() => onMove(item.id, 1)}>↓</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.id)}>Del</button>
              </div>
            </td>
          </tr>
        );
      }),
    ]);
  }

  if (items.length === 0) {
    return <div className="card"><div className="empty">No line items yet.</div></div>;
  }

  const unsectioned = items.filter((item) => !item.section);
  const hasSections = sections.length > 0;

  return (
    <div className="card">
      <div className="card-title">{config.label} Items</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Total</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {hasSections ? (
              <>
                {unsectioned.length > 0 && (
                  <>
                    <tr className="row-unsectioned"><td colSpan={6}>Unsectioned Items</td></tr>
                    {renderRows(unsectioned)}
                  </>
                )}
                {sections.map((section) => {
                  const sectionItems = items.filter((item) => item.section === section.id);
                  if (sectionItems.length === 0) return null;
                  return (
                    <Fragment key={section.id}>
                      <tr className="row-section"><td colSpan={6}>{section.name}</td></tr>
                      {renderRows(sectionItems)}
                    </Fragment>
                  );
                })}
              </>
            ) : (
              renderRows(items)
            )}

            <tr className="row-total">
              <td colSpan={4} className="text-right">Subtotal</td>
              <td className="text-right">{money(totals.subtotal)}</td>
              <td />
            </tr>
            {!doc.remove_vat && (
              <tr className="row-total">
                <td colSpan={4} className="text-right">VAT ({Math.round(totals.vatRate * 100)}%)</td>
                <td className="text-right">{money(totals.vat)}</td>
                <td />
              </tr>
            )}
            {config.hasDeduction && totals.deduction > 0 && (
              <tr className="row-total">
                <td colSpan={4} className="text-right">Deduction</td>
                <td className="text-right">-{money(totals.deduction)}</td>
                <td />
              </tr>
            )}
            <tr className="row-total">
              <td colSpan={4} className="text-right" style={{ fontSize: 16 }}>
                <strong>{config.hasDeduction ? 'Amount Due' : 'Total'}</strong>
              </td>
              <td className="text-right" style={{ fontSize: 16 }}>
                <strong>{money(config.hasDeduction ? totals.amountDue : totals.total)}</strong>
              </td>
              <td />
            </tr>
            {config.hasDeposit && totals.depositAmount > 0 && (
              <tr className="row-total">
                <td colSpan={4} className="text-right muted">Deposit ({totals.depositPercent}%)</td>
                <td className="text-right muted">{money(totals.depositAmount)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
