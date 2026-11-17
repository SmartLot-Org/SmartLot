import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { GoogleMapsContext } from './googleMapsContext';

// El puente que llama a useJsApiLoader vive en su propio módulo y se importa
// con lazy(): así @react-google-maps/api no entra al bundle de entrada y solo
// se descarga cuando una pantalla pide el mapa (ADR-006).
const MapsLoaderBridge = lazy(() => import('./MapsLoaderBridge'));

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
      {requested && (
        <Suspense fallback={null}>
          <MapsLoaderBridge onStateChange={setMapsState} />
        </Suspense>
      )}
      {children}
    </GoogleMapsContext.Provider>
  );
}
