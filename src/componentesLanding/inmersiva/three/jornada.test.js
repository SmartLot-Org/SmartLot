import test from 'node:test';
import assert from 'node:assert/strict';
import { atardecer, horaDe, ocupacion, ocupacionDe, textoHora } from './jornada.js';

test('la jornada va de las 7 a las 20 y el reloj marca de a cuarto de hora', () => {
  assert.equal(horaDe(0), 7);
  assert.equal(horaDe(1), 20);
  assert.equal(textoHora(7), '07:00');
  assert.equal(textoHora(8.6), '08:30');
  assert.equal(textoHora(19.99), '20:00');
});

test('los garages están vacíos temprano y tarde, y llenos a media mañana', () => {
  assert.ok(ocupacion(7) < 0.01);
  assert.ok(ocupacion(20) < 0.01);
  assert.ok(ocupacion(11) > 0.9);
  assert.ok(ocupacion(13.3) < ocupacion(11));   // algunos salen a almorzar
  for (let i = 0; i < 7; i++) {
    for (let h = 7; h <= 20; h += 0.25) {
      const o = ocupacionDe(i, h);
      assert.ok(o >= 0 && o <= 1, `garage ${i} a las ${h}`);
    }
  }
});

test('las ventanas se encienden solo al final de la jornada', () => {
  assert.equal(atardecer(12), 0);
  assert.equal(atardecer(20), 1);
});
