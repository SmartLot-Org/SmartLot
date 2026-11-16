# Plan técnico: landing inmersiva

Spec: `docs/specs/SPEC-landing-inmersiva.md` (aprobada). Decisión de arquitectura: `docs/decisions/ADR-008-landing-inmersiva-webgl.md`.

## Enfoque

La landing es un relato con scroll sobre un plano técnico de la ciudad. Dos capas separadas:

- **Capa DOM** (`src/vistasLanding/Landing.jsx` y `src/componentesLanding/inmersiva/{contenido,scroll,estado,ui}`): el contenido real, la barra, la CTA y el director de scroll. Se carga con la app.
- **Capa 3D** (`src/componentesLanding/inmersiva/three/`): Canvas fijo de React Three Fiber, decorativo, en un chunk aparte que se pide después del primer render.

Las une `scroll/rig.js`, un objeto mutable. El director (`useStoryTimeline`) mide el avance de cada sección con ScrollTrigger y escribe el estado que calculan las funciones puras de `scroll/estado.js`. `three/CameraRig.jsx` lo amortigua una vez y las escenas lo leen.

## Orden

1. Base: dependencias, fuentes autoalojadas, tokens, estructura de carpetas y ADR.
2. Esqueleto HTML con el contenido real. Se lee completo sin 3D ni animación.
3. Director de scroll y composición del estado, con sus tests.
4. Mundo y escenas: ciudad, trato, vueltas, garage, acceso; rótulos, lente del QR y escala gráfica.
5. Versiones de respaldo: sin 3D con pósters, movimiento reducido, estática.
6. Verificación: tests, lint de lo tocado, build y presupuestos, recorrido en 390 y 1280 px hacia adelante y hacia atrás, Core Web Vitals con emulación, teclado y contraste.

## Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| `three` entra al bundle de entrada | Test de contrato `landing_dom_sin_three.source.test.js`; el 3D solo entra por `lazy()` |
| El relato salta o no vuelve atrás igual | El estado es función pura de la posición; `estado.test.js` prueba continuidad y reversibilidad |
| El texto queda tapado o ilegible sobre el dibujo | El texto va siempre en notas opacas; cada sección tiene encuadre horizontal y vertical |
| Equipos sin WebGL o lentos | Tier `static` sin descargar el chunk; `PerformanceMonitor` baja la resolución; contexto perdido → estática |
| Cambio de aspecto en los paneles al autoalojar fuentes | Mismas familias y mismos rangos de peso que servía Google Fonts |
| CSS global que choca con los paneles | Todos los selectores cuelgan de `.plano` |

## Fuera de este plan

- `/para-garages`, login y registro.
- La Fase 1 de la auditoría de paneles, que tiene su propia spec (`docs/specs/SPEC-fundaciones-ui.md`).
