import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const landing = await readFile(new URL('./Landing.jsx', import.meta.url), 'utf8');
const inmersiva = (ruta) => readFile(new URL(`../componentesLanding/inmersiva/${ruta}`, import.meta.url), 'utf8');
// La home es el armazón común (ui/PaginaPlano.jsx) con su objeto de página
// (paginas/home.js): los contratos que antes leían Landing.jsx leen esos dos.
const armazon = await inmersiva('ui/PaginaPlano.jsx');
const home = await inmersiva('paginas/home.js');
const director = await inmersiva('scroll/useStoryTimeline.js');
const regla = await inmersiva('ui/Regla.jsx');
const seccion = await inmersiva('ui/Seccion.jsx');
const sinComentarios = (fuente) => fuente
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');
const nav = await inmersiva('ui/Nav.jsx');
// El agente 3D muda el Canvas, el contexto perdido y el envoltorio aria-hidden a
// three/Escenario.jsx; mientras tanto siguen en Experience.jsx.
const escenario = await inmersiva(existsSync(new URL('../componentesLanding/inmersiva/three/Escenario.jsx', import.meta.url)) ? 'three/Escenario.jsx' : 'three/Experience.jsx');
const store = await inmersiva('estado/store.js');
const estilos = await inmersiva('inmersiva.css');
const rotulos = await inmersiva('three/Rotulos.jsx');
const cta = await inmersiva('ui/Cta.jsx');
const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const indexCss = await readFile(new URL('../index.css', import.meta.url), 'utf8');
const authCallback = await readFile(new URL('./AuthCallback.jsx', import.meta.url), 'utf8');
const loginForm = await readFile(new URL('../componentesLanding/auth/LoginForm.jsx', import.meta.url), 'utf8');
const registerGarage = await readFile(new URL('../componentesLanding/auth/RegisterGarageForm.jsx', import.meta.url), 'utf8');
const registerEmpresa = await readFile(new URL('../componentesLanding/auth/RegisterEmpresaForm.jsx', import.meta.url), 'utf8');
const register = await readFile(new URL('../pages/Register.jsx', import.meta.url), 'utf8');
const forgotPassword = await readFile(new URL('../pages/ForgotPassword.jsx', import.meta.url), 'utf8');
const auth = await readFile(new URL('./Auth.jsx', import.meta.url), 'utf8');

test('las vistas pesadas se cargan por ruta y la landing no espera a la sesión', () => {
  assert.doesNotMatch(app, /if \(loading\) return null/);
  assert.match(app, /lazy\(\(\) => import\("\.\/vistasAdmin\//);
  assert.match(app, /lazy\(\(\) => import\("\.\/vistasSuperadmin\//);
  assert.match(app, /lazy\(\(\) => import\("\.\/vistasEmpleados\//);
  assert.match(app, /<Suspense fallback=/);
  assert.match(app, /import LandingPage from "\.\/vistasLanding\/Landing"/);
});

test('la landing es siempre clara: no hay variante de tema', () => {
  assert.doesNotMatch(store, /tema/);
  assert.doesNotMatch(estilos, /cianotipo|data-tema/);
  for (const fuente of [landing, armazon]) assert.doesNotMatch(fuente, /data-tema|tema=/);
});

test('/para-empresas eliminada sin referencias huérfanas', () => {
  assert.doesNotMatch(app, /ParaEmpresas|para-empresas/);
});

test('la config muerta de Tailwind y PostCSS ya no existen', () => {
  assert.equal(existsSync(new URL('../../tailwind.config.js', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../postcss.config.cjs', import.meta.url)), false);
  assert.doesNotMatch(indexCss, /@config/);
});

test('el azul obsoleto #2A5CBF ya no vive en las superficies de landing', () => {
  assert.doesNotMatch(loginForm, /#2A5CBF|#6BA3E8/);
});

test('AA: el muted baja a #475569 y el sky entra en la familia señal', () => {
  assert.match(indexCss, /--color-brand-muted:\s*#475569/);
  assert.match(indexCss, /--color-brand-sky:\s*#93C5FD/);
  assert.match(indexCss, /--text:\s*#475569/);
});

test('los errores del funnel usan red-600 con role="alert"', () => {
  assert.doesNotMatch(loginForm, /text-red-500/);
  assert.doesNotMatch(registerGarage, /text-red-500/);
  assert.doesNotMatch(registerEmpresa, /text-red-500/);
  assert.match(loginForm, /role="alert"/);
});

test('voseo en las superficies públicas', () => {
  assert.doesNotMatch(forgotPassword, /Ya puedes/);
  assert.match(forgotPassword, /Ya podés/);
});

test('lang es-AR, meta sin promesas de IA y SEO por ruta', () => {
  assert.match(indexHtml, /lang="es-AR"/);
  assert.doesNotMatch(indexHtml, /analítica predictiva/);
  for (const source of [armazon, auth, register, forgotPassword]) {
    assert.match(source, /usePageMeta/);
  }
});

test('AuthCallback muestra un loader accesible', () => {
  assert.match(authCallback, /role="status"/);
  assert.match(authCallback, /aria-live="polite"/);
  assert.match(authCallback, /animate-spin/);
});

test('el login declara autocomplete y alertas', () => {
  assert.match(loginForm, /autoComplete="email"/);
  assert.match(loginForm, /autoComplete="current-password"/);
});

test('el hero es HTML desde el primer render: h1 propio, sin animación de entrada ni espera del 3D', () => {
  assert.match(seccion, /const Titulo = i === 0 \? 'h1' : 'h2'/);
  assert.doesNotMatch(seccion, /SplitText|gsap\.from\(/);
  assert.match(home, /escena: lazy\(\(\) => import\('\.\.\/three\/Experience'\)\)/);
  assert.match(armazon, /mostrar3d && <Suspense fallback=\{null\}><Escena \/><\/Suspense>/);
});

test('el 3D no se pide antes de inicializar, con ?sin3d ni sin WebGL', () => {
  assert.match(armazon, /const mostrar3d = inicializado && !estatico && !sin3d/);
  assert.match(armazon, /const estatico = useUI\(\(s\) => s\.tier === 'static'\)/);
  assert.match(store, /sin3d: q\.has\('sin3d'\)/);
  assert.match(armazon, /export function PaginaPlano\(\{ pagina \}\) \{\n {2}asegurarInicio\(\);/);
  assert.match(store, /if \(!webgl\) return 'static'/);
  assert.match(escenario, /webglcontextlost/);
});

test('el escenario 3D es decorativo y hay enlace para saltar al contenido', () => {
  assert.match(escenario, /className="plano-escenario"[^>]*aria-hidden="true"/);
  assert.match(armazon, /className="plano-saltar" href="#contenido"/);
  assert.match(armazon, /<main id="contenido"/);
});

test('la barra nueva lleva al panel si hay sesión y no intercepta el click', () => {
  assert.match(nav, /getUserHomeRoute\(usuario\)/);
  assert.match(nav, /NAVEGACION\.panel/);
  assert.doesNotMatch(nav, /setTimeout|showToast|preventDefault/);
});

test('el movimiento de interfaz no usa transition: all y respeta reduced motion', () => {
  assert.doesNotMatch(estilos, /transition:\s*all/);
  assert.match(estilos, /prefers-reduced-motion: reduce/);
});

test('la landing vieja se retiró sin dejar archivos ni referencias', () => {
  for (const archivo of ['Hero', 'BentoGrid', 'Contact', 'IntroAnimation', 'LogoWatermark']) {
    assert.equal(existsSync(new URL(`../componentesLanding/landing/${archivo}.jsx`, import.meta.url)), false, archivo);
  }
  assert.equal(existsSync(new URL('../../public/GIF_IMGS_LOGO', import.meta.url)), false);
  for (const fuente of [landing, armazon]) assert.doesNotMatch(fuente, /componentesLanding\/landing\//);
  assert.doesNotMatch(indexHtml, /fonts\.googleapis|fonts\.gstatic/);
});

test('el hero tiene una sola acción y la otra página es un enlace simple en la barra y el pie', () => {
  assert.doesNotMatch(seccion, /EnlacePagina/);
  assert.match(nav, /<EnlacePagina enlace=\{enlace\} className="plano-navlink" \/>/);
  assert.match(armazon, /<footer className="plano-pie">[\s\S]*<EnlacePagina enlace=\{pagina\.enlace\} \/>/);
  assert.doesNotMatch(estilos, /text-decoration: underline;\n {2}text-underline-offset/);
});

test('no queda la escala gráfica de metros', () => {
  assert.doesNotMatch(rotulos, /plano-escala|TRAMOS/);
  assert.doesNotMatch(estilos, /plano-escala/);
});

test('la opción sin 3D solo se ofrece con movimiento reducido (o para volver de ella)', () => {
  assert.match(armazon, /!estatico && \(reducido \|\| sin3d\) &&/);
  assert.match(armazon, /useMovimientoReducido\(\)/);
});

test('salir de la landing no la deja sin 3D: se ignora la liberación intencional del contexto', () => {
  assert.match(escenario, /if \(!lienzo\.isConnected\) return;/);
  assert.match(store, /if \(estado\.contextoPerdido\) useUI\.setState\(\{ tier: tierDeLlegada, contextoPerdido: false \}\)/);
});

test('el botón principal tiene el brillo y el barrido de luz, solo con mouse y sin barrido con movimiento reducido', () => {
  assert.match(cta, /plano-boton__brillo/);
  assert.match(estilos, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*\.plano-boton:hover \.plano-boton__brillo::before \{[\s\S]*transform: translateX\(200%\)/);
  assert.match(estilos, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.plano-boton__brillo \{ display: none; \}/);
  assert.doesNotMatch(estilos, /transition:[^;]*box-shadow/);
});

test('la barra tiene tres niveles: la CTA de la página, Iniciar sesión y la navegación a la otra página', () => {
  assert.match(nav, /className="plano-boton-secundario"[\s\S]*NAVEGACION\.ingresar\.etiqueta/);
  assert.match(nav, /<Cta cta=\{cta\} chico \/>/);
  assert.match(nav, /<nav aria-label="Principal" className="plano-barra__nav">\s*<EnlacePagina enlace=\{enlace\} className="plano-navlink" \/>/);
  assert.match(estilos, /\.plano-navlink \{[\s\S]*color: var\(--texto-suave\)/);
  assert.match(estilos, /\.plano-boton-secundario \{[\s\S]*border: 1px solid var\(--borde\)/);
});

test('el brillo del botón de la barra queda dentro de la barra', () => {
  assert.match(estilos, /\.plano-boton--chico \{[\s\S]*box-shadow: 0 4px 8px -3px var\(--brillo-reposo\)/);
  assert.match(estilos, /\.plano-boton--chico::after \{ box-shadow: 0 6px 12px -4px/);
  assert.match(estilos, /\.plano \{ --barra: 72px; \}/);
});

test('la home es el armazón del plano con su objeto de página', () => {
  assert.match(landing, /export default function LandingPage\(\) \{\n {2}return <PaginaPlano pagina=\{PAGINA_HOME\} \/>;/);
  assert.match(home, /cta: CTA\.principal/);
  assert.match(home, /enlace: CTA\.secundaria/);
  assert.match(home, /posters: '\/landing\/posters'/);
  assert.match(home, /intro: true/);
  // El deslizador recompone el dibujo por el guion de la página, no desde el director.
  assert.match(home, /ajustar: \(destino, avances, vertical\) =>\s*aplicarComparacion\(destino, useUI\.getState\(\)\.comparar, avances, vertical\)/);
  assert.match(home, /suscribir: \(recomponer\) => useUI\.subscribe\(/);
});

test('el armazón no conoce ninguna página: el contenido, la escena y el guion llegan en `pagina`', () => {
  for (const [nombre, fuente] of [['PaginaPlano', armazon], ['Seccion', seccion], ['Nav', nav], ['Cta', cta], ['Regla', regla], ['director', director]]) {
    assert.doesNotMatch(sinComentarios(fuente), /contenido\/secciones|contenido\/garages|paginas\//, nombre);
  }
  assert.match(armazon, /data-pagina=\{pagina\.id\}/);
  assert.match(armazon, /\{pagina\.intro && <Intro \/>\}/);
  assert.match(armazon, /<Nav cta=\{pagina\.cta\} enlace=\{pagina\.enlace\} \/>/);
  assert.match(armazon, /<Regla secciones=\{secciones\} \/>/);
  assert.match(armazon, /usePageMeta\(\{ title: pagina\.meta\.titulo, description: pagina\.meta\.descripcion \}\)/);
  assert.match(armazon, /useStoryTimeline\(main, pagina\)/);
});

test('una página sin escena va en el flujo sin 3D y sin el botón "Ver sin 3D"', () => {
  assert.match(armazon, /const mostrar3d = inicializado && !estatico && !sin3d && !!pagina\.escena;/);
  assert.match(armazon, /const sinEscena = inicializado && !mostrar3d;/);
  assert.match(armazon, /\{pagina\.escena && !estatico && \(reducido \|\| sin3d\) && \(/);
});

test('la sección pone las piezas que nombra y la figura solo si ninguna la reemplaza', () => {
  assert.match(seccion, /export function Seccion\(\{ s, i, ultima, sinEscena, piezas, posters, cta \}\)/);
  assert.match(seccion, /if \(!pieza \|\| \(pieza\.soloConEscena && sinEscena\)\) return null;/);
  assert.match(seccion, /<Pieza key=\{nombre\} sinEscena=\{sinEscena\} posters=\{posters\} \/>/);
  assert.match(seccion, /\{sinEscena && posters && !reemplazaFigura && <Figura s=\{s\} i=\{i\} posters=\{posters\} \/>\}/);
  assert.match(seccion, /const poster = `\$\{posters\}\/\$\{s\.poster \?\? s\.id\}`/);
  assert.match(seccion, /<Cta cta=\{cta\} \/>/);
});

test('el director sigue a la página: sin guion no escribe rig y los controles entran por el guion', () => {
  assert.match(director, /export function useStoryTimeline\(scope, pagina\)/);
  assert.match(director, /if \(!mostrar3d \|\| !guion\) return;/);
  assert.match(director, /guion\.componer\(avances, vertical, rig\);\n\s*pagina\.guion\.ajustar\?\.\(rig, avances, vertical\);\n\s*rig\.requestFrame\(\);/);
  assert.match(director, /pagina\.guion\.suscribir\?\.\(\(\) => escribir\(ultimos\)\)/);
  assert.doesNotMatch(director, /aplicarComparacion|comparar|PESOS/);
});
