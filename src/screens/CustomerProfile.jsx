import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomer, updateCustomer, listActivity } from '../lib/customers.js';
import { listDocuments, createDocument } from '../lib/documents.js';
import { errorMessage } from '../lib/pb.js';
import { money } from '../lib/money.js';
import { padNumber, formatDate } from '../lib/format.js';
import { DOC_TYPE_LIST } from '../documents/docTypes.js';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * Customer profile — the hub the CRM revolves around.
 *
 * Everything for one customer in one place: their details, every document
 * raised for them, and the activity trail.
 */
export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [customerRecord, docs, acts] = await Promise.all([
        getCustomer(id),
        listDocuments({ customer: id, perPage: 100 }),
        listActivity(id),
      ]);
      setCustomer(customerRecord);
      setDocuments(docs.items);
      setActivity(acts.items);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load this customer.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!customer) return <div className="error-banner">{error || 'Customer not found.'}</div>;

  async function handleNewDocument(type) {
    setBusy(true);
    try {
      const doc = await createDocument({
        type,
        customer: customer.id,
        site_address: customer.address,
        site_postcode: customer.postcode,
      });
      navigate(`/document/${doc.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not create the document.'));
      setBusy(false);
    }
  }

  const won = documents.filter((d) => d.type === 'estimate' && d.status === 'accepted');
  const outstanding = documents.filter((d) => d.type === 'invoice' && d.status !== 'paid');

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{customer.name}</div>
          <div className="page-sub">
            {customer.ref} · <Link to="/customers">All customers</Link>
          </div>
        </div>
        <div className="btn-row">
          {DOC_TYPE_LIST.map((config) => (
            <button
              key={config.type}
              className={config.type === 'estimate' ? 'btn btn-primary' : 'btn btn-secondary'}
              disabled={busy}
              onClick={() => handleNewDocument(config.type)}
            >
              New {config.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-label">Won Work</div>
          <div className="stat-value">{money(won.reduce((s, d) => s + (Number(d.total) || 0), 0))}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Outstanding Invoices</div>
          <div className="stat-value">{money(outstanding.reduce((s, d) => s + (Number(d.amount_due) || 0), 0))}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Documents</div>
          <div className="stat-value">{documents.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Details</div>
        {editing ? (
          <CustomerForm
            customer={customer}
            onCancel={() => setEditing(false)}
            onSave={async (data) => {
              await updateCustomer(customer.id, data);
              setEditing(false);
              load();
            }}
          />
        ) : (
          <>
            <div className="grid grid-2">
              <Detail label="Phone" value={customer.phone} />
              <Detail label="Email" value={customer.email} />
              <Detail label="Address" value={customer.address} />
              <Detail label="Postcode" value={customer.postcode} />
            </div>
            {customer.notes && <Detail label="Notes" value={customer.notes} />}
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>
              Edit
            </button>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Documents</div>
        {documents.length === 0 ? (
          <div className="empty">Nothing raised for this customer yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/document/${doc.id}`)}>
                    <td style={{ textTransform: 'capitalize' }}>{doc.type}</td>
                    <td>#{padNumber(doc.number)}</td>
                    <td>{formatDate(doc.issued_at)}</td>
                    <td><StatusBadge status={doc.status} /></td>
                    <td className="text-right">{money(doc.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Activity</div>
        {activity.length === 0 ? (
          <div className="empty">No activity recorded.</div>
        ) : (
          <ul style={{ listStyle: 'none', fontSize: 14 }}>
            {activity.map((entry) => (
              <li key={entry.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="muted" style={{ fontSize: 12 }}>{formatDate(entry.created)}</span>
                <br />
                {entry.summary || entry.kind}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Detail({ label, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div>{value || <span className="muted">—</span>}</div>
    </div>
  );
}

function CustomerForm({ customer, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    postcode: customer.postcode || '',
    notes: customer.notes || '',
  });
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    await onSave(form);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="e-name">Name</label>
          <input id="e-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="e-phone">Phone</label>
          <input id="e-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="e-email">Email</label>
          <input id="e-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="e-postcode">Postcode</label>
          <input id="e-postcode" value={form.postcode} onChange={(e) => set('postcode', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="e-address">Address</label>
        <input id="e-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="e-notes">Notes</label>
        <textarea id="e-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
