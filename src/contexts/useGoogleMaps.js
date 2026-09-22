import { useContext, useEffect } from 'react';
import { GoogleMapsContext } from './googleMapsContext';

// Único punto de consumo de la API de Maps. Al montar el primer consumidor
// dispara la carga del script (idempotente) para no cargar Maps en páginas
// que no lo usan (landing, login, etc.).
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  const { isLoaded, loadError, requestMapsLoad } = context;

  useEffect(() => {
    if (!isLoaded && !loadError) {
      requestMapsLoad();
    }
  }, [isLoaded, loadError, requestMapsLoad]);

  return context;
}
