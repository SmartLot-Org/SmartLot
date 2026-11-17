import test from 'node:test';
import assert from 'node:assert/strict';
import { ANCLAS, G1, MUNDO, PORTON, RESERVADAS, puntoEnVuelta } from './mundo.js';

test('el mundo es determinista y cada malla tiene posiciones completas', () => {
  for (const [nombre, parte] of Object.entries({ ...MUNDO.ciudad, ...MUNDO.oficina, ...MUNDO.coche, ...MUNDO.persona })) {
    assert.ok(parte instanceof Float32Array, nombre);
    assert.equal(parte.length % 3, 0, nombre);
    assert.ok(parte.every(Number.isFinite), nombre);
  }
  assert.equal(MUNDO.ciudad.caras.length % 9, 0);
  assert.equal(MUNDO.ciudad.cerca.length % 6, 0);
});

test('el recorrido del trato mide unos 300 metros y termina en el portón', () => {
  assert.equal(MUNDO.ruta.metros, 300);
  assert.equal(PORTON.z, G1.z0);
  assert.ok(PORTON.x0 < 24 && PORTON.x1 > 24);
});

test('hay 25 plazas reservadas y una pila de consumos por cada una', () => {
  assert.equal(MUNDO.planta.rellenos.length, RESERVADAS * 18);
  const { losas, tapas, lados, aristas } = MUNDO.planta.consumos;
  assert.ok(losas >= RESERVADAS * 2 && losas <= RESERVADAS * 9);
  assert.equal(tapas.length, losas * 18);
  assert.equal(lados.length, losas * 72);
  assert.equal(aristas.length, losas * 72);
});

test('la vuelta a la manzana es un circuito cerrado y parejo', () => {
  const v = MUNDO.vuelta;
  assert.deepEqual(v.pts[0], v.pts.at(-1));
  const p = { x: 0, z: 0, rumbo: 0 };
  for (let s = 0; s < v.largo; s += 0.5) {
    puntoEnVuelta(v, s, p);
    assert.ok(Math.max(Math.abs(p.x), Math.abs(p.z)) <= 6.001 && Math.max(Math.abs(p.x), Math.abs(p.z)) >= 4.9);
  }
  assert.deepEqual({ ...puntoEnVuelta(v, v.largo, { x: 0, z: 0, rumbo: 0 }), rumbo: 0 }, { ...puntoEnVuelta(v, 0, { x: 0, z: 0, rumbo: 0 }), rumbo: 0 });
});

test('las anclas de los rótulos caen sobre sus edificios', () => {
  assert.equal(ANCLAS.g1[0], (G1.x0 + G1.x1) / 2);
  assert.equal(ANCLAS.sumados.length, 4);
});
