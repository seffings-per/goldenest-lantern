import { useState, useEffect } from 'react';
import { TRIP_VIBES } from '../../lib/constants';
import { generateItinerary, swapSuggestion } from '../../lib/itinerary';
import styles from './TripForm.module.css';

const EMPTY_TRIP = {
  label: '',
  startDate: '',
  endDate: '',
  vibe: '',
  notes: '',
  itinerary: [],
  status: 'upcoming',
  log: [],
};

export default function TripForm({ initial = {}, places = [], onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_TRIP, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // Rebuild day list when date range changes
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;
    const start = new Date(form.startDate);
    const end   = new Date(form.endDate);
    if (end < start) return;
    const days = [];
    const cur  = new Date(start);
    let dayNum = 1;
    while (cur <= end) {
      const iso = cur.toISOString().split('T')[0];
      const existing = form.itinerary.find(d => d.date === iso);
      days.push(existing || { day: dayNum, date: iso, slots: [] });
      cur.setDate(cur.getDate() + 1);
      dayNum++;
    }
    setForm(f => ({ ...f, itinerary: days }));
  }, [form.startDate, form.endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Slot helpers ──────────────────────────────────────────
  const addSlot = (dayIdx) => {
    setForm(f => ({
      ...f,
      itinerary: f.itinerary.map((d, i) =>
        i === dayIdx ? { ...d, slots: [...d.slots, { placeId:'', placeName:'', notes:'', time:'', suggested: false }] } : d
      )
    }));
  };

  const updateSlot = (dayIdx, slotIdx, field, val) => {
    setForm(f => ({
      ...f,
      itinerary: f.itinerary.map((d, di) =>
        di !== dayIdx ? d : {
          ...d,
          slots: d.slots.map((s, si) => si === slotIdx ? { ...s, [field]: val } : s)
        }
      )
    }));
  };

  const removeSlot = (dayIdx, slotIdx) => {
    setForm(f => ({
      ...f,
      itinerary: f.itinerary.map((d, di) =>
        di !== dayIdx ? d : { ...d, slots: d.slots.filter((_, si) => si !== slotIdx) }
      )
    }));
  };

  // Selecting a place manually clears the suggested flag
  const selectPlace = (dayIdx, slotIdx, placeId) => {
    const place = places.find(p => p.id === placeId);
    setForm(f => ({
      ...f,
      itinerary: f.itinerary.map((d, di) =>
        di !== dayIdx ? d : {
          ...d,
          slots: d.slots.map((s, si) =>
            si !== slotIdx ? s : {
              ...s,
              placeId,
              placeName: placeId === '__custom__' ? s.placeName : (place?.name || ''),
              suggested: false,
            }
          )
        }
      )
    }));
  };

  // ── Itinerary suggestion ──────────────────────────────────
  const handleSuggest = () => {
    setForm(f => ({ ...f, itinerary: generateItinerary(places, f) }));
  };

  const handleSwap = (dayIdx, slotIdx) => {
    setForm(f => swapSuggestion(places, f, dayIdx, slotIdx));
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.label.trim()) { setError('A trip name is required.'); return; }
    if (!form.startDate)    { setError('A start date is required.'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const isEdit  = !!initial.id;
  const fmtDate = (d) => d
    ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
    : '';

  const hasDays = form.itinerary.length > 0;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <div className={styles.headerText}><span>🌙</span>
            <h2 className={styles.title}>{isEdit ? 'Edit Trip' : 'Plan a Trip'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>

          <Sec label="The Journey" glyph="✦">
            <Field label="Trip Name *">
              <input className="form-input" value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder="e.g. Spring NOLA 2025, Southern Decadence…" autoFocus />
            </Field>
            <div className={styles.row2}>
              <Field label="Start Date">
                <input className="form-input" type="date" value={form.startDate}
                  onChange={e => set('startDate', e.target.value)} />
              </Field>
              <Field label="End Date">
                <input className="form-input" type="date" value={form.endDate}
                  onChange={e => set('endDate', e.target.value)} />
              </Field>
            </div>
          </Sec>

          <Sec label="The Vibe" glyph="☽">
            <div className={styles.vibeGrid}>
              {TRIP_VIBES.map(v => (
                <button key={v} type="button"
                  className={`${styles.vibeBtn} ${form.vibe === v ? styles.vibeBtnOn : ''}`}
                  onClick={() => set('vibe', form.vibe === v ? '' : v)}>
                  {v}
                </button>
              ))}
            </div>
            <Field label="Notes">
              <textarea className="form-textarea" value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="What are you hoping for this trip? Anything to plan around?"
                rows={2} />
            </Field>
          </Sec>

          {hasDays && (
            <Sec label="Day by Day" glyph="🔮">

              {/* ── Suggest button ── */}
              {places.length > 0 && (
                <button type="button" className={styles.suggestBtn} onClick={handleSuggest}>
                  <span className={styles.suggestGlyph}>✨</span>
                  Suggest Itinerary
                  <span className={styles.suggestHint}>fills empty slots · keeps your picks</span>
                </button>
              )}

              {form.itinerary.map((day, di) => (
                <div key={day.date} className={styles.dayBlock}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayNum}>Day {day.day}</span>
                    <span className={styles.dayDate}>{fmtDate(day.date)}</span>
                  </div>

                  {day.slots.map((slot, si) => (
                    <div key={si} className={`${styles.slot} ${slot.suggested ? styles.slotSuggested : ''}`}>
                      {slot.suggested && (
                        <div className={styles.suggestedBadge}>✦ suggested — swap or keep</div>
                      )}
                      <div className={styles.slotRow}>
                        <input className={`form-input ${styles.slotTime}`}
                          value={slot.time}
                          onChange={e => updateSlot(di, si, 'time', e.target.value)}
                          placeholder="Time" />
                        <select className={`form-select ${styles.slotPlace}`}
                          value={slot.placeId}
                          onChange={e => selectPlace(di, si, e.target.value)}>
                          <option value="">— Pick a place —</option>
                          {places.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="__custom__">+ Custom / unlisted</option>
                        </select>
                        {slot.suggested && (
                          <button type="button" className={styles.swapBtn}
                            title="Try a different place"
                            onClick={() => handleSwap(di, si)}>
                            🔄
                          </button>
                        )}
                        <button className={styles.removeSlot}
                          onClick={() => removeSlot(di, si)}>✕</button>
                      </div>
                      {slot.placeId === '__custom__' && (
                        <input className="form-input"
                          value={slot.placeName}
                          onChange={e => updateSlot(di, si, 'placeName', e.target.value)}
                          placeholder="Place name" style={{ marginTop:'0.4rem' }} />
                      )}
                      <input className="form-input"
                        value={slot.notes}
                        onChange={e => updateSlot(di, si, 'notes', e.target.value)}
                        placeholder="Notes for this stop…"
                        style={{ marginTop:'0.4rem' }} />
                    </div>
                  ))}

                  <button className={styles.addSlot} onClick={() => addSlot(di)}>
                    + Add Stop
                  </button>
                </div>
              ))}
            </Sec>
          )}

        </div>

        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.footer}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? '✦ Saving…' : isEdit ? '✦ Save Changes' : '✦ Plan Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sec({ label, glyph, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.secHeader}>
        <span className={styles.secGlyph}>{glyph}</span>
        <span className={styles.secLabel}>{label}</span>
        <span className={styles.secLine} />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
