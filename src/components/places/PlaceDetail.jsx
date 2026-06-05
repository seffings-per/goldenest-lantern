import { CATEGORIES, BEST_FOR, STATUS_META } from '../../lib/constants';
import styles from './PlaceDetail.module.css';

export default function PlaceDetail({ place, onEdit, onDelete, onClose }) {
  const status = STATUS_META[place.status] || STATUS_META.want_to_try;
  const cats = CATEGORIES.filter(c => (place.categories || []).includes(c.id));

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header} style={{ '--status-color': status.color }}>
          <div className={styles.headerGlow} />
          <div className={styles.headerContent}>
            <div className={styles.statusRow}>
              <span className={styles.statusIcon}>{status.icon}</span>
              <span className={styles.statusLabel}>{status.label}</span>
            </div>
            <h2 className={styles.name}>{place.name}</h2>
            {place.neighborhood && (
              <p className={styles.neighborhood}>◆ {place.neighborhood}</p>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Categories */}
          {cats.length > 0 && (
            <div className={styles.section}>
              <SectionLabel>Categories</SectionLabel>
              <div className={styles.catList}>
                {cats.map(c => (
                  <span key={c.id} className={styles.catChip}>
                    {c.icon} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best for */}
          {place.bestFor?.length > 0 && (
            <div className={styles.section}>
              <SectionLabel>Best For</SectionLabel>
              <div className={styles.pillList}>
                {place.bestFor.map(b => (
                  <span key={b} className={styles.pill}>{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <div className={styles.section}>
              <SectionLabel>Notes & Vibes</SectionLabel>
              <p className={styles.notes}>{place.notes}</p>
            </div>
          )}

          {/* Who told us */}
          {place.recommendedBy && (
            <div className={styles.section}>
              <SectionLabel>Who Told Us</SectionLabel>
              <div className={styles.recBlock}>
                <span className={styles.recEye}>👁️</span>
                <div>
                  <p className={styles.recBy}>{place.recommendedBy}</p>
                  {place.recommendationContext && (
                    <p className={styles.recContext}>"{place.recommendationContext}"</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Address / website / hours */}
          {(place.address || place.website || place.hours) && (
            <div className={styles.section}>
              <SectionLabel>Find It</SectionLabel>
              {place.address && <p className={styles.address}>📍 {place.address}</p>}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.website}
                >
                  🔗 {place.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {place.hours && (
                <div className={styles.hours}>
                  <p className={styles.hoursLabel}>🕐 Hours</p>
                  {place.hours.split('\n').map((line, i) => (
                    <p key={i} className={styles.hourLine}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Visit history */}
          {place.visitHistory?.length > 0 && (
            <div className={styles.section}>
              <SectionLabel>Visit History</SectionLabel>
              <div className={styles.historyList}>
                {[...place.visitHistory].reverse().map((v, i) => (
                  <div key={i} className={styles.historyItem}>
                    <span className={styles.historyTrip}>{v.tripLabel || v.date}</span>
                    {v.rating && (
                      <span className={styles.historyRating}>
                        {STATUS_META[v.rating]?.icon} {STATUS_META[v.rating]?.label}
                      </span>
                    )}
                    {v.notes && <p className={styles.historyNotes}>{v.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className={styles.footer}>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm(`Remove "${place.name}" from your lantern?`)) onDelete();
            }}
          >
            ✕ Remove
          </button>
          <button className="btn btn-gold" onClick={onEdit}>
            ✦ Edit Place
          </button>
        </div>

      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-heading)',
      fontSize: '0.65rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--gold)',
      marginBottom: '0.5rem',
    }}>
      {children}
    </p>
  );
}
