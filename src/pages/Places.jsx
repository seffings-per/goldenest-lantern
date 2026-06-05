import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getPlaces, addPlace, updatePlace, deletePlace } from '../lib/db';
import { CATEGORIES, STATUS_META } from '../lib/constants';
import PlaceCard from '../components/places/PlaceCard';
import PlaceForm from '../components/places/PlaceForm';
import PlaceDetail from '../components/places/PlaceDetail';
import LanternIcon from '../components/LanternIcon';
import styles from './Places.module.css';

const ALL = 'all';

export default function Places() {
  const { workspaceId } = useWorkspace();
  const [places, setPlaces]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);   // place obj being edited
  const [viewing, setViewing]       = useState(null);   // place obj in detail view
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterCat, setFilterCat]   = useState(ALL);

  // ── Load ──────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const data = await getPlaces(workspaceId);
    setPlaces(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workspaceId]);

  // ── CRUD ──────────────────────────────────────────────────
  const handleAdd = async (form) => {
    await addPlace(workspaceId, form);
    await load();
  };

  const handleUpdate = async (form) => {
    await updatePlace(workspaceId, editing.id, form);
    await load();
    setViewing(null);
  };

  const handleDelete = async () => {
    await deletePlace(workspaceId, viewing.id);
    setViewing(null);
    await load();
  };

  // ── Filter + search ───────────────────────────────────────
  const filtered = useMemo(() => {
    let list = places;
    if (filterStatus !== ALL)
      list = list.filter(p => p.status === filterStatus);
    if (filterCat !== ALL)
      list = list.filter(p => (p.categories || []).includes(filterCat));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.neighborhood?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.recommendedBy?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [places, filterStatus, filterCat, search]);

  // ── Group by status for counts ────────────────────────────
  const counts = useMemo(() => {
    const c = {};
    for (const s of Object.keys(STATUS_META)) c[s] = 0;
    places.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, [places]);

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <div>
            <h1 className={styles.pageTitle}>The Map</h1>
            <p className={styles.pageSub}>
              {places.length} place{places.length !== 1 ? 's' : ''} in the lantern
            </p>
          </div>
          <button className="btn btn-gold" onClick={() => { setEditing(null); setShowForm(true); }}>
            ✦ Add Place
          </button>
        </div>

        {/* Status summary chips */}
        <div className={styles.statusSummary}>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <button
              key={key}
              className={`${styles.summaryChip} ${filterStatus === key ? styles.summaryChipActive : ''}`}
              style={{ '--chip-color': meta.color }}
              onClick={() => setFilterStatus(filterStatus === key ? ALL : key)}
            >
              {meta.icon} {meta.label}
              <span className={styles.summaryCount}>{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + category filter ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>✦</span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search places, neighborhoods, notes…"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <select
          className={`form-select ${styles.catFilter}`}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value={ALL}>All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.loading}>
          <LanternIcon className={styles.loadingLantern} />
          <p>Reading the cards…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔮</span>
          {places.length === 0 ? (
            <>
              <p className={styles.emptyTitle}>The lantern awaits its first light.</p>
              <p className={styles.emptySub}>Add your first NOLA place to begin.</p>
              <button className="btn btn-gold" onClick={() => setShowForm(true)}>✦ Add a Place</button>
            </>
          ) : (
            <>
              <p className={styles.emptyTitle}>No places match your search.</p>
              <button className="btn btn-outline" onClick={() => { setSearch(''); setFilterStatus(ALL); setFilterCat(ALL); }}>
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((place, i) => (
            <div key={place.id} style={{ animationDelay: `${i * 40}ms` }} className={styles.cardWrap}>
              <PlaceCard place={place} onClick={() => setViewing(place)} />
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <PlaceForm
          initial={editing || {}}
          onSave={editing ? handleUpdate : handleAdd}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {viewing && !showForm && (
        <PlaceDetail
          place={viewing}
          onEdit={() => { setEditing(viewing); setShowForm(true); }}
          onDelete={handleDelete}
          onClose={() => setViewing(null)}
        />
      )}

    </div>
  );
}
