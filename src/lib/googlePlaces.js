import { Loader } from '@googlemaps/js-api-loader';

let loader;

export function loadMaps() {
  if (!loader) {
    loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
      libraries: ['places'],
    });
  }
  return loader.load();
}

export const MAPS_KEY_SET = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;
