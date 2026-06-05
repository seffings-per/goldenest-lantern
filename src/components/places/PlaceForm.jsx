import { useState, useEffect, useRef, Component } from 'react';
import { CATEGORIES, BEST_FOR, NEIGHBORHOODS, STATUS_META } from '../../lib/constants';
import { EMPTY_PLACE } from '../../lib/placeSchema';
import { loadMaps, MAPS_KEY_SET } from '../../lib/googlePlaces';
import styles from './PlaceForm.module.css';

class SearchErrorBoundary extends Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() { return this.state.crashed ? null : this.props.children; }
}

export default function PlaceForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_PLACE, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleArray = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('A name is required.'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const isEdit = !!initial.id;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerIcon}>📍</span>
            <h2 className={styles.title}>{isEdit ? 'Edit Place' : 'Add a Place'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          {/* ── Section: The Place ── */}
          <Section label="The Place" glyph="✦">
            {MAPS_KEY_SET && (
              <SearchErrorBoundary>
                <GooglePlaceSearch onSelect={data => {
                  if (data.name)    set('name',    data.name);
                  if (data.address) set('address', data.address);
                  if (data.website) set('website', data.website);
                  if (data.hours)   set('hours',   data.hours);
                }} />
              </SearchErrorBoundary>
            )}
            <div className={styles.row}>
              <FormField label="Name *">
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Cure, Bacchanal, Café Du Monde"
                  autoFocus
                />
              </FormField>
            </div>
            <div className={styles.row2}>
              <FormField label="Address">
                <input
                  className="form-input"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Street address"
                />
              </FormField>
              <FormField label="Neighborhood">
                <select
                  className="form-select"
                  value={form.neighborhood}
                  onChange={e => set('neighborhood', e.target.value)}
                >
                  <option value="">— Select —</option>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Website">
              <input
                className="form-input"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </FormField>
            <FormField label="Hours">
              <textarea
                className="form-textarea"
                value={form.hours}
                onChange={e => set('hours', e.target.value)}
                placeholder={"Monday: 11:00 AM – 11:00 PM\nTuesday: …"}
                rows={3}
              />
            </FormField>
          </Section>

          {/* ── Section: Status ── */}
          <Section label="Our Relationship" glyph="☽">
            <div className={styles.statusGrid}>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.statusBtn} ${form.status === key ? styles.statusActive : ''}`}
                  style={form.status === key ? { '--status-color': meta.color } : {}}
                  onClick={() => set('status', key)}
                >
                  <span className={styles.statusIcon}>{meta.icon}</span>
                  <span className={styles.statusLabel}>{meta.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Section: Categories ── */}
          <Section label="Categories" glyph="🔮">
            <div className={styles.checkGrid}>
              {CATEGORIES.map(cat => (
                <label
                  key={cat.id}
                  className={`${styles.checkItem} ${form.categories.includes(cat.id) ? styles.checkItemOn : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={form.categories.includes(cat.id)}
                    onChange={() => toggleArray('categories', cat.id)}
                  />
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Section: Best For ── */}
          <Section label="Best For" glyph="✦">
            <div className={styles.pillGrid}>
              {BEST_FOR.map(b => (
                <button
                  key={b}
                  type="button"
                  className={`${styles.pill} ${form.bestFor.includes(b) ? styles.pillOn : ''}`}
                  onClick={() => toggleArray('bestFor', b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Section: Who Told Us ── */}
          <Section label="Who Told Us" glyph="👁️">
            <div className={styles.row2}>
              <FormField label="Recommended By">
                <input
                  className="form-input"
                  value={form.recommendedBy}
                  onChange={e => set('recommendedBy', e.target.value)}
                  placeholder="Person, handle, publication…"
                />
              </FormField>
              <FormField label="What They Said">
                <input
                  className="form-input"
                  value={form.recommendationContext}
                  onChange={e => set('recommendationContext', e.target.value)}
                  placeholder='e.g. "Get the frozen daiquiri"'
                />
              </FormField>
            </div>
          </Section>

          {/* ── Section: Notes ── */}
          <Section label="Notes & Vibes" glyph="🕯️">
            <FormField label="Notes">
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Vibes, what to order, when to go, who to ask for…"
                rows={4}
              />
            </FormField>
          </Section>

        </div>

        {/* ── Footer ── */}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.footer}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? '✦ Saving…' : isEdit ? '✦ Save Changes' : '✦ Add Place'}
          </button>
        </div>

      </div>
    </div>
  );
}

function GooglePlaceSearch({ onSelect }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mapsReady, setMapsReady]   = useState(false);
  const [filled, setFilled]         = useState(false);
  const mapNodeRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadMaps().then(() => setMapsReady(true)).catch(() => {});
  }, []);

  const search = (text) => {
    setQuery(text);
    setFilled(false);
    clearTimeout(debounceRef.current);
    if (!mapsReady || text.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      const svc = new window.google.maps.places.AutocompleteService();
      svc.getPlacePredictions({
        input: text,
        types: ['establishment'],
        location: new window.google.maps.LatLng(29.9511, -90.0715),
        radius: 40000,
      }, (preds, status) => {
        setSuggestions(status === 'OK' ? preds.slice(0, 6) : []);
      });
    }, 300);
  };

  const pick = (placeId) => {
    const svc = new window.google.maps.places.PlacesService(mapNodeRef.current);
    svc.getDetails({
      placeId,
      fields: ['name', 'formatted_address', 'website', 'opening_hours'],
    }, (place, status) => {
      if (status !== 'OK') return;
      onSelect({
        name:    place.name || '',
        address: place.formatted_address || '',
        website: place.website || '',
        hours:   place.opening_hours?.weekday_text?.join('\n') || '',
      });
      setSuggestions([]);
      setQuery('');
      setFilled(true);
    });
  };

  return (
    <div className={styles.googleSearch}>
      <div ref={mapNodeRef} style={{ display: 'none' }} />
      <label className="form-label">Search Google Places</label>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={`form-input ${styles.searchInput}`}
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Type a place name to auto-fill address, hours & website…"
        />
        {filled && <span className={styles.searchFilled}>✓ Filled</span>}
      </div>
      {suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map(s => (
            <li key={s.place_id} className={styles.suggestion} onMouseDown={() => pick(s.place_id)}>
              <span className={styles.sugMain}>{s.structured_formatting.main_text}</span>
              <span className={styles.sugSub}>{s.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ label, glyph, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionGlyph}>{glyph}</span>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.sectionLine} />
      </div>
      {children}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className={styles.formField}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
