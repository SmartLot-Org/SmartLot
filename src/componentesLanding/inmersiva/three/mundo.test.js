import test from 'node:test';
import assert from 'node:assert/strict';
import { ANCLAS, EDIFICIOS, G1, GARAGES, MUNDO, OFICINA, PASO, PORTON, RESERVADAS, RUTA, SEDES, puntoEnVuelta, tapa } from './mundo.js';
import { cintaPunteada, recorrido } from './trazos.js';

// Huella de un Float32Array (FNV-1a de 32 bits sobre sus bytes): cambia con cualquier vértice.
function huella(arr) {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let h = 0x811c9dc5;
  for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

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

// ── La home no cambia: huellas calculadas con el código de antes de SEDES y trazos.js
// (commit 55a49b7). Si cambian, cambió el dibujo de la home y sus pósters quedan viejos.
test('la ciudad de la home no cambió al sumar las sedes', () => {
  assert.equal(EDIFICIOS.length, 573);
  assert.equal(huella(new Float32Array(EDIFICIOS.flatMap((e) => [e.x0, e.z0, e.x1, e.z1, e.h]))), 'bc4c58c2');
  const ciudad = Object.fromEntries(Object.entries(MUNDO.ciudad).map(([k, v]) => [k, huella(v)]));
  assert.deepEqual(ciudad, { manzanas: '97b70415', caras: '1ac05b20', cerca: 'f7706b95', lejos: 'fa40a6ad' });
});

test('los recorridos de la red de la home tienen la misma geometría que antes de trazos.js', () => {
  const red = GARAGES.slice(1).map((g) => huella(cintaPunteada(recorrido(g)).caras));
  assert.deepEqual(red, ['2b4d081b', 'a1162a41', 'c8c9352d', '363e011f', 'c1e6204d', 'db7fb139']);
});

// ── Las sedes de /para-garages ──
const centro = (b) => [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2];
const largo = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const enCalle = (v) => Math.abs((((v - 6) % PASO) + PASO) % PASO) < 1e-9;

test('las sedes son cuatro y deterministas: la oficina y tres edificios que ya existían', () => {
  assert.equal(SEDES.length, 4);
  const [oficina, ...otras] = SEDES;
  assert.deepEqual([oficina.x0, oficina.z0, oficina.x1, oficina.z1, oficina.h], [OFICINA.x0, OFICINA.z0, OFICINA.x1, OFICINA.z1, OFICINA.h]);
  assert.equal(oficina.recorrido, RUTA);
  assert.equal(oficina.metros, MUNDO.ruta.metros);
  for (const s of otras) {
    assert.ok(EDIFICIOS.some((e) => e.x0 === s.x0 && e.z0 === s.z0 && e.x1 === s.x1 && e.z1 === s.z1 && e.h === s.h), `${s.cx},${s.cz}`);
    assert.ok(s.h >= 6, 'son edificios altos');
  }
  // Fijas: los pósters de garages se sacan de este dibujo.
  assert.deepEqual(SEDES.map((s) => [s.cx, s.cz, s.metros]), [[0, 0, 300], [50.25, -2.25, 430], [69.75, 36, 740], [12, 33.75, 380]]);
  assert.deepEqual(ANCLAS.sedes, SEDES.map((s) => [s.cx, s.h + 0.3, s.cz]));
});

test('cada sede llega a tu garage por la calle, a entre 300 m y 1 km', () => {
  for (const s of SEDES) {
    const pts = s.recorrido;
    assert.equal(s.metros, Math.round(largo(pts)) * 10, `${s.cx},${s.cz}`);
    assert.ok(s.metros >= 300 && s.metros <= 1000, `${s.metros} m`);
    // Sale por una fachada de la sede, va por los ejes de las calles y entra por el portón.
    const [x, z] = pts[0];
    assert.ok([s.x0, s.x1].includes(x) || [s.z0, s.z1].includes(z), 'sale por una fachada');
    assert.ok(enCalle(pts[1][0]) || enCalle(pts[1][1]), 'llega a una calle');
    pts.slice(1).forEach((p, i) => assert.ok(p[0] === pts[i][0] || p[1] === pts[i][1], 'tramos rectos, sin diagonales'));
    assert.deepEqual(pts.slice(-2), [[24, 6], [24, G1.z0]]);
    assert.ok(PORTON.x0 < 24 && PORTON.x1 > 24);
  }
});

test('las sedes no tapan tu garage y lo rodean desde direcciones distintas', () => {
  const [gx, gz] = centro(G1);
  const rumbos = SEDES.map((s) => {
    assert.equal(tapa(s, G1), false, `${s.cx},${s.cz}`);
    assert.ok(Math.abs(s.radio - Math.hypot(s.cx - gx, s.cz - gz)) < 1e-9);
    return Math.atan2(s.cz - gz, s.cx - gx);
  });
  for (let i = 0; i < rumbos.length; i++) {
    for (let j = i + 1; j < rumbos.length; j++) {
      const d = Math.abs(((rumbos[i] - rumbos[j] + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(d >= Math.PI / 4, `sedes ${i} y ${j}: ${Math.round((d * 180) / Math.PI)}°`);
    }
  }
  // La prueba de tapar funciona: un volumen alto pegado delante de G1 sí lo tapa.
  assert.equal(tapa({ x0: 27, z0: 16, x1: 30, z1: 19, h: 9 }, G1), true);
});
