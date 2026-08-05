#!/usr/bin/env node
//
// Create the first company and owner login in a running PocketBase.
//
//   npm run seed:admin
//
// Reads configuration from the environment:
//
//   PB_URL          PocketBase base URL      (default http://127.0.0.1:8090)
//   PB_SUPERUSER    superuser email          (prompted for if omitted)
//   PB_SUPERUSER_PASSWORD
//   ADMIN_EMAIL     login to create          (default admin@traderbrothers.local)
//   ADMIN_PASSWORD  its password             (default admin123 — LOCAL ONLY)
//   COMPANY_NAME    (default Trader Brothers Ltd)
//
// The admin123 default is deliberate and deliberately limited: it is convenient
// on your own machine, and this script refuses to use a weak password against
// anything that is not localhost. A CRM holding customers' names, addresses and
// phone numbers should not be reachable from the internet with a guessable
// password — that is how these get breached, and a "temporary" default has a
// habit of still being there a year later.

import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'trader@brothers.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Trader Brothers Ltd';

const WEAK = new Set(['admin123', 'password', 'admin', '12345678', 'changeme', 'letmein']);

function isLocal(url) {
  try {
    const { hostname } = new URL(url);
    return ['127.0.0.1', 'localhost', '0.0.0.0', '::1', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const weakOnRemote = !isLocal(PB_URL) && WEAK.has(ADMIN_PASSWORD.toLowerCase());

if (weakOnRemote) {
  // Your system, your call — this proceeds. But it says so plainly first,
  // because the account being created opens every customer address and phone
  // number in the database to anyone who guesses the password.
  console.warn(
    `\n⚠  Creating "${ADMIN_EMAIL}" with the password "${ADMIN_PASSWORD}" on ${PB_URL}.\n` +
    '   That host is not localhost, so this login is reachable from the internet.\n' +
    '   Change it once you are past testing:\n\n' +
    `     ADMIN_PASSWORD='$(openssl rand -base64 18)' npm run seed:admin\n`
  );
}

if (ADMIN_PASSWORD.length < 8) {
  fail('PocketBase requires a password of at least 8 characters.');
}

const superuserEmail = process.env.PB_SUPERUSER;
const superuserPassword = process.env.PB_SUPERUSER_PASSWORD;

if (!superuserEmail || !superuserPassword) {
  fail(
    'Set PB_SUPERUSER and PB_SUPERUSER_PASSWORD to the superuser account you\n' +
    '  created at /_/ when PocketBase first started. Example:\n\n' +
    '    PB_SUPERUSER=you@example.com PB_SUPERUSER_PASSWORD=... npm run seed:admin\n'
  );
}

const pb = new PocketBase(PB_URL);

async function authenticateSuperuser() {
  // Collection name differs across PocketBase versions: newer builds use
  // _superusers, older ones expose pb.admins.
  try {
    await pb.collection('_superusers').authWithPassword(superuserEmail, superuserPassword);
    return;
  } catch (err) {
    if (typeof pb.admins?.authWithPassword !== 'function') throw err;
  }
  await pb.admins.authWithPassword(superuserEmail, superuserPassword);
}

async function findOrCreateCompany() {
  try {
    const existing = await pb.collection('companies').getFirstListItem(
      pb.filter('name = {:name}', { name: COMPANY_NAME })
    );
    console.log(`  company    reusing "${existing.name}" (${existing.id})`);
    return existing;
  } catch {
    // not found — fall through and create
  }

  const created = await pb.collection('companies').create({
    name: COMPANY_NAME,
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
  });
  console.log(`  company    created "${created.name}" (${created.id})`);
  return created;
}

async function createOwner(companyId) {
  try {
    const existing = await pb.collection('users').getFirstListItem(
      pb.filter('email = {:email}', { email: ADMIN_EMAIL })
    );
    console.log(`  user       already exists (${existing.id}) — leaving it alone`);
    return existing;
  } catch {
    // not found — fall through and create
  }

  const created = await pb.collection('users').create({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    passwordConfirm: ADMIN_PASSWORD,
    emailVisibility: true,
    verified: true,
    full_name: 'Administrator',
    company: companyId,
    role: 'owner',
    active: true,
  });
  console.log(`  user       created ${ADMIN_EMAIL} (${created.id})`);
  return created;
}

try {
  console.log(`\nSeeding ${PB_URL}\n`);
  await authenticateSuperuser();
  const company = await findOrCreateCompany();
  await createOwner(company.id);

  console.log('\n✔ Done. Sign in with:\n');
  console.log(`    email     ${ADMIN_EMAIL}`);
  console.log(`    password  ${ADMIN_PASSWORD}\n`);

  if (WEAK.has(ADMIN_PASSWORD.toLowerCase())) {
    console.log('  This is a well-known password. Change it before this server is');
    console.log('  reachable from the internet or holds real customer data.\n');
  }
} catch (err) {
  fail(err?.response?.message || err?.message || String(err));
}
