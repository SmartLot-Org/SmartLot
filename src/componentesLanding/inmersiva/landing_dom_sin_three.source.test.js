import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Regla de oro de la landing (ADR-008): la capa DOM nunca importa three ni
// @react-three/*. Si lo hace, three.js entero entra al bundle de entrada.
const raiz = new URL('./', import.meta.url);
const CAPA_DOM = ['contenido', 'scroll', 'estado', 'ui'];

async function fuentesDe(carpeta) {
  const archivos = await readdir(new URL(`${carpeta}/`, raiz));
  return Promise.all(archivos
    .filter((a) => /\.(js|jsx)$/.test(a) && !a.endsWith('.test.js'))
    .map(async (a) => [`${carpeta}/${a}`, await readFile(new URL(`${carpeta}/${a}`, raiz), 'utf8')]));
}

const IMPORTA_3D = /from\s+['"](three|three\/[^'"]*|@react-three\/[^'"]*|maath[^'"]*)['"]|from\s+['"][^'"]*\/three\/[^'"]*['"]/;

test('ningún archivo de la capa DOM importa three, @react-three ni el chunk 3D', async () => {
  const fuentes = (await Promise.all(CAPA_DOM.map(fuentesDe))).flat();
  fuentes.push(['Landing.jsx', await readFile(new URL('../../vistasLanding/Landing.jsx', raiz), 'utf8')]);
  assert.ok(fuentes.length >= 10);
  for (const [nombre, fuente] of fuentes) {
    const sinLazy = fuente.replace(/lazy\(\(\) => import\([^)]*\)\)/g, '');
    assert.doesNotMatch(sinLazy, IMPORTA_3D, nombre);
  }
});

test('el 3D solo entra por lazy() y se comunica por rig', async () => {
  const landing = await readFile(new URL('../../vistasLanding/Landing.jsx', raiz), 'utf8');
  assert.equal((landing.match(/three\/Experience/g) ?? []).length, 1);
  const rig = await readFile(new URL('scroll/rig.js', raiz), 'utf8');
  assert.match(rig, /requestFrame: \(\) => \{\}/);
  const director = await readFile(new URL('scroll/useStoryTimeline.js', raiz), 'utf8');
  assert.match(director, /scrub: true/);
});

test('las escenas leen el estado amortiguado y no escriben rig', async () => {
  const escenas = await fuentesDe('three/escenas');
  assert.ok(escenas.length >= 5);
  for (const [nombre, fuente] of escenas) {
    assert.doesNotMatch(fuente, /scroll\/rig/, nombre);
    assert.match(fuente, /useFrame\(\(/, nombre);
    assert.doesNotMatch(fuente, /useFrame\([^)]*\},\s*[1-9]/, nombre); // prioridad 0 siempre
  }
});
