import { Loader } from '@googlemaps/js-api-loader';

let loader;
let loadFailed = false;
let placesLib    = null;
let mapsLib      = null;
let markerLib    = null;
let geocodingLib = null;

function getLoader() {
  if (!loader) {
    window.gm_authFailure = () => { loadFailed = true; };
    loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
      version: 'weekly',
    });
  }
  return loader;
}

export async function loadPlacesLib() {
  if (loadFailed) throw new Error('Maps load failed');
  if (placesLib) return placesLib;
  try {
    placesLib = await getLoader().importLibrary('places');
    return placesLib;
  } catch (e) {
    loadFailed = true;
    throw e;
  }
}

export async function loadMapsLib() {
  if (loadFailed) throw new Error('Maps load failed');
  if (mapsLib) return mapsLib;
  try {
    mapsLib = await getLoader().importLibrary('maps');
    return mapsLib;
  } catch (e) {
    loadFailed = true;
    throw e;
  }
}

export async function loadMarkerLib() {
  if (loadFailed) throw new Error('Maps load failed');
  if (markerLib) return markerLib;
  try {
    markerLib = await getLoader().importLibrary('marker');
    return markerLib;
  } catch (e) {
    loadFailed = true;
    throw e;
  }
}

export async function geocodeAddress(address) {
  if (loadFailed || !address) return null;
  try {
    if (!geocodingLib) geocodingLib = await getLoader().importLibrary('geocoding');
    const { Geocoder } = geocodingLib;
    const geocoder = new Geocoder();
    const result = await geocoder.geocode({ address: `${address}, New Orleans, LA` });
    if (result.results?.[0]) {
      const loc = result.results[0].geometry.location;
      return { lat: loc.lat(), lng: loc.lng() };
    }
  } catch {}
  return null;
}

export const MAPS_KEY_SET = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
