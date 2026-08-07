import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('crear y editar garages no envian id_sede', async () => {
  const [create, edit] = await Promise.all([
    read('../vistasAdmin/agregar_zona.jsx'),
    read('../vistasAdmin/editar_zona.jsx'),
  ]);

  assert.doesNotMatch(create, /\bid_sede\b/);
  assert.doesNotMatch(edit, /garageData\.id_sede|\bid_sede\s*:/);
});

test('distancia a sede envia la referencia como query parameter', async () => {
  const api = await read('../servicies/API_Garage.js');

  assert.match(api, /GaragesGetDistanciaSede\s*=\s*async\s*\(idGarage,\s*idSede\)/);
  assert.match(api, /params:\s*\{\s*sede_id:\s*idSede\s*\}/);
});

test('superadmin deriva todas las sedes y empresas desde los tratos', async () => {
  const [view, card] = await Promise.all([
    read('../vistasSuperadmin/superadmin_gestion_garages.jsx'),
    read('../componentesAdmin/tarjeta_garages.jsx'),
  ]);

  assert.match(view, /TratosGetAll\(\)/);
  assert.match(view, /relacionesPorGarage/);
  assert.match(view, /_idEmpresas\.includes/);
  assert.doesNotMatch(view, /garage\.id_sede|g\.id_sede/);
  assert.match(card, /relaciones\.map/);
  assert.match(card, /Sin tratos/);
});
