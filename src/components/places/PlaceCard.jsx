import { CATEGORIES, STATUS_META } from '../../lib/constants';
import styles from './PlaceCard.module.css';

export default function PlaceCard({ place, onClick }) {
  const status = STATUS_META[place.status] || STATUS_META.want_to_try;
  const cats = CATEGORIES.filter(c => (place.categories || []).includes(c.id));
  const lastVisit = place.visitHistory?.at(-1);

  return (
    <article
      className={styles.card}
      onClick={onClick}
      style={{ '--status-color': status.color }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div className={styles.topBar}>
        <span className={styles.cornerGlyph}>✦</span>
        <span className={styles.topLine} />
        <span className={styles.cornerGlyph}>✦</span>
      </div>

      <div className={styles.statusBadge}>
        <span className={styles.statusIcon}>{status.icon}</span>
        <span className={styles.statusLabel}>{status.label}</span>
      </div>

      <h3 className={styles.name}>{place.name}</h3>

      {place.neighborhood && (
        <p className={styles.neighborhood}>
          <span className={styles.neighborhoodDot}>◆</span>
          {place.neighborhood}
        </p>
      )}

      {cats.length > 0 && (
        <div className={styles.cats}>
          {cats.slice(0, 5).map(c => (
            <span key={c.id} className={styles.catIcon} title={c.label}>{c.icon}</span>
          ))}
          {cats.length > 5 && (
            <span className={styles.catMore}>+{cats.length - 5}</span>
          )}
        </div>
      )}

      {place.notes && (
        <p className={styles.notes}>{place.notes}</p>
      )}

      {place.recommendedBy && (
        <p className={styles.rec}>
          <span className={styles.recIcon}>👁️</span>
          via {place.recommendedBy}
        </p>
      )}

      {lastVisit && (
        <p className={styles.lastVisit}>
          Last visited: {lastVisit.tripLabel || lastVisit.date}
        </p>
      )}

      <div className={styles.bottomBar}>
        <span className={styles.cornerGlyph}>✦</span>
        <span className={styles.bottomDiamond}>◆</span>
        <span className={styles.cornerGlyph}>✦</span>
      </div>
    </article>
  );
}
