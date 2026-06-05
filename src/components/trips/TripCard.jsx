import styles from './TripCard.module.css';

export default function TripCard({ trip, onClick }) {
  const fmtDate = (d) => d
    ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })
    : '';

  const totalStops = trip.itinerary?.reduce((acc, d) => acc + (d.slots?.length || 0), 0) || 0;
  const isCompleted = trip.status === 'completed';
  const isUpcoming  = !isCompleted;

  return (
    <article className={`${styles.card} ${isCompleted ? styles.completed : styles.upcoming}`}
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}>

      <div className={styles.topBar}>
        <span className={styles.glyph}>✦</span>
        <span className={styles.line} />
        <span className={styles.glyph}>✦</span>
      </div>

      <div className={styles.statusBadge}>
        {isUpcoming ? '🌙 Upcoming' : '⭐ Completed'}
      </div>

      <h3 className={styles.name}>{trip.label}</h3>

      {(trip.startDate || trip.endDate) && (
        <p className={styles.dates}>
          {fmtDate(trip.startDate)}
          {trip.endDate && trip.endDate !== trip.startDate && ` — ${fmtDate(trip.endDate)}`}
        </p>
      )}

      {trip.vibe && <p className={styles.vibe}>✦ {trip.vibe}</p>}

      {totalStops > 0 && (
        <p className={styles.stops}>
          {trip.itinerary?.length} day{trip.itinerary?.length !== 1 ? 's' : ''} · {totalStops} stop{totalStops !== 1 ? 's' : ''}
        </p>
      )}

      {trip.notes && <p className={styles.notes}>{trip.notes}</p>}

      <div className={styles.bottomBar}>
        <span className={styles.glyph}>✦</span>
        <span className={styles.diamond}>◆</span>
        <span className={styles.glyph}>✦</span>
      </div>

    </article>
  );
}
