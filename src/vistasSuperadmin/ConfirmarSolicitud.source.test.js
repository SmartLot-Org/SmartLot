import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
const pagina = await readFile(new URL('./ConfirmarSolicitud.jsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../servicies/API_SolicitudRegistro.js', import.meta.url), 'utf8');
const protegida = await readFile(new URL('../components/ProtectedRoute.jsx', import.meta.url), 'utf8');
const loginForm = await readFile(new URL('../componentesLanding/auth/LoginForm.jsx', import.meta.url), 'utf8');

test('la revisión de solicitudes vive en ruta protegida de superadmin', () => {
  assert.match(app, /path="\/solicitud-registro\/revision"/);
  assert.match(app, /<ConfirmarSolicitud \/>/);
  const ruta = app.match(/path="\/solicitud-registro\/revision"[\s\S]*?<\/ProtectedRoute>/)[0];
  assert.match(ruta, /allowedRoles=\{\[4\]\}/);
});

test('la página carga la solicitud por id y exige id numérico', () => {
  assert.match(pagina, /SolicitudRegistroGetById/);
  assert.match(pagina, /searchParams\.get\('solicitud'\)/);
  assert.match(pagina, /\/\^\\d\+\$\/\.test\(String\(id\)\)/);
});

test('la página lee la acción del mail y ofrece aprobar y rechazar', () => {
  assert.match(pagina, /get\('accion'\)/);
  assert.match(pagina, /SolicitudesRegistroAprobar/);
  assert.match(pagina, /SolicitudesRegistroRechazar/);
  assert.match(pagina, /Aceptar solicitud/);
  assert.match(pagina, /Rechazar solicitud/);
});

test('la página maneja solicitudes ya resueltas y errores sin exponer datos sensibles', () => {
  assert.match(pagina, /estado !== 'pendiente'/);
  assert.match(pagina, /res\.datos\?\.message/);
  assert.doesNotMatch(pagina, /contraseña/);
});

test('getById va sin caché y las transiciones invalidan prefijos', () => {
  assert.match(api, /SolicitudRegistroGetById/);
  assert.match(api, /Sin caché: la página de confirmación/);
  assert.match(api, /invalidateByPrefix\('solicitudes-registro:'\)/);
});

test('ProtectedRoute conserva el destino en ?redirect= al mandar a login', () => {
  assert.match(protegida, /login\?redirect=\$\{encodeURIComponent\(destino\)\}/);
  assert.match(protegida, /location\.pathname\}\$\{location\.search\}/);
});

test('LoginForm solo acepta redirects internos', () => {
  assert.match(loginForm, /redirect\.startsWith\("\/"\)/);
  assert.match(loginForm, /!redirect\.startsWith\("\/\/"\)/);
  assert.ok(loginForm.includes('!redirect.includes("\\\\")'));
  assert.match(loginForm, /getUserHomeRoute\(usuario\)/);
});
