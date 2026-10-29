# Spec: Landing inmersiva de SmartLot (`/`)

> Estado: Implementada
> Módulo: `landing-inmersiva`
> Última actualización: 2026-10-29

## Objetivo

Que una empresa que llega a `/` entienda, en una sola pasada, cómo SmartLot le asegura lugar a su gente:

1. Pide plazas.
2. El dueño del garage confirma.
3. El empleado reserva.
4. El empleado entra con QR.
5. La empresa audita cada consumo.

El ciclo se cuenta con un recorrido en scroll y **un solo momento 3D** (una maqueta procedural del garage), sin datos inventados y con el hero visible desde el primer render.

- **Audiencia principal:** admin de empresa o sede (`admin`).
- **Audiencia secundaria:** dueño de garage, que tiene su puerta a `/para-garages` (esa página ya cuenta su propio relato).
- **Éxito:** el visitante llega a "Registrate" sabiendo qué pasa después de registrarse.

Origen: pedido de aplicar la skill `web-inmersiva` a la landing (2026-10-29). Decisiones del dueño del producto en esa sesión:

- Nivel 2 de intensidad (3D acotado).
- Audiencia: empresas, con puerta a garages.
- Se sacan las métricas no verificadas y se prueba con el producto.
- Se retira la intro de puertas.
- El logo flip-book y las partículas se mantienen.

**Decisiones cerradas el 2026-10-29.** El dueño del producto delegó las decisiones pendientes ("modo automático"):

- Estudio de dirección: **B (Maqueta)**.
- Subtítulo del hero: **B**.
- Copy: los borradores de este spec, con tres ajustes de redacción:
  - El cuerpo de `problema` dice "cuesta auditar los consumos".
  - El paso de acceso se titula "Acceso con QR, sin molinetes".
  - En el cuerpo del acceso: "quedan registrados el ingreso y el egreso".

**Criterios de aceptación** (verificados el 2026-10-29; resultados en "Verificación"):

- [x] El `h1`, el subtítulo y la CTA "Registrate" del hero se pintan en el primer render, sin esperar animaciones ni 3D. Ya no hay intro de puertas.
- [x] La CTA principal dice "Registrate" en el navbar, el hero y el cierre. "Para dueños de garages" queda como acción secundaria.
- [x] `/` no muestra métricas, testimonios ni claims no verificados: nada de 4.9/5, 2 min, 4.8★, 24/7, "aprende" ni "tiempo real".
- [x] El recorrido cuenta los 5 pasos reales del producto: solicitud, trato, reserva, acceso con QR y consumo.
- [x] Sin WebGL2, con `?sin3d` o con `prefers-reduced-motion: reduce`, el recorrido se lee completo con un SVG estático por paso y la CTA funciona.
- [x] `three` y `@react-three/fiber` no entran en `index-*.js`. Viven en un chunk diferido de 350 KB gzip como máximo, que se pide recién cuando `#recorrido` está cerca.
- [x] Lenis se activa solo en `/` y se destruye al salir. `/para-garages` y los paneles mantienen el scroll nativo.
- [x] El scroll hacia adelante, hacia atrás y con un tirón rápido restaura el estado de cada paso del recorrido.
- [x] Accesibilidad:
  - Enlace para saltar al contenido y foco visible.
  - Un `h1` y un `h2` por sección.
  - Cuerpo de 16 px como mínimo.
  - Áreas táctiles de 44 px como mínimo.
- [x] Pruebas:
  - `npm test`, el lint de los archivos tocados y `npm run build` en verde.
  - Consola limpia en Playwright a 390×844, 768 y 1440×900, y con reduced motion.

## Contrato narrativo

### Mapa de secciones

Una sección es una idea y un encuadre. El copy de cada sección es un **borrador para aprobar**. Las fuentes son `PRODUCT.md`, `docs/domain-flows.md` y `docs/reservation-limit.md`.

| id | Qué hay en la escena | Título | Cuerpo | Fuente | Movimiento | weight |
|---|---|---|---|---|---|---|
| `inicio` | Logo del hero, con el flip-book actual sin cambios | Gestioná. Optimizá. Escalá. | Subtítulo nuevo, `TODO(contenido)`: ver las propuestas más abajo | Tagline de `PRODUCT.md` | El realce del título no lo esconde nunca | 1 |
| `problema` | Solo tipografía, sin 3D | Lugar sin asegurar, consumos sin auditar | Tu gente no tiene lugar asegurado y las reservas se arreglan de manera informal. Los acuerdos con el garage quedan de palabra y cuesta auditar los consumos por sede o por período. | `PRODUCT.md` § Problema que resuelve | El título se revela por líneas | 1 |
| `recorrido` | Maqueta del garage (3D acotado), ver los pasos abajo | Cómo funciona | Cinco pasos fijados | Ver la tabla de pasos | La cámara desciende de la planta a la plaza y de ahí al ingreso | 5 (1 por paso) |
| `capacidades` | Sin 3D, el bento actual reescrito | Control por sede y por persona | Cada sede opera lo suyo y vos definís las reglas para tu gente. | Ver la lista de capacidades | Revelado | 1 |
| `contacto` | Sin 3D, el `Contact.jsx` actual | Asegurale lugar a tu gente | Registrá tu empresa. Revisamos la solicitud y, una vez aprobada, creás tus sedes y sumás a tu equipo. | `pages/Register.jsx` (el registro de empresa requiere aprobación) | Ninguno | 1 |

### Pasos del recorrido

| Paso | Estado de la escena | Título | Cuerpo | Fuente | Cámara |
|---|---|---|---|---|---|
| `solicitud` | Planta completa. Un grupo de plazas se demarca en `brand-sky` (solicitadas) | Pedís lugar para tu gente | Elegís un garage de la zona y solicitás plazas para una sede, con la modalidad de pago que te sirve. | `PRODUCT.md` § Tratos y solicitudes; `ParaGaragesSteps.jsx` | Desciende sobre la planta |
| `trato` | Las plazas solicitadas pasan a `brand-blue` (trato activo) | El dueño confirma el trato | Nada se activa sin su confirmación. El acuerdo queda registrado con plazas, modalidad y vigencia. | Regla de negocio 5; glosario "Trato" | Quieta; las plazas se pintan |
| `reserva` | Un volumen simple de vehículo ocupa una plaza | Tu gente reserva su plaza | Cada persona reserva desde el celular para una fecha y un horario. Si la reserva lleva pago, la plaza queda apartada mientras se paga con Mercado Pago. | `docs/domain-flows.md` §2 | Se acerca a la plaza |
| `acceso` | Barrera del ingreso con una señal de acceso habilitado | Acceso con QR, sin molinetes | En el ingreso, el garagista escanea el QR de la reserva desde su celular y quedan registrados el ingreso y el egreso. No se instala hardware. | `PRODUCT.md` § Propuesta de valor; `docs/domain-flows.md` §3 | Travelling hasta el ingreso |
| `consumo` | Planta completa con las plazas usadas marcadas como registro | Cada consumo, auditado | Ves el detalle reserva por reserva y filtrás por sede, garage y período. Exportás en PDF o Excel. | `PRODUCT.md` § Transparencia de cobro | Se aleja a la planta completa |

### Capacidades

El bento actual se reescribe con capacidades reales que complementan el recorrido, sin repetirlo:

- **Sedes con su propio admin:** cada sede opera lo suyo y la empresa ve el conjunto. Fuente: `PRODUCT.md` § Empresas y sedes.
- **Límite de reservas por persona:** definís cuántas reservas activas puede tener cada empleado, o lo dejás sin máximo. Fuente: `docs/reservation-limit.md`.
- **Personal y vehículos:** das de alta a tu gente y a sus vehículos, y las patentes se validan al cargarlas. Fuente: `docs/domain-flows.md` §2 y §4.
- **Cambios con aprobación:** un cambio de cocheras también pasa por el dueño, en dos pasos. Fuente: `PRODUCT.md` § Tratos y solicitudes.

### Propuestas de subtítulo para el hero (`TODO(contenido)`, a elegir)

- **A:** "Pedís lugar para tu gente en garages de la zona, el dueño confirma y cada reserva, acceso y consumo queda registrado. Sin hardware, sin planillas."
- **B:** "Tu empresa contrata plazas en garages cercanos, tu gente reserva y entra con QR, y vos auditás cada consumo. Sin hardware, sin planillas."
- **C:** Mantener la frase canónica actual, que le habla al dueño de garage.

Elegida: **B**. `PRODUCT.md` la registra como frase canónica de `/`.

### Lo que sale de `/`

- **`StatsTicker`:** sale de `/`. El componente se queda para `/para-garages`, donde muestra capacidades reales.
- **Intro de puertas:** se elimina `IntroAnimation.jsx`.
- **Claims del bento:** "Tecnología de Asignación… que aprende", "Métricas en tiempo real", el eyebrow "Ecosistema Integral" y las badges "Core" y "Admin".

## Dirección de arte

### Biblia de estilo

Todo se resuelve **dentro** del sistema "Azul Señal" (`DESIGN.md`, ADR-005). No se crea una paleta nueva.

- **Clima:** preciso, señalizado, sereno.
- **Metáfora:** *la planta del garage*. Es el plano de ingeniería del North Star de `DESIGN.md`: la demarcación de las plazas es el lenguaje con el que se cuenta el estado de cada una.
- **Paleta con significado:**

  | Rol | Token | Significado |
  |---|---|---|
  | Campo | `brand-bg` #F5F7FB | El piso del plano |
  | Tinta | `brand-deep` #0C1E3F | Estructura, títulos, líneas de la planta |
  | Plaza solicitada | `brand-sky` #93C5FD | Pedido pendiente de confirmación |
  | Trato activo / plaza tomada | `brand-blue` #2563EB | El acento: solo marca lo que está activo |
  | Acceso habilitado | `success` #22C55E | Siempre acompañado de texto ("Acceso habilitado"); el color nunca va solo |
  | Neutro de maqueta | `border` #E2E8F0 / `border-strong` #CBD5E1 | Losa, columnas, volúmenes sin estado |

- **Voces:** Archivo como display y DM Sans como lectura. Las cifras van con `tabular-nums`.
- **Materiales:** maqueta mate de grises fríos, sin brillos ni reflejos. Solo emite luz lo que tiene significado (`toneMapped={false}`, sin Bloom).
- **Gramática de movimiento:** *se demarca*. Las plazas se pintan según su estado y la cámara desciende de la planta a la plaza y de la plaza al ingreso.
- **Ritmo:** el gancho entra rápido, el recorrido se toma su tiempo (cinco pasos) y el cierre es breve.
- **Audacia en un solo lugar:** el recorrido. El resto es sobrio.
- **Clichés del rubro que se evitan:**
  - El auto deportivo brillante.
  - El pin de mapa rebotando.
  - La "P" azul de estacionamiento.
  - Los dashboards con números inventados.

### Estudios de dirección (elegir uno)

Los tres estudios cambian el campo, el material, la luz, la relación tipográfica y la composición, dentro de los tokens:

- **A. Plano:** vista cenital ortográfica, líneas finas de `brand-deep` sobre `brand-bg`, luz plana. El texto va a la izquierda y la planta a la derecha. Archivo pesado en un tamaño contenido.
- **B. Maqueta:** vista axonométrica, volúmenes blancos mate con sombra horneada suave sobre `brand-bg`. Composición full-bleed con un panel de texto abajo. DM Sans domina y Archivo queda para el número de paso.
- **C. Nocturno:** campo `brand-deep`, plazas iluminadas como señalética y paneles de texto claros (`brand-surface`) con contraste AA. Archivo grande y composición centrada.

Los tres estudios muestran el mismo momento (paso "Trato", con tres plazas ya confirmadas y dos todavía solicitadas) en un lienzo de diseño: <https://claude.ai/artifact/Frm7VeH8W5afsDQshDyA8q>. El lienzo es privado hasta que su dueño lo comparta desde el menú Compartir.

**Estudio elegido:** B (Maqueta). En la implementación, la maqueta es procedural:
- losa, muros y columnas mate;
- demarcación instanciada;
- cinco plazas que pasan de celeste a azul;
- un marco blanco para la plaza reservada;
- una barrera con tapa luminosa en verde de éxito;
- un vehículo de dos volúmenes;
- el recorrido registrado como un tubo azul;
- una calle de acceso y una sombra horneada.

## Verificación (2026-10-29)

- **Pruebas y build:**
  - `npm test`: 131 pruebas en verde.
  - `npx eslint` sobre los archivos tocados: sin problemas.
  - `npm run build`: en verde.
- **Peso:**
  - JS inicial: 186,3 KB gzip, contra 185,6 KB en la base. La diferencia es mínima: la intro y las métricas salieron, y Lenis se carga aparte.
  - Chunk de la escena (`EscenaGarage-*.js`): 245 KB gzip.
- **Playwright** (Chromium con SwiftShader), recorridos hacia adelante, hacia atrás y con un tirón rápido en:
  - 1440×900, 768×1024 y 390×844: modo inmersivo;
  - con reduced motion, con `?sin3d` y sin WebGL: modo estático.
  - En todos: sin scroll horizontal ni errores de página.
  - La consola solo muestra la falta de backend (`ERR_CONNECTION_REFUSED`, `VITE_API_URL`) y el aviso conocido `THREE.Clock`.
- **Teclado:** el primer Tab es "Saltar al contenido principal", y Enter lleva el foco a `main`. El orden de tabulación sigue al visual.
- **Títulos:** un `h1`, un `h2` por sección y un `h3` por paso o capacidad.
- **Navegación SPA:** al ir a `/para-garages` Lenis se destruye (la clase `lenis` desaparece del `html`) y al volver se crea de nuevo.

## Pulido del hero y del problema (2026-10-29)

Pedido del dueño del producto después de ver el recorrido: el hero "puede ser mucho mejor" y la sección del problema se podía pulir. Criterios combinados:

- **`web-inmersiva`:** un solo momento orquestado por sección.
- **Impeccable** (`.agents/skills/impeccable`: polish, bolder, typeset, layout y su piso de calidad):
  - Llevar el hero al nivel expresivo que ya tiene el recorrido, con el mismo vocabulario.
  - Escala tipográfica en celulares.
  - Sin glows decorativos.
  - Detector sin hallazgos.
- **Emil Kowalski** (`emilkowalski/skills`, `emil-design-eng`; se leyó del repo público, no está instalada):
  - Transiciones con propiedades concretas.
  - `scale(0.97)` al presionar.
  - Nada de efectos de hover de 700 ms.
  - Escalonados de 30 a 80 ms.

**Hero**

| Antes | Después | Por qué |
|---|---|---|
| Las palabras entraban con un `yPercent` animado | Título, bajada y CTAs quietos desde el primer render | Son el LCP; el momento del hero pasa a ser la fila de plazas |
| Mitad inferior vacía (hero de 75vh) | `FilaPlazas`: una fila de plazas como piso, con tres en azul (lugar asegurado) que se demarcan al cargar | Es la demarcación del recorrido. El hero ocupa la primera pantalla en escritorio |
| `h1` de 28 px en celulares | `clamp(2.75rem, 6vw, 5rem)`: 44 px en celulares, igual en escritorio | La jerarquía en celular era casi nula frente a un cuerpo de 16 px |
| CTA de 64 a 72 px, `transition-all`, brillo de hover de 700 ms | `CtaButton size="md"` de 48 px (DESIGN.md), transición de `transform`, `background-color` y `box-shadow` en 150 ms y `active:scale-[0.97]` | Un control que se usa seguido responde rápido y no decora |
| Secundaria con ícono de auto y sombra | Botón quieto con borde, texto en tinta y chevron | Acción secundaria clara, sin competir con la CTA |
| Glow azul difuso detrás del logo | Sin glow; el logo lleva `fetchpriority="high"` | Glow decorativo; el logo es el LCP en escritorio |

**Problema**

- **Lista:** los dos párrafos pasan a ser tres problemas concretos de la empresa (`PRODUCT.md`), en una lista con hairlines.
- **Cierre:** "Con SmartLot, cada paso queda registrado.", en tinta plena.
- **Momento:**
  - Al scrollear hacia "Cómo funciona", cada problema se tacha en azul, con scroll scrubbed.
  - El tachado es un fondo, así que sigue cada línea cuando el texto se parte.
  - Con reduced motion queda sin tachar.
  - Se quitó el revelado con SplitText (un solo momento por sección), y el chunk de `Problema` bajó de 3,9 a 0,7 kB gzip.

**Transversal**

- **Títulos de sección:** comparten el rol `.titulo-relato`, de 32 px como mínimo en celular y con `text-wrap: balance`.
- **Selección de texto:** usa los colores de la marca (`::selection`).

## Desvíos respecto de la skill `web-inmersiva`

- **JS y Tailwind** en lugar de TS y CSS propio: manda lo que ya decidió el repo.
- **Lenis sin `anchors`:** así las anclas nativas mueven el foco (ADR-008).
- **Reduced motion usa la versión estática completa** (sin escenario fijo), no la cámara a saltos.
- **Sin `PerformanceMonitor` ni postprocesado:** la escena es liviana y no sumamos drei.
- **Prueba pura en `src/helpers/`:** el glob de `npm test` solo llega a un nivel de carpeta (ver `docs/development.md`).

## Supuestos

1. **Copy:** los textos de este spec son borradores derivados de la documentación. Ninguno se publica sin aprobación.
2. **Registro de empresa:** `/register` sin parámetros abre el modo empresa, y `?modo=garage` abre el de dueño de garage (`src/pages/Register.jsx`). La CTA principal apunta a `/register`.
3. **Flip-book del logo:** `LogoWatermark` sigue igual. Usa `scrub: 1`; con Lenis puede sentirse doblemente suavizado y, si pasa, se ajusta en una tarea aparte con aprobación.
4. **Scroll nativo:** la regla `html:has(.landing-page) { scroll-behavior: smooth }` de `src/index.css` convive con Lenis porque `lenis/dist/lenis.css` fuerza `scroll-behavior: auto` mientras Lenis está activo.
5. **Bundle principal:** la línea base actual es de 563,63 kB (173,25 kB gzip) y ya supera el presupuesto de 150 KB de la skill. Es deuda previa (ADR-006). Este trabajo no debe sumarle three.js ni R3F.

## Comandos

```bash
npm install
npm run dev
npm test
npx eslint src/vistasLanding src/componentesLanding/landing
npm run build
```

## Estructura del proyecto

- **`src/vistasLanding/Landing.jsx`:** compone las secciones, inicia y destruye Lenis, renderiza el skip link. Sin intro.
- **`src/componentesLanding/landing/contenido.js`:** todo el copy de las secciones y de los pasos. Ningún componente hardcodea texto del relato.
- **`src/componentesLanding/landing/smoothScroll.js`:** Lenis movido por `gsap.ticker`, `lenis.on('scroll', ScrollTrigger.update)` y `scrollToSection`.
- **`src/componentesLanding/landing/Problema.jsx`:** la sección `problema`.
- **`src/componentesLanding/landing/recorrido/`**
  - `Recorrido.jsx` (DOM):
    - Elige el modo. En el modo inmersivo hay un escenario `sticky` de `100svh` y un panel por paso que pasa por encima.
    - Un ScrollTrigger escribe el progreso en el rig, sin tween ni scrub propio, porque el suavizado lo hacen Lenis y la cámara.
    - El modo estático es el flujo normal con una planta por paso.
  - `useModoRecorrido.js`: decide entre "inmersivo" y "estatico" según WebGL2, `?sin3d` y reduced motion.
  - `rigRecorrido.js`: el objeto mutable `{ progreso, entrada }`. No importa three.
  - `camaras.js`: el encuadre de cada paso, horizontal y vertical, como datos puros. No importa three.
  - `paleta.js`: los colores de la maqueta con el nombre de su token (prueba contra `DESIGN.md`).
  - `EscenarioRecorrido.jsx` (DOM):
    - Ocupa el escenario fijo, observa la cercanía con IntersectionObserver y carga la escena con `lazy()`.
    - Si WebGL falla, muestra la planta estática.
  - `PlantaSvg.jsx`: el respaldo estático por paso, con `<title>` y utilidades de Tailwind.
  - `EscenaGarage.jsx`: el **único** módulo que importa `three` y `@react-three/fiber`.
- **`src/helpers/recorridoLanding.js`** y su prueba: la cuenta pura del recorrido (`pasoActivo`, `posicionPaso` con estadía, `encuadreEn`).
- **`src/componentesLanding/landing/BentoGrid.jsx`:** pasa a ser la sección `capacidades`.
- **`src/componentesLanding/landing/StatsTicker.jsx`:** el prop `stats` pasa a ser obligatorio y se elimina `DEFAULT_STATS`.

## Estilo de código

El patrón es el de la skill (rig mutable más un ScrollTrigger único que lo escribe), adaptado a JSX. Los comentarios van en español y solo explican el porqué.

```js
// rigRecorrido.js — estado continuo del recorrido. GSAP lo escribe y la
// escena lo lee en useFrame: nunca pasa por React para no re-renderizar
// en cada frame de scroll.
export const rigRecorrido = { progreso: 0, entrada: 0 };

// Recorrido.jsx — la capa DOM nunca importa three: la escena llega por lazy()
const EscenaGarage = lazy(() => import('./EscenaGarage'));
```

## Estrategia de pruebas

- **Framework:** `node:test`.
- **Lógica pura** (`*.test.js` junto a la fuente):
  - El paso que corresponde a cada progreso.
  - La interpolación de cámaras.
  - Que todo paso tenga su encuadre vertical.
- **Contratos de fuente** (`src/vistasLanding/landing.source.test.js`):
  - Sin intro.
  - Con skip link.
  - "Registrate" en navbar, hero y cierre.
  - Sin claims no verificados en `/`.
  - `three` y `@react-three/*` solo en `EscenaGarage.jsx`.
  - La escena se importa con `lazy()`.
  - Lenis se destruye en la limpieza.
- **Verificación manual con Playwright y el Chromium preinstalado:**
  - Viewports: 390×844, 768, 1440×900 y reduced motion.
  - Scroll hacia adelante, hacia atrás y con un tirón rápido.
  - Versiones `?sin3d` y sin WebGL.
  - Consola limpia.
  - Capturas revisadas a ojo.

## Límites

- **Siempre:**
  - Respetar `DESIGN.md` y los tokens de `src/index.css`.
  - Reutilizar `CtaButton`, `Navbar`, `usePageMeta` y el skip link de `ParaGarages.jsx`.
  - Envolver toda animación en `gsap.matchMedia` con reduced motion.
- **Preguntar antes de:**
  - Sumar dependencias fuera de `three`, `@react-three/fiber` y `lenis` (por ejemplo `@react-three/drei`).
  - Tocar `LogoWatermark`.
  - Cambiar rutas.
  - Cambiar claims de `/para-garages`.
- **Nunca:**
  - Inventar métricas, testimonios o logos.
  - Poner texto real dentro del Canvas.
  - Importar three desde la capa DOM.
  - Bloquear el scroll o forzar snapping.

## Fuera de alcance

- `/para-garages`, salvo el prop obligatorio de `StatsTicker`.
- El flip-book del logo y las partículas de fondo.
- Rutas nuevas, backend y formularios de registro.
- La deuda previa del bundle principal (ADR-006).

## Preguntas abiertas

- [x] Estudio de dirección: B (Maqueta).
- [x] Subtítulo del hero: B.
- [x] Copy de `problema`, los pasos, `capacidades` y el cierre: aprobado por delegación, con los ajustes de redacción de arriba.
- [ ] ¿Sumamos una imagen de Open Graph (`og:image`) con una captura del recorrido? Pendiente: la meta necesita una URL absoluta y para eso hace falta el dominio de producción.
