import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Ninguna animación saca texto del árbol de accesibilidad. autoAlpha pone
// visibility: hidden, y un lector de pantalla deja de encontrar lo que se oculta
// así (pasaba con las secciones ya leídas de la home). Solo lo decorativo, que ya
// está fuera del árbol con aria-hidden, puede usarlo. Cubre las piezas de cada
// página (subcarpetas de ui/, como ui/garages/) y los objetos de página.
const raiz = new URL('./', import.meta.url);
const CARPETAS = ['ui', 'scroll', 'paginas'];
const DECORATIVOS = new Set(['ui/Intro.jsx']);

const sinComentarios = (fuente) => fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');

async function fuentesDe(carpeta) {
  const base = new URL(`${carpeta}/`, raiz);
  const archivos = (await readdir(base, { recursive: true })).map((a) => a.replaceAll('\\', '/'));
  return Promise.all(archivos
    .filter((a) => /\.(js|jsx)$/.test(a) && !a.endsWith('.test.js'))
    .map(async (a) => [`${carpeta}/${a}`, await readFile(new URL(a, base), 'utf8')]));
}

test('la interfaz y el director animan el texto con opacidad, nunca con autoAlpha ni visibility', async () => {
  const fuentes = (await Promise.all(CARPETAS.map(fuentesDe))).flat();
  assert.ok(fuentes.length >= 12);
  assert.ok(fuentes.some(([nombre]) => nombre === 'ui/PaginaPlano.jsx'));
  assert.ok(fuentes.some(([nombre]) => nombre.startsWith('paginas/')));
  for (const [nombre, fuente] of fuentes) {
    if (DECORATIVOS.has(nombre)) {
      assert.match(fuente, /aria-hidden="true"/, `${nombre} solo puede usar autoAlpha si es decorativo`);
      continue;
    }
    assert.doesNotMatch(sinComentarios(fuente), /autoAlpha|visibility/, nombre);
  }
});

test('la nota desvanecida no toma el cursor y se ve entera con el foco del teclado', async () => {
  const seccion = await readFile(new URL('ui/Seccion.jsx', raiz), 'utf8');
  const estilos = await readFile(new URL('inmersiva.css', raiz), 'utf8');
  assert.match(seccion, /toggleAttribute\('data-desvanecida', this\.progress\(\) === 1\)/);
  assert.match(seccion, /return \(\) => nota\.removeAttribute\('data-desvanecida'\)/);
  assert.match(estilos, /\.plano-nota\[data-desvanecida\] \{ pointer-events: none; \}/);
  assert.match(estilos, /\.plano-nota:has\(:focus-visible\) \{ pointer-events: auto; \}/);
  assert.match(estilos, /\.plano-nota:has\(:focus-visible\) > \* \{ opacity: 1 !important; \}/);
});
