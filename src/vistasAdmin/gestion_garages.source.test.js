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
test('solicitudes incluyen sede y pendientes se distinguen por sede y garage', () => {
  assert.match(source, /buildSolicitudPayload\(\{ id_sede: sedeId, id_garage:/);
  assert.match(source, /`\$\{Number\(s\.id_sede\)\}:\$\{Number\(s\.id_garage\)\}`/);
  assert.match(source, /if \(!sedeId\) return/);
});
test('tratos contratados se filtran por id_sede', () => {
  assert.match(source, /Number\(t\.id_sede\) === Number\(sedeId\)/);
});
test('la ruta anterior redirige a la gestión unificada', () => {
  assert.match(app, /path="\/admin\/tratos-garages"[\s\S]*Navigate to="\/gestion_garages" replace/);
});
test('buscar garages integra mapa y listado con selección sincronizada', () => {
  assert.match(source, /lazy\(\(\) => import\('\.\.\/componentesAdmin\/MapaGaragesCercanos'\)\)/);
  assert.match(source, /<MapaGaragesCercanos[\s\S]*garages=\{results\}/);
  assert.match(source, /selectGarageOnMap/);
  assert.match(source, /garage-results-list/);
});
test('el flujo de solicitud muestra alertas sobre el modal y libera el estado de envío', () => {
  assert.match(source, /container: 'garage-swal-container'/);
  assert.match(source, /setSubmitting\(false\);[\s\S]*title: 'Solicitud enviada'/);
});
