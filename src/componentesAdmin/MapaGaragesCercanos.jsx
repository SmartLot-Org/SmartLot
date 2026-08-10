import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { AlertCircle, MapPin } from 'lucide-react';
import { getMapPosition } from '../helpers/tratos';

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: 'cooperative',
};

const garageIdOf = (garage) => garage?.id ?? garage?.id_garage;

export default function MapaGaragesCercanos({ sede, garages, selectedGarageId, onSelectGarage, onClearSelection }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_FRONTEND_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });
  const [map, setMap] = useState(null);
  const sedePosition = useMemo(() => getMapPosition(sede), [sede]);
  const garagePoints = useMemo(() => garages.flatMap((garage) => {
    const position = getMapPosition(garage);
    return position ? [{ garage, position, id: garageIdOf(garage) }] : [];
  }), [garages]);
  const selectedPoint = useMemo(() => garagePoints.find(({ id }) => String(id) === String(selectedGarageId)) || null, [garagePoints, selectedGarageId]);

  const fitVisiblePoints = useCallback((mapInstance) => {
    if (!mapInstance || !window.google) return;
    const positions = [sedePosition, ...garagePoints.map(({ position }) => position)].filter(Boolean);
    if (!positions.length) return;
    if (positions.length === 1) {
      mapInstance.setCenter(positions[0]);
      mapInstance.setZoom(14);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    positions.forEach((position) => bounds.extend(position));
    mapInstance.fitBounds(bounds, 54);
  }, [garagePoints, sedePosition]);

  useEffect(() => {
    fitVisiblePoints(map);
  }, [fitVisiblePoints, map]);

  useEffect(() => {
    if (!map || selectedGarageId == null) return;
    const selected = garagePoints.find(({ id }) => String(id) === String(selectedGarageId));
    if (selected) map.panTo(selected.position);
  }, [garagePoints, map, selectedGarageId]);

  if (!apiKey || loadError) {
    return <div className="garage-map-state garage-map-state--error" role="status"><AlertCircle size={22}/><div><strong>No pudimos cargar Google Maps</strong><span>Podés seguir buscando y solicitando garages desde el listado.</span></div></div>;
  }

  if (!isLoaded) {
    return <div className="garage-map-state" role="status"><span className="garage-map-spinner"/><div><strong>Cargando mapa</strong><span>Preparando los garages cercanos…</span></div></div>;
  }

  if (!sedePosition && garagePoints.length === 0) {
    return <div className="garage-map-state" role="status"><MapPin size={23}/><div><strong>No hay ubicaciones para mostrar</strong><span>Los garages siguen disponibles en el listado.</span></div></div>;
  }

  const fallbackCenter = sedePosition || garagePoints[0].position;

  return <GoogleMap
    mapContainerClassName="garage-google-map"
    center={fallbackCenter}
    zoom={13}
    options={MAP_OPTIONS}
    onLoad={(mapInstance) => {
      setMap(mapInstance);
      fitVisiblePoints(mapInstance);
    }}
    onUnmount={() => setMap(null)}
  >
    {sedePosition ? <Marker
      position={sedePosition}
      icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#0f172a', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3, scale: 13 }}
      label={{ text: 'S', color: '#ffffff', fontWeight: '700' }}
      title={`Sede: ${sede?.nombre || sede?.ubicacion || 'seleccionada'}`}
      zIndex={3}
    /> : null}
    {garagePoints.map(({ garage, position, id }) => {
      const isSelected = String(id) === String(selectedGarageId);
      return <Marker
        key={id}
        position={position}
        icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: isSelected ? 4 : 2, scale: isSelected ? 15 : 12 }}
        label={{ text: 'G', color: '#ffffff', fontWeight: '700' }}
        title={`${garage.nombre || 'Garage'} · ${garage.distanciaTexto || garage.distanciaKm || garage.distance || 'distancia no informada'}`}
        opacity={selectedGarageId == null || isSelected ? 1 : .68}
        zIndex={isSelected ? 5 : 2}
        onClick={() => onSelectGarage(garage, { scroll: false })}
      />;
    })}
    {selectedPoint ? <InfoWindow position={selectedPoint.position} onCloseClick={onClearSelection} options={{ pixelOffset: new window.google.maps.Size(0, -16) }}>
      <article className="garage-map-card">
        <span>{selectedPoint.garage.distanciaTexto || `${Number(selectedPoint.garage.distance || 0).toFixed(1)} km`} · {selectedPoint.garage.tiempoConduccion || 'tiempo estimado'}</span>
        <h3>{selectedPoint.garage.nombre || 'Garage'}</h3>
        <p>{selectedPoint.garage.ubicacion || 'Ubicación no informada'}</p>
        <div><strong>{selectedPoint.garage.cocheras_disponibles ?? 0}</strong><small> cocheras disponibles</small></div>
        <button type="button" onClick={() => onSelectGarage(selectedPoint.garage)}>Ver tarjeta completa</button>
      </article>
    </InfoWindow> : null}
  </GoogleMap>;
}
