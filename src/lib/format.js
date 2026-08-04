// Formatting helpers shared by the UI and the document templates.

/**
 * Escape text for interpolation into HTML.
 *
 * The legacy code interpolated descriptions straight into innerHTML and into
 * the PDF markup. A description containing " or < corrupted the row. Now that
 * documents are shared between users through a database, unescaped text is a
 * stored-XSS vector too, so every template interpolation goes through this.
 */
export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape, then turn newlines into <br> — for free-text notes blocks. */
export function escapeMultiline(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

/** 04 Aug 2026 */
export function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** 04/08/2026 */
export function formatDateShort(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB');
}

export function addDays(date, days) {
  const d = new Date(date instanceof Date ? date.getTime() : new Date(date).getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** 4-digit zero-padded document number, e.g. 42 -> "0042". */
export function padNumber(n) {
  return String(Number(n) || 0).padStart(4, '0');
}

/**
 * Customer reference, e.g. "JOHSMI4821".
 *
 * Unchanged in shape from the original, but the meaning is different now: this
 * runs ONCE when a customer record is created and the result is stored. The old
 * version regenerated a different random suffix on every keystroke, so the ID on
 * a saved PDF never matched anything.
 */
export function generateCustomerRef(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  if (parts.length >= 2) {
    const first = parts[0].substring(0, 3).toUpperCase();
    const last = parts[parts.length - 1].substring(0, 3).toUpperCase();
    return `${first}${last}${suffix}`;
  }
  return `${parts[0].substring(0, 6).toUpperCase()}${suffix}`;
}

/** Safe filename fragment: "John Smith" -> "John_Smith". */
export function sanitizeFilename(value) {
  return String(value || 'Client').replace(/[^a-z0-9]/gi, '_');
}
