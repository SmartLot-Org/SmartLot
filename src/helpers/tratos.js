export function parsePositiveInteger(value, field = 'ID') {
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${field} debe ser un entero positivo.`);
  return number;
}

export function buildTratoPayload(values, { partial = false } = {}) {
  const payload = {};
  if (!partial || values.id_sede !== undefined) payload.id_sede = parsePositiveInteger(values.id_sede, 'Sede');
  if (!partial || values.id_garage !== undefined) payload.id_garage = parsePositiveInteger(values.id_garage, 'Garage');
  if (!partial || values.cantidad_cocheras !== undefined) payload.cantidad_cocheras = parsePositiveInteger(values.cantidad_cocheras, 'Cantidad de cocheras');
  return payload;
}

export function buildSolicitudPayload(values) {
  const payload = {
    id_garage: parsePositiveInteger(values.id_garage, 'Garage'),
    cantidad_cocheras: parsePositiveInteger(values.cantidad_cocheras, 'Cantidad de cocheras'),
  };
  if (values.descripcion !== undefined && values.descripcion !== null && String(values.descripcion).trim()) {
    payload.descripcion = String(values.descripcion).trim();
  }
  return payload;
}

export const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  for (const key of ['datos', 'data', 'garages', 'value']) if (Array.isArray(value?.[key])) return value[key];
  return [];
};

export const normalizeDays = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  const contents = trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed.slice(1, -1) : trimmed;
  return contents.split(',').map((day) => day.trim().replace(/^"|"$/g, '')).filter(Boolean);
};

export const filterGarages = (garages, { search = '', maxDistance = Infinity, availableOnly = false, activeOnly = false } = {}) => {
  const query = search.trim().toLowerCase();
  return normalizeList(garages).filter((garage) => {
    const text = `${garage.nombre || ''} ${garage.ubicacion || ''}`.toLowerCase();
    const distance = Number(garage.distanciaKm ?? garage.distance ?? 0);
    return (!query || text.includes(query)) && distance <= Number(maxDistance) &&
      (!availableOnly || Number(garage.cocheras_disponibles) > 0) &&
      (!activeOnly || garage.estado !== false);
  });
};
