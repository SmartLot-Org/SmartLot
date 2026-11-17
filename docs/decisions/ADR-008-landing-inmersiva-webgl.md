# ADR-008: Landing inmersiva con WebGL (React Three Fiber, GSAP y Lenis)

## Estado

Aceptado.

## Fecha

2026-11-16.

## Contexto

La landing pública (`/`) se rehace por completo según `docs/specs/SPEC-landing-inmersiva.md`: un
relato con scroll sobre un plano técnico de la ciudad ("estudio A, Plano"), elegido por el dueño del
producto sobre un prototipo. La metáfora es un lugar que se recorre por escalas (ciudad, cuadra,
garage, plaza), así que el dibujo tiene que ser un mundo continuo y no una serie de ilustraciones.

La home anterior cargaba una animación de entrada, 120 fotogramas PNG del logo (11 MB en `public/`),
un ticker con métricas de ejemplo y una grilla de tarjetas. Nada de eso se conserva.

Restricciones: la app es una SPA en JavaScript sin SSR (ADR-001), la landing es la única vista eager
(ADR-006) y el sistema visual es "Azul Señal" (ADR-005).

## Decisión

1. **Stack 3D y de scroll.** `three` 0.187, `@react-three/fiber` 9.8, `@react-three/drei` 10.7,
   `lenis` 1.3, `zustand` 5 y `maath` 0.10, más GSAP y `@gsap/react`, que ya estaban. Sin
   posprocesado y sin modelos externos: toda la geometría se genera por código
   (`three/mundo.js`) y se dibuja como líneas ocultas (caras del color del papel, aristas en tinta).
2. **Dos capas que no se mezclan.** La capa DOM (`src/vistasLanding/Landing.jsx` y
   `src/componentesLanding/inmersiva/{contenido,scroll,estado,ui}`) nunca importa `three` ni
   `@react-three/*`. El 3D vive en `inmersiva/three/` y entra solo por
   `lazy(() => import('.../three/Experience'))`. Lo verifica
   `landing_dom_sin_three.source.test.js`.
3. **Un director, un loop, un suavizado.**
   - `scroll/useStoryTimeline.js` es el único que escribe `scroll/rig.js`. Mide con ScrollTrigger
     (`scrub: true`) el avance de cada sección y compone el estado con funciones puras
     (`scroll/estado.js`): el relato es una función de la posición de scroll, reversible y testeable
     sin navegador.
   - El ticker de GSAP mueve a Lenis; no hay otro `requestAnimationFrame` para el scroll.
   - El amortiguado se aplica una sola vez, en `three/CameraRig.jsx`, que deja el resultado en
     `three/vivo.js`. Las escenas leen `vivo` y no escriben `rig`.
4. **El HTML es el contenido.** El título, el texto y la CTA de cada sección son HTML y se ven en el
   primer render. El escenario 3D es decorativo (`aria-hidden`) y entra con un fundido cuando ya
   dibujó su primer frame. El contenido vive en `contenido/secciones.js`.
5. **La versión se decide antes del primer render** (`asegurarInicio()` en `estado/store.js`), no en un efecto: así el layout no salta al pasar a la versión sin 3D y el chunk 3D no se pide cuando no se va a usar. Es posible porque la app no tiene SSR.
6. **Cuatro versiones.** Normal; sin 3D (`?sin3d`, o el botón del pie, que solo aparece con movimiento reducido), con pósters de
   `public/landing/posters/`; movimiento reducido (la cámara salta por sección y el Canvas renderiza
   a demanda); y estática (sin WebGL2, con ahorro de datos o si se pierde el contexto). En las
   versiones sin 3D el chunk 3D no se descarga. Al salir de la landing, R3F libera el contexto a
   propósito con el lienzo ya fuera de la página: ese evento se ignora. Una pérdida real deja la
   versión estática solo hasta la próxima visita a la landing.
7. **Estilos.** Tokens nuevos en `@theme` (`--color-plano-*`) y un CSS propio,
   `inmersiva/inmersiva.css`, con todos los selectores bajo `.plano`. Los colores del dibujo salen
   de esos mismos tokens (`three/paleta.js` los lee del DOM).
8. **Fuentes autoalojadas** para toda la app (`src/fuentes.css`, paquetes
   `@fontsource-variable/archivo` y `@fontsource-variable/dm-sans`). Se declara el mismo rango de
   pesos que servía Google Fonts (Archivo 400–900, DM Sans 400–700) para que los paneles no cambien
   de aspecto. `index.html` precarga los dos archivos de la primera pantalla.
9. **Presupuestos.** Chunk 3D: hasta 350 kB gzip. JS propio de la landing antes del 3D (capa DOM,
   Lenis y zustand): hasta 150 kB gzip. El runtime compartido con el resto de la app (React, router,
   cliente HTTP, sesión, Google Maps) queda fuera de ese límite por decisión del dueño del producto.

## Alternativas consideradas

- **Animación solo en el DOM (SVG y CSS).** Más liviana, pero el acercamiento continuo por escalas
  con oclusión de volúmenes no se sostiene en SVG. Descartada.
- **three.js sin React Three Fiber**, como el prototipo. Menos dependencias, pero se pierde la
  integración con el ciclo de vida de React (montaje por ruta, descarte de recursos, tiers).
- **Timelines de GSAP escribiendo `rig`** en lugar de funciones puras. Equivalente en pantalla; se
  eligieron las funciones puras porque se prueban con `node:test` y no dependen del orden de
  actualización de los triggers.
- **Fuentes estáticas por peso.** Diez archivos en lugar de dos; descartada.

## Consecuencias

- Seis dependencias nuevas de runtime y dos de fuentes. Se quitó `ogl`, que no se usaba.
- Medido sobre el build del 2026-11-16: JS de entrada 159 kB gzip (antes de la landing nueva, 173 kB), de los cuales unos 12 kB son propios de la landing; chunk 3D 254 kB gzip. Para llegar a ese número, el puente de Google Maps (`contexts/MapsLoaderBridge.jsx`) pasó a cargarse con `lazy()`: la librería `@react-google-maps/api` estaba en el bundle de entrada de todas las rutas, en contra de lo que pide ADR-006.
- `public/` baja 11 MB (los fotogramas del logo) y suma unos 497 kB de pósters (siete imágenes en dos tamaños) y la marca.
- La landing ya no depende de Google Fonts ni de ningún otro dominio.
- `three` es grande: el chunk 3D pesa unos 250 kB gzip. Se descarga después del primer render y solo
  si hay WebGL2.
- Cualquier cambio en el guion toca tres lugares que se mueven juntos: `contenido/secciones.js`
  (texto y `weight`), `scroll/coreografia.js` (encuadres y fx) y la escena en `three/escenas/`.
- `/para-garages` sigue con el sistema visual anterior (vidrio, ticker). Su rediseño tendrá spec
  propia y puede reutilizar este mundo.
- El script `npm test` ahora pasa el glob entre comillas: sin eso, el shell solo expandía un nivel
  de carpetas y los tests más profundos no corrían.
