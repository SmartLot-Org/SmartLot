# ADR-014: El módulo `inmersiva` sirve a varias páginas

## Estado

Aceptado.

## Fecha

2026-11-18.

## Contexto

`/para-garages` se rehace como un relato con scroll sobre el mismo plano de la ciudad que usa la home
(`docs/specs/SPEC-landing-garages.md`, nivel 3). El mundo, el director de scroll, las cuatro versiones
y sus tests ya existen desde ADR-008, pero todo el módulo `componentesLanding/inmersiva/` apuntaba a la
home:

- `scroll/estado.js` armaba el guion al importarse, con las secciones y la coreografía de la home, y el
  director (`scroll/useStoryTimeline.js`) leía el deslizador de la home desde el store.
- `ui/Nav.jsx`, `Cta.jsx`, `Regla.jsx` y `Seccion.jsx` importaban el contenido y las piezas de la home.
- `vistasLanding/Landing.jsx` mezclaba el armazón (versiones, salto al contenido, barra, regla y pie)
  con el contenido de la home.
- `three/Experience.jsx` tiene la lista fija de las escenas de la home, y varias escenas importan su
  contenido o tienen anclas fijas en la oficina y en los garages de la home.
- `scroll/rig.js`, `three/vivo.js` y `estado/store.js` son singletons de módulo.

Restricciones: la home es la única vista eager (ADR-006), la capa DOM nunca importa `three`
(ADR-008), la home no puede cambiar ni en pantalla ni en sus tests, y no se agregan dependencias.

## Decisión

1. **La página es un parámetro y el armazón es común.** Cada página del plano es un objeto
   (`inmersiva/paginas/home.js`, `paginas/garages.js`) con `id`, `meta`, `cta`, `enlace` (la otra
   página), `pie`, `secciones`, `piezas`, `posters`, `escena` (un componente `lazy()` o `null`),
   `guion` (o `null`) e `intro`. `ui/PaginaPlano.jsx` hace lo que hacía `Landing.jsx`: llama a
   `asegurarInicio()` antes del primer render, decide la versión, inicia Lenis y el director, y arma el
   salto, la barra, la regla, las secciones y el pie. `Landing.jsx` queda en
   `<PaginaPlano pagina={PAGINA_HOME} />` y `ParaGarages.jsx` en `<PaginaPlano pagina={PAGINA_GARAGES} />`.
   - Las piezas de la nota se nombran en cada sección (`s.piezas`) y el objeto de página dice qué
     componente es cada una. Las que solo mueven el dibujo se marcan `soloConEscena`, y la que dibuja
     su propio póster, `reemplazaFigura`.
   - Una página sin `escena` se muestra en el flujo sin 3D y sin el botón "Ver sin 3D".
   - El guion se arma por página con `crearGuion(pagina)` (`scroll/guion.js`), una función pura.
     `scroll/estado.js` sigue exportando lo de la home con los mismos nombres, armado con ella. Los
     controles de la nota que recomponen el dibujo (el deslizador de la home, el interruptor de
     garages) entran por `guion.ajustar` y `guion.suscribir`: el director no conoce ningún control.
2. **Un escenario 3D, una composición por página.** `three/Escenario.jsx` sale de `Experience.jsx`
   con el Canvas, el monitor de rendimiento, `CameraRig`, el puente de frames, el aviso del primer
   cuadro, el contexto perdido y los colores desde los tokens. `three/Experience.jsx` sigue siendo la
   composición de la home, con el mismo archivo y la misma importación diferida, y
   `three/ExperienceGarages.jsx` es la de garages. Vite separa lo común (three, R3F, drei, maath, el
   mundo y las escenas compartidas) en un chunk compartido: la home no descarga las escenas de garages
   y quien pasa de una página a la otra baja solo la parte propia. Las escenas compartidas que
   necesitan otro dato reciben props cuyo valor por defecto reproduce la home.
3. **Un solo vocabulario de fx, con el 0 como estado de la home.** `FX_CERO` suma las claves de
   garages (`fuera`, `alta`, `sedes`, `busqueda` y `llegan`) y cada una vale 0 en la home: una escena
   compartida que lea una clave nueva no cambia nada en la home. `crearGuion` arranca cada composición
   en `FX_CERO` y después aplica el `inicial` de la página (en garages, tu garage empieza fuera del
   mapa).
4. **Los singletons se quedan.** `rig`, `vivo` y `estado/store.js` siguen siendo módulos únicos porque
   hay una sola página del plano montada por vez: cada página es una ruta. Nada arrastra estado de una
   página a la otra: el director reescribe la cámara y todos los fx desde el arranque en cada
   escritura, `Experience` reinicia `vivo` al montarse y los triggers recalculan la sección activa. Lo
   propio de cada página va aparte: `comparar`, `diaElegido` e `intro` son de la home y siguen en
   `store.js`, que no cambia; el interruptor de garages tiene su store chico (`estado/garages.js`).
5. **`/para-garages` sigue en `lazy()` y deja el vidrio.** La ruta se sigue cargando con `lazy()`
   (ADR-006). Como la home es eager, el armazón y la capa DOM compartida ya están en la entrada, y el
   chunk de la ruta solo trae el contenido, las piezas y `inmersiva/garages.css`. La página deja el
   vidrio, el ticker y las partículas: la Regla del Vidrio de `DESIGN.md` queda solo para la
   autenticación.
6. **Los presupuestos de ADR-008 valen por página.** Hasta 150 kB gzip de JS propio antes del 3D y
   hasta 350 kB gzip de 3D, medidos en cada página (en garages, el chunk compartido más el propio).
   ADR-008 no se edita.

## Alternativas consideradas

- **Copiar el armazón en `ParaGarages.jsx`.** Es lo más rápido, pero duplica la decisión de la versión
  (`asegurarInicio`, `mostrar3d`, el botón "Ver sin 3D"), el salto, la regla y el pie, y cada arreglo de
  accesibilidad (como el de las notas desvanecidas, commit `3011f5c`) habría que hacerlo dos veces.
  Descartada.
- **Una ruta de layout con `<Outlet>` en `src/App.jsx`.** Obliga a tocar el router y a resolver en el
  mismo layout una página eager y otra `lazy()`, y el contenido igual tiene que llegar por algún lado.
  El objeto de página logra lo mismo sin tocar `App.jsx`. Descartada.
- **Instanciar `rig`, `vivo` y el store por página, con un contexto de React.** Más prolijo en teoría,
  pero nunca hay dos páginas del plano montadas a la vez, y `rig` vive fuera de React a propósito: lo
  leen el ticker de GSAP y `useFrame` sin pasar por un render. Sumaría providers y riesgo de renders de
  más sin ganancia. Descartada mientras haya una página por vez.
- **Un vocabulario de fx por página.** Las escenas compartidas tendrían que traducir claves y un cambio
  en una página podría mover la otra. Descartada.
- **3D acotado en garages (nivel 2, un escenario contenido por sección).** Lo descarta la spec: obliga
  a construir un escenario que el proyecto no tiene y a mantener dos formas de mostrar el mismo dibujo.

## Consecuencias

- Una página nueva del plano es un contenido, un objeto de página y, si lleva 3D, una composición y una
  coreografía. El armazón no cambia.
- Cambiar el guion de la home sigue tocando los tres lugares de ADR-008 (contenido, coreografía y
  escena), y `paginas/home.js` solo si cambian las piezas o la escena.
- El objeto de página y las firmas de `Seccion`, `Nav`, `Cta`, `EnlacePagina` y `Regla` son la
  interfaz entre el armazón y cada página: cambiarlos toca las dos. Los cubren los tests de contrato de
  fuente (`vistasLanding/landing.source.test.js`).
- La regla de la capa DOM (`landing_dom_sin_three.source.test.js`) y la de las notas accesibles
  (`notas_accesibles.source.test.js`) recorren también las subcarpetas de `ui/` y `paginas/`, así
  cubren las piezas de cada página.
- Medido sobre la build del 2026-11-18, con el armazón ya en uso por la home (etapa 2A): la entrada
  pasa de 171,7 a 172,4 kB gzip, la CSS no cambia y el chunk 3D de la home tampoco (263,6 kB gzip).
  Las capturas de la home con movimiento reducido, en 390 y 1440 px, son idénticas a las de antes.
- Dos páginas del plano no pueden estar montadas a la vez (por ejemplo, una vista previa de garages
  dentro de la home). Si alguna vez hace falta, primero hay que sacar los singletons.
