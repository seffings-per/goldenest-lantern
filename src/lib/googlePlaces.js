import { Loader } from '@googlemaps/js-api-loader';

let loader;
let loadFailed = false;

export function loadMaps() {
  if (loadFailed) return Promise.reject(new Error('Maps load failed'));
  if (!loader) {
    // Prevent Google's auth-failure overlay from crashing the page
    window.gm_authFailure = () => { loadFailed = true; };
    loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
      libraries: ['places'],
    });
  }
  return loader.load().catch(e => { loadFailed = true; throw e; });
}

export const MAPS_KEY_SET = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
