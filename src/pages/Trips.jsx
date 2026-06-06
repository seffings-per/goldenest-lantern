import { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getTrips, addTrip, updateTrip, deleteTrip, getPlaces, updatePlace } from '../lib/db';
import { STATUS_META } from '../lib/constants';
import { generateItinerary, parseTime } from '../lib/itinerary';
import TripCard from '../components/trips/TripCard';
import TripForm from '../components/trips/TripForm';
import styles from './Trips.module.css';

export default function Trips() {
  const { workspaceId } = useWorkspace();
  const [trips,  setTrips]   = useState([]);
  const [places, setPlaces]  = useState([]);
  const [loading, setLoading]= useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [viewing,  setViewing]  = useState(null);
  // post-trip log state: { slotKey: { visited, rating, notes } }
  const [logState, setLogState] = useState({});

  const load = async () => {
    setLoading(true);
    const [t, p] = await Promise.all([getTrips(workspaceId), getPlaces(workspaceId)]);
    setTrips(t);
    setPlaces(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const handleSave = async (form) => {
    if (editing) await updateTrip(workspaceId, editing.id, form);
    else         await addTrip(workspaceId, form);
    await load();
  };

  const handleDelete = async () => {
    await deleteTrip(workspaceId, viewing.id);
    setViewing(null);
    await load();
  };

  const handleMarkComplete = async () => {
    await updateTrip(workspaceId, viewing.id, { status: 'completed' });
    await load();
    setViewing(trips.find(t => t.id === viewing.id) || null);
  };

  const handleSuggestDetail = async () => {
    const newItinerary = generateItinerary(places, viewing);
    setViewing(v => ({ ...v, itinerary: newItinerary }));
    await updateTrip(workspaceId, viewing.id, { itinerary: newItinerary });
    load();
  };

  // Save the post-trip log and optionally update place statuses
  const handleSaveLog = async () => {
    const logEntries = [];
    for (const [key, val] of Object.entries(logState)) {
      if (!val.visited) continue;
      const [dayIdx, slotIdx] = key.split('-').map(Number);
      const slot = viewing.itinerary?.[dayIdx]?.slots?.[slotIdx];
      if (!slot) continue;
      logEntries.push({
        placeId:   slot.placeId,
        placeName: slot.placeName || slot.placeId,
        date:      viewing.itinerary[dayIdx].date,
        rating:    val.rating || null,
        notes:     val.notes || '',
      });
      // Update the place's visitHistory if it's a known place
      if (slot.placeId && slot.placeId !== '__custom__') {
        const place = places.find(p => p.id === slot.placeId);
        if (place) {
          const entry = {
            tripId:    viewing.id,
            tripLabel: viewing.label,
            date:      viewing.itinerary[dayIdx].date,
            rating:    val.rating || null,
            notes:     val.notes || '',
          };
          const updated = [...(place.visitHistory || []), entry];
          await updatePlace(workspaceId, slot.placeId, { visitHistory: updated });
        }
      }
    }
    // Persist log to trip
    const existing = viewing.log || [];
    await updateTrip(workspaceId, viewing.id, { log: [...existing, ...logEntries], status: 'completed' });
    setLogState({});
    await load();
    setViewing(null);
  };

  const upcoming  = trips.filter(t => t.status !== 'completed');
  const completed = trips.filter(t => t.status === 'completed');

  const fmtDate = (d) => d
    ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
    : '';

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, mi] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(mi).padStart(2, '0')} ${ampm}`;
  };

  const placeName = (slot) =>
    slot.placeId && slot.placeId !== '__custom__'
      ? (places.find(p => p.id === slot.placeId)?.name || slot.placeName)
      : slot.placeName;

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.pageTitle}>The Journey</h1>
            <p className={styles.pageSub}>
              {upcoming.length} upcoming · {completed.length} completed
            </p>
          </div>
          <button className="btn btn-gold"
            onClick={() => { setEditing(null); setShowForm(true); }}>
            ✦ Plan Trip
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><span>🌙</span><p>Charting the course…</p></div>
      ) : trips.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🌙</span>
          <p className={styles.emptyTitle}>No journeys planned yet.</p>
          <p className={styles.emptySub}>Plan your first NOLA trip and let the lantern guide you.</p>
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>✦ Plan a Trip</button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span>🌙</span> Upcoming
              </h2>
              <div className={styles.grid}>
                {upcoming.map((trip, i) => (
                  <div key={trip.id} style={{ animationDelay:`${i*40}ms` }} className={styles.cardWrap}>
                    <TripCard trip={trip} onClick={() => setViewing(trip)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span>⭐</span> Past Journeys
              </h2>
              <div className={styles.grid}>
                {completed.map((trip, i) => (
                  <div key={trip.id} style={{ animationDelay:`${i*40}ms` }} className={styles.cardWrap}>
                    <TripCard trip={trip} onClick={() => setViewing(trip)} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Trip Detail ── */}
      {viewing && !showForm && (
        <div className={styles.detailOverlay}
          onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div className={styles.detail}>

            <div className={styles.detailHeader}>
              <div>
                <span className={styles.detailStatus}>
                  {viewing.status === 'completed' ? '⭐ Completed' : '🌙 Upcoming'}
                </span>
                <h2 className={styles.detailName}>{viewing.label}</h2>
                {(viewing.startDate || viewing.endDate) && (
                  <p className={styles.detailDates}>
                    {fmtDate(viewing.startDate)}
                    {viewing.endDate && viewing.endDate !== viewing.startDate
                      && ` — ${fmtDate(viewing.endDate)}`}
                  </p>
                )}
                {viewing.vibe && <p className={styles.detailVibe}>✦ {viewing.vibe}</p>}
                {viewing.accommodation && (
                  <p className={styles.detailAccommodation}>
                    🏨 {viewing.accommodation}
                    {viewing.accommodationHood && ` · ${viewing.accommodationHood}`}
                  </p>
                )}
                {(viewing.arrivalTime || viewing.departureTime) && (
                  <p className={styles.detailTravelTimes}>
                    {viewing.arrivalTime && `→ Arriving ${fmtTime(viewing.arrivalTime)}`}
                    {viewing.arrivalTime && viewing.departureTime && ' · '}
                    {viewing.departureTime && `← Departing ${fmtTime(viewing.departureTime)}`}
                  </p>
                )}
              </div>
              <button className={styles.closeBtn} onClick={() => setViewing(null)}>✕</button>
            </div>

            <div className={styles.detailBody}>

              {/* Notes */}
              {viewing.notes && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Notes</p>
                  <p className={styles.detailNotes}>{viewing.notes}</p>
                </div>
              )}

              {/* Itinerary */}
              {viewing.itinerary?.some(d => d.slots?.length > 0) && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Itinerary</p>
                  {viewing.itinerary.filter(d => d.slots?.length > 0).map((day, di) => {
                    const isFirst = di === 0;
                    const isLast  = di === viewing.itinerary.filter(d => d.slots?.length > 0).length - 1;
                    return (
                    <div key={day.date} className={styles.detailDay}>
                      <p className={styles.detailDayTitle}>
                        Day {day.day} · {fmtDate(day.date)}
                      </p>
                      {isFirst && viewing.arrivalTime && (
                        <div className={styles.travelNote}>✈️ Arriving {fmtTime(viewing.arrivalTime)}</div>
                      )}
                      {[...day.slots].sort((a, b) => parseTime(a.time) - parseTime(b.time)).map((slot, si) => (
                        <div key={si} className={`${styles.detailSlot} ${slot.suggested ? styles.detailSlotSuggested : ''}`}>
                          {slot.time && <span className={styles.slotTime}>{slot.time}</span>}
                          <span className={styles.slotName}>{placeName(slot) || '—'}</span>
                          {slot.suggested && <span className={styles.slotSuggestedMark}>✦</span>}
                          {slot.notes && <span className={styles.slotNotes}>{slot.notes}</span>}
                        </div>
                      ))}
                      {isLast && viewing.departureTime && (
                        <div className={styles.travelNote}>✈️ Departing {fmtTime(viewing.departureTime)}</div>
                      )}
                    </div>
                  );})}
                </div>
              )}

              {/* Post-trip log (upcoming trips with itinerary) */}
              {viewing.status !== 'completed' && viewing.itinerary?.some(d => d.slots?.length > 0) && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Log This Trip</p>
                  <p className={styles.logIntro}>
                    Check off what you did and rate any new places you tried.
                  </p>
                  {viewing.itinerary.filter(d => d.slots?.length > 0).map((day, di) => (
                    <div key={day.date} className={styles.logDay}>
                      <p className={styles.logDayTitle}>Day {day.day} · {fmtDate(day.date)}</p>
                      {[...day.slots].sort((a, b) => parseTime(a.time) - parseTime(b.time)).map((slot, si) => {
                        const key = `${di}-${si}`;
                        const ls  = logState[key] || {};
                        return (
                          <div key={si} className={`${styles.logSlot} ${ls.visited ? styles.logSlotVisited : ''}`}>
                            <label className={styles.logCheck}>
                              <input type="checkbox" checked={!!ls.visited}
                                onChange={e => setLogState(prev => ({
                                  ...prev, [key]: { ...ls, visited: e.target.checked }
                                }))} />
                              <span>{placeName(slot) || '—'}</span>
                            </label>
                            {ls.visited && (
                              <div className={styles.logRateRow}>
                                {['loved','meh','never_again'].map(r => (
                                  <button key={r} type="button"
                                    className={`${styles.rateBtn} ${ls.rating === r ? styles.rateBtnOn : ''}`}
                                    onClick={() => setLogState(prev => ({
                                      ...prev, [key]: { ...ls, rating: ls.rating === r ? '' : r }
                                    }))}>
                                    {STATUS_META[r].icon} {STATUS_META[r].label}
                                  </button>
                                ))}
                                <input className={`form-input ${styles.logNotes}`}
                                  value={ls.notes || ''}
                                  onChange={e => setLogState(prev => ({
                                    ...prev, [key]: { ...ls, notes: e.target.value }
                                  }))}
                                  placeholder="Trip notes for this place…" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <button className="btn btn-gold" style={{ marginTop:'0.75rem', width:'100%' }}
                    onClick={handleSaveLog}>
                    ✦ Save Trip Log
                  </button>
                </div>
              )}

              {/* Past log */}
              {viewing.log?.length > 0 && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>What We Did</p>
                  {viewing.log.map((entry, i) => (
                    <div key={i} className={styles.logEntry}>
                      <span className={styles.logEntryName}>{entry.placeName}</span>
                      {entry.rating && (
                        <span className={styles.logEntryRating}>
                          {STATUS_META[entry.rating]?.icon} {STATUS_META[entry.rating]?.label}
                        </span>
                      )}
                      {entry.notes && <p className={styles.logEntryNotes}>{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className={styles.detailFooter}>
              <button className="btn btn-danger"
                onClick={() => { if(confirm('Delete this trip?')) handleDelete(); }}>
                ✕ Delete
              </button>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {viewing.status !== 'completed' && viewing.itinerary?.length > 0 && places.length > 0 && (
                  <button className="btn btn-outline" onClick={handleSuggestDetail}>
                    ✨ Suggest
                  </button>
                )}
                {viewing.status !== 'completed' && (
                  <button className="btn btn-outline" onClick={handleMarkComplete}>
                    ⭐ Mark Complete
                  </button>
                )}
                <button className="btn btn-gold"
                  onClick={() => { setEditing(viewing); setShowForm(true); }}>
                  ✦ Edit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <TripForm
          initial={editing || {}}
          places={places}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

    </div>
  );
}
