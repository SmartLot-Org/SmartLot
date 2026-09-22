import { createContext } from 'react';

// Estado compartido de la API de Google Maps:
// { isLoaded: boolean, loadError: Error|null, requestMapsLoad: () => void }
export const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
  requestMapsLoad: () => {},
});
