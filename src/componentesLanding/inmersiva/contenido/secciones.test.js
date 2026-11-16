import test from 'node:test';
import assert from 'node:assert/strict';
import { CTA, DEMO, SECCIONES } from './secciones.js';

test('hay entre cinco y ocho secciones con ids únicos', () => {
  assert.ok(SECCIONES.length >= 5 && SECCIONES.length <= 8);
  const ids = SECCIONES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z]+$/);
});

test('cada título tiene de 3 a 8 palabras y cada cuerpo, de 1 a 3 oraciones', () => {
  for (const s of SECCIONES) {
    const palabras = s.titulo.trim().split(/\s+/).length;
    assert.ok(palabras >= 3 && palabras <= 8, `${s.id}: ${palabras} palabras`);
    const oraciones = s.cuerpo.split(/[.!?]+/).filter((o) => o.trim()).length;
    assert.ok(oraciones >= 1 && oraciones <= 3, `${s.id}: ${oraciones} oraciones`);
  }
});

test('el weight de cada sección está entre 0,8 y 2,5 pantallas', () => {
  for (const s of SECCIONES) assert.ok(s.weight >= 0.8 && s.weight <= 2.5, s.id);
});

test('la CTA va solo en el hero y en la última sección, con la misma etiqueta', () => {
  const conCta = SECCIONES.filter((s) => s.cta).map((s) => s.id);
  assert.deepEqual(conCta, [SECCIONES[0].id, SECCIONES.at(-1).id]);
  assert.equal(CTA.principal.etiqueta, 'Registrate');
  assert.equal(CTA.principal.destino, '/register');
  assert.equal(CTA.secundaria.destino, '/para-garages');
});

test('cada sección describe su figura para la versión sin 3D', () => {
  for (const s of SECCIONES) assert.ok(s.figura && s.figura.length > 30, s.id);
});

test('el copy usa voseo y no promete IA ni métricas de satisfacción', () => {
  const todo = JSON.stringify({ SECCIONES, CTA, DEMO });
  assert.doesNotMatch(todo, /Regístrate|Crea tu|Pide |Elige |tú /);
  assert.doesNotMatch(todo, /\bIA\b|inteligencia artificial/i);
  assert.doesNotMatch(todo, /4[.,]9|4[.,]8|24\/7|satisfacci/i);
});

test('los consumos de ejemplo suman lo que dice el total', () => {
  const pesos = (t) => Number(t.replace(/[^\d]/g, ''));
  const suma = DEMO.consumos.filas.reduce((acc, f) => acc + pesos(f.importe), 0);
  assert.equal(suma, pesos(DEMO.consumos.total.importe));
  for (const f of DEMO.consumos.filas) {
    const [, h, m] = f.tiempo.match(/(\d+) h (\d+) min/);
    assert.equal(Math.round((Number(h) + Number(m) / 60) * pesos(f.tarifa)), pesos(f.importe), f.reserva);
  }
});
