import { pb } from './pb.js';
import { currentCompanyId } from './auth.js';
import { generateCustomerRef } from './format.js';

const COLLECTION = 'customers';

/**
 * List customers, optionally filtered by a search term.
 *
 * The company filter is belt-and-braces: the API rules already scope every
 * query to the caller's company, but filtering client-side too means a
 * misconfigured rule shows nothing rather than someone else's data.
 */
export async function listCustomers({ search = '', includeArchived = false, page = 1, perPage = 50 } = {}) {
  const company = currentCompanyId();
  const filters = [pb.filter('company = {:company}', { company })];

  if (!includeArchived) filters.push('archived != true');
  if (search.trim()) {
    filters.push(
      pb.filter('(name ~ {:q} || ref ~ {:q} || email ~ {:q} || phone ~ {:q} || postcode ~ {:q})', {
        q: search.trim(),
      })
    );
  }

  return pb.collection(COLLECTION).getList(page, perPage, {
    filter: filters.join(' && '),
    sort: 'name',
  });
}

export async function getCustomer(id) {
  return pb.collection(COLLECTION).getOne(id);
}

/**
 * Create a customer.
 *
 * The reference is generated ONCE here and stored. The legacy app regenerated a
 * different random suffix on every keystroke of the name field, so the ID
 * printed on a saved PDF matched nothing afterwards. A unique index on
 * (company, ref) means a collision is rejected rather than silently accepted,
 * so we retry a handful of times before giving up.
 */
export async function createCustomer(data) {
  const company = currentCompanyId();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await pb.collection(COLLECTION).create({
        ...data,
        company,
        ref: data.ref || generateCustomerRef(data.name),
      });
    } catch (err) {
      const isRefCollision = err?.response?.data?.ref && !data.ref;
      if (!isRefCollision) throw err;
      // fall through and try a fresh random suffix
    }
  }
  throw new Error('Could not allocate a unique customer reference. Please try again.');
}

export async function updateCustomer(id, data) {
  return pb.collection(COLLECTION).update(id, data);
}

/** Archive rather than delete — documents reference customers. */
export async function archiveCustomer(id) {
  return pb.collection(COLLECTION).update(id, { archived: true });
}

export async function listActivity(customerId, limit = 25) {
  return pb.collection('activity').getList(1, limit, {
    filter: pb.filter('customer = {:customer}', { customer: customerId }),
    sort: '-created',
  });
}
