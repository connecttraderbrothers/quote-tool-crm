// An in-memory stand-in for the PocketBase client — standalone mode.
//
// Active when VITE_DEMO=true, including in production builds, so the app can be
// deployed to a static host like Vercel with no backend at all. The shim sits at
// the `pb` seam, so everything above it — every screen, the document template,
// the totals maths, the pipeline — is the real code running against fake
// records. Nothing in the app branches on "am I in standalone mode".
//
// WHAT THIS IS AND ISN'T:
//   - It is a complete, working demonstration of the CRM with a real login.
//   - It is NOT secure, and does not pretend to be. The admin credentials are
//     compiled into the JavaScript bundle, so anyone who loads the page can
//     read them and sign in. That is acceptable precisely because there is
//     nothing here to steal: this client never contacts PocketBase, so the only
//     data behind the login is the fixture data in demoData.js.
//   - The moment you point the app at a real PocketBase (VITE_PB_URL, with
//     VITE_DEMO unset), this file is not loaded at all and the built-in account
//     does not exist. Real accounts come from scripts/seed-admin.mjs.
//
// It also mirrors the parts of pocketbase/pb_hooks/main.pb.js that the UI would
// otherwise appear to get wrong — deriving line_total, recomputing document
// totals, and allocating numbers. That is a deliberate duplication for
// standalone mode only; the server remains the real authority.

import { seedStore, DEMO_USER, ADMIN_EMAIL, ADMIN_PASSWORD } from './demoData.js';

const SESSION_KEY = 'omega_demo_session';

const DEFAULT_VAT_RATE = 0.2;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const newId = () => `demo_${Math.random().toString(36).slice(2, 12)}`;

const store = seedStore();

// ── Filter evaluation ───────────────────────────────────────────────────────
//
// Understands the subset of PocketBase filter syntax this app actually
// generates: `a = 'x'`, `a != true`, `a ~ 'x'`, joined by && and ||, with
// parenthesised groups and dotted relation paths.

function resolvePath(record, path) {
  const parts = path.split('.');
  let value = record;
  for (const part of parts) {
    if (value == null) return null;
    // Follow a relation id into the related collection.
    if (typeof value === 'object' && !(part in value)) return null;
    const next = value[part];
    if (typeof next === 'string' && parts.indexOf(part) < parts.length - 1) {
      value = findRelated(next);
    } else {
      value = next;
    }
  }
  return value;
}

function findRelated(id) {
  for (const rows of Object.values(store)) {
    const hit = rows.find((row) => row.id === id);
    if (hit) return hit;
  }
  return null;
}

function parseLiteral(raw) {
  const token = raw.trim();
  if (token === 'true') return true;
  if (token === 'false') return false;
  if (token === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  return token.replace(/^['"]|['"]$/g, '');
}

function evaluateComparison(record, expression) {
  const match = expression.trim().match(/^([\w.]+)\s*(!=|=|~)\s*(.+)$/);
  if (!match) return true; // unrecognised clause — don't filter anything out
  const [, path, op, rawValue] = match;
  const expected = parseLiteral(rawValue);
  const actual = resolvePath(record, path);

  if (op === '=') return actual === expected || String(actual ?? '') === String(expected ?? '');
  if (op === '!=') return !(actual === expected || String(actual ?? '') === String(expected ?? ''));
  if (op === '~') return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
  return true;
}

/** Split on a top-level operator, ignoring anything inside parentheses. */
function splitTopLevel(expression, operator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth === 0 && expression.startsWith(operator, i)) {
      parts.push(current);
      current = '';
      i += operator.length - 1;
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function matchesFilter(record, filter) {
  if (!filter || !filter.trim()) return true;
  const expression = filter.trim();

  const andParts = splitTopLevel(expression, '&&');
  if (andParts.length > 1) return andParts.every((part) => matchesFilter(record, part));

  const orParts = splitTopLevel(expression, '||');
  if (orParts.length > 1) return orParts.some((part) => matchesFilter(record, part));

  if (expression.startsWith('(') && expression.endsWith(')')) {
    return matchesFilter(record, expression.slice(1, -1));
  }

  return evaluateComparison(record, expression);
}

// ── Sorting and expanding ───────────────────────────────────────────────────

function applySort(rows, sort) {
  if (!sort) return rows;
  const fields = sort.split(',').map((field) => field.trim()).filter(Boolean);
  return [...rows].sort((a, b) => {
    for (const field of fields) {
      const descending = field.startsWith('-');
      const key = descending ? field.slice(1) : field;
      const left = a[key];
      const right = b[key];
      if (left === right) continue;
      const comparison = left > right || left == null ? 1 : -1;
      return descending ? -comparison : comparison;
    }
    return 0;
  });
}

function applyExpand(record, expand) {
  if (!expand) return record;
  const expanded = {};
  for (const key of expand.split(',').map((k) => k.trim())) {
    const relatedId = record[key];
    if (relatedId) {
      const related = findRelated(relatedId);
      if (related) expanded[key] = related;
    }
  }
  return { ...record, expand: expanded };
}

// ── Hook mirror: derived money and numbering ────────────────────────────────

function recomputeDocumentTotals(documentId) {
  const doc = store.documents.find((d) => d.id === documentId);
  if (!doc) return;

  const items = store.document_items.filter((item) => item.document === documentId);
  const subtotal = round2(
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
  );
  const rate = Number(doc.vat_rate) || DEFAULT_VAT_RATE;
  const vat = doc.remove_vat ? 0 : round2(subtotal * rate);
  const total = round2(subtotal + vat);
  const deduction = doc.type === 'invoice' ? round2(Number(doc.deduction) || 0) : 0;

  doc.subtotal = subtotal;
  doc.vat_amount = vat;
  doc.total = total;
  doc.amount_due = round2(total - deduction);
}

function allocateNumber(companyId, type) {
  let counter = store.document_counters.find((c) => c.company === companyId && c.type === type);
  if (!counter) {
    counter = { id: newId(), company: companyId, type, last_number: 0 };
    store.document_counters.push(counter);
  }
  counter.last_number += 1;
  return counter.last_number;
}

// ── Collection API ──────────────────────────────────────────────────────────

function collection(name) {
  const rows = () => (store[name] ||= []);

  return {
    async getList(page = 1, perPage = 30, options = {}) {
      const filtered = rows().filter((row) => matchesFilter(row, options.filter));
      const sorted = applySort(filtered, options.sort);
      const start = (page - 1) * perPage;
      const items = sorted.slice(start, start + perPage).map((row) => applyExpand(row, options.expand));
      return {
        page, perPage, totalItems: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
        items,
      };
    },

    async getFullList(options = {}) {
      const filtered = rows().filter((row) => matchesFilter(row, options.filter));
      return applySort(filtered, options.sort).map((row) => applyExpand(row, options.expand));
    },

    async getOne(id, options = {}) {
      const record = rows().find((row) => row.id === id);
      if (!record) throw new Error(`Demo record not found: ${name}/${id}`);
      return applyExpand(record, options.expand);
    },

    async getFirstListItem(filter, options = {}) {
      const record = rows().find((row) => matchesFilter(row, filter));
      if (!record) throw new Error(`Demo record not found in ${name}`);
      return applyExpand(record, options.expand);
    },

    async create(data) {
      const record = { ...data, id: newId(), collectionName: name, created: new Date().toISOString() };

      if (name === 'documents') {
        // Mirrors the server hook: the number is allocated, not accepted.
        record.number = allocateNumber(record.company, record.type);
        record.status ||= 'draft';
        record.issued_at ||= new Date().toISOString();
        record.public_token ||= newId();
        record.subtotal = 0; record.vat_amount = 0; record.total = 0; record.amount_due = 0;
      }
      if (name === 'document_items') {
        record.line_total = round2((Number(record.quantity) || 0) * (Number(record.unit_price) || 0));
      }

      rows().push(record);
      if (name === 'document_items') recomputeDocumentTotals(record.document);
      return { ...record };
    },

    async update(id, data) {
      const record = rows().find((row) => row.id === id);
      if (!record) throw new Error(`Demo record not found: ${name}/${id}`);
      Object.assign(record, data);

      if (name === 'document_items') {
        record.line_total = round2((Number(record.quantity) || 0) * (Number(record.unit_price) || 0));
        recomputeDocumentTotals(record.document);
      }
      if (name === 'documents') recomputeDocumentTotals(record.id);
      return { ...record };
    },

    async delete(id) {
      const list = rows();
      const index = list.findIndex((row) => row.id === id);
      if (index === -1) return true;
      const [removed] = list.splice(index, 1);
      if (name === 'document_items') recomputeDocumentTotals(removed.document);
      return true;
    },

    async authWithPassword(email, password) {
      const emailMatches = String(email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if (!emailMatches || password !== ADMIN_PASSWORD) {
        const error = new Error('Failed to authenticate.');
        error.response = { data: { identity: { message: 'Invalid email or password.' } } };
        throw error;
      }
      authStore.save('demo-token', DEMO_USER);
      return { token: 'demo-token', record: DEMO_USER };
    },

    async authRefresh() {
      if (!authStore.record) throw new Error('Not signed in.');
      return { token: 'demo-token', record: DEMO_USER };
    },
  };
}

// ── Auth store ──────────────────────────────────────────────────────────────
//
// Starts signed out so the real login screen is shown, then persists to
// sessionStorage so a page refresh doesn't kick you back out.

const listeners = new Set();

function restoreSession() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) ? DEMO_USER : null;
  } catch {
    return null; // storage blocked (private mode) — just start signed out
  }
}

const authStore = {
  token: '',
  record: restoreSession(),
  get isValid() { return !!this.record; },
  save(token, record) {
    this.token = token;
    this.record = record;
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    listeners.forEach((fn) => fn(token, record));
  },
  clear() {
    this.token = '';
    this.record = null;
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    listeners.forEach((fn) => fn('', null));
  },
  onChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};

authStore.token = authStore.record ? 'demo-token' : '';

// ── Client ──────────────────────────────────────────────────────────────────

export const demoClient = {
  authStore,
  collection,
  autoCancellation() {},

  /** Mirrors pb.filter(): substitutes bound params and quotes strings. */
  filter(raw, params = {}) {
    return raw.replace(/\{:(\w+)\}/g, (_match, key) => {
      const value = params[key];
      if (value == null) return "''";
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return `'${String(value).replace(/'/g, "\\'")}'`;
    });
  },

  files: {
    getUrl: () => '',
    getToken: async () => 'demo-file-token',
  },

  async send(path) {
    // There is no Gotenberg in demo mode; pdf.js handles this by opening the
    // browser's own print dialog instead.
    throw new Error(`Demo mode has no backend for ${path}.`);
  },
};

export const IS_DEMO = true;
