import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const landing = await readFile(new URL('./Landing.jsx', import.meta.url), 'utf8');
const inmersiva = (ruta) => readFile(new URL(`../componentesLanding/inmersiva/${ruta}`, import.meta.url), 'utf8');
const seccion = await inmersiva('ui/Seccion.jsx');
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
  assert.doesNotMatch(landing, /data-tema|tema=/);
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
  for (const source of [landing, auth, register, forgotPassword]) {
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
  assert.match(landing, /lazy\(\(\) => import\('\.\.\/componentesLanding\/inmersiva\/three\/Experience'\)\)/);
  assert.match(landing, /mostrar3d && <Suspense fallback=\{null\}>/);
});

test('el 3D no se pide antes de inicializar, con ?sin3d ni sin WebGL', () => {
  assert.match(landing, /const mostrar3d = inicializado && !estatico && !sin3d/);
  assert.match(landing, /const estatico = useUI\(\(s\) => s\.tier === 'static'\)/);
  assert.match(store, /sin3d: q\.has\('sin3d'\)/);
  assert.match(landing, /export default function LandingPage\(\) \{\n {2}asegurarInicio\(\);/);
  assert.match(store, /if \(!webgl\) return 'static'/);
  assert.match(escenario, /webglcontextlost/);
});

test('el escenario 3D es decorativo y hay enlace para saltar al contenido', () => {
  assert.match(escenario, /className="plano-escenario"[^>]*aria-hidden="true"/);
  assert.match(landing, /className="plano-saltar" href="#contenido"/);
  assert.match(landing, /<main id="contenido"/);
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
  assert.doesNotMatch(landing, /componentesLanding\/landing\//);
  assert.doesNotMatch(indexHtml, /fonts\.googleapis|fonts\.gstatic/);
});

test('el hero tiene una sola acción y el lado del garage es un enlace simple en la barra y el pie', () => {
  assert.doesNotMatch(seccion, /EnlaceGarage/);
  assert.match(nav, /<EnlaceGarage className="plano-navlink" \/>/);
  assert.match(landing, /<footer className="plano-pie">[\s\S]*<EnlaceGarage \/>/);
  assert.doesNotMatch(estilos, /text-decoration: underline;\n {2}text-underline-offset/);
});

test('no queda la escala gráfica de metros', () => {
  assert.doesNotMatch(rotulos, /plano-escala|TRAMOS/);
  assert.doesNotMatch(estilos, /plano-escala/);
});

test('la opción sin 3D solo se ofrece con movimiento reducido (o para volver de ella)', () => {
  assert.match(landing, /!estatico && \(reducido \|\| sin3d\) &&/);
  assert.match(landing, /useMovimientoReducido\(\)/);
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

test('la barra tiene tres niveles: Registrate, Iniciar sesión y la navegación a garages', () => {
  assert.match(nav, /className="plano-boton-secundario"[\s\S]*NAVEGACION\.ingresar\.etiqueta/);
  assert.match(nav, /<Cta chico \/>/);
  assert.match(nav, /<nav aria-label="Principal" className="plano-barra__nav">\s*<EnlaceGarage className="plano-navlink" \/>/);
  assert.match(estilos, /\.plano-navlink \{[\s\S]*color: var\(--texto-suave\)/);
  assert.match(estilos, /\.plano-boton-secundario \{[\s\S]*border: 1px solid var\(--borde\)/);
});

test('el brillo del botón de la barra queda dentro de la barra', () => {
  assert.match(estilos, /\.plano-boton--chico \{[\s\S]*box-shadow: 0 4px 8px -3px var\(--brillo-reposo\)/);
  assert.match(estilos, /\.plano-boton--chico::after \{ box-shadow: 0 6px 12px -4px/);
  assert.match(estilos, /\.plano \{ --barra: 72px; \}/);
});

