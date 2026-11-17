import test from 'node:test';
import assert from 'node:assert/strict';
import { SECCIONES } from '../contenido/secciones.js';
import { COREOGRAFIA, FX_CERO } from './coreografia.js';
import { aplicarComparacion, pesoComparacion } from './estado.js';
import { avancesFinales, componer, PESOS } from './estado.js';
import { avancesEn, largoTotal, rangosDeScroll } from './rangos.js';

test('los rangos de scroll se encadenan sin huecos y suman el largo total', () => {
  const rangos = rangosDeScroll([1, 1.5, 2]);
  assert.deepEqual(rangos[0], { inicio: 0, arriba: 0, fin: 0 });
  assert.deepEqual(rangos[1], { inicio: 0, arriba: 1, fin: 1.5 });
  assert.deepEqual(rangos[2], { inicio: 1.5, arriba: 2.5, fin: 3.5 });
  assert.equal(largoTotal([1, 1.5, 2]), 3.5);
  assert.deepEqual(avancesEn(0, [1, 1.5, 2]), [1, 0, 0]);
  assert.deepEqual(avancesEn(1.25, [1, 1.5, 2]), [1, 1.25, 0]);
  assert.deepEqual(avancesEn(3.5, [1, 1.5, 2]), [1, 1.5, 2]);
});

test('cada sección tiene encuadre horizontal y vertical, y fx con tramos válidos', () => {
  for (const s of SECCIONES) {
    const g = COREOGRAFIA[s.id];
    assert.ok(g, s.id);
    for (const c of [g.camara, g.camaraVertical]) {
      assert.ok(Number.isFinite(c.x) && Number.isFinite(c.z) && c.zoom > 0, s.id);
    }
    for (const f of g.fx) {
      assert.ok(f.clave in FX_CERO, `${s.id}: ${f.clave}`);
      assert.ok(f.desde >= 0 && f.hasta > f.desde && f.hasta <= s.weight + 1e-9, `${s.id}: ${f.clave}`);
    }
  }
});

test('al cargar se ve el encuadre del hero con el dibujo en cero', () => {
  const e = componer(avancesEn(0, PESOS), false);
  assert.equal(e.cam.x, COREOGRAFIA.gancho.camara.x);
  assert.equal(e.cam.lz, Math.log(COREOGRAFIA.gancho.camara.zoom));
  assert.deepEqual(e.fx, { ...FX_CERO });
});

test('al final de cada sección la cámara está en su encuadre', () => {
  SECCIONES.forEach((s, i) => {
    for (const vertical of [false, true]) {
      const e = componer(avancesFinales(i), vertical);
      const c = vertical ? COREOGRAFIA[s.id].camaraVertical : COREOGRAFIA[s.id].camara;
      assert.ok(Math.abs(e.cam.x - c.x) < 1e-9 && Math.abs(e.cam.z - c.z) < 1e-9, s.id);
      assert.ok(Math.abs(e.cam.lz - Math.log(c.zoom)) < 1e-9, s.id);
    }
  });
});

test('el relato es continuo: un paso chico de scroll nunca produce un salto', () => {
  const total = largoTotal(PESOS);
  const paso = 0.002;
  let antes = componer(avancesEn(0, PESOS), false);
  for (let p = paso; p <= total; p += paso) {
    const ahora = componer(avancesEn(p, PESOS), false);
    assert.ok(Math.abs(ahora.cam.lz - antes.cam.lz) < 0.02, `zoom en ${p.toFixed(3)}`);
    assert.ok(Math.hypot(ahora.cam.x - antes.cam.x, ahora.cam.z - antes.cam.z) < 0.2, `cámara en ${p.toFixed(3)}`);
    for (const k in FX_CERO) assert.ok(Math.abs(ahora.fx[k] - antes.fx[k]) < 0.02, `${k} en ${p.toFixed(3)}`);
    antes = ahora;
  }
});

test('el relato es reversible: el estado depende solo de la posición', () => {
  const ida = [0.4, 2.1, 5.3, 8.2].map((p) => JSON.stringify(componer(avancesEn(p, PESOS), true)));
  const vuelta = [8.2, 5.3, 2.1, 0.4].map((p) => JSON.stringify(componer(avancesEn(p, PESOS), true))).reverse();
  assert.deepEqual(ida, vuelta);
});

test('el guion cierra: la ruta queda trazada, el garage con techo y más garages marcados', () => {
  const fin = componer(avancesFinales(SECCIONES.length - 1), false).fx;
  assert.equal(fin.traza, 1);
  assert.equal(fin.trato, 1);
  assert.equal(fin.tapa, 0);
  assert.equal(fin.consumos, 0);
  assert.equal(fin.acceso, 0);
  assert.equal(fin.vueltas, 0);
  assert.equal(fin.red, 1);
});

test('antes / con SmartLot: solo pesa en el problema y lleva al estado del trato', () => {
  const iProblema = SECCIONES.findIndex((s) => s.id === 'problema');
  const enProblema = avancesFinales(iProblema);
  assert.equal(pesoComparacion(avancesFinales(0)), 0);
  assert.equal(pesoComparacion(enProblema), 1);
  assert.equal(pesoComparacion(avancesFinales(SECCIONES.length - 1)), 0);

  const antes = componer(enProblema, false);
  const sinCambio = aplicarComparacion(componer(enProblema, false), 0, enProblema, false);
  assert.deepEqual(sinCambio, antes);

  const despues = aplicarComparacion(componer(enProblema, false), 1, enProblema, false);
  assert.equal(despues.fx.vueltas, 0);
  assert.equal(despues.fx.traza, 1);
  assert.equal(despues.fx.trato, 1);
  assert.ok(Math.abs(despues.cam.x - COREOGRAFIA.idea.camara.x) < 1e-9);
});
