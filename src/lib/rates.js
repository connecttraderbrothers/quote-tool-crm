// Edinburgh 2025 standard trade rates.
//
// This is now the ONLY copy. Previously it existed twice (script.js and
// statement.js) and had to be kept byte-for-byte in sync by hand, with a third
// implicit copy as the <option> list in index.html. CATEGORY_ORDER below drives
// the dropdowns, so the list and the rate table can no longer drift apart.
//
// A rate of 0 means "no standard rate — the user must type one". Zero rates are
// omitted from the rate hint shown under the category picker.

export const TRADE_RATES = {
  'Downtakings':           { hourly: 30, daily: 220, job: 0 },
  'General Building':      { hourly: 30, daily: 230, job: 0 },
  'Building work':         { hourly: 30, daily: 230, job: 0 },
  'Carpentry':             { hourly: 32, daily: 240, job: 0 },
  'Joinery':               { hourly: 32, daily: 240, job: 0 },
  'Electrical':            { hourly: 45, daily: 320, job: 200 },
  'Electricals':           { hourly: 45, daily: 320, job: 200 },
  'Plumbing':              { hourly: 45, daily: 300, job: 200 },
  'Gas work/Plumbing':     { hourly: 50, daily: 340, job: 250 },
  'Plastering':            { hourly: 30, daily: 240, job: 0 },
  'Skimming /Painting':    { hourly: 28, daily: 220, job: 0 },
  'Painting & Decorating': { hourly: 28, daily: 220, job: 0 },
  'Tiling':                { hourly: 32, daily: 250, job: 0 },
  'Roofing':               { hourly: 35, daily: 260, job: 0 },
  'Kitchen Fitting':       { hourly: 32, daily: 250, job: 3000 },
  'Bathroom Fitting':      { hourly: 32, daily: 250, job: 2200 },
  'Bathrooms':             { hourly: 32, daily: 250, job: 2200 },
  'Flooring':              { hourly: 28, daily: 220, job: 0 },
  'Bricklaying':           { hourly: 32, daily: 250, job: 0 },
  'HVAC':                  { hourly: 40, daily: 300, job: 0 },
  'Groundworks':           { hourly: 30, daily: 230, job: 0 },
  'Scaffolding':           { hourly: 0,  daily: 200, job: 0 },
  'Glazing':               { hourly: 32, daily: 250, job: 0 },
  'Insulation':            { hourly: 28, daily: 220, job: 0 },
  'Materials':             { hourly: 0,  daily: 0,   job: 0 },
};

// Display order for category grouping in tables and PDFs. Categories not in
// this list (custom, user-typed) sort to the end, preserving insertion order.
export const CATEGORY_ORDER = [
  'Downtakings',
  'General Building',
  'Building work',
  'Carpentry',
  'Joinery',
  'Electrical',
  'Electricals',
  'Plumbing',
  'Gas work/Plumbing',
  'Plastering',
  'Skimming /Painting',
  'Painting & Decorating',
  'Tiling',
  'Roofing',
  'Kitchen Fitting',
  'Bathroom Fitting',
  'Bathrooms',
  'Flooring',
  'Bricklaying',
  'HVAC',
  'Groundworks',
  'Scaffolding',
  'Glazing',
  'Insulation',
  'Materials',
];

// The category <select> options. Label differs from value in a few cases,
// matching the original dropdown ("Electrical" stored, "Electricals" shown).
export const CATEGORY_OPTIONS = [
  { value: 'Downtakings',           label: 'Downtakings' },
  { value: 'General Building',      label: 'General Building' },
  { value: 'Building work',         label: 'Building work' },
  { value: 'Carpentry',             label: 'Carpentry' },
  { value: 'Joinery',               label: 'Joinery' },
  { value: 'Electrical',            label: 'Electricals' },
  { value: 'Plumbing',              label: 'Plumbing' },
  { value: 'Gas work/Plumbing',     label: 'Gas work/Plumbing' },
  { value: 'Plastering',            label: 'Plastering' },
  { value: 'Skimming /Painting',    label: 'Skimming /Painting' },
  { value: 'Painting & Decorating', label: 'Painting & Decorating' },
  { value: 'Tiling',                label: 'Tiling' },
  { value: 'Roofing',               label: 'Roofing' },
  { value: 'Kitchen Fitting',       label: 'Kitchen Fitting' },
  { value: 'Bathroom Fitting',      label: 'Bathrooms' },
  { value: 'Flooring',              label: 'Flooring' },
  { value: 'Bricklaying',           label: 'Bricklaying' },
  { value: 'HVAC',                  label: 'HVAC (Heating & Ventilation)' },
  { value: 'Groundworks',           label: 'Groundworks' },
  { value: 'Scaffolding',           label: 'Scaffolding' },
  { value: 'Glazing',               label: 'Glazing' },
  { value: 'Insulation',            label: 'Insulation' },
  { value: 'Materials',             label: 'Materials' },
];

export const RATE_TYPES = [
  { type: 'hourly', label: 'Hourly Rate',  unit: 'hour', priceLabel: 'Hourly Rate (£)' },
  { type: 'daily',  label: 'Day Rate',     unit: 'day',  priceLabel: 'Day Rate (£)' },
  { type: 'job',    label: 'Per Job',      unit: 'job',  priceLabel: 'Per Job Rate (£)' },
  { type: 'custom', label: 'Custom',       unit: null,   priceLabel: 'Unit Price (£)' },
];

export const DEFAULT_RATE_TYPE = 'job';

/** Standard rate for a category at a given rate type, or 0 if none is set. */
export function standardRate(category, rateType) {
  const rates = TRADE_RATES[category];
  if (!rates) return 0;
  return rates[rateType] || 0;
}

/** Human-readable rate hint, e.g. "£32/hr | £240/day". Empty when no rates. */
export function rateHint(category) {
  const rates = TRADE_RATES[category];
  if (!rates) return '';
  const parts = [];
  if (rates.hourly > 0) parts.push(`£${rates.hourly}/hr`);
  if (rates.daily > 0) parts.push(`£${rates.daily}/day`);
  if (rates.job > 0) parts.push(`£${rates.job}/job`);
  return parts.length ? `Standard rates: ${parts.join(' | ')}` : '';
}

/**
 * Sort into CATEGORY_ORDER, then group by category.
 * Returns [{ category, items }] with unknown categories last.
 */
export function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  const rank = (cat) => {
    const i = CATEGORY_ORDER.indexOf(cat);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...groups.entries()]
    .map(([category, catItems]) => ({ category, items: catItems }))
    .sort((a, b) => rank(a.category) - rank(b.category));
}
