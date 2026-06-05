import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { getPlaces, getPeople, getTrips } from '../lib/db';
import { CATEGORIES, STATUS_META } from '../lib/constants';
import LanternIcon from '../components/LanternIcon';
import styles from './OracleBoard.module.css';

export default function OracleBoard() {
  const { workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [people, setPeople] = useState([]);
  const [trips,  setTrips]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawnCard, setDrawnCard] = useState(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    async function load() {
      const [pl, pe, tr] = await Promise.all([
        getPlaces(workspaceId),
        getPeople(workspaceId),
        getTrips(workspaceId),
      ]);
      setPlaces(pl);
      setPeople(pe);
      setTrips(tr);
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  // ── Derived data ──────────────────────────────────────────────
  const mustGo    = useMemo(() => places.filter(p => p.status === 'must_go'), [places]);
  const loved     = useMemo(() => places.filter(p => p.status === 'loved'), [places]);
  const wantToTry = useMemo(() => places.filter(p => p.status === 'want_to_try'), [places]);

  const nextTrip = useMemo(() => {
    const upcoming = trips
      .filter(t => t.status !== 'completed' && t.startDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    return upcoming[0] || null;
  }, [trips]);

  const lastTrip = useMemo(() => {
    const done = trips
      .filter(t => t.status === 'completed' && t.startDate)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
    return done[0] || null;
  }, [trips]);

  const daysUntil = useMemo(() => {
    if (!nextTrip?.startDate) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const trip  = new Date(nextTrip.startDate + 'T12:00:00');
    const diff  = Math.round((trip - today) / (1000 * 60 * 60 * 24));
    return diff;
  }, [nextTrip]);

  const fmtDate = (d) => d
    ? new Date(d + 'T12:00:00').toLocaleDateString('en-US',
        { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  // ── Pull a card ───────────────────────────────────────────────
  const pullCard = () => {
    const pool = [...mustGo, ...loved, ...wantToTry];
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setDrawnCard(pick);
    setCardFlipped(false);
    setTimeout(() => setCardFlipped(true), 80);
  };

  const catIcons = (place) =>
    CATEGORIES.filter(c => (place.categories || []).includes(c.id))
      .slice(0, 4).map(c => c.icon).join(' ');

  if (loading) {
    return (
      <div className={styles.loading}>
        <LanternIcon className={styles.loadingLantern} />
        <p>The lantern is reading the cards…</p>
      </div>
    );
  }

  const isEmpty = places.length === 0 && people.length === 0 && trips.length === 0;

  return (
    <div className={styles.page}>

      {/* ── Hero greeting ── */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>The Goldenest Lantern</h1>
          <p className={styles.heroSub}>
            {isEmpty
              ? 'Your oracle awaits its first light. Add places, people, and trips to begin.'
              : `${places.length} places · ${people.length} people · ${trips.length} trips`}
          </p>
        </div>
        <LanternIcon className={styles.heroLantern} />
      </div>

      {isEmpty ? (
        <EmptyWelcome navigate={navigate} />
      ) : (
        <div className={styles.grid}>

          {/* ── Next Trip ── */}
          {nextTrip ? (
            <div className={`${styles.panel} ${styles.panelGold} ${styles.spanFull}`}>
              <PanelLabel icon="🌙" label="Next Journey" />
              <div className={styles.tripHero}>
                <div>
                  <h2 className={styles.tripName}>{nextTrip.label}</h2>
                  <p className={styles.tripDate}>{fmtDate(nextTrip.startDate)}
                    {nextTrip.endDate && nextTrip.endDate !== nextTrip.startDate
                      && ` — ${fmtDate(nextTrip.endDate)}`}
                  </p>
                  {nextTrip.vibe && (
                    <p className={styles.tripVibe}>✦ {nextTrip.vibe}</p>
                  )}
                </div>
                {daysUntil !== null && (
                  <div className={styles.countdown}>
                    <span className={styles.countdownNum}>
                      {daysUntil === 0 ? '🎉' : daysUntil < 0 ? '✈️' : daysUntil}
                    </span>
                    <span className={styles.countdownLabel}>
                      {daysUntil === 0 ? "It's today!" : daysUntil < 0 ? 'En route' : 'days away'}
                    </span>
                  </div>
                )}
              </div>
              {nextTrip.itinerary?.some(d => d.slots?.length > 0) && (
                <div className={styles.tripStops}>
                  {nextTrip.itinerary.filter(d => d.slots?.length > 0).slice(0, 3).map(day => (
                    <div key={day.date} className={styles.tripStopDay}>
                      <span className={styles.tripStopDayLabel}>Day {day.day}</span>
                      <span className={styles.tripStopNames}>
                        {day.slots.map(s => s.placeName || places.find(p => p.id === s.placeId)?.name || '—').join(' · ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button className={styles.panelLink} onClick={() => navigate('/trips')}>
                View all trips ✦
              </button>
            </div>
          ) : (
            <div className={`${styles.panel} ${styles.panelDim} ${styles.spanFull}`}>
              <PanelLabel icon="🌙" label="Next Journey" />
              <p className={styles.noTrip}>No trips planned yet.</p>
              <button className="btn btn-gold" style={{ marginTop: '0.75rem' }}
                onClick={() => navigate('/trips')}>
                ✦ Plan a Trip
              </button>
            </div>
          )}

          {/* ── Must Go ── */}
          <div className={`${styles.panel} ${styles.panelGold}`}>
            <PanelLabel icon="⭐" label="Must Always Go" count={mustGo.length} />
            {mustGo.length === 0 ? (
              <p className={styles.empty}>No anchors yet — add a place and mark it Must Go.</p>
            ) : (
              <ul className={styles.placeList}>
                {mustGo.slice(0, 6).map(p => (
                  <PlaceRow key={p.id} place={p} catIcons={catIcons(p)}
                    onClick={() => navigate('/places')} />
                ))}
              </ul>
            )}
            {mustGo.length > 6 && (
              <button className={styles.panelLink} onClick={() => navigate('/places')}>
                +{mustGo.length - 6} more ✦
              </button>
            )}
          </div>

          {/* ── Want to Try ── */}
          <div className={`${styles.panel} ${styles.panelCrimson}`}>
            <PanelLabel icon="🔮" label="Want to Try" count={wantToTry.length} />
            {wantToTry.length === 0 ? (
              <p className={styles.empty}>Your wish list is empty.</p>
            ) : (
              <ul className={styles.placeList}>
                {wantToTry.slice(0, 6).map(p => (
                  <PlaceRow key={p.id} place={p} catIcons={catIcons(p)}
                    onClick={() => navigate('/places')} />
                ))}
              </ul>
            )}
            {wantToTry.length > 6 && (
              <button className={styles.panelLink} onClick={() => navigate('/places')}>
                +{wantToTry.length - 6} more ✦
              </button>
            )}
          </div>

          {/* ── People ── */}
          <div className={`${styles.panel} ${styles.panelTeal}`}>
            <PanelLabel icon="👁️" label="People to See" count={people.length} />
            {people.length === 0 ? (
              <p className={styles.empty}>No one in the court yet.</p>
            ) : (
              <div className={styles.peopleGrid}>
                {people.slice(0, 8).map(person => {
                  const initials = person.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
                  return (
                    <button key={person.id} className={styles.personChip}
                      onClick={() => navigate('/people')}>
                      <span className={styles.personInitials}>{initials}</span>
                      <span className={styles.personName}>{person.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {people.length > 8 && (
              <button className={styles.panelLink} onClick={() => navigate('/people')}>
                +{people.length - 8} more ✦
              </button>
            )}
            {people.length === 0 && (
              <button className="btn btn-outline" style={{ marginTop:'0.5rem', fontSize:'0.75rem' }}
                onClick={() => navigate('/people')}>
                Add to the Court
              </button>
            )}
          </div>

          {/* ── Pull a Card ── */}
          <div className={`${styles.panel} ${styles.panelMystic}`}>
            <PanelLabel icon="🃏" label="Pull a Card" />
            <p className={styles.pullIntro}>
              Let the lantern decide where you go next.
            </p>

            {drawnCard ? (
              <div className={`${styles.drawnCard} ${cardFlipped ? styles.drawnCardVisible : ''}`}>
                <div className={styles.drawnStatus}>
                  {STATUS_META[drawnCard.status]?.icon} {STATUS_META[drawnCard.status]?.label}
                </div>
                <h3 className={styles.drawnName}>{drawnCard.name}</h3>
                {drawnCard.neighborhood && (
                  <p className={styles.drawnNeighborhood}>◆ {drawnCard.neighborhood}</p>
                )}
                {drawnCard.notes && (
                  <p className={styles.drawnNotes}>{drawnCard.notes}</p>
                )}
                <p className={styles.drawnCats}>{catIcons(drawnCard)}</p>
              </div>
            ) : (
              <div className={styles.cardBack}>
                <span className={styles.cardBackGlyph}>✦</span>
                <span className={styles.cardBackStar}>☽</span>
                <span className={styles.cardBackGlyph}>✦</span>
              </div>
            )}

            <button
              className={`${styles.pullBtn} ${!places.length ? styles.pullBtnDisabled : ''}`}
              onClick={pullCard}
              disabled={!places.length}>
              {drawnCard ? '✦ Pull Again' : '✦ Pull a Card'}
            </button>
          </div>

          {/* ── Loved places (quick glance) ── */}
          {loved.length > 0 && (
            <div className={`${styles.panel} ${styles.panelTeal} ${styles.spanFull}`}>
              <PanelLabel icon="🌟" label="Tried & Loved" count={loved.length} />
              <div className={styles.lovedGrid}>
                {loved.slice(0, 8).map(p => (
                  <button key={p.id} className={styles.lovedChip}
                    onClick={() => navigate('/places')}>
                    <span className={styles.lovedName}>{p.name}</span>
                    {p.neighborhood && (
                      <span className={styles.lovedNeighborhood}>{p.neighborhood}</span>
                    )}
                  </button>
                ))}
              </div>
              {loved.length > 8 && (
                <button className={styles.panelLink} onClick={() => navigate('/places')}>
                  +{loved.length - 8} more ✦
                </button>
              )}
            </div>
          )}

          {/* ── Last trip recap ── */}
          {lastTrip && lastTrip.log?.length > 0 && (
            <div className={`${styles.panel} ${styles.panelDim} ${styles.spanFull}`}>
              <PanelLabel icon="⭐" label={`Last Time: ${lastTrip.label}`} />
              <div className={styles.logGrid}>
                {lastTrip.log.slice(0, 6).map((entry, i) => (
                  <div key={i} className={styles.logChip}>
                    <span className={styles.logChipName}>{entry.placeName}</span>
                    {entry.rating && (
                      <span className={styles.logChipRating}>
                        {STATUS_META[entry.rating]?.icon}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <button className={styles.panelLink} onClick={() => navigate('/trips')}>
                See full trip log ✦
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function PanelLabel({ icon, label, count }) {
  return (
    <div className={styles.panelLabelRow}>
      <span className={styles.panelLabelIcon}>{icon}</span>
      <span className={styles.panelLabelText}>{label}</span>
      {count !== undefined && (
        <span className={styles.panelCount}>{count}</span>
      )}
    </div>
  );
}

function PlaceRow({ place, catIcons, onClick }) {
  return (
    <li className={styles.placeRow} onClick={onClick}>
      <span className={styles.placeRowName}>{place.name}</span>
      <span className={styles.placeRowMeta}>
        {place.neighborhood && (
          <span className={styles.placeRowNeighborhood}>{place.neighborhood}</span>
        )}
        {catIcons && <span className={styles.placeRowCats}>{catIcons}</span>}
      </span>
    </li>
  );
}

function EmptyWelcome({ navigate }) {
  return (
    <div className={styles.welcomeGrid}>
      <WelcomeCard
        icon="📍" title="Start with Places"
        body="Add the spots you love, the ones you need to try, and your NOLA anchors."
        action="Add a Place" onAction={() => navigate('/places')} />
      <WelcomeCard
        icon="👁️" title="Build Your Court"
        body="Add performers, local friends, and anyone you always need to find."
        action="Add Someone" onAction={() => navigate('/people')} />
      <WelcomeCard
        icon="🌙" title="Plan a Journey"
        body="Plan your next trip with dates, vibes, and a day-by-day itinerary."
        action="Plan a Trip" onAction={() => navigate('/trips')} />
    </div>
  );
}

function WelcomeCard({ icon, title, body, action, onAction }) {
  return (
    <div className={styles.welcomeCard}>
      <span className={styles.welcomeIcon}>{icon}</span>
      <h3 className={styles.welcomeTitle}>{title}</h3>
      <p className={styles.welcomeBody}>{body}</p>
      <button className="btn btn-gold" onClick={onAction}>{action}</button>
    </div>
  );
}
