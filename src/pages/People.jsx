import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getPeople, addPerson, updatePerson, deletePerson } from '../lib/db';
import PersonCard from '../components/people/PersonCard';
import PersonForm from '../components/people/PersonForm';
import styles from './People.module.css';

export default function People() {
  const { workspaceId } = useWorkspace();
  const [people, setPeople]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [viewing, setViewing]   = useState(null);
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    setPeople(await getPeople(workspaceId));
    setLoading(false);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const handleSave = async (form) => {
    if (editing) {
      await updatePerson(workspaceId, editing.id, form);
    } else {
      await addPerson(workspaceId, form);
    }
    await load();
  };

  const handleDelete = async () => {
    await deletePerson(workspaceId, viewing.id);
    setViewing(null);
    await load();
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.toLowerCase();
    return people.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.context?.toLowerCase().includes(q) ||
      p.linkedPlace?.toLowerCase().includes(q)
    );
  }, [people, search]);

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.pageTitle}>The Court</h1>
            <p className={styles.pageSub}>
              {people.length} {people.length === 1 ? 'person' : 'people'} in your circle
            </p>
          </div>
          <button className="btn btn-gold"
            onClick={() => { setEditing(null); setShowForm(true); }}>
            ✦ Add Person
          </button>
        </div>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>✦</span>
          <input className={styles.searchInput} value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, context, or place…" />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>
          <span>👁️</span><p>Gathering the court…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>👁️</span>
          {people.length === 0 ? (
            <>
              <p className={styles.emptyTitle}>The court awaits its first member.</p>
              <p className={styles.emptySub}>Add performers, locals, and friends you must see.</p>
              <button className="btn btn-gold" onClick={() => setShowForm(true)}>
                ✦ Add Someone
              </button>
            </>
          ) : (
            <>
              <p className={styles.emptyTitle}>No one matches your search.</p>
              <button className="btn btn-outline" onClick={() => setSearch('')}>Clear</button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((person, i) => (
            <div key={person.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className={styles.cardWrap}>
              <PersonCard person={person} onClick={() => setViewing(person)} />
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {viewing && !showForm && (
        <div className={styles.detailOverlay}
          onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailInitials}>
                  {viewing.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setViewing(null)}>✕</button>
            </div>

            <h2 className={styles.detailName}>{viewing.name}</h2>
            {viewing.context && <p className={styles.detailContext}>{viewing.context}</p>}

            <div className={styles.detailBody}>
              {viewing.linkedPlace && (
                <DetailRow icon="📍" label="Find Them">
                  {viewing.linkedPlace}
                </DetailRow>
              )}
              {viewing.instagram && (
                <DetailRow icon="📸" label="Instagram">
                  <a href={`https://instagram.com/${viewing.instagram.replace('@','')}`}
                    target="_blank" rel="noopener noreferrer"
                    className={styles.detailLink}>
                    {viewing.instagram.startsWith('@') ? viewing.instagram : `@${viewing.instagram}`}
                  </a>
                </DetailRow>
              )}
              {viewing.phone && (
                <DetailRow icon="📱" label="Phone">
                  <a href={`tel:${viewing.phone}`} className={styles.detailLink}>
                    {viewing.phone}
                  </a>
                </DetailRow>
              )}
              {viewing.notes && (
                <DetailRow icon="🕯️" label="Notes">
                  {viewing.notes}
                </DetailRow>
              )}
            </div>

            <div className={styles.detailFooter}>
              <button className="btn btn-danger"
                onClick={() => {
                  if (confirm(`Remove ${viewing.name} from the court?`)) handleDelete();
                }}>
                ✕ Remove
              </button>
              <button className="btn btn-gold"
                onClick={() => { setEditing(viewing); setShowForm(true); }}>
                ✦ Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <PersonForm
          initial={editing || {}}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

    </div>
  );
}

function DetailRow({ icon, label, children }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <p style={{
        fontFamily: 'var(--font-heading)', fontSize: '0.65rem',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--teal)', marginBottom: '0.2rem'
      }}>
        {icon} {label}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        {children}
      </p>
    </div>
  );
}
