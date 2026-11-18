import test from 'node:test';
import assert from 'node:assert/strict';
import { SECCIONES } from '../contenido/secciones.js';
import { COREOGRAFIA, FX_CERO } from './coreografia.js';
import { aplicarComparacion, avancesFinales, componer, PESOS } from './estado.js';
import { crearGuion, nuevoEstado } from './guion.js';
import { avancesEn, largoTotal } from './rangos.js';

// ── Referencia: estado.js tal como estaba antes de crearGuion (commit 5c6eedc) ──
// Se copia acá para que la comparación no sea consigo misma: el guion por página
// tiene que dar, número por número, lo mismo que la home componía antes.
const limitarAntes = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const suaveAntes = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);
const mezclaAntes = (a, b, t) => a + (b - a) * t;
const GUION_ANTES = SECCIONES.map((s) => ({ ...COREOGRAFIA[s.id], id: s.id, weight: s.weight }));
const PESOS_ANTES = GUION_ANTES.map((g) => g.weight);
const avancesFinalesAntes = (indice) => PESOS_ANTES.map((peso, i) => (i <= indice ? peso : 0));

function componerAntes(avances, vertical) {
  const destino = { cam: { x: 0, z: 0, lz: 0 }, fx: { ...FX_CERO } };
  const encuadre = (g) => (vertical ? g.camaraVertical : g.camara);
  const c0 = encuadre(GUION_ANTES[0]);
  let x = c0.x;
  let z = c0.z;
  let lz = Math.log(c0.zoom);
  const fx = destino.fx;
  for (const k in FX_CERO) fx[k] = 0;
  for (let i = 0; i < GUION_ANTES.length; i++) {
    const g = GUION_ANTES[i];
    const u = Math.min(Math.max(avances[i] ?? 0, 0), g.weight);
    if (i > 0) {
      const t = suaveAntes(limitarAntes(u));
      const c = encuadre(g);
      x = mezclaAntes(x, c.x, t);
      z = mezclaAntes(z, c.z, t);
      lz = mezclaAntes(lz, Math.log(c.zoom), t);
    }
    for (const f of g.fx) {
      const t = limitarAntes((u - f.desde) / (f.hasta - f.desde));
      fx[f.clave] = mezclaAntes(fx[f.clave], f.valor, t);
    }
  }
  destino.cam.x = x;
  destino.cam.z = z;
  destino.cam.lz = lz;
  return destino;
}

const I_PROBLEMA = GUION_ANTES.findIndex((g) => g.id === 'problema');
const I_IDEA = GUION_ANTES.findIndex((g) => g.id === 'idea');
function compararAntes(destino, comparar, avances, vertical) {
  const peso = limitarAntes(avances[I_PROBLEMA] ?? 0) * (1 - limitarAntes((avances[I_IDEA] ?? 0) * 2));
  const k = suaveAntes(limitarAntes(comparar)) * peso;
  if (k <= 0) return destino;
  const g = GUION_ANTES[I_IDEA];
  const c = vertical ? g.camaraVertical : g.camara;
  destino.cam.x = mezclaAntes(destino.cam.x, c.x, k);
  destino.cam.z = mezclaAntes(destino.cam.z, c.z, k);
  destino.cam.lz = mezclaAntes(destino.cam.lz, Math.log(c.zoom), k);
  destino.fx.vueltas = mezclaAntes(destino.fx.vueltas, 0, k);
  destino.fx.traza = mezclaAntes(destino.fx.traza, 1, k);
  destino.fx.trato = mezclaAntes(destino.fx.trato, 1, limitarAntes((k - 0.3) / 0.7));
  return destino;
}

const HOME = { secciones: SECCIONES, guion: { coreografia: COREOGRAFIA } };

// Avances al azar pero repetibles (LCG), también fuera de rango y con huecos.
function* avancesAlAzar(cantidad) {
  let semilla = 20261118;
  const azar = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let n = 0; n < cantidad; n++) {
    yield PESOS_ANTES.map((peso) => (azar() < 0.1 ? undefined : -0.5 + azar() * (peso + 1)));
  }
}

test('con la home, crearGuion da los mismos pesos y estados finales que antes', () => {
  const guion = crearGuion(HOME);
  assert.deepEqual(guion.pesos, PESOS_ANTES);
  assert.deepEqual(PESOS, PESOS_ANTES);
  SECCIONES.forEach((_, i) => {
    assert.deepEqual(guion.avancesFinales(i), avancesFinalesAntes(i));
    assert.deepEqual(avancesFinales(i), avancesFinalesAntes(i));
  });
});

test('con la home, crearGuion compone exactamente lo mismo que antes en todo el recorrido', () => {
  const guion = crearGuion(HOME);
  const total = largoTotal(PESOS_ANTES);
  // Como el rig: un destino que se reutiliza de una escritura a la otra.
  const destino = nuevoEstado();
  for (const vertical of [false, true]) {
    const casos = [];
    for (let p = 0; p <= total + 1e-9; p += 0.01) casos.push(avancesEn(p, PESOS_ANTES));
    SECCIONES.forEach((_, i) => casos.push(avancesFinalesAntes(i)));
    casos.push([], [1], PESOS_ANTES.map(() => 99), PESOS_ANTES.map(() => -3), ...avancesAlAzar(400));
    for (const avances of casos) {
      const antes = componerAntes(avances, vertical);
      const donde = `${vertical ? 'vertical' : 'horizontal'} ${JSON.stringify(avances)}`;
      assert.deepEqual(guion.componer(avances, vertical), antes, donde);
      assert.deepEqual(guion.componer(avances, vertical, destino), antes, donde);
      assert.deepEqual(componer(avances, vertical), antes, donde);
    }
  }
});

test('el deslizador de la home recompone igual que antes sobre el guion nuevo', () => {
  const guion = crearGuion(HOME);
  const casos = [...SECCIONES.map((_, i) => avancesFinalesAntes(i)), ...avancesAlAzar(200)];
  for (const vertical of [false, true]) {
    for (const avances of casos) {
      for (const comparar of [0, 0.2, 0.5, 0.8, 1]) {
        const antes = compararAntes(componerAntes(avances, vertical), comparar, avances, vertical);
        const ahora = aplicarComparacion(guion.componer(avances, vertical), comparar, avances, vertical);
        assert.deepEqual(ahora, antes, `${comparar} ${JSON.stringify(avances)}`);
      }
    }
  }
});

// Una página mínima, para probar lo que la home no usa.
const congelar = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') congelar(v);
  return Object.freeze(o);
};
const PRUEBA = congelar({
  secciones: [{ id: 'uno', weight: 1 }, { id: 'dos', weight: 2 }],
  guion: {
    coreografia: {
      uno: { camara: { x: 0, z: 0, zoom: 1 }, camaraVertical: { x: 1, z: 1, zoom: 0.8 }, fx: [] },
      dos: {
        camara: { x: 10, z: 5, zoom: 4 },
        camaraVertical: { x: 9, z: 4, zoom: 3 },
        fx: [
          { clave: 'red', valor: 1, desde: 0, hasta: 1 },
          { clave: 'traza', valor: 0, desde: 1, hasta: 2 },
        ],
      },
    },
    inicial: { traza: 1 },
  },
});

test('inicial fija el arranque de los fx y las secciones parten de ahí', () => {
  const guion = crearGuion(PRUEBA);
  assert.deepEqual(guion.pesos, [1, 2]);

  const alCargar = guion.componer(guion.avancesFinales(0), false);
  assert.deepEqual(alCargar.fx, { ...FX_CERO, traza: 1 });
  assert.deepEqual(alCargar.cam, { x: 0, z: 0, lz: 0 });

  const aMitad = guion.componer([1, 1.5], false);
  assert.equal(aMitad.fx.traza, 0.5);
  assert.equal(aMitad.fx.red, 1);

  const alFinal = guion.componer(guion.avancesFinales(1), true);
  assert.equal(alFinal.fx.traza, 0);
  assert.ok(Math.abs(alFinal.cam.x - 9) < 1e-9 && Math.abs(alFinal.cam.lz - Math.log(3)) < 1e-9);

  // Un destino reutilizado vuelve al arranque en cada escritura, sin arrastrar valores.
  const destino = nuevoEstado();
  destino.fx.traza = 0.3;
  destino.fx.vueltas = 0.7;
  guion.componer([1, 0], false, destino);
  assert.equal(destino.fx.traza, 1);
  assert.equal(destino.fx.vueltas, 0);
});

test('sin inicial los fx parten de FX_CERO, que es el estado de la home', () => {
  const guion = crearGuion({ ...PRUEBA, guion: { coreografia: PRUEBA.guion.coreografia } });
  assert.deepEqual(guion.componer([1, 0], false).fx, { ...FX_CERO });
});

test('crearGuion es puro y avisa si a una sección le falta su coreografía', () => {
  // PRUEBA está congelada: si crearGuion o componer la modificaran, esto tiraría.
  const guion = crearGuion(PRUEBA);
  guion.componer(guion.avancesFinales(1), false);
  assert.equal(PRUEBA.guion.inicial.traza, 1);
  assert.throws(
    () => crearGuion({ secciones: [{ id: 'suelta', weight: 1 }], guion: { coreografia: {} } }),
    /suelta/,
  );
});
