import test from 'node:test'; import assert from 'node:assert/strict';
import { buildSolicitudPayload, buildTratoPayload, filterGarages, getMapPosition, normalizeDays, normalizeList, parsePositiveInteger } from './tratos.js';
test('valida IDs y cantidad', () => { assert.equal(parsePositiveInteger('2'), 2); assert.throws(() => parsePositiveInteger(0)); assert.throws(() => parsePositiveInteger(1.5)); });
test('construye payload estricto sin campos inexistentes', () => {
  const payload = buildTratoPayload({ id_empresa: '999', id_sede: '1', id_garage: '2', cantidad_cocheras: '3', precio_pickup: '0', precio_auto: '10' });
  assert.deepEqual(payload, { id_sede: 1, id_garage: 2, cantidad_cocheras: 3 });
});
test('normaliza y filtra garages reales', () => {
  const rows = normalizeList({ datos: [{ nombre: 'Centro', ubicacion: 'Mitre', distance: 3, cocheras_disponibles: 2, estado: true }] });
  assert.equal(filterGarages(rows, { search: 'mitre', maxDistance: 5, availableOnly: true, activeOnly: true }).length, 1);
});
test('un garage contratado queda marcado para impedir duplicarlo en la misma sede', () => {
  const rows = normalizeList([{ id: 2, ya_contratado: true }]);
  assert.equal(rows[0].ya_contratado, true);
});
test('normaliza arrays de días y literales PostgreSQL de enum[]', () => {
  assert.deepEqual(normalizeDays(['Lunes', 'Martes']), ['Lunes', 'Martes']);
  assert.deepEqual(normalizeDays('{Lunes,Martes,Jueves}'), ['Lunes', 'Martes', 'Jueves']);
  assert.deepEqual(normalizeDays(null), []);
});
test('payload de solicitud exige sede y no permite empresa, estado ni precios manipulados', () => {
  assert.deepEqual(buildSolicitudPayload({ id_empresa: 99, id_sede: 4, id_garage: '5', cantidad_cocheras: '2', descripcion: ' hola ', modalidad_pago: 'empleado_paga_todo', estado: 'aceptada', precio_auto: 1 }), {
    id_sede: 4, id_garage: 5, cantidad_cocheras: 2, descripcion: 'hola', modalidad_pago: 'empleado_paga_todo',
  });
  assert.throws(() => buildSolicitudPayload({ id_garage: 5, cantidad_cocheras: 2 }), /Sede/);
});
test('normaliza coordenadas para Google Maps y descarta valores inválidos', () => {
  assert.deepEqual(getMapPosition({ latitud: '-34.6037', longitud: '-58.3816' }), { lat: -34.6037, lng: -58.3816 });
  assert.deepEqual(getMapPosition({ latitude: -31.4, longitude: -64.2 }), { lat: -31.4, lng: -64.2 });
  assert.equal(getMapPosition({ latitud: 95, longitud: -58 }), null);
  assert.equal(getMapPosition({ latitud: null, longitud: null }), null);
});
