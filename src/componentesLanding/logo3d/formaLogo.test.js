import assert from 'node:assert/strict';
import test from 'node:test';
import { areaConSigno, contornosLogo, PROPORCION_LOGO } from './formaLogo.js';

test('el logo son dos contornos cerrados (P y flecha) en sentido antihorario', () => {
  const contornos = contornosLogo();
  assert.equal(contornos.length, 2);
  for (const c of contornos) {
    assert.ok(c.length > 10);
    assert.ok(areaConSigno(c) > 0);
    for (const [x, y] of c) assert.ok(Number.isFinite(x) && Number.isFinite(y));
  }
});

test('la silueta ocupa una caja de alto 1 centrada, con la proporción del original', () => {
  const puntos = contornosLogo().flat();
  const xs = puntos.map((p) => p[0]);
  const ys = puntos.map((p) => p[1]);
  const alto = Math.max(...ys) - Math.min(...ys);
  const ancho = Math.max(...xs) - Math.min(...xs);
  assert.ok(Math.abs(alto - 1) < 0.02, `alto ${alto}`);
  assert.ok(Math.abs(ancho / alto - PROPORCION_LOGO) < 0.03, `proporción ${ancho / alto}`);
  assert.ok(Math.abs((Math.max(...ys) + Math.min(...ys)) / 2) < 0.02);
});

test('la punta de la flecha es el punto más alto y el pie de la P el más bajo', () => {
  const [p, flecha] = contornosLogo();
  const maxY = (c) => Math.max(...c.map((q) => q[1]));
  const minY = (c) => Math.min(...c.map((q) => q[1]));
  assert.ok(maxY(flecha) > maxY(p));
  assert.ok(minY(p) < minY(flecha));
});

test('más detalle solo agrega puntos en las curvas', () => {
  assert.ok(contornosLogo(3)[0].length > contornosLogo(1)[0].length);
});
