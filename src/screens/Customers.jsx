import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCustomers, createCustomer } from '../lib/customers.js';
import { errorMessage } from '../lib/pb.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  async function load(term = search) {
    setLoading(true);
    try {
      const result = await listCustomers({ search: term });
      setCustomers(result.items);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load customers.'));
    } finally {
      setLoading(false);
    }
  }

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => load(search), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-sub">{customers.length} shown</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>New Customer</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <input
          placeholder="Search by name, reference, email, phone or postcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : customers.length === 0 ? (
        <div className="card"><div className="empty">No customers yet.</div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reference</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Postcode</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td><Link to={`/customers/${customer.id}`}>{customer.name}</Link></td>
                    <td className="muted">{customer.ref}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.postcode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adding && (
        <NewCustomerModal
          onClose={() => setAdding(false)}
          onCreated={() => { setAdding(false); load(); }}
        />
      )}
    </>
  );
}

function NewCustomerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', postcode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return setError('Please enter a name.');
    setBusy(true);
    setError('');
    try {
      await createCustomer({ ...form, name: form.name.trim() });
      onCreated();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the customer.'));
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <strong>New Customer</strong>
          <button type="button" className="close-x" onClick={onClose}>&times;</button>
        </div>

        <div style={{ padding: 18 }}>
          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="c-name">Name *</label>
            <input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus />
            <div className="field-hint">A customer reference is generated once and kept for good.</div>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="c-phone">Phone</label>
              <input id="c-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="c-address">Address</label>
            <input id="c-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="c-postcode">Postcode</label>
            <input id="c-postcode" value={form.postcode} onChange={(e) => set('postcode', e.target.value)} />
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Create Customer'}</button>
        </div>
      </form>
    </div>
  );
}
