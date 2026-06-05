import styles from './PersonCard.module.css';

export default function PersonCard({ person, onClick }) {
  const initials = person.name
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <article className={styles.card} onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}>

      <div className={styles.topBar}>
        <span className={styles.glyph}>✦</span>
        <span className={styles.line} />
        <span className={styles.glyph}>✦</span>
      </div>

      <div className={styles.avatar}>
        <span className={styles.avatarInitials}>{initials}</span>
        <div className={styles.avatarRing} />
      </div>

      <h3 className={styles.name}>{person.name}</h3>

      {person.context && (
        <p className={styles.context}>{person.context}</p>
      )}

      {person.linkedPlace && (
        <p className={styles.place}>
          <span className={styles.placePin}>📍</span>
          {person.linkedPlace}
        </p>
      )}

      <div className={styles.contacts}>
        {person.instagram && (
          <span className={styles.contact} title="Instagram">
            <span>📸</span>
          </span>
        )}
        {person.phone && (
          <span className={styles.contact} title="Phone">
            <span>📱</span>
          </span>
        )}
      </div>

      <div className={styles.bottomBar}>
        <span className={styles.glyph}>✦</span>
        <span className={styles.diamond}>◆</span>
        <span className={styles.glyph}>✦</span>
      </div>

    </article>
  );
}
