import test from 'node:test';
import assert from 'node:assert/strict';
import { SECCIONES } from '../contenido/garages.js';
import { FX_CERO } from './coreografia.js';
import { COREOGRAFIA_GARAGES, INICIAL_GARAGES } from './coreografiaGarages.js';
import { crearGuion } from './guion.js';
import { avancesEn, largoTotal } from './rangos.js';

const GUION = crearGuion({ secciones: SECCIONES, guion: { coreografia: COREOGRAFIA_GARAGES, inicial: INICIAL_GARAGES } });
const { pesos, componer, avancesFinales } = GUION;
const total = largoTotal(pesos);
const recorrer = (vertical, paso = 0.002) => {
  const estados = [];
  for (let p = 0; p <= total + 1e-9; p += paso) estados.push(componer(avancesEn(p, pesos), vertical));
  return estados;
};

test('cada sección de garages tiene encuadre horizontal y vertical, y fx con tramos válidos', () => {
  assert.deepEqual(Object.keys(COREOGRAFIA_GARAGES), SECCIONES.map((s) => s.id));
  for (const s of SECCIONES) {
    const g = COREOGRAFIA_GARAGES[s.id];
    for (const c of [g.camara, g.camaraVertical]) {
      assert.ok(Number.isFinite(c.x) && Number.isFinite(c.z) && c.zoom > 0, s.id);
    }
    for (const f of g.fx) {
      assert.ok(f.clave in FX_CERO, `${s.id}: ${f.clave}`);
      assert.ok(f.desde >= 0 && f.hasta > f.desde && f.hasta <= s.weight + 1e-9, `${s.id}: ${f.clave}`);
      assert.ok(f.valor >= 0 && f.valor <= 1, `${s.id}: ${f.clave}`);
    }
  }
  for (const clave of Object.keys(INICIAL_GARAGES)) assert.ok(clave in FX_CERO, clave);
});

test('al cargar, tu garage está fuera del mapa y las sedes ya están marcadas', () => {
  for (const vertical of [false, true]) {
    const e = componer(avancesEn(0, pesos), vertical);
    const c = vertical ? COREOGRAFIA_GARAGES.gancho.camaraVertical : COREOGRAFIA_GARAGES.gancho.camara;
    assert.equal(e.cam.x, c.x);
    assert.equal(e.cam.lz, Math.log(c.zoom));
    assert.deepEqual(e.fx, { ...FX_CERO, fuera: 1, sedes: 1 });
  }
});

test('al final de cada sección la cámara está en su encuadre', () => {
  SECCIONES.forEach((s, i) => {
    for (const vertical of [false, true]) {
      const e = componer(avancesFinales(i), vertical);
      const c = vertical ? COREOGRAFIA_GARAGES[s.id].camaraVertical : COREOGRAFIA_GARAGES[s.id].camara;
      assert.ok(Math.abs(e.cam.x - c.x) < 1e-9 && Math.abs(e.cam.z - c.z) < 1e-9, s.id);
      assert.ok(Math.abs(e.cam.lz - Math.log(c.zoom)) < 1e-9, s.id);
    }
  });
});

test('el relato es continuo: un paso chico de scroll nunca produce un salto', () => {
  for (const vertical of [false, true]) {
    const estados = recorrer(vertical);
    for (let i = 1; i < estados.length; i++) {
      const [antes, ahora] = [estados[i - 1], estados[i]];
      const donde = `${vertical ? 'vertical' : 'horizontal'} ${(i * 0.002).toFixed(3)}`;
      assert.ok(Math.abs(ahora.cam.lz - antes.cam.lz) < 0.02, `zoom en ${donde}`);
      assert.ok(Math.hypot(ahora.cam.x - antes.cam.x, ahora.cam.z - antes.cam.z) < 0.2, `cámara en ${donde}`);
      for (const k in FX_CERO) assert.ok(Math.abs(ahora.fx[k] - antes.fx[k]) < 0.02, `${k} en ${donde}`);
    }
  }
});

test('el relato es reversible: el estado depende solo de la posición', () => {
  const posiciones = [0.4, 1.7, 3.1, 4.6, 6.2, 7.5, 8.6];
  const ida = posiciones.map((p) => JSON.stringify(componer(avancesEn(p, pesos), true)));
  const vuelta = [...posiciones].reverse().map((p) => JSON.stringify(componer(avancesEn(p, pesos), true))).reverse();
  assert.deepEqual(ida, vuelta);
});

test('el cierre: tu garage en el mapa, el trato aceptado, el techo puesto y las rutas llegando', () => {
  const fin = componer(avancesFinales(SECCIONES.length - 1), false).fx;
  assert.equal(fin.fuera, 0);
  assert.equal(fin.trato, 1);
  assert.equal(fin.tapa, 0);
  assert.equal(fin.consumos, 0);
  assert.equal(fin.llegan, 1);
  assert.equal(fin.sedes, 1);
  assert.equal(fin.vueltas, 0);
});

test('cada cosa pasa en su sección y en orden', () => {
  const final = (id) => componer(avancesFinales(SECCIONES.findIndex((s) => s.id === id)), false).fx;
  // Hasta el problema, tu garage sigue fuera del mapa.
  assert.equal(final('problema').fuera, 1);
  assert.equal(final('problema').ficha, 0);
  // En el mapa entra al mapa, la búsqueda lo encuentra y la flecha lleva a su tarjeta.
  assert.equal(final('mapa').fuera, 0);
  assert.equal(final('mapa').busqueda, 1);
  assert.equal(final('mapa').ficha, 1);
  assert.equal(final('mapa').vueltas, 0);
  // La tarjeta de la búsqueda no sigue en el pedido.
  assert.equal(final('trato').ficha, 0);
  // El trato se acepta en su sección y la ocupación la mueven las reservas en la operación.
  assert.equal(final('trato').trato, 1);
  assert.equal(final('trato').llenas, 0);
  assert.equal(final('operacion').llenas, 1);
  assert.equal(final('operacion').consumos, 1);
  assert.equal(final('control').busqueda, 1);
  assert.equal(final('control').tapa, 0);
});

test('el techo se pinta recién con la ruta completa, y la flecha sale cuando tu garage ya está en el mapa', () => {
  for (const e of recorrer(false, 0.005)) {
    // Regla 5: nada se activa antes de que llegue el pedido.
    if (e.fx.trato > 0) assert.equal(e.fx.traza, 1);
    // La flecha señala tu garage en el mapa: nunca mientras está fuera de él, y nunca a la
    // vez que la línea del pedido.
    if (e.fx.ficha > 0) {
      assert.equal(e.fx.fuera, 0, `ficha ${e.fx.ficha}, fuera ${e.fx.fuera}`);
      assert.equal(e.fx.traza, 0, `ficha ${e.fx.ficha}, traza ${e.fx.traza}`);
    }
  }
});

test('en mapa, primero aparecen las distancias y después la flecha', () => {
  const { fx } = COREOGRAFIA_GARAGES.mapa;
  const tramo = (clave) => fx.find((f) => f.clave === clave);
  assert.ok(tramo('fuera').hasta <= tramo('busqueda').desde);
  assert.ok(tramo('busqueda').desde < tramo('ficha').desde);
  // La flecha termina dentro de la estadía, con lugar para leer la tarjeta antes de irse.
  assert.ok(tramo('ficha').hasta <= SECCIONES.find((s) => s.id === 'mapa').weight - 0.15);
});
