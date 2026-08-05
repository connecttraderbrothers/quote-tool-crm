// Fixture data for demo mode (VITE_DEMO=true).
//
// This exists so the whole CRM can be clicked through with no PocketBase, no
// VM and no login — useful before the backend is deployed, and for working on
// screens without a server running.
//
// It is development-only: demoClient.js refuses to load unless the Vite dev
// server is running, so this can never be what a production build talks to.

const today = new Date();
const daysAgo = (n) => new Date(today.getTime() - n * 86400000).toISOString();

export const DEMO_COMPANY = {
  id: 'demo_company_01',
  collectionName: 'companies',
  name: 'TRADER BROTHERS LTD',
  address_line1: '8 Craigour Terrace',
  address_line2: 'Edinburgh, EH17 7PB',
  phone: '07931 810557',
  email: 'traderbrotherslimited@gmail.com',
  vat_registered: true,
  vat_rate: 0.2,
  logo_url: 'https://github.com/infotraderbrothers-lgtm/traderbrothers-assets-logo/blob/main/Trader%20Brothers.png?raw=true',
  bank_account_name: 'Trader Brothers Ltd',
  bank_sort_code: '04-06-05',
  bank_account_number: '24049254',
  default_deposit_percent: 30,
  default_payment_due_days: 30,
};

// The built-in administrator account.
//
// These credentials are compiled into the bundle, so anyone who can load the
// app can sign in with them. That is fine here and only here: standalone mode
// never connects to PocketBase, so the only thing behind this login is the
// sample data below. Never reuse these against a real backend — see
// scripts/seed-admin.mjs for creating a genuine account.
export const ADMIN_EMAIL = 'trader@brothers.local';
export const ADMIN_PASSWORD = 'admin123';

export const DEMO_USER = {
  id: 'demo_user_0001',
  collectionName: 'users',
  email: ADMIN_EMAIL,
  full_name: 'Administrator',
  company: DEMO_COMPANY.id,
  role: 'owner', // full access — every screen and action is unlocked
  active: true,
  expand: { company: DEMO_COMPANY },
};

export const DEMO_CUSTOMERS = [
  {
    id: 'demo_cust_0001', collectionName: 'customers', company: DEMO_COMPANY.id,
    ref: 'JOHSMI4821', name: 'John Smith', phone: '07700 900123',
    email: 'john.smith@example.co.uk', address: '14 Blackford Avenue',
    postcode: 'EH9 2PE', notes: 'Repeat customer. Prefers calls after 5pm.',
    archived: false, created: daysAgo(120),
  },
  {
    id: 'demo_cust_0002', collectionName: 'customers', company: DEMO_COMPANY.id,
    ref: 'SARWIL3092', name: 'Sarah Wilson', phone: '07700 900456',
    email: 'sarah.wilson@example.co.uk', address: '3 Morningside Road',
    postcode: 'EH10 4DD', notes: '', archived: false, created: daysAgo(64),
  },
  {
    id: 'demo_cust_0003', collectionName: 'customers', company: DEMO_COMPANY.id,
    ref: 'DAVBRO7715', name: 'David Brown', phone: '07700 900789',
    email: 'd.brown@example.co.uk', address: '27 Leith Walk',
    postcode: 'EH6 8NX', notes: 'Landlord — three flats in the same block.',
    archived: false, created: daysAgo(31),
  },
  {
    id: 'demo_cust_0004', collectionName: 'customers', company: DEMO_COMPANY.id,
    ref: 'EMMTAY5183', name: 'Emma Taylor', phone: '07700 900321',
    email: 'emma.taylor@example.co.uk', address: '9 Corstorphine Road',
    postcode: 'EH12 6DD', notes: '', archived: false, created: daysAgo(9),
  },
];

export const DEMO_DOCUMENTS = [
  // Won estimate, with a deposit invoice raised against it
  {
    id: 'demo_doc_00001', collectionName: 'documents', company: DEMO_COMPANY.id,
    customer: 'demo_cust_0001', type: 'estimate', number: 1, status: 'accepted',
    remove_vat: false, vat_rate: 0.2, deposit_percent: 30,
    site_address: '14 Blackford Avenue', site_postcode: 'EH9 2PE',
    notes: 'Full bathroom refit including tiling and new suite.',
    subtotal: 4160, vat_amount: 832, total: 4992, amount_due: 4992,
    issued_at: daysAgo(45), sent_at: daysAgo(45), responded_at: daysAgo(38),
    expires_at: daysAgo(15), created: daysAgo(45), public_token: 'demotoken0001',
  },
  {
    id: 'demo_doc_00002', collectionName: 'documents', company: DEMO_COMPANY.id,
    customer: 'demo_cust_0001', type: 'invoice', number: 1, status: 'paid',
    parent_document: 'demo_doc_00001', is_deposit: true, deposit_percent: 30,
    remove_vat: true, deduction: 0, payment_due_days: 30,
    site_address: '14 Blackford Avenue', site_postcode: 'EH9 2PE',
    notes: 'Deposit invoice for Estimate 0001.',
    subtotal: 1497.6, vat_amount: 0, total: 1497.6, amount_due: 1497.6,
    issued_at: daysAgo(38), sent_at: daysAgo(38), created: daysAgo(38),
    public_token: 'demotoken0002',
  },
  // Out with the customer, awaiting a reply
  {
    id: 'demo_doc_00003', collectionName: 'documents', company: DEMO_COMPANY.id,
    customer: 'demo_cust_0002', type: 'estimate', number: 2, status: 'sent',
    remove_vat: false, vat_rate: 0.2, deposit_percent: 30,
    site_address: '3 Morningside Road', site_postcode: 'EH10 4DD',
    notes: '', subtotal: 2740, vat_amount: 548, total: 3288, amount_due: 3288,
    issued_at: daysAgo(12), sent_at: daysAgo(12), expires_at: daysAgo(-18),
    created: daysAgo(12), public_token: 'demotoken0003',
  },
  // Lost
  {
    id: 'demo_doc_00004', collectionName: 'documents', company: DEMO_COMPANY.id,
    customer: 'demo_cust_0003', type: 'estimate', number: 3, status: 'declined',
    remove_vat: false, vat_rate: 0.2, deposit_percent: 30,
    site_address: '27 Leith Walk', site_postcode: 'EH6 8NX',
    notes: 'Went with another contractor on price.',
    subtotal: 8900, vat_amount: 1780, total: 10680, amount_due: 10680,
    issued_at: daysAgo(28), sent_at: daysAgo(28), responded_at: daysAgo(20),
    created: daysAgo(28), public_token: 'demotoken0004',
  },
  // Chased, no answer
  {
    id: 'demo_doc_00005', collectionName: 'documents', company: DEMO_COMPANY.id,
    customer: 'demo_cust_0003', type: 'estimate', number: 4, status: 'no_reply',
    remove_vat: false, vat_rate: 0.2, deposit_percent: 30,
    site_address: '27 Leith Walk', site_postcode: 'EH6 8NX',
    notes: '', subtotal: 1450, vat_amount: 290, total: 1740, amount_due: 1740,
    issued_at: daysAgo(52), sent_at: daysAgo(52), created: daysAgo(52),
    public_token: 'demotoken0005',
  },
  // Draft, still being written
  {
    id: 'demo_doc_00006', collectionName: 'documents', company: DEMO_COMPANY.id,
    customer: 'demo_cust_0004', type: 'estimate', number: 5, status: 'draft',
    remove_vat: false, vat_rate: 0.2, deposit_percent: 30,
    site_address: '9 Corstorphine Road', site_postcode: 'EH12 6DD',
    notes: '', subtotal: 1330, vat_amount: 266, total: 1596, amount_due: 1596,
    issued_at: daysAgo(2), created: daysAgo(2), public_token: 'demotoken0006',
  },
];

export const DEMO_SECTIONS = [
  { id: 'demo_sect_0001', collectionName: 'document_sections', document: 'demo_doc_00001', name: 'Bathroom', sort_order: 0 },
  { id: 'demo_sect_0002', collectionName: 'document_sections', document: 'demo_doc_00001', name: 'Hallway', sort_order: 1 },
  { id: 'demo_sect_0003', collectionName: 'document_sections', document: 'demo_doc_00006', name: 'Kitchen', sort_order: 0 },
];

export const DEMO_ITEMS = [
  // Estimate 0001 — bathroom refit
  { id: 'demo_item_0001', collectionName: 'document_items', document: 'demo_doc_00001', section: 'demo_sect_0001', category: 'Downtakings', description: 'Strip out existing bathroom suite and tiling', quantity: 2, unit: 'day', unit_price: 220, line_total: 440, sort_order: 0 },
  { id: 'demo_item_0002', collectionName: 'document_items', document: 'demo_doc_00001', section: 'demo_sect_0001', category: 'Plumbing', description: 'Install new bath, basin and WC', quantity: 1, unit: 'job', unit_price: 1200, line_total: 1200, sort_order: 1 },
  { id: 'demo_item_0003', collectionName: 'document_items', document: 'demo_doc_00001', section: 'demo_sect_0001', category: 'Tiling', description: 'Full height tiling to bath and basin walls', quantity: 3, unit: 'day', unit_price: 250, line_total: 750, sort_order: 2 },
  { id: 'demo_item_0004', collectionName: 'document_items', document: 'demo_doc_00001', section: 'demo_sect_0001', category: 'Electrical', description: 'Move shaver socket and fit extractor fan', quantity: 1, unit: 'job', unit_price: 320, line_total: 320, sort_order: 3 },
  { id: 'demo_item_0005', collectionName: 'document_items', document: 'demo_doc_00001', section: 'demo_sect_0002', category: 'Painting & Decorating', description: 'Make good and repaint hallway after works', quantity: 2, unit: 'day', unit_price: 220, line_total: 440, sort_order: 4 },
  { id: 'demo_item_0006', collectionName: 'document_items', document: 'demo_doc_00001', section: null, category: 'Materials', description: 'Bathroom suite, tiles and sundries', quantity: 1, unit: 'job', unit_price: 1010, line_total: 1010, sort_order: 5 },

  // Deposit invoice
  { id: 'demo_item_0007', collectionName: 'document_items', document: 'demo_doc_00002', section: null, category: 'Deposit', description: '30% deposit against Estimate 0001', quantity: 1, unit: 'job', unit_price: 1497.6, line_total: 1497.6, sort_order: 0 },

  // Estimate 0002
  { id: 'demo_item_0008', collectionName: 'document_items', document: 'demo_doc_00003', section: null, category: 'Joinery', description: 'Fit new internal doors throughout (6 no.)', quantity: 4, unit: 'day', unit_price: 240, line_total: 960, sort_order: 0 },
  { id: 'demo_item_0009', collectionName: 'document_items', document: 'demo_doc_00003', section: null, category: 'Flooring', description: 'Lay engineered oak flooring to living room', quantity: 3, unit: 'day', unit_price: 220, line_total: 660, sort_order: 1 },
  { id: 'demo_item_0010', collectionName: 'document_items', document: 'demo_doc_00003', section: null, category: 'Materials', description: 'Doors, ironmongery and flooring', quantity: 1, unit: 'job', unit_price: 1120, line_total: 1120, sort_order: 2 },

  // Estimate 0003 (lost)
  { id: 'demo_item_0011', collectionName: 'document_items', document: 'demo_doc_00004', section: null, category: 'Roofing', description: 'Strip and re-slate main roof', quantity: 20, unit: 'day', unit_price: 260, line_total: 5200, sort_order: 0 },
  { id: 'demo_item_0012', collectionName: 'document_items', document: 'demo_doc_00004', section: null, category: 'Scaffolding', description: 'Scaffold hire and erection, 6 weeks', quantity: 1, unit: 'job', unit_price: 2400, line_total: 2400, sort_order: 1 },
  { id: 'demo_item_0013', collectionName: 'document_items', document: 'demo_doc_00004', section: null, category: 'Materials', description: 'Slates, battens, felt and leadwork', quantity: 1, unit: 'job', unit_price: 1300, line_total: 1300, sort_order: 2 },

  // Estimate 0004 (no reply)
  { id: 'demo_item_0014', collectionName: 'document_items', document: 'demo_doc_00005', section: null, category: 'Plastering', description: 'Skim two bedroom ceilings', quantity: 3, unit: 'day', unit_price: 240, line_total: 720, sort_order: 0 },
  { id: 'demo_item_0015', collectionName: 'document_items', document: 'demo_doc_00005', section: null, category: 'Painting & Decorating', description: 'Paint bedrooms after skimming', quantity: 2, unit: 'day', unit_price: 220, line_total: 440, sort_order: 1 },
  { id: 'demo_item_0016', collectionName: 'document_items', document: 'demo_doc_00005', section: null, category: 'Materials', description: 'Plaster, paint and sundries', quantity: 1, unit: 'job', unit_price: 290, line_total: 290, sort_order: 2 },

  // Estimate 0005 (draft)
  { id: 'demo_item_0017', collectionName: 'document_items', document: 'demo_doc_00006', section: 'demo_sect_0003', category: 'Kitchen Fitting', description: 'Fit supplied kitchen units and worktop', quantity: 1, unit: 'job', unit_price: 1000, line_total: 1000, sort_order: 0 },
  { id: 'demo_item_0018', collectionName: 'document_items', document: 'demo_doc_00006', section: 'demo_sect_0003', category: 'Plumbing', description: 'Reconnect sink and dishwasher', quantity: 1, unit: 'job', unit_price: 200, line_total: 200, sort_order: 1 },
  { id: 'demo_item_0019', collectionName: 'document_items', document: 'demo_doc_00006', section: 'demo_sect_0003', category: 'Electrical', description: 'Fit under-cabinet lighting', quantity: 1, unit: 'job', unit_price: 130, line_total: 130, sort_order: 2 },
];

export const DEMO_ACTIVITY = [
  { id: 'demo_act_00001', collectionName: 'activity', company: DEMO_COMPANY.id, customer: 'demo_cust_0001', document: 'demo_doc_00002', kind: 'payment_received', summary: 'Deposit payment received — £1,497.60', created: daysAgo(36) },
  { id: 'demo_act_00002', collectionName: 'activity', company: DEMO_COMPANY.id, customer: 'demo_cust_0001', document: 'demo_doc_00002', kind: 'created', summary: 'Deposit invoice raised from Estimate 0001', created: daysAgo(38) },
  { id: 'demo_act_00003', collectionName: 'activity', company: DEMO_COMPANY.id, customer: 'demo_cust_0001', document: 'demo_doc_00001', kind: 'status_changed', summary: 'Status changed from sent to accepted', created: daysAgo(38) },
  { id: 'demo_act_00004', collectionName: 'activity', company: DEMO_COMPANY.id, customer: 'demo_cust_0001', document: 'demo_doc_00001', kind: 'created', summary: 'estimate created', created: daysAgo(45) },
  { id: 'demo_act_00005', collectionName: 'activity', company: DEMO_COMPANY.id, customer: 'demo_cust_0002', document: 'demo_doc_00003', kind: 'status_changed', summary: 'Status changed from draft to sent', created: daysAgo(12) },
];

/** Fresh deep copy, so edits in one session don't leak into a page reload. */
export function seedStore() {
  const clone = (rows) => rows.map((row) => ({ ...row }));
  return {
    companies: clone([DEMO_COMPANY]),
    users: clone([DEMO_USER]),
    customers: clone(DEMO_CUSTOMERS),
    projects: [],
    documents: clone(DEMO_DOCUMENTS),
    document_sections: clone(DEMO_SECTIONS),
    document_items: clone(DEMO_ITEMS),
    activity: clone(DEMO_ACTIVITY),
    payments: [],
    people: [],
    document_counters: [
      { id: 'demo_ctr_0001', company: DEMO_COMPANY.id, type: 'estimate', last_number: 5 },
      { id: 'demo_ctr_0002', company: DEMO_COMPANY.id, type: 'invoice', last_number: 1 },
      { id: 'demo_ctr_0003', company: DEMO_COMPANY.id, type: 'statement', last_number: 0 },
    ],
  };
}
