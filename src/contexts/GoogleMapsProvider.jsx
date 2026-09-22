import { useCallback, useEffect, useMemo, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GoogleMapsContext } from './googleMapsContext';

// Configuración canónica de la API de Google Maps.
// Toda la app carga el script exclusivamente por acá: centralizar la llamada
// evita que varios componentes montados en paralelo inyecten el script con
// configuraciones distintas (libraries distintas → colisiones de carga).
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_FRONTEND_KEY || '';
const LIBRARIES = ['places'];
const SCRIPT_ID = 'smartlot-google-maps-script';

// Único call-site de useJsApiLoader de la aplicación.
function MapsLoaderBridge({ onStateChange }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
    language: 'es',
    region: 'AR',
    id: SCRIPT_ID,
  });

  useEffect(() => {
    onStateChange({ isLoaded, loadError });
  }, [isLoaded, loadError, onStateChange]);

  return null;
}

export function GoogleMapsProvider({ children }) {
  const [mapsState, setMapsState] = useState({ isLoaded: false, loadError: null });
  const [requested, setRequested] = useState(false);

  const requestMapsLoad = useCallback(() => {
    setRequested(true);
  }, []);

  const value = useMemo(
    () => ({ ...mapsState, requestMapsLoad }),
    [mapsState, requestMapsLoad],
  );

  // El bridge se renderiza como hermano de children para que los consumidores
  // no se desmonten/remonten cuando arranca la carga del script.
  return (
    <GoogleMapsContext.Provider value={value}>
      {requested && <MapsLoaderBridge onStateChange={setMapsState} />}
      {children}
    </GoogleMapsContext.Provider>
  );
}
