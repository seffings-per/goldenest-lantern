import { useEffect, useRef, useState } from 'react';
import { loadMapsLib, loadMarkerLib, geocodeAddress, MAPS_KEY_SET } from '../../lib/googlePlaces';
import { STATUS_META } from '../../lib/constants';
import styles from './PlacesMap.module.css';

const NOLA = { lat: 29.9511, lng: -90.0715 };

export default function PlacesMap({ places, onPlaceClick, onLocationUpdate }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const mapsLibRef   = useRef(null);
  const markerLibRef = useRef(null);
  const markersRef   = useRef([]);
  const runIdRef     = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!MAPS_KEY_SET) { setError('no-key'); return; }
    let cancelled = false;

    Promise.all([loadMapsLib(), loadMarkerLib()])
      .then(([ml, mkl]) => {
        if (cancelled) return;
        mapsLibRef.current   = ml;
        markerLibRef.current = mkl;
        const { Map } = ml;
        mapRef.current = new Map(containerRef.current, {
          center: NOLA,
          zoom: 13,
          mapId: 'DEMO_MAP_ID',
          clickableIcons: false,
        });
        setMapReady(true);
      })
      .catch(() => { if (!cancelled) setError('load-failed'); });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    updateMarkers();
  }, [mapReady, places]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateMarkers() {
    const runId = ++runIdRef.current;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const { LatLngBounds }          = mapsLibRef.current;

    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];

    const bounds = new LatLngBounds();
    let pinCount = 0;

    for (const place of places) {
      if (runIdRef.current !== runId) return;

      let pos = place.location?.lat ? place.location : null;

      if (!pos && place.address) {
        pos = await geocodeAddress(place.address);
        if (runIdRef.current !== runId) return;
        if (pos && onLocationUpdate) onLocationUpdate(place.id, pos);
      }

      if (!pos) continue;

      const status = STATUS_META[place.status] || STATUS_META.want_to_try;
      const el = document.createElement('div');
      el.className = styles.marker;
      el.style.setProperty('--mc', status.color);
      el.innerHTML = `<span class="${styles.markerEmoji}">${status.icon}</span>`;

      const marker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: pos.lat, lng: pos.lng },
        content: el,
        title: place.name,
      });

      marker.addListener('click', () => onPlaceClick(place));
      markersRef.current.push(marker);
      bounds.extend({ lat: pos.lat, lng: pos.lng });
      pinCount++;
    }

    if (pinCount > 1) {
      mapRef.current.fitBounds(bounds, 60);
    } else if (pinCount === 1) {
      mapRef.current.setZoom(15);
    }
  }

  if (error === 'no-key') {
    return (
      <div className={styles.errorState}>
        <p>No Maps API key — map unavailable.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>Map could not load.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {!mapReady && <div className={styles.mapLoading}>Loading map…</div>}
      <div ref={containerRef} className={styles.mapContainer} />
    </div>
  );
}
