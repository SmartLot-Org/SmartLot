import { useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Configuración canónica de la API de Google Maps.
// Toda la app carga el script exclusivamente por acá: centralizar la llamada
// evita que varios componentes montados en paralelo inyecten el script con
// configuraciones distintas (libraries distintas → colisiones de carga).
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_FRONTEND_KEY?.trim() || '';
const LIBRARIES = ['maps', 'places'];
const SCRIPT_ID = 'smartlot-google-maps-script';

// Único call-site de useJsApiLoader de la aplicación.
export default function MapsLoaderBridge({ onStateChange }) {
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const previous = window.gm_authFailure;
    const handleAuthFailure = () => {
      setAuthError(new Error('Google Maps rechazó la autenticación.'));
      previous?.();
    };
    window.gm_authFailure = handleAuthFailure;
    return () => {
      if (window.gm_authFailure === handleAuthFailure) window.gm_authFailure = previous;
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
    language: 'es',
    region: 'AR',
    id: SCRIPT_ID,
  });

  useEffect(() => {
    const error = authError || loadError || null;
    onStateChange({ isLoaded: isLoaded && !error, loadError: error });
  }, [isLoaded, loadError, authError, onStateChange]);

  return null;
}
