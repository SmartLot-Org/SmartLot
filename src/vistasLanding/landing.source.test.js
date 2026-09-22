import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const landing = await readFile(new URL('./Landing.jsx', import.meta.url), 'utf8');
const intro = await readFile(new URL('../componentesLanding/landing/IntroAnimation.jsx', import.meta.url), 'utf8');
const watermark = await readFile(new URL('../componentesLanding/landing/LogoWatermark.jsx', import.meta.url), 'utf8');
const hero = await readFile(new URL('../componentesLanding/landing/Hero.jsx', import.meta.url), 'utf8');
const ticker = await readFile(new URL('../componentesLanding/landing/StatsTicker.jsx', import.meta.url), 'utf8');
const particles = await readFile(new URL('../componentesLanding/landing/InteractiveBackground.jsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const indexCss = await readFile(new URL('../index.css', import.meta.url), 'utf8');
const contact = await readFile(new URL('../componentesLanding/landing/Contact.jsx', import.meta.url), 'utf8');
const navbar = await readFile(new URL('../componentesLanding/landing/Navbar.jsx', import.meta.url), 'utf8');
const authCallback = await readFile(new URL('./AuthCallback.jsx', import.meta.url), 'utf8');
const loginForm = await readFile(new URL('../componentesLanding/auth/LoginForm.jsx', import.meta.url), 'utf8');
const registerGarage = await readFile(new URL('../componentesLanding/auth/RegisterGarageForm.jsx', import.meta.url), 'utf8');
const registerEmpresa = await readFile(new URL('../componentesLanding/auth/RegisterEmpresaForm.jsx', import.meta.url), 'utf8');
const register = await readFile(new URL('../pages/Register.jsx', import.meta.url), 'utf8');
const forgotPassword = await readFile(new URL('../pages/ForgotPassword.jsx', import.meta.url), 'utf8');
const auth = await readFile(new URL('./Auth.jsx', import.meta.url), 'utf8');
const paraGarages = await readFile(new URL('./ParaGarages.jsx', import.meta.url), 'utf8');
const garageCta = await readFile(new URL('../componentesLanding/paraGarages/ParaGaragesCTA.jsx', import.meta.url), 'utf8');
const garageSteps = await readFile(new URL('../componentesLanding/paraGarages/ParaGaragesSteps.jsx', import.meta.url), 'utf8');

test('el bloqueo de scroll respeta reduce: con motion reducido nunca se bloquea', () => {
  assert.match(landing, /const locked = !isIntroComplete && !prefersReducedMotion/);
  assert.match(landing, /classList\.toggle\('no-scroll', locked\)/);
});

test('la intro se ve una vez por sesión y es saltable', () => {
  assert.match(landing, /sessionStorage\.getItem\(INTRO_SEEN_KEY\)/);
  assert.match(landing, /sessionStorage\.setItem\(INTRO_SEEN_KEY, '1'\)/);
  assert.match(intro, /skippedRef\.current/);
  assert.match(intro, /e\.key === 'Escape'/);
  assert.match(intro, /tlRef\.current\?\.kill\(\)/);
  assert.match(intro, /Saltar/);
});

test('la intro respira ~2.3s: ningún tween llega a 1s', () => {
  assert.doesNotMatch(intro, /duration:\s*(1(?![0-9.])|[1-9][0-9.]*\.)/);
});

test('el flip-book arranca con el primer scroll (sin precarga en idle) y el giro tiene red de dibujo', () => {
  const mountEffect = watermark.slice(watermark.indexOf('useEffect(() => {'));
  assert.match(mountEffect, /matchMedia\('(?:\(prefers-reduced-motion: reduce\))'\)/);
  assert.match(mountEffect, /window\.scrollY > 0/);
  assert.doesNotMatch(mountEffect, /requestIdleCallback\(kick/);
  assert.match(mountEffect, /addEventListener\('scroll', kick/);
  assert.match(mountEffect, /addEventListener\('wheel', kick/);
  assert.match(mountEffect, /addEventListener\('touchmove', kick/);
  assert.match(watermark, /FRAME_BATCH/);
  assert.match(watermark, /startDrawRetry/);
  assert.match(watermark, /drawRetryRafRef/);
});

test('las vistas pesadas se cargan por ruta y la landing no espera a la sesión', () => {
  assert.doesNotMatch(app, /if \(loading\) return null/);
  assert.match(app, /lazy\(\(\) => import\("\.\/vistasAdmin\//);
  assert.match(app, /lazy\(\(\) => import\("\.\/vistasSuperadmin\//);
  assert.match(app, /lazy\(\(\) => import\("\.\/vistasEmpleados\//);
  assert.match(app, /<Suspense fallback=/);
  assert.match(app, /import LandingPage from "\.\/vistasLanding\/Landing"/);
});

test('el hero conserva el trío de marca y ya no promete IA ni lleva eyebrow', () => {
  assert.match(hero, /Gestioná\./);
  assert.match(hero, /Optimizá\./);
  assert.match(hero, /Escalá\./);
  assert.doesNotMatch(hero, /con IA/);
  assert.doesNotMatch(hero, /SmartLot App/);
  assert.match(hero, /px-5 py-3/);
});

test('el ticker conserva sus métricas de confianza', () => {
  assert.match(ticker, /Satisfacción del cliente/);
  assert.match(ticker, /4\.9\/5/);
  assert.match(ticker, /Tiempo de respuesta/);
  assert.match(ticker, /Soporte técnico/);
});

test('las partículas usan la familia del azul señal', () => {
  assert.match(particles, /#2563EB/);
  assert.doesNotMatch(particles, /#1E90FF|#87CEEB|#4169E1|#00BFFF|#5B9BD5/);
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
  assert.doesNotMatch(contact, /#2A5CBF|#6BA3E8/);
  assert.doesNotMatch(garageCta, /#2A5CBF|#6BA3E8/);
  assert.doesNotMatch(loginForm, /#2A5CBF|#6BA3E8/);
  assert.match(garageSteps, /hover:border-brand-sky/);
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
  assert.doesNotMatch(contact, /Regístrate/);
  assert.match(contact, /Registrate/);
  assert.doesNotMatch(forgotPassword, /Ya puedes/);
  assert.match(forgotPassword, /Ya podés/);
});

test('lang es-AR, meta sin promesas de IA y SEO por ruta', () => {
  assert.match(indexHtml, /lang="es-AR"/);
  assert.doesNotMatch(indexHtml, /analítica predictiva/);
  for (const source of [landing, paraGarages, auth, register, forgotPassword]) {
    assert.match(source, /usePageMeta/);
  }
});

test('el footer de Contact ya no esconde texto a 1px', () => {
  assert.doesNotMatch(contact, /text-\[1px\]/);
  assert.doesNotMatch(contact, /text-brand-muted\/(30|40)/);
  assert.doesNotMatch(garageCta, /text-brand-muted\/(30|40|50)/);
});

test('el navbar no intercepta el click con toast ni setTimeout', () => {
  assert.doesNotMatch(navbar, /setTimeout|showToast/);
  assert.match(navbar, /Ir a mi panel/);
  assert.match(navbar, /getUserHomeRoute\(usuario\)/);
});

test('Demo.jsx muerto eliminado sin referencias', () => {
  assert.equal(existsSync(new URL('../componentesLanding/landing/Demo.jsx', import.meta.url)), false);
  assert.doesNotMatch(landing, /landing\/Demo/);
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
