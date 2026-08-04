import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS, RATE_TYPES, DEFAULT_RATE_TYPE, standardRate, rateHint } from '../lib/rates.js';

const BLANK = {
  category: '',
  customCategory: '',
  description: '',
  quantity: '1',
  unitPrice: '',
  customUnit: '',
};

/**
 * Add-a-line-item form. One component for estimates, invoices and statements —
 * the three tools each had their own copy of this, with their own prefix on
 * every element id.
 */
export default function LineItemForm({ sections, activeSection, onActiveSectionChange, onAdd, busy }) {
  const [form, setForm] = useState(BLANK);
  const [rateType, setRateType] = useState(DEFAULT_RATE_TYPE);
  const [error, setError] = useState('');

  const isCustomCategory = form.category === 'Custom';
  const hint = isCustomCategory ? '' : rateHint(form.category);

  // Selecting a trade, or switching rate type, fills in the standard price.
  useEffect(() => {
    if (isCustomCategory || !form.category) return;
    const rate = standardRate(form.category, rateType);
    if (rate > 0) setForm((f) => ({ ...f, unitPrice: String(rate) }));
  }, [form.category, rateType, isCustomCategory]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const category = isCustomCategory ? form.customCategory.trim() : form.category;
    if (!category) return setError('Please choose or enter a category.');
    if (!form.description.trim()) return setError('Please enter a description.');

    const quantity = parseFloat(form.quantity);
    const unitPrice = parseFloat(form.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0) return setError('Please enter a quantity above zero.');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return setError('Please enter a unit price.');

    const rateMeta = RATE_TYPES.find((r) => r.type === rateType);
    const unit = rateMeta.unit ?? (form.customUnit.trim() || 'item');

    onAdd({
      category,
      description: form.description.trim(),
      quantity,
      unit,
      unit_price: unitPrice,
      section: activeSection || null,
    });

    setForm({ ...BLANK, quantity: '1' });
  }

  const priceLabel = RATE_TYPES.find((r) => r.type === rateType)?.priceLabel ?? 'Unit Price (£)';

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-title">Add Line Item</div>

      {error && <div className="error-banner">{error}</div>}

      {sections.length > 0 && (
        <div className="field">
          <label htmlFor="active-section">Add into section</label>
          <select
            id="active-section"
            value={activeSection || ''}
            onChange={(e) => onActiveSectionChange(e.target.value || null)}
          >
            <option value="">Unsectioned</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="category">Trade Category</label>
          <select id="category" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select a trade…</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            <option value="Custom">Custom Category</option>
          </select>
          <div className="field-hint">{hint}</div>
          {isCustomCategory && (
            <input
              placeholder="Enter category name"
              value={form.customCategory}
              onChange={(e) => set('customCategory', e.target.value)}
            />
          )}
        </div>

        <div className="field">
          <label htmlFor="description">Description *</label>
          <input
            id="description"
            placeholder="Describe the work"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="quantity">Quantity *</label>
          <input
            id="quantity"
            type="number"
            min="0.1"
            step="0.1"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Rate Type</label>
          <div className="btn-row">
            {RATE_TYPES.map((rate) => (
              <button
                type="button"
                key={rate.type}
                className={`btn btn-sm ${rateType === rate.type ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRateType(rate.type)}
              >
                {rate.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="unit-price">{priceLabel} *</label>
          <input
            id="unit-price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter price or use standard rate"
            value={form.unitPrice}
            onChange={(e) => set('unitPrice', e.target.value)}
          />
        </div>

        {rateType === 'custom' && (
          <div className="field">
            <label htmlFor="custom-unit">Custom Unit Name</label>
            <input
              id="custom-unit"
              placeholder="e.g., per sqm, per item"
              value={form.customUnit}
              onChange={(e) => set('customUnit', e.target.value)}
            />
          </div>
        )}
      </div>

      <button className="btn btn-primary" disabled={busy}>Add Item</button>
    </form>
  );
}
