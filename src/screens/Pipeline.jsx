import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDocuments, sumDocuments } from '../lib/documents.js';
import { errorMessage } from '../lib/pb.js';
import { money } from '../lib/money.js';
import { padNumber, formatDate } from '../lib/format.js';
import { PIPELINE_COLUMNS } from '../documents/docTypes.js';

/**
 * Estimate pipeline: awaiting reply / won / lost / no reply.
 *
 * This is the feature the localStorage-only app could not have had — it needs
 * estimates to outlive the browser tab that made them.
 */
export default function Pipeline() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listDocuments({
          type: 'estimate',
          status: ['sent', 'accepted', 'declined', 'no_reply', 'expired'],
          perPage: 200,
        });
        if (!cancelled) setEstimates(result.items);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load the pipeline.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Pipeline</div>
          <div className="page-sub">Estimates that have been sent to a customer</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="pipeline">
        {PIPELINE_COLUMNS.map((column) => {
          const columnDocs = estimates.filter((doc) => column.statuses.includes(doc.status));
          return (
            <div className="pipeline-col" key={column.key}>
              <div className="pipeline-col-head">
                <span className="pipeline-col-title">{column.title} ({columnDocs.length})</span>
                <span className="pipeline-col-sum">{money(sumDocuments(columnDocs))}</span>
              </div>

              {columnDocs.length === 0 ? (
                <p className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>Nothing here.</p>
              ) : (
                columnDocs.map((doc) => (
                  <div
                    className="pipeline-card"
                    key={doc.id}
                    onClick={() => navigate(`/document/${doc.id}`)}
                  >
                    <div className="pipeline-card-name">
                      {doc.expand?.customer?.name || 'Unknown customer'}
                    </div>
                    <div className="pipeline-card-meta">
                      <span>#{padNumber(doc.number)}</span>
                      <span>{money(doc.total)}</span>
                    </div>
                    <div className="pipeline-card-meta">
                      <span>Sent {formatDate(doc.sent_at || doc.issued_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
