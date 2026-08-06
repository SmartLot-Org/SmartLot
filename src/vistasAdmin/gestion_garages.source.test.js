import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./gestion_garages.jsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
test('admin no ve acciones de crear o editar garages físicos', () => {
  assert.doesNotMatch(source, /Nuevo Garage|agregar_zona|editar_zona/);
});
test('cambiar sede dispara nuevamente la consulta de cercanos', () => {
  assert.match(source, /\[tab, sedeId, radio\]/);
  assert.match(source, /GaragesGetCercanos\(Number\(sedeId\)/);
});
test('la ruta anterior redirige a la gestión unificada', () => {
  assert.match(app, /path="\/admin\/tratos-garages"[\s\S]*Navigate to="\/gestion_garages" replace/);
});
