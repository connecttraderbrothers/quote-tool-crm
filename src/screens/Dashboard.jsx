import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listDocuments } from '../lib/documents.js';
import { listCustomers } from '../lib/customers.js';
import { errorMessage } from '../lib/pb.js';
import { money } from '../lib/money.js';
import { padNumber, formatDate } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: '', recent: [], stats: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [estimates, invoices, customers, recent] = await Promise.all([
          listDocuments({ type: 'estimate', perPage: 200 }),
          listDocuments({ type: 'invoice', perPage: 200 }),
          listCustomers({ perPage: 1 }),
          listDocuments({ perPage: 8 }),
        ]);

        const awaiting = estimates.items.filter((d) => d.status === 'sent');
        const won = estimates.items.filter((d) => d.status === 'accepted');
        const unpaid = invoices.items.filter((d) => d.status !== 'paid' && d.status !== 'draft');

        if (!cancelled) {
          setState({
            loading: false,
            error: '',
            recent: recent.items,
            stats: {
              awaitingCount: awaiting.length,
              awaitingValue: awaiting.reduce((s, d) => s + (Number(d.total) || 0), 0),
              wonValue: won.reduce((s, d) => s + (Number(d.total) || 0), 0),
              outstanding: unpaid.reduce((s, d) => s + (Number(d.amount_due) || 0), 0),
              customerCount: customers.totalItems,
            },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: errorMessage(err, 'Could not load the dashboard.') }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return <div className="spinner">Loading…</div>;

  const { stats } = state;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Where the business stands today</div>
        </div>
        <Link className="btn btn-primary" to="/customers">New Job</Link>
      </div>

      {state.error && <div className="error-banner">{state.error}</div>}

      {stats && (
        <div className="grid grid-3" style={{ marginBottom: 20 }}>
          <Link to="/pipeline" className="stat">
            <div className="stat-label">Awaiting Reply</div>
            <div className="stat-value">{money(stats.awaitingValue)}</div>
            <div className="muted" style={{ fontSize: 13 }}>{stats.awaitingCount} estimates out</div>
          </Link>
          <div className="stat">
            <div className="stat-label">Won Work</div>
            <div className="stat-value">{money(stats.wonValue)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Outstanding Invoices</div>
            <div className="stat-value">{money(stats.outstanding)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Customers</div>
            <div className="stat-value">{stats.customerCount}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Recent Documents</div>
        {state.recent.length === 0 ? (
          <div className="empty">
            Nothing yet. <Link to="/customers">Add a customer</Link> to raise your first estimate.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.recent.map((doc) => (
                  <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/document/${doc.id}`)}>
                    <td style={{ textTransform: 'capitalize' }}>{doc.type}</td>
                    <td>#{padNumber(doc.number)}</td>
                    <td>{doc.expand?.customer?.name || '—'}</td>
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
    </>
  );
}
