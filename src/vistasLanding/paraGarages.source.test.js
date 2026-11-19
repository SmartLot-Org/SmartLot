import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { CTA, ENLACE } from '../componentesLanding/inmersiva/contenido/garages.js';
import { useGarages } from '../componentesLanding/inmersiva/estado/garages.js';

// /para-garages es el armazón del plano con el objeto de página de garages
// (docs/specs/SPEC-landing-garages.md). La página anterior, con vidrio, ticker,
// partículas y su propia barra, se retiró entera.
const src = new URL('../', import.meta.url);
const leer = (ruta) => readFile(new URL(ruta, src), 'utf8');
const sinComentarios = (fuente) => fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');

const app = await leer('App.jsx');
const vista = await leer('vistasLanding/ParaGarages.jsx');
const pagina = await leer('componentesLanding/inmersiva/paginas/garages.js');
const register = await leer('pages/Register.jsx');
const indexCss = await leer('index.css');
const estilos = await leer('componentesLanding/inmersiva/garages.css');
const pieza = (nombre) => leer(`componentesLanding/inmersiva/ui/garages/${nombre}.jsx`);

async function fuentesDe(carpeta) {
  const base = new URL(carpeta, src);
  const archivos = await readdir(base, { recursive: true });
  return Promise.all(archivos
    .map((a) => a.replaceAll('\\', '/'))
    .filter((a) => /\.(js|jsx|css)$/.test(a))
    .map(async (a) => [`${carpeta}${a}`, await readFile(new URL(a, base), 'utf8')]));
}

test('la ruta sigue en lazy() (ADR-006) y solo arma la página con el armazón', () => {
  assert.match(app, /const ParaGarages = lazy\(\(\) => import\("\.\/vistasLanding\/ParaGarages"\)\);/);
  assert.match(app, /<Route path="\/para-garages" element=\{<ParaGarages \/>\} \/>/);
  assert.match(vista, /export default function ParaGarages\(\) \{\n {2}return <PaginaPlano pagina=\{PAGINA_GARAGES\} \/>;/);
  assert.match(vista, /from '\.\.\/componentesLanding\/inmersiva\/ui\/PaginaPlano'/);
});

test('la CTA de la página, la del hero y la de la barra, abre el alta de dueño; el enlace vuelve a la home', () => {
  assert.deepEqual(CTA, { etiqueta: 'Registrá tu garage', destino: '/register?modo=garage' });
  assert.deepEqual(ENLACE, { etiqueta: 'Para empresas', destino: '/' });
  assert.match(pagina, /cta: CTA,/);
  assert.match(pagina, /enlace: ENLACE,/);
  // El registro abre el formulario de dueño con ese parámetro.
  assert.match(register, /searchParams\.get\("modo"\) === "garage" \? MODO_GARAGE/);
});

test('el objeto de página toma la escena del archivo del 3D y no trae el cajetín de la home', () => {
  assert.match(pagina, /import \{ ESCENA, GUION, POSTERS \} from '\.\/garagesEscena';/);
  assert.match(pagina, /escena: ESCENA,\n {2}guion: GUION,\n {2}posters: POSTERS,/);
  assert.match(pagina, /intro: false/);
  assert.match(pagina, /import '\.\.\/garages\.css';/);
  assert.match(pagina, /busqueda: \{ componente: FichaBusqueda \}/);
  assert.match(pagina, /consumos: \{ componente: TablaConsumosGarage \}/);
  assert.match(pagina, /visibilidad: \{ componente: Visibilidad, reemplazaFigura: true \}/);
});

test('el interruptor es un switch accesible que anuncia el cambio y escribe el estado de garages', async () => {
  const visibilidad = await pieza('Visibilidad');
  assert.match(visibilidad, /<button\s+type="button"\s+role="switch"\s+aria-checked=\{visible\}/);
  assert.match(visibilidad, /aria-describedby=\{`\$\{id\}-estado`\}/);
  assert.match(visibilidad, /aria-live="polite" aria-atomic="true"/);
  assert.match(visibilidad, /onClick=\{\(\) => setVisible\(!visible\)\}/);
  // El renglón entero es el objetivo: 48 px de alto y sin la demora del doble toque.
  assert.match(estilos, /\.plano \[data-ui='visibilidad'\] button \{[^}]*min-height: 48px;[^}]*touch-action: manipulation;/);
  // Visible por defecto; el 3D lo lee fuera de React con getState y subscribe.
  assert.equal(useGarages.getState().visible, true);
  const vistos = [];
  const soltar = useGarages.subscribe((s) => vistos.push(s.visible));
  useGarages.getState().setVisible(false);
  useGarages.getState().setVisible(true);
  soltar();
  assert.deepEqual(vistos, [false, true]);
});

test('las piezas son fragmentos del producto: data-ui, sin h1 ni h2 y con los datos rotulados', async () => {
  for (const nombre of ['FichaBusqueda', 'TablaConsumosGarage', 'Visibilidad']) {
    const fuente = await pieza(nombre);
    assert.match(fuente, /data-ui="[a-z]+"/, nombre);
    assert.doesNotMatch(fuente, /<h1|<h2/, nombre);
    assert.match(fuente, /\.aviso\}|\{aviso\}/, nombre);
  }
  // El botón de la ficha ("Solicitud pendiente", deshabilitado) es parte de la imagen:
  // no es un control que no hace nada.
  assert.doesNotMatch(await pieza('FichaBusqueda'), /<button|<a |onClick|tabIndex/);
});

test('los estilos de garages cuelgan de .plano y el movimiento respeta las reglas de interfaz', () => {
  const reglas = sinComentarios(estilos).replace(/@media[^{]+\{/g, '').match(/[^{}]+\{/g) ?? [];
  assert.ok(reglas.length > 10);
  for (const regla of reglas) {
    for (const selector of regla.slice(0, -1).split(',')) assert.match(selector.trim(), /^\.plano[\s[.:]/, selector);
  }
  assert.doesNotMatch(estilos, /transition:\s*all/);
  assert.match(estilos, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(estilos, /@media \(hover: hover\) and \(pointer: fine\)/);
});

test('no quedan la página anterior, su barra de vidrio ni sus referencias', async () => {
  assert.equal(existsSync(new URL('componentesLanding/paraGarages', src)), false);
  assert.equal(existsSync(new URL('componentesLanding/landing', src)), false);
  assert.equal(existsSync(new URL('componentesLanding/CtaButton.jsx', src)), false);
  const RETIRADO = /componentesLanding\/(paraGarages|landing)\/|CtaButton|StatsTicker|InteractiveBackground|GarageWatermark|landing\.css|\bglass-(nav|card)\b|\bbg-noise\b|content-visibility-auto|landing-page/;
  const fuentes = (await fuentesDe('')).filter(([nombre]) => !nombre.endsWith('.test.js'));
  assert.ok(fuentes.length > 50);
  for (const [nombre, fuente] of fuentes) assert.doesNotMatch(sinComentarios(fuente), RETIRADO, nombre);
  // El vidrio era solo de esta página: index.css ya no lo define. El token del brillo queda.
  assert.doesNotMatch(indexCss, /\.bg-noise|\.glass-nav|\.glass-card|\.content-visibility-auto|html:has\(\.landing-page\)/);
  assert.match(indexCss, /--shadow-accent:/);
});

test('en pantallas angostas la barra entra entera: la marca no se aplasta y tiene 44 px de área táctil', async () => {
  const comun = await leer('componentesLanding/inmersiva/inmersiva.css');
  const marca = comun.match(/\.plano-marca \{[^}]*\}/)?.[0] ?? '';
  assert.match(marca, /flex-shrink: 0;/);
  assert.match(marca, /min-width: 44px;/);
  // La CTA de garages es más larga que la de la home: solo esta página compacta la barra.
  assert.match(estilos, /@media \(max-width: 359px\) \{[^@]*\.plano\[data-pagina='garages'\] \.plano-boton--chico \{ padding: 0 10px; font-size: 13px; \}/);
  assert.match(estilos, /@media \(max-width: 339px\) \{[^@]*\.plano\[data-pagina='garages'\] \.plano-boton--chico \{ padding: 0 8px; \}/);
});
