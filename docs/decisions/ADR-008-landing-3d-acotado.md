# ADR-008: 3D acotado en la landing con three + React Three Fiber, y Lenis solo en `/`

## Estado

Aceptado.

## Fecha

2026-10-29.

## Contexto

La landing `/` no cuenta cómo funciona el producto: hoy es hero, ticker de métricas, bento y contacto. El dueño del producto pidió aplicar la skill `web-inmersiva` y eligió el **nivel 2 ("3D acotado")**: un único momento 3D, la maqueta del garage, que acompaña el recorrido solicitud → trato → reserva → acceso con QR → consumo (`docs/specs/SPEC-landing-inmersiva.md`).

Restricciones vigentes:

- **ADR-006:** la landing es la única vista eager, y las dependencias pesadas se importan en el punto de uso.
- **Bundle principal:** ya pesa 563,63 kB (173,25 kB gzip) en la build del 2026-10-29. No tiene margen para sumar three.js, que solo agrega unos 240 kB gzip (medición de la skill: de 125 a 365 KB gzip cuando la capa DOM lo importa).
- **Scroll:** el repo ya usa GSAP 3.15 con ScrollTrigger, sin una librería de smooth scroll. `ogl` figura en `package.json` pero no tiene usos en `src/`.
- **Peer de R3F 9.8:** React `>=19 <19.4`. El lockfile instala React 19.2.5.

## Decisión

1. **Dependencias nuevas:** `three` (0.186), `@react-three/fiber` (9.8) y `lenis` (1.3). No se suman `@react-three/drei`, `@react-three/postprocessing`, `maath` ni `zustand`:
   - El suavizado de cámara usa `THREE.MathUtils.damp`.
   - El estado continuo vive en un objeto mutable (`rigRecorrido`).
   - El estado discreto vive en React.
   - "Solo brilla lo que significa algo" se resuelve con colores sin iluminar (`meshBasicMaterial`) y el Canvas en `flat` (sin tone mapping), sin Bloom.
2. **Aislamiento del 3D:** `src/componentesLanding/landing/recorrido/EscenaGarage.jsx` es el único módulo que importa `three` o `@react-three/*`.
   - Se carga con `lazy()` desde un escenario DOM que ya ocupa su lugar (el escenario fijo de `100svh`), así que no mueve el layout.
   - Lo monta solo cuando `#recorrido` está a 300 px del viewport.
   - Se pausa con `frameloop="never"` cuando sale de pantalla.
   - Con `prefers-reduced-motion` no se monta: aplica el respaldo del punto 4.
   - La capa DOM se comunica con la escena solo a través del rig.
3. **Un solo loop de scroll:** Lenis se crea al montar `Landing.jsx`, solo con movimiento habilitado, y se destruye al desmontarla. Se importa en forma dinámica para no sumar al bundle principal.
   - Lo mueve `gsap.ticker`, sin `requestAnimationFrame` propio.
   - Notifica a ScrollTrigger con `lenis.on('scroll', ScrollTrigger.update)`.
   - El resto de la app (incluida `/para-garages`) mantiene el scroll nativo.
   - No se usa la opción `anchors` de Lenis. Lenis no cancela el salto nativo del hash, así que las anclas (incluido "Saltar al contenido") quedan nativas: mueven el foco y Lenis se resincroniza.
4. **Respaldo sin 3D:** sin WebGL2, con `?sin3d` o con `prefers-reduced-motion`, el recorrido muestra un SVG estático por paso. El contenido real siempre está en el HTML y el Canvas es `aria-hidden`.

## Alternativas consideradas

### Nivel 1: recorrido solo con SVG y GSAP (sin WebGL)
- Pros: sin dependencias 3D, el peso más bajo y el mejor SEO.
- Contras: pierde la profundidad de la maqueta, que es el objeto central del relato (el garage como lugar).
- Rechazada por elección del dueño del producto. Queda como respaldo dentro de esta misma decisión (punto 4).

### Nivel 3: mundo 3D fijo detrás de todo el sitio
- Pros: la mayor inmersión.
- Contras: un Canvas activo en toda la página, más riesgo en celulares medios y en el LCP, y conflicto con el flip-book del logo que ya ocupa el hero.
- Rechazada.

### Reutilizar `ogl` (ya está en `package.json`)
- Pros: no suma una dependencia nueva y pesa menos que three.
- Contras: no tiene integración declarativa con React ni el ecosistema y los patrones probados de la skill (R3F, `useFrame`, `frameloop`). Habría que reescribir a mano el ciclo de vida del Canvas.
- Rechazada. Su remoción, si no tiene uso, queda fuera de este ADR.

### GSAP ScrollSmoother en lugar de Lenis
- Pros: viene con GSAP y no suma una dependencia.
- Contras: envuelve el contenido en un contenedor transformado, lo que afecta los `position: fixed` existentes (navbar, partículas, `LogoWatermark`). La skill lo descarta a favor de Lenis.
- Rechazada.

## Consecuencias

- **Chunk 3D:** aparece un chunk diferido de 350 KB gzip como máximo (medido: 245 KB), que solo descarga quien llega cerca del recorrido y tiene WebGL2. El JS inicial queda en 186,3 KB gzip, contra 185,6 KB en la base. Una prueba de contrato de fuente verifica que three no salga de `EscenaGarage.jsx`.
- **Techo de React:** React no puede pasar de 19.3.x mientras se use R3F 9.8. Cualquier actualización de React requiere revisar primero el peer de `@react-three/fiber`.
- **Scroll de la landing:**
  - La regla `html:has(.landing-page) { scroll-behavior: smooth }` queda neutralizada por `lenis.css` mientras Lenis está activo.
  - Las anclas internas (`#contacto`, `#capacidades`) pasan a resolverse con `anchors: true` de Lenis.
- **Sticky en la landing:** el escenario fijo del recorrido usa `position: sticky`. Como `src/index.css` pone `overflow-y: scroll` en `html` y `overflow-x: hidden` en `body`, el body pasaba a ser un contenedor de scroll que anulaba el sticky. En las páginas de landing, `body:has(.landing-page)` usa `overflow-x: clip`, y el wrapper de `/` también usa `overflow-x-clip`.
- **`LogoWatermark`:** usa `scrub: 1`. Con Lenis puede notarse doble suavizado; se verifica con Playwright y, si hace falta, se ajusta en una tarea aparte.
- **Spec:** la verificación de la landing suma Chromium con WebGL por software (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`) y la versión `?sin3d` (ver el spec).
