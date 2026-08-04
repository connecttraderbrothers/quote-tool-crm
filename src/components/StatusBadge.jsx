import { DOC_STATUS } from '../documents/docTypes.js';

export default function StatusBadge({ status }) {
  const meta = DOC_STATUS[status] || { label: status || 'Unknown', tone: 'grey' };
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}
