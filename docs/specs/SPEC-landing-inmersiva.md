# Spec: Landing inmersiva

> Estado: En revisión
> Módulo: `landing-inmersiva`
> Última actualización: 2026-11-16

## Objetivo

Rehacer por completo la landing pública (`/`) como un relato con scroll sobre un mundo 3D, y dejar definido cómo se suma después `/para-garages`. Destinatarios: quien administra una empresa y busca cocheras para su personal, y quien es dueño de un garage con plazas libres.

Éxito en una frase: después de una pasada de scroll, el visitante entiende qué hace SmartLot para su lado del trato y se registra.

Por qué ahora: la home actual tiene tres bloques (hero, una grilla de cuatro tarjetas y un cierre), no muestra el producto, no tiene botón principal en el hero y se apoya en un lema de tres verbos. La idea más fuerte del sitio está en `/para-garages` ("Aparecé en el mapa de las empresas") y la home no la usa.

**Criterios de aceptación:**

- [ ] El título, el subtítulo y la CTA del hero son HTML y se ven en el primer render, sin esperar al 3D ni a una animación.
- [ ] Las siete secciones se leen completas y la CTA funciona en cuatro versiones: normal, sin 3D (`?sin3d`), con movimiento reducido y estática (sin WebGL).
- [ ] En perfil móvil: LCP menor a 2,5 s, CLS menor a 0,1 e INP menor a 200 ms.
- [ ] El JS de entrada no supera los 150 kB gzip (hoy `index-*.js` pesa 173 kB gzip) y el chunk 3D no supera los 350 kB gzip.
- [ ] 60 fps en notebook y al menos 30 en un celular de gama media; el scroll es reversible y nunca se secuestra la rueda.
- [ ] No aparece ninguna métrica, testimonio ni logo que no haya dado el dueño del producto.
- [ ] Contraste AA en todo el texto, foco visible, enlace para saltar al contenido, un solo `h1` y un `h2` por sección.
- [ ] Ningún archivo de la capa DOM importa `three` ni `@react-three/*`.

## Supuestos

1. La CTA principal sigue siendo "Registrate" y lleva a `/register`. El alta de garage usa `/register?modo=garage`, que ya existe (`src/pages/Register.jsx:22`).
2. La home le habla primero a las empresas. El dueño de garage entra por un enlace secundario y `/para-garages` profundiza su lado.
3. La marca no cambia: "Azul Señal", Archivo para títulos y DM Sans para lectura. Lo que se reemplaza es el mundo visual de la landing (vidrio, ruido, tarjetas), y eso obliga a actualizar las secciones de landing de `DESIGN.md`.
4. Las métricas del ticker actual (4.9/5, 2 min, 4.8★, 24/7) son datos de ejemplo según `PRODUCT.md` y no se trasladan. La prueba se arma con el producto real.
5. El proyecto sigue en JavaScript (`.jsx`), sin TypeScript, y sin SSR.
6. La geometría 3D se genera por código. No hay modelos encargados ni presupuesto de arte externo.
7. Las pantallas de login y registro quedan como están en esta etapa.

## Nivel de intensidad

**Nivel 3, mundo de scroll**: un Canvas fijo detrás del contenido, donde el scroll mueve la cámara. Motivo: la metáfora es un lugar (ciudad, cuadra, garage, plaza), no un objeto ni una serie de datos.

`/para-garages` queda para una segunda etapa, en nivel 1 o 2, reutilizando el mismo mundo.

## Guion: de la ciudad a la cochera

Un solo movimiento de cámara atraviesa el relato: empieza lejos, sobre la ciudad, y se acerca escala por escala hasta el celular del empleado. Al final se aleja de nuevo.

Los títulos y cuerpos son borradores de copy para aprobar antes de construir el esqueleto HTML.

| `id` | Escena | Título | Cuerpo | Evidencia | Movimiento | `weight` |
|---|---|---|---|---|---|---|
| `gancho` | Una zona de la ciudad vista desde arriba: una oficina y, alrededor, garages con lugar | Cocheras para tu equipo, cerca de la oficina | SmartLot conecta a tu empresa con garages que tienen plazas libres cerca de cada sede. Sin hardware, sin planillas. | `PRODUCT.md`, resumen | desciende | 1,0 |
| `problema` | La cuadra: autos dando vueltas y un garage a medio llenar | Acuerdos de palabra y vueltas a la manzana | Hoy los acuerdos se arreglan por WhatsApp o en papel, las cocheras quedan vacías y nadie sabe cuánto se usó cada lugar. | `PRODUCT.md`, problema de cada lado | orbita | 1,2 |
| `idea` | Una línea une la oficina con el garage | Un trato claro entre empresa y garage | La empresa pide plazas para una sede y el dueño del garage acepta o rechaza. Nada se activa sin su confirmación. | Regla de negocio 5; pantalla `/gestion_garages` | se traza | 1,2 |
| `reserva` | Un nivel del garage: las plazas se van ocupando | Cada persona reserva su lugar | Cada empleado elige día y horario desde el celular. La empresa define cuántas reservas activas puede tener cada uno. | Regla de negocio 1; pantalla `/nueva_reserva` | se llena | 1,5 |
| `acceso` | La entrada del garage y un celular con el código | Se entra con un QR | El garagista escanea el código al ingreso y a la salida. No hay molinetes ni lectores que instalar. | Propuesta de valor; pantalla `/control-acceso` | avanza | 1,5 |
| `prueba` | El detalle de consumos, reserva por reserva | Cada consumo queda registrado | Tiempo, tarifa e importe por reserva, con exportación a PDF y Excel. El garage y la empresa ven el mismo detalle. | Pantalla `/admin_pagos` con datos de demostración | se apila | 1,5 |
| `accion` | La ciudad otra vez, con más garages marcados | Pedí cocheras para tu equipo | Creá la cuenta de tu empresa y pedí plazas en los garages de tu zona. | — | asciende | 1,0 |

CTA: "Registrate", igual en el hero y en `accion`, hacia `/register`. Enlace secundario, más callado: "Tengo un garage", hacia `/para-garages`.

## Dirección de arte

**Clima:** preciso, urbano, luminoso.

**Metáfora de mundo:** la ciudad a escala. Cada sección es el mismo lugar visto más de cerca.

**Señal propia:** el cartel argentino de estacionamiento, el cuadrado azul con la "E". El azul señal marca una sola cosa en todo el sitio: un lugar que está disponible o reservado para vos.

**Clichés del rubro que se evitan:**

1. La foto de garage subterráneo oscuro con luces en fuga.
2. El auto brillante que gira como si fuera el producto.
3. El mapa con pines de aplicación de delivery.

También quedan afuera el ticker de métricas, las tarjetas iguales de ícono, título y texto, los rótulos en mayúsculas sobre cada título y la numeración 01, 02, 03.

### Estudio elegido: A, "Plano"

Se compararon tres estudios sobre el mismo guion, distintos en campo de color, material, luz, tipografía y composición. Se eligió el A el 2026-11-16; la tabla queda como registro.

| | A. Plano | B. Noche de ciudad | C. Hormigón de día |
|---|---|---|---|
| Idea | El sitio es un plano técnico que se dibuja solo | La ciudad de noche; los garages se encienden | Se baja por la rampa de un garage real |
| Campo | Papel frío `#F5F7FB` | Azul profundo `#0C1E3F` | Hormigón claro, neutros fríos |
| Tinta y acento | Líneas en azul profundo; relleno azul señal para lo reservado | Blanco; carteles "E" emisivos en azul señal | Texto `#1E293B`; pintura azul señal en flechas y números |
| Material | Dibujo axonométrico de aristas y tramas, sin sombreado | Volúmenes mate con emisivos; asfalto con reflejo leve | Hormigón mate, pintura epoxi, columnas con franja |
| Luz | No hay: se traza | Nocturna, de cartelería; bloom en equipos potentes | Natural, entra por la rampa |
| Tipografía | Archivo 800 en tinta sobre papel; cotas en DM Sans con cifras tabulares | Archivo 900 muy grande en blanco sobre paneles sólidos | Archivo como señalética pintada dentro de la escena |
| Composición | Cámara axonométrica; el dibujo ocupa dos tercios y el texto va en un panel de papel | Mundo a sangre completa; panel abajo a la izquierda | Cámara a la altura del conductor; una sección por nivel |
| Movimiento | Se arma y hace zoom por escalas | Travelling lateral y descenso | Desciende |
| Recurso propio | Un indicador de escala (1:5000 hasta 1:1) hace de mapa del recorrido | Los garages se prenden uno por uno al cerrar el trato | Los números de nivel pintados marcan el avance |
| Costo en equipos | El más liviano: líneas e instancias | El más exigente: bloom y muchas luces | Intermedio: pide un modelo cuidado |
| Riesgo | Menos espectáculo inmediato | Es el look oscuro con brillo más visto en sitios de tecnología | Fácil de caer en el garage 3D genérico; es el que más arte necesita |

**Por qué A.** Es el más propio: `DESIGN.md` ya define la marca como "la claridad de un plano de ingeniería bien ejecutado". Es el que mejor rinde en un celular de gama media, y el zoom por escalas le da al relato un hilo que los otros dos no tienen.

Antes de construir escenas, el estudio A se muestra como mini prototipo navegable (hero y una sección) para confirmarlo.

## Comandos

```bash
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

## Estructura del proyecto

- `src/vistasLanding/Landing.jsx` → sigue siendo la ruta `/` y sigue cargándose sin `lazy()`. Solo contiene la capa DOM.
- `src/componentesLanding/inmersiva/contenido/secciones.js` → las siete secciones: textos, evidencia y `weight`. Ningún texto queda escrito dentro de los componentes.
- `src/componentesLanding/inmersiva/scroll/` → `smoothScroll.js`, `useStoryTimeline.js`, `rig.js`. Un solo director escribe `rig`; las escenas solo lo leen.
- `src/componentesLanding/inmersiva/estado/store.js` → sección activa, tier y versión del sitio.
- `src/componentesLanding/inmersiva/three/` → `Experience.jsx` (se carga con `lazy()`), `CameraRig.jsx`, `escenas/*.jsx`, `paleta.js`.
- `src/componentesLanding/inmersiva/ui/` → `Seccion.jsx`, `Nav.jsx`, `Cta.jsx`.
- `public/landing/posters/` → imágenes de respaldo para las versiones sin 3D.
- Tokens nuevos en `@theme` de `src/index.css`; se actualizan junto con `DESIGN.md`.

Se parte de los templates de la skill `web-inmersiva` del hub, adaptados de TypeScript a JavaScript y a estos nombres de carpeta.

## Estilo de código

```js
// contenido/secciones.js — el contenido vive acá, no en los componentes
export const SECCIONES = [
  {
    id: "gancho",
    titulo: "Cocheras libres, empresas cerca. Los unimos.",
    cuerpo: "SmartLot conecta empresas que necesitan cocheras para su personal con garages que tienen plazas libres.",
    movimiento: "desciende",
    weight: 1,
    cta: { etiqueta: "Registrate", destino: "/register" },
  },
];
```

Movimiento narrativo con `scrub: true` para la cámara y revelados de 0,6 a 1,0 s para el contenido. La interfaz (nav, botones) sigue las reglas de micro-interacción del hub: menos de 300 ms, sin `transition: all`.

## Estrategia de pruebas

- Framework: `node:test`, junto a la fuente.
- `secciones.test.js`: ids únicos, títulos de 3 a 8 palabras, `weight` entre 0,8 y 2,5, CTA solo en el hero y en la última sección.
- Helper puro que convierte los `weight` en rangos de scroll, con su test.
- `landing_dom_sin_three.source.test.js`: contrato de fuente que falla si un archivo de `ui/`, `scroll/`, `estado/` o `Landing.jsx` importa `three` o `@react-three/*`.
- Verificación manual: recorrido completo hacia adelante y hacia atrás en 390 y 1440 px, en las cuatro versiones del sitio; Core Web Vitals en perfil móvil; teclado y lector de pantalla.

## Etapas

Cada una termina con una revisión antes de pasar a la siguiente.

1. Aprobación de esta spec y mini prototipo del estudio A.
2. Base: dependencias, estructura, tokens y ADR.
3. Esqueleto HTML con el contenido real, sin 3D ni animación. Ya es publicable.
4. Director de scroll y escena gris, para validar tiempos y encuadres.
5. Escenas definitivas y pase de arte.
6. Tiers y respaldos: sin 3D, movimiento reducido, estática.
7. Verificación y entrega.

## Límites

- **Siempre:** voseo y tono de `PRODUCT.md`; hero en HTML antes que el 3D; el Canvas es decorativo y lleva `aria-hidden`; actualizar `DESIGN.md` y `docs/architecture.md` cuando cambie algo que documentan.
- **Preguntar antes de:**
  - Agregar dependencias. Esta spec necesita `three`, `@react-three/fiber`, `@react-three/drei`, `lenis`, `zustand` y `maath`. El estudio A no usa postprocesado. GSAP y `@gsap/react` ya están instalados en las versiones que hacen falta.
  - Autoalojar las fuentes en lugar de usar Google Fonts: afecta a toda la app.
  - Quitar `ogl`, que hoy figura en `package.json` y no se importa en `src/`.
- **Nunca:** inventar métricas, testimonios o logos; prometer IA; importar `three` desde la capa DOM; forzar snapping o secuestrar la rueda.

Decisión de arquitectura a registrar: un ADR nuevo para la landing con WebGL (stack, presupuestos y versiones de respaldo).

## Fuera de alcance

- Los paneles por rol y las pantallas de login y registro.
- SSR o prerender.
- `/para-garages`, que tendrá su propia spec cuando esta esté aprobada.
- Cualquier claim nuevo de marketing.

## Decisiones tomadas (2026-11-16)

- **Estudio:** A, "Plano".
- **Audiencia:** la home le habla primero a las empresas.
- **Prueba:** solo el producto. Pantallas reales y hechos verificables; ninguna cifra de satisfacción.

## Preguntas abiertas

- [ ] ¿Desde dónde llega la mayoría de las visitas, celular o escritorio? ¿El posicionamiento en buscadores es prioritario? Si lo es, hay que sumar prerender.
- [ ] ¿Se aprueban las dependencias nuevas y el autoalojado de fuentes?
- [ ] ¿El copy borrador del guion se usa como base o lo reescribís vos?
- [ ] ¿Se conserva algo de la landing actual (la animación de entrada, la marca de agua del logo)?
