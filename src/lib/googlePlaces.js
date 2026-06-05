import { Loader } from '@googlemaps/js-api-loader';

let loader;
let loadFailed = false;
let placesLib = null;

export async function loadPlacesLib() {
  if (loadFailed) throw new Error('Maps load failed');
  if (placesLib) return placesLib;

  if (!loader) {
    window.gm_authFailure = () => { loadFailed = true; };
    loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
      version: 'weekly',
    });
  }

  try {
    placesLib = await loader.importLibrary('places');
    return placesLib;
  } catch (e) {
    loadFailed = true;
    throw e;
  }
}

export const MAPS_KEY_SET = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
