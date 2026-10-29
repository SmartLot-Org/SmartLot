import test from 'node:test';
import assert from 'node:assert/strict';
import { encuadreEn, pasoActivo, posicionPaso, suavizar } from './recorridoLanding.js';
import { ENCUADRES, ENCUADRES_VERTICAL } from '../componentesLanding/landing/recorrido/camaras.js';
import { recorrido } from '../componentesLanding/landing/contenido.js';

const TOTAL = recorrido.pasos.length;

test('suavizar queda en 0 antes del tramo, en 1 después y es simétrica en el medio', () => {
  assert.equal(suavizar(0.25, 0.75, 0), 0);
  assert.equal(suavizar(0.25, 0.75, 1), 1);
  assert.equal(suavizar(0.25, 0.75, 0.5), 0.5);
});

test('el paso activo es el panel que ocupa el viewport', () => {
  assert.equal(pasoActivo(0, TOTAL), 0);
  assert.equal(pasoActivo(0.25, TOTAL), 1);
  assert.equal(pasoActivo(0.5, TOTAL), 2);
  assert.equal(pasoActivo(1, TOTAL), TOTAL - 1);
  // Fuera de rango (antes o después del escenario fijo) queda en los extremos.
  assert.equal(pasoActivo(-0.3, TOTAL), 0);
  assert.equal(pasoActivo(1.4, TOTAL), TOTAL - 1);
});

test('la escena queda quieta alrededor de cada paso y viaja entre pasos', () => {
  const porPaso = 1 / (TOTAL - 1);
  for (let i = 0; i < TOTAL; i++) {
    assert.equal(posicionPaso(i * porPaso, TOTAL), i, `centrado en el paso ${i}`);
  }
  // Estadía: un 20 % de paso después del centro todavía no se movió.
  assert.equal(posicionPaso(0.2 * porPaso, TOTAL), 0);
  // A mitad de camino entre dos pasos está a mitad del viaje.
  assert.equal(posicionPaso(1.5 * porPaso, TOTAL), 1.5);
});

test('la posición crece con el scroll y deshace lo mismo al volver', () => {
  let anterior = -Infinity;
  for (let k = 0; k <= 400; k++) {
    const actual = posicionPaso(k / 400, TOTAL);
    assert.ok(actual >= anterior, `monótona en ${k / 400}`);
    anterior = actual;
  }
  assert.equal(posicionPaso(0.37, TOTAL), posicionPaso(0.37, TOTAL));
});

test('cada paso tiene encuadre horizontal y vertical', () => {
  assert.equal(ENCUADRES.length, TOTAL);
  assert.equal(ENCUADRES_VERTICAL.length, TOTAL);
  for (const encuadre of [...ENCUADRES, ...ENCUADRES_VERTICAL]) {
    assert.equal(encuadre.posicion.length, 3);
    assert.equal(encuadre.objetivo.length, 3);
  }
});

test('encuadreEn devuelve el encuadre exacto en cada paso y mezcla entre dos', () => {
  for (let i = 0; i < TOTAL; i++) {
    assert.deepEqual(encuadreEn(i, ENCUADRES), ENCUADRES[i]);
  }
  const medio = encuadreEn(0.5, ENCUADRES);
  medio.posicion.forEach((valor, k) => {
    assert.equal(valor, (ENCUADRES[0].posicion[k] + ENCUADRES[1].posicion[k]) / 2);
  });
  assert.deepEqual(encuadreEn(99, ENCUADRES), ENCUADRES[TOTAL - 1]);
});

test('encuadreEn reutiliza el objeto de salida (sin basura por frame)', () => {
  const salida = { posicion: [0, 0, 0], objetivo: [0, 0, 0] };
  assert.equal(encuadreEn(1.25, ENCUADRES, salida), salida);
});
