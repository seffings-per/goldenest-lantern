import { useState, useEffect, useRef, Component } from 'react';
import { loadPlacesLib, MAPS_KEY_SET } from '../../lib/googlePlaces';
import styles from './AccommodationSearch.module.css';

class ErrorBoundary extends Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() { return this.state.crashed ? null : this.props.children; }
}

export default function AccommodationSearch({ onSelect }) {
  if (!MAPS_KEY_SET) return null;
  return (
    <ErrorBoundary>
      <Inner onSelect={onSelect} />
    </ErrorBoundary>
  );
}

function Inner({ onSelect }) {
  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filled, setFilled]           = useState(false);
  const [ready, setReady]             = useState(false);
  const libRef     = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadPlacesLib()
      .then(lib => { libRef.current = lib; setReady(true); })
      .catch(() => {});
  }, []);

  const search = (text) => {
    setQuery(text);
    setFilled(false);
    clearTimeout(debounceRef.current);
    if (!ready || text.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion } = libRef.current;
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text,
          locationBias: { lat: 29.9511, lng: -90.0715 },
          includedPrimaryTypes: ['lodging'],
        });
        setSuggestions(results.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const pick = async (suggestion) => {
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });
      onSelect({
        name:         place.displayName      || '',
        neighborhood: detectNeighborhood(place.formattedAddress || ''),
      });
      setSuggestions([]);
      setQuery('');
      setFilled(true);
    } catch {}
  };

  return (
    <div className={styles.wrap}>
      <label className="form-label">Search Google</label>
      <div className={styles.inputWrap}>
        <span className={styles.icon}>🔍</span>
        <input
          className={`form-input ${styles.input}`}
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search for your hotel, B&B, rental…"
        />
        {filled && <span className={styles.filled}>✓ Filled</span>}
      </div>
      {suggestions.length > 0 && (
        <ul className={styles.list}>
          {suggestions.map((s, i) => (
            <li key={i} className={styles.item} onMouseDown={() => pick(s)}>
              <span className={styles.main}>{s.placePrediction.mainText.toString()}</span>
              <span className={styles.sub}>{s.placePrediction.secondaryText?.toString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Map a formatted Google address to the nearest NOLA neighborhood label.
function detectNeighborhood(address) {
  const checks = [
    ['French Quarter',   'French Quarter'],
    ['Marigny',          'Marigny'],
    ['Bywater',          'Bywater'],
    ['Garden District',  'Garden District'],
    ['Uptown',           'Uptown'],
    ['Mid-City',         'Mid-City'],
    ['Trem',             'Treme'],
    ['Warehouse',        'CBD / Warehouse'],
    ['Algiers',          'Algiers'],
    ['Frenchmen',        'Frenchmen Street'],
    ['Magazine',         'Magazine Street'],
  ];
  for (const [key, label] of checks) {
    if (address.includes(key)) return label;
  }
  return '';
}
