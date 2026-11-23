import test from 'node:test';
import assert from 'node:assert/strict';
import { SECCIONES } from '../contenido/garages.js';
import { useGarages } from '../estado/garages.js';
import { aplicarVisibilidad, GUION_GARAGES, pesoVisibilidad } from './ajustesGarages.js';
import { COREOGRAFIA_GARAGES, INICIAL_GARAGES } from './coreografiaGarages.js';
import { crearGuion } from './guion.js';
import { avancesEn, largoTotal } from './rangos.js';

const { pesos, componer, avancesFinales } = crearGuion({ secciones: SECCIONES, guion: GUION_GARAGES });
const indice = (id) => SECCIONES.findIndex((s) => s.id === id);

test('el guion de garages trae su coreografía, su arranque y el interruptor', () => {
  assert.equal(GUION_GARAGES.coreografia, COREOGRAFIA_GARAGES);
  assert.equal(GUION_GARAGES.inicial, INICIAL_GARAGES);
  assert.equal(typeof GUION_GARAGES.ajustar, 'function');
  assert.equal(typeof GUION_GARAGES.suscribir, 'function');
});

test('el interruptor pesa solo en control', () => {
  assert.equal(pesoVisibilidad(avancesFinales(0)), 0);
  assert.equal(pesoVisibilidad(avancesFinales(indice('operacion'))), 0);
  assert.equal(pesoVisibilidad(avancesFinales(indice('control'))), 1);
  assert.equal(pesoVisibilidad(avancesFinales(SECCIONES.length - 1)), 0);
  // Entra y sale de a poco, sin saltos.
  const total = largoTotal(pesos);
  let antes = pesoVisibilidad(avancesEn(0, pesos));
  for (let p = 0.002; p <= total; p += 0.002) {
    const ahora = pesoVisibilidad(avancesEn(p, pesos));
    assert.ok(Math.abs(ahora - antes) < 0.02, `en ${p.toFixed(3)}`);
    antes = ahora;
  }
});

test('con "En borrador", en control tu garage sale del mapa y nada más cambia', () => {
  const enControl = avancesFinales(indice('control'));
  const visible = componer(enControl, false);
  assert.equal(visible.fx.fuera, 0);
  assert.deepEqual(aplicarVisibilidad(componer(enControl, false), true, enControl), visible);

  const borrador = aplicarVisibilidad(componer(enControl, true), false, enControl);
  const esperado = componer(enControl, true);
  esperado.fx.fuera = 1;
  assert.deepEqual(borrador, esperado);
});

test('fuera de control, "En borrador" no cambia el dibujo', () => {
  for (const id of ['gancho', 'problema', 'mapa', 'trato', 'operacion', 'accion']) {
    const avances = avancesFinales(indice(id));
    assert.deepEqual(aplicarVisibilidad(componer(avances, false), false, avances), componer(avances, false), id);
  }
});

test('el interruptor no toca la flecha ni la tarjeta de la búsqueda', () => {
  // En control la ficha ya se fue; en mapa el borrador no pesa.
  for (const id of ['mapa', 'control']) {
    const avances = avancesFinales(indice(id));
    const borrador = aplicarVisibilidad(componer(avances, false), false, avances);
    assert.equal(borrador.fx.ficha, componer(avances, false).fx.ficha, id);
  }
  assert.equal(componer(avancesFinales(indice('control')), false).fx.ficha, 0);
});

test('ajustar lee el interruptor y suscribir recompone solo cuando cambia', () => {
  const enControl = avancesFinales(indice('control'));
  const llamadas = [];
  const soltar = GUION_GARAGES.suscribir(() => llamadas.push(useGarages.getState().visible));
  try {
    useGarages.getState().setVisible(false);
    assert.equal(GUION_GARAGES.ajustar(componer(enControl, false), enControl, false).fx.fuera, 1);
    useGarages.getState().setVisible(false);
    useGarages.getState().setVisible(true);
    assert.equal(GUION_GARAGES.ajustar(componer(enControl, false), enControl, false).fx.fuera, 0);
    assert.deepEqual(llamadas, [false, true]);
  } finally {
    soltar();
    useGarages.getState().setVisible(true);
  }
  useGarages.getState().setVisible(false);
  assert.equal(llamadas.length, 2, 'después de soltar no recompone');
  useGarages.getState().setVisible(true);
});
