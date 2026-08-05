import { parseOptionalNonNegativeNumber } from './prices.js';

export function parsePositiveInteger(value, field = 'ID') {
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${field} debe ser un entero positivo.`);
  return number;
}

export function buildTratoPayload(values, { partial = false } = {}) {
  const payload = {};
  if (!partial || values.id_empresa !== undefined) payload.id_empresa = parsePositiveInteger(values.id_empresa, 'Empresa');
  if (!partial || values.id_garage !== undefined) payload.id_garage = parsePositiveInteger(values.id_garage, 'Garage');
  if (!partial || values.cantidad_cocheras !== undefined) payload.cantidad_cocheras = parsePositiveInteger(values.cantidad_cocheras, 'Cantidad de cocheras');
  if (!partial || values.precio_pickup !== undefined) {
    const value = parseOptionalNonNegativeNumber(values.precio_pickup, 'Precio pickup');
    if (value === null) throw new Error('Precio pickup es requerido.');
    payload.precio_pickup = value;
  }
  if (!partial || values.precio_auto !== undefined) {
    const value = parseOptionalNonNegativeNumber(values.precio_auto, 'Precio auto');
    if (value === null) throw new Error('Precio auto es requerido.');
    payload.precio_auto = value;
  }
  return payload;
}
