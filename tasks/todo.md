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

- [x] Recorrido hacia adelante, hacia atrás y con tirón rápido: cada punto del relato se ve idéntico (comparación de píxeles en 1280×720); recorrido visual en 390×844.
- [x] Presupuestos sobre el build: entrada 159 kB gzip, chunk 3D 254 kB gzip.
- [x] Core Web Vitals con emulación (Pixel 7, CPU ×4, 1,6 Mbps): LCP 2,0 s y CLS 0,006 en la versión normal; LCP 2,4 s y CLS 0 sin 3D. Interacciones entre 24 y 290 ms con render por software; falta medir INP en un equipo con GPU.
- [x] Teclado, foco y contraste: orden de tabulación igual al visual, foco visible en todos los controles, contraste mínimo 4,82:1, ningún control por debajo de 44 px.
- [x] Detector de `impeccable` sobre el código y sobre la página servida (`?sin3d`, escritorio): sin hallazgos después de documentar los radios del plano y sumar `text-wrap` a títulos y párrafos. La versión con 3D no terminó de cargar dentro del límite del detector en este contenedor (render por software).
- [x] Repaso de rendimiento de React: el 3D entra por `lazy()`; la librería de Google Maps salió del bundle de entrada; los componentes leen campos sueltos del store; lo que cambia en cada frame se escribe por ref, sin estado de React. Falta la pasada formal con la skill `vercel-react-best-practices`.
- [x] `npm test`, lint de lo tocado y `npm run build`.

## Retoques del 2026-11-17

- [x] Hero con una sola acción; "Para garages" como enlace simple en la barra y el pie (`design-taste-frontend`).
- [x] Barra en tres niveles (principal, secundario con borde y navegación) y de 72 px; el brillo del botón de la barra no sale de ella. Revisado con `review-animations` y `vercel-react-best-practices`.
- [x] Sin escala gráfica de metros.
- [x] Brillo y barrido de luz en "Registrate", como el botón de la landing anterior (`emil-design-eng`).
- [x] "Ver sin 3D" solo con movimiento reducido.
- [x] Ida y vuelta de la landing sin caer en la versión estática: probado nueve veces seguidas (`web-inmersiva`).
- [x] Textos de 12 px que se leen ("Datos de ejemplo", encabezados de la tabla) pasan a 13 px.

## Decisiones del dueño del producto (2026-11-17)

- [x] La landing es siempre clara: se retiró la variante cianotipo (estilos, tokens y pósters).
- [x] Se borraron las métricas inventadas de `StatsTicker.jsx` y los testimonios de `/para-garages`.
