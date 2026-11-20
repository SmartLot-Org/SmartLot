import { useId, useMemo, useRef } from 'react';
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { useGoogleMaps } from '../contexts/useGoogleMaps';
import { getMapPosition } from '../helpers/tratos';
import './UbicacionGarage.css';

const CENTRO_INICIAL = { lat: -34.6037, lng: -58.3816 };
const CAMPOS = ['formatted_address', 'geometry'];
const OPCIONES_MAPA = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: 'cooperative',
};

export default function UbicacionGarage({
  direccion,
  coordenadas,
  onDireccionChange,
  onSeleccionar,
  mostrarMapa = false,
  children,
}) {
  const id = useId();
  const estadoId = `${id}-estado`;
  const autocomplete = useRef(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const posicion = useMemo(() => getMapPosition(coordenadas), [coordenadas]);

  const seleccionarDireccion = () => {
    const lugar = autocomplete.current?.getPlace();
    const punto = lugar?.geometry?.location;
    if (!punto || !lugar.formatted_address) return;
    onSeleccionar({ lat: punto.lat(), lng: punto.lng(), direccion: lugar.formatted_address });
  };

  const input = (
    <input
      id={id}
      type="text"
      value={direccion}
      onChange={(event) => onDireccionChange(event.target.value)}
      placeholder="Ej. Av. Corrientes 1234, CABA"
      autoComplete="off"
      aria-describedby={mostrarMapa ? estadoId : undefined}
      required
    />
  );

  return (
    <div className="garage-location">
      <label htmlFor={id}>Ubicación del garage</label>
      {isLoaded ? (
        <Autocomplete
          fields={CAMPOS}
          onLoad={(instance) => { autocomplete.current = instance; }}
          onPlaceChanged={seleccionarDireccion}
        >
          {input}
        </Autocomplete>
      ) : input}
      {children}
      {mostrarMapa && (
        <>
          <p className="garage-location-status" id={estadoId} role="status">
            {loadError
              ? 'El mapa no está disponible. Las direcciones nuevas requieren una ubicación validada.'
              : !isLoaded
                ? 'Cargando mapa…'
                : posicion
                  ? 'La ubicación del garage está marcada en el mapa.'
                  : 'Elegí una sugerencia para marcar la ubicación del garage.'}
          </p>
          {!loadError && (
            <div className="garage-location-map-frame" role="group" aria-label="Mapa de ubicación del garage" aria-busy={!isLoaded}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerClassName="garage-location-map"
                  center={posicion || CENTRO_INICIAL}
                  zoom={posicion ? 16 : 11}
                  options={OPCIONES_MAPA}
                >
                  {posicion && <Marker position={posicion} title={direccion} />}
                </GoogleMap>
              ) : (
                <MapPin size={24} aria-hidden="true" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
