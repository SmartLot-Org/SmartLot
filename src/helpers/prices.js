export function parseOptionalNonNegativeNumber(value, field = 'precio') {
  if (value === '' || value === null || value === undefined) return null;
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} debe ser un numero mayor o igual a 0.`);
  return number;
}

export function buildGaragePricesPayload(values) {
  return {
    precio_pickup: parseOptionalNonNegativeNumber(values.precio_pickup, 'Precio pickup'),
    precio_auto: parseOptionalNonNegativeNumber(values.precio_auto, 'Precio auto'),
    precio_moto: parseOptionalNonNegativeNumber(values.precio_moto, 'Precio moto'),
  };
}

const arsFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
export const formatARS = (value) => value === null || value === undefined || value === ''
  ? 'Sin definir'
  : arsFormatter.format(Number(value));
