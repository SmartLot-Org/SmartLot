import test from 'node:test'; import assert from 'node:assert/strict';
import { buildTratoPayload, parsePositiveInteger } from './tratos.js';
test('valida IDs y cantidad', () => { assert.equal(parsePositiveInteger('2'), 2); assert.throws(() => parsePositiveInteger(0)); assert.throws(() => parsePositiveInteger(1.5)); });
test('construye payload estricto sin campos inexistentes', () => {
  const payload = buildTratoPayload({ id_empresa: '1', id_garage: '2', cantidad_cocheras: '3', precio_pickup: '0', precio_auto: '10', created_at: 'x', precio_moto: 5, estado: 'aceptada' });
  assert.deepEqual(payload, { id_empresa: 1, id_garage: 2, cantidad_cocheras: 3, precio_pickup: 0, precio_auto: 10 });
});
