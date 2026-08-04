import { useState } from 'react';

/**
 * Named sections (Kitchen, Bedroom 1, …).
 *
 * Sections are records with ids now, and items point at them by id. Renaming
 * one is a single update — previously items stored the section as a plain
 * string, so a rename meant rewriting every item's section field and missing
 * one silently orphaned it.
 */
export default function SectionManager({ sections, onAdd, onRename, onRemove }) {
  const [name, setName] = useState('');

  function handleAdd(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (sections.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    onAdd(trimmed);
    setName('');
  }

  async function handleRename(section) {
    const next = window.prompt('Rename section', section.name);
    if (next && next.trim() && next.trim() !== section.name) {
      await onRename(section.id, next.trim());
    }
  }

  return (
    <div className="card">
      <div className="card-title">Sections</div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Group line items by area (e.g. Kitchen, Bedroom 1). Items you add go into the
        section selected on the form below.
      </p>

      <form onSubmit={handleAdd} className="btn-row" style={{ marginBottom: 12 }}>
        <input
          placeholder="e.g. Kitchen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <button className="btn btn-secondary">Add Section</button>
      </form>

      {sections.length === 0 ? (
        <p className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>No sections yet.</p>
      ) : (
        <div className="btn-row">
          {sections.map((section) => (
            <span key={section.id} className="badge badge-grey" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 10px' }}>
              {section.name}
              <button className="close-x" style={{ fontSize: 16 }} title="Rename" onClick={() => handleRename(section)}>✎</button>
              <button className="close-x" style={{ fontSize: 18 }} title="Remove" onClick={() => onRemove(section.id)}>&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
