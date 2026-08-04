import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listDocuments } from '../lib/documents.js';
import { errorMessage } from '../lib/pb.js';
import { money } from '../lib/money.js';
import { padNumber, formatDate } from '../lib/format.js';
import { docType, statusesFor } from '../documents/docTypes.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DocumentList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const config = docType(type);

  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await listDocuments({ type, status: status || undefined, search, perPage: 100 });
        if (!cancelled) setDocuments(result.items);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load documents.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [type, status, search]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{config.plural}</div>
          <div className="page-sub">{documents.length} shown</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="grid grid-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="search">Search by customer</label>
            <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {statusesFor(type).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : documents.length === 0 ? (
        <div className="card"><div className="empty">No {config.plural.toLowerCase()} found.</div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/document/${doc.id}`)}>
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
        </div>
      )}
    </>
  );
}
