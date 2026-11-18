import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Regla de oro de la landing (ADR-008): la capa DOM nunca importa three ni
// @react-three/*. Si lo hace, three.js entero entra al bundle de entrada.
// Vale para las dos páginas del plano (ADR-014): el armazón, las piezas de cada
// página (las subcarpetas de ui/), los objetos de página y las vistas de las rutas.
const raiz = new URL('./', import.meta.url);
const CAPA_DOM = ['contenido', 'scroll', 'estado', 'ui', 'paginas'];
const VISTAS = ['Landing.jsx', 'ParaGarages.jsx'];

// Fuentes de una carpeta y de sus subcarpetas (ui/garages/, por ejemplo).
async function fuentesDe(carpeta) {
  const base = new URL(`${carpeta}/`, raiz);
  const archivos = (await readdir(base, { recursive: true })).map((a) => a.replaceAll('\\', '/'));
  return Promise.all(archivos
    .filter((a) => /\.(js|jsx)$/.test(a) && !a.endsWith('.test.js'))
    .map(async (a) => [`${carpeta}/${a}`, await readFile(new URL(a, base), 'utf8')]));
}

const vista = (nombre) => readFile(new URL(`../../vistasLanding/${nombre}`, raiz), 'utf8');
const sinComentarios = (fuente) => fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');
const sinLazy = (fuente) => fuente.replace(/lazy\(\(\) => import\([^)]*\)\)/g, '');

const IMPORTA_3D = /from\s+['"](three|three\/[^'"]*|@react-three\/[^'"]*|maath[^'"]*)['"]|from\s+['"][^'"]*\/three\/[^'"]*['"]/;

test('ningún archivo de la capa DOM importa three, @react-three ni el chunk 3D', async () => {
  const fuentes = (await Promise.all(CAPA_DOM.map(fuentesDe))).flat();
  for (const nombre of VISTAS) fuentes.push([nombre, await vista(nombre)]);
  assert.ok(fuentes.length >= 10);
  // El armazón y los objetos de página están en el recorrido.
  assert.ok(fuentes.some(([nombre]) => nombre === 'ui/PaginaPlano.jsx'));
  assert.ok(fuentes.some(([nombre]) => nombre === 'paginas/home.js'));
  for (const [nombre, fuente] of fuentes) {
    assert.doesNotMatch(sinLazy(fuente), IMPORTA_3D, nombre);
  }
});

test('el 3D solo entra por lazy() desde el objeto de página y se comunica por rig', async () => {
  // La vista de la ruta no nombra el 3D: lo trae el objeto de página.
  assert.doesNotMatch(sinComentarios(await vista('Landing.jsx')), /three\//);
  const home = await readFile(new URL('paginas/home.js', raiz), 'utf8');
  assert.equal((home.match(/three\/Experience/g) ?? []).length, 1);
  assert.match(home, /escena: lazy\(\(\) => import\('\.\.\/three\/Experience'\)\)/);
  for (const [nombre, fuente] of await fuentesDe('paginas')) {
    assert.doesNotMatch(sinLazy(sinComentarios(fuente)), /three\//, nombre);
  }
  const armazon = await readFile(new URL('ui/PaginaPlano.jsx', raiz), 'utf8');
  assert.match(armazon, /const Escena = pagina\.escena;/);
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
    assert.match(fuente, /import \{[^}]*\bvivo\b[^}]*\} from '\.\.\/vivo'/, nombre);
    assert.match(fuente, /useFrame\(\(/, nombre);
    assert.doesNotMatch(fuente, /useFrame\([^)]*\},\s*[1-9]/, nombre); // prioridad 0 siempre
  }
});
