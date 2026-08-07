import test from 'node:test';
import assert from 'node:assert/strict';
import { getUsuarioGarageIds, mergeUsuariosById } from './usuarios.js';

test('fusiona filas duplicadas del mismo usuario conservando todos sus garages', () => {
  const result = mergeUsuariosById([
    { id: 10, nombre: 'Dueño', id_garage: 8 },
    { id: 10, nombre: 'Dueño', id_garage: 3 },
  ]);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].id_garages, [3, 8]);
  assert.equal(result[0].id_garage, 3);
});

test('normaliza arreglos, objetos y escalares de garages sin duplicados', () => {
  assert.deepEqual(getUsuarioGarageIds({ id_garages: [4, '2'], garages: [{ id: 4 }, { id_garage: 7 }], id_garage: 2 }), [2, 4, 7]);
});

test('mantiene una sola fila para usuarios con uno o ningún garage', () => {
  const result = mergeUsuariosById([{ id: 1, id_garage: 5 }, { id: 2 }]);
  assert.deepEqual(result.map(({ id, id_garage, id_garages }) => ({ id, id_garage, id_garages })), [
    { id: 1, id_garage: 5, id_garages: [5] },
    { id: 2, id_garage: null, id_garages: [] },
  ]);
});
