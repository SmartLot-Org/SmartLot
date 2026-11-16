# Tareas: landing inmersiva

Cada tarea cierra con su verificación. Estado al 2026-11-16.

## Etapa 2 — Base

- [x] Quitar `ogl` e instalar `three`, `@react-three/fiber`, `@react-three/drei`, `lenis`, `zustand` y `maath`. Verificación: `npm run build`.
- [x] Autoalojar Archivo y DM Sans (`src/fuentes.css`) y quitar Google Fonts de `index.html`. Verificación: el build emite los `woff2` y las precargas apuntan a ellos.
- [x] Tokens `--color-plano-*` en `@theme` y ADR-008.
- [x] `npm test` con el glob entre comillas, para que corran los tests de carpetas profundas.

## Etapa 3 — Esqueleto HTML

- [x] `contenido/secciones.js` con las siete secciones y `secciones.test.js`.
- [x] `ui/Seccion.jsx`, `ui/Nav.jsx`, `ui/Cta.jsx`, `ui/Dato.jsx`, `ui/TablaConsumos.jsx` e `inmersiva.css`.
- [x] `Landing.jsx` nuevo: un `h1`, un `h2` por sección, enlace para saltar al contenido, CTA en el hero y en el cierre.
- [x] Retirar la landing anterior (componentes, fotogramas del logo, estilos) y actualizar `landing.source.test.js`.

## Etapa 4 — Director de scroll

- [x] `scroll/coreografia.js`, `scroll/estado.js`, `scroll/rangos.js` y `estado.test.js` (encuadres, continuidad, reversibilidad).
- [x] `scroll/smoothScroll.js` (Lenis movido por el ticker de GSAP) y `scroll/useStoryTimeline.js`.
- [x] Contrato `landing_dom_sin_three.source.test.js`.

## Etapa 5 — Escenas

- [x] `three/mundo.js` y `mundo.test.js`: ciudad, hitos, recorrido, planta, consumos, auto y persona.
- [x] `three/CameraRig.jsx`, `three/paleta.js`, `three/vivo.js`.
- [x] Escenas `Ciudad`, `Trato`, `Vueltas`, `Garage` y `Acceso`.
- [x] `three/Rotulos.jsx`: rótulos anclados, lente del QR y escala gráfica.
- [x] Encuadres revisados en 1280×720 y 390×844.

## Etapa 6 — Respaldos

- [x] Versión sin 3D (`?sin3d` y botón del pie) con pósters en `public/landing/posters/`.
- [x] Movimiento reducido: la cámara salta por sección; Canvas a demanda.
- [x] Estática: sin WebGL2, con ahorro de datos o contexto perdido, sin descargar el chunk 3D.

## Etapa 7 — Verificación

- [ ] Recorrido hacia adelante, hacia atrás y con tirón rápido en ambos tamaños.
- [ ] Presupuestos sobre el build y Core Web Vitals con emulación de celular.
- [ ] Teclado, foco y contraste.
- [ ] Pasada de `impeccable audit` y de `vercel-react-best-practices`.
- [ ] `npm test`, lint de lo tocado y `npm run build`.

## Preguntas para el dueño del producto

- ¿La landing queda siempre en claro o sigue el tema del sistema (variante cianotipo, hoy con `?tema=cianotipo`)?
- ¿Se borran las métricas por defecto de `StatsTicker.jsx`, que ya no se usan?
