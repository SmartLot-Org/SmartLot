# Spec: Landing de garages

> Estado: Implementada, con los "Por defecto" de las preguntas abiertas (pendientes de confirmación del dueño del producto)
> Módulo: `landing-garages`
> Última actualización: 2026-11-25

> Cambio pedido por el usuario (2026-11-23): `alta` y `mapa` pasan a ser una sola sección, `mapa`, con el mensaje "Las empresas cercanas te encuentran", y en el dibujo una flecha sale de tu garage hacia la tarjeta con los datos de cómo te ve una empresa. Son siete secciones. Detalle en "Alta y mapa en una sección (2026-11-23)".

> Cambio pedido por el usuario (2026-11-25): el logo 3D de la rama `claude/logo-3d-qysndm` se integra. En el cierre de la home el logo flota sobre la oficina y, en el de esta página, sobre tu garage, donde convergen las rutas de las sedes. La home cambia a propósito en su cierre. Detalle en "Logo 3D en el cierre (2026-11-25)". Ajuste del mismo día, pedido por el usuario: "hacé que el logo 3D del final de las landings sea un poco más pequeño y gire en el lugar".

> Decisión del usuario (2026-11-18): se implementa sin esperar la aprobación. Las recomendaciones de "Preguntas abiertas" valen como decisiones por defecto (marcadas "Por defecto"). Si el dueño del producto responde distinto, esta spec se actualiza antes de seguir con la etapa afectada.

## Objetivo

Rehacer `/para-garages` como un relato con scroll sobre el mismo plano de la ciudad que usa la home (estudio A, "Plano", ADR-008), alrededor del mensaje más fuerte del sitio: **Aparecé en el mapa de las empresas**. Destinatario: quien tiene un garage con plazas libres y todavía no está en SmartLot.

Éxito en una frase: después de una pasada de scroll, el dueño entiende que su garage aparece cuando una empresa busca cocheras cerca de una de sus sedes, que nada se activa sin su confirmación, y se registra.

Por qué ahora (capturas y línea base del 2026-11-18):

- Una visita directa ve primero el spinner de la ruta y después el título entra con una animación (`.word` desde `yPercent: 110`). El hero no tiene subtítulo ni botón.
- La primera acción hacia `/register?modo=garage` está al final, a unos 7.800 px del inicio en escritorio. La barra ofrece "Regístrate", con tuteo, hacia `/register`, que abre el alta de empresa.
- LCP móvil de 2752 ms, y el elemento LCP es la marca de agua del logo (`paraGarages/GarageWatermark.jsx:46`, al 6 % de opacidad).
- `landing/landing.css` no está en una capa y le gana a las utilidades de Tailwind: las cifras de la vitrina salen del tamaño del cuerpo y los textos chicos, agrandados.
- Repite las marcas de plantilla que la home ya dejó: un rótulo en mayúsculas sobre cada título, tarjetas iguales con ícono, pasos 01/02/03, pastillas "CORE", cifras de ejemplo como héroe, vidrio, ruido, partículas y el logo girando.
- Promete lo que el producto no respalda: "pueden empezar a generar esta semana", "sin costo de instalación", "registro en minutos", "en minutos ya está publicado", "cobrá por uso" (la pantalla de consumos dice que no son cobros) y "el estacionamiento del futuro".
- axe marca contraste insuficiente en tarjetas, rótulos y números decorativos, y una tabla con scroll horizontal que no se alcanza con teclado. En el celular, los botones de la barra miden de 40 a 42 px.
- No comparte nada con la home: quien llega desde "Para garages" cambia de sitio.

**Criterios de aceptación:**

- [ ] El `h1` "Aparecé en el mapa de las empresas", el cuerpo y la CTA "Registrá tu garage" (hacia `/register?modo=garage`) son HTML y están en el primer render de la ruta, sin esperar al 3D ni a una animación.
- [ ] Las siete secciones se leen completas y la CTA funciona en las cuatro versiones: normal, sin 3D (`?sin3d`), con movimiento reducido y estática (sin WebGL).
- [ ] El interruptor "Visible / En borrador" funciona con teclado, mouse y toque en las cuatro versiones y anuncia el cambio.
- [ ] Perfil móvil de la línea base (mediana de tres corridas): LCP menor a 2,5 s (hoy 2752 ms), con el `h1` o el párrafo del hero como elemento LCP; CLS menor a 0,1 en la carga y durante el scroll; INP menor a 200 ms en el interruptor y en la CTA.
- [ ] Se cumplen los presupuestos de JS y de 3D de la tabla "Presupuestos".
- [ ] 60 fps en notebook y al menos 30 en un celular de gama media (emulado). El scroll es reversible y nunca se secuestra la rueda.
- [ ] Solo aparecen los cuatro claims vigentes: 24 meses de historial; tarifas de auto, moto y pickup; 100% online, sin hardware; exportación a PDF y Excel. Ninguna métrica, testimonio, logo ni cantidad de empresas cercanas. Los datos de las piezas dicen "Datos de ejemplo".
- [ ] El relato respeta las reglas de negocio 4, 5 y 6 (ver "Guion").
- [ ] La home no cambia. Sus tests pasan sin cambiar aserciones de comportamiento y, con movimiento reducido, las capturas del estado final de cada sección (390 y 1440 px) difieren en menos del 0,5 % de los píxeles respecto de las de antes.
- [ ] axe no da hallazgos serious ni critical en 390, 1440 y 390 con movimiento reducido. Contraste AA, foco visible, enlace para saltar al contenido, Canvas con `aria-hidden`, objetivos táctiles de 44 px o más, y un solo `h1` y un `h2` por sección en el árbol de accesibilidad, también con el scroll al final.
- [ ] Ningún archivo de la capa DOM (incluidos `ParaGarages.jsx`, el armazón común y los objetos de página) importa `three` ni `@react-three/*`.
- [ ] No quedan `componentesLanding/paraGarages/`, `componentesLanding/landing/`, `CtaButton.jsx` ni las reglas de vidrio de `index.css`, y ningún archivo los nombra.

## Qué significa "aparecer en el mapa de las empresas" (verificado en el código)

Es el eje del relato. Solo lo que sigue cuenta como evidencia de las secciones.

1. **La búsqueda de la empresa.** Un admin de empresa entra a `/gestion_garages`, pestaña "Buscar garages", elige una sede y un radio de 5, 15, 50 o 100 km (50 por defecto), con los filtros "Con disponibilidad" y "Activos/abiertos", este último prendido por defecto (`vistasAdmin/gestion_garages.jsx:35` y `:215`). Los datos salen de `GaragesGetCercanos(sedeId, radioKm)`, que llama a `GET /api/garage/cercanos` con `sede_id` y `radio_km` (`servicies/API_Garage.js:51`), y se filtran con `filterGarages` (`helpers/tratos.js`).
2. **El mapa.** `componentesAdmin/MapaGaragesCercanos.jsx` marca la sede con un círculo oscuro con "S" y cada garage con un círculo azul con "G" (`:79-90`). Necesita la latitud y la longitud del garage. Si Google Maps no carga, la búsqueda sigue en el listado.
3. **Lo que la empresa ve de tu garage.** La tarjeta muestra distancia y tiempo de manejo, nombre, dirección, horario y días, "X de Y disponibles" y las tarifas de auto, moto y pickup. El botón "Solicitar cocheras" se deshabilita si el garage ya está contratado, si hay una solicitud pendiente o si no quedan disponibles (`gestion_garages.jsx:261-263`).
4. **El pedido.** La empresa elige cuántas cocheras (de 1 al máximo disponible), la modalidad de pago ("La empresa cubre el cupo" o "El empleado paga todo") y una descripción opcional. El pedido queda "Esperando confirmación del garage" (`gestion_garages.jsx:239` y `:268`).
5. **La respuesta del dueño.** En `/duenio-garage/tratos` (`componentesCompartidos/GestionTratosGarage.jsx`, modo dueño) ve la empresa, el garage, la sede, las cocheras, la modalidad y la descripción, y elige "Aceptar trato" o "Rechazar" (`:60` y `:140`). Los cambios de cantidad llegan aparte y piden "Autorizar cambio" (`:85` y `:150`). Es la regla de negocio 5.
6. **El alta.** `/register?modo=garage` crea la cuenta de dueño y entra directo: "Después de registrarte vas a poder crear tu garage y empezar a recibir solicitudes de empresas" (`componentesLanding/auth/RegisterGarageForm.jsx:144`). El garage se carga en `/duenio-garage/crear-garage` con nombre, piso, ubicación con un punto del mapa (obligatorio), horario, días, plazas para reservas y para uso libre, y tarifas por hora de auto, moto y pickup. Se crea con `estado: true` (`vistasDueñoGarage/crear_garage_dueño.jsx:96` y `:161-172`).
7. **El borrador no es un paso previo.** Un garage nuevo nace operativo. "Mover a borrador" lo saca de la vista de las empresas ("ya no estará visible para las empresas, pero podrás restaurarlo cuando quieras") y "Restaurar" lo devuelve (`vistasDueñoGarage/duenio_garage_dashboard.jsx:85-91` y `:132-138`). Por eso el relato no presenta el alta como el paso "de borrador a publicado": el alta pone el garage en el mapa y el borrador aparece después, como lo que es, ocultarlo y restaurarlo (regla 6).
8. **Los consumos.** `vistasDueñoGarage/cuentas_por_cobrar.jsx` filtra por empresa, sede, garage y un período de hasta 24 meses (`:42`), muestra el detalle por reserva (vehículo, horario, minutos, tarifa por hora e importe) y exporta a PDF y Excel. La misma pantalla aclara: "Estos datos son consumos generados. No confirman cobros, vencimientos ni pagos recibidos" (`:48`) y "Cobros, estados y conciliación: pendiente de integración" (`:25`).

## Supuestos

1. La CTA lleva a `/register?modo=garage`, que ya existe (`src/pages/Register.jsx:22`). No hace falta ninguna ruta nueva ni tocar `src/App.jsx`.
2. `/para-garages` sigue cargándose con `lazy()` (ADR-006). La home sigue siendo la única vista eager.
3. El mundo de la home alcanza. El garage del trato (`G1` en `three/mundo.js`) hace de "tu garage", la oficina de la home es una de las sedes y su recorrido de 300 m es el del pedido. Las otras sedes se eligen por código entre los edificios que ya existen, sin regenerar la ciudad. No hay modelos externos.
4. No hacen falta dependencias nuevas: `three`, `@react-three/*`, `lenis`, `zustand`, `maath` y GSAP ya están instalados.
5. El backend excluye de `/api/garage/cercanos` los garages en borrador. Lo afirman la regla 6 de `PRODUCT.md` y el texto de "Mover a borrador"; el frontend no los filtra y desde este repositorio no se puede verificar.
6. La dirección de arte es la de la home, con los mismos tokens, tipografías, notas y barra. No se hacen estudios nuevos.
7. Los nombres de empresas y los importes de las piezas son ficticios y se rotulan "Datos de ejemplo", como hacía la tabla actual (`PRODUCT.md`, decisión del 2026-11-17).
8. El proyecto sigue en JavaScript, sin SSR ni prerender.

## Nivel de intensidad

**Nivel 3, mundo de scroll, reutilizando el de la home.** Motivos:

- La metáfora es un lugar: el mensaje es literalmente un mapa, la búsqueda de una empresa alrededor de su sede. Es el criterio de `web-inmersiva` para el nivel 3.
- El mundo, el director de scroll, las versiones de respaldo y sus tests ya existen. El nivel 2 obligaría a construir un escenario contenido (`InlineStage`) que el proyecto no tiene y a mantener dos formas de mostrar el mismo dibujo.
- Quien llega desde el enlace "Para garages" de la home ya tiene en caché la parte compartida del 3D.
- Es la misma ciudad, vista desde el otro lado del trato.

La spec de la home había anticipado "nivel 1 o 2" para esta página (ver "Preguntas abiertas"). Para que pese menos que la home: siete secciones y unas 9 pantallas de scroll (la home tiene 9,8), sin cajetín de entrada, sin el detalle del QR, sin la jornada y sin la interacción con el mouse.

**Adónde va la cámara.** La home baja de la ciudad a la plaza, desde el lado de la empresa. Garages hace el camino inverso: arranca en el mapa con tu garage afuera, baja a la cuadra del problema, sube para mostrar quién lo encuentra y cómo lo ve, y cierra con la ciudad entera apuntando a tu garage.

**Cómo se escenifica "aparecé en el mapa de las empresas":**

1. En el hero, el mapa ya tiene las sedes de cuatro empresas (tinta plena, con el rótulo "Sede") y dos garages con el cartel E. Tu garage está en línea de trazos y tinta tenue: todavía fuera del mapa. De cada sede sale, lento, un anillo de búsqueda.
2. En `mapa`, la cámara sube, tu garage pasa de tinta a azul señal y lleva el cartel E. Cuando el anillo de una sede lo alcanza, aparece sobre esa sede la distancia por la calle. Después, una flecha fina sale de tu garage y lleva a la tarjeta con lo que ve la empresa: distancia, horario y días, disponibles y tarifas (los datos del alta). Es el único momento audaz de la página.
3. En `control`, el interruptor lo devuelve a la línea de trazos y los anillos pasan sin encontrarlo. Al restaurarlo, se enciende otra vez.

El azul señal conserva su único significado (`DESIGN.md`): un lugar disponible. Tu garage es azul cuando las empresas lo ven; las sedes y sus anillos van en tinta.

## Guion: del garage al mapa

Títulos de unos 35 caracteres como máximo, para que entren en dos o tres líneas en la nota de 480 px. Copy en voseo y con el tono de `PRODUCT.md`; los `weight` se validan en la etapa 4, como en la home.

| `id` | Escena | Título | Cuerpo | Evidencia | Movimiento | `weight` |
|---|---|---|---|---|---|---|
| `gancho` | La ciudad desde arriba: cuatro sedes en tinta, dos garages con el cartel E y tu garage en línea de trazos, fuera del mapa. De cada sede sale un anillo de búsqueda | Aparecé en el mapa de las empresas | Publicás tu garage, las empresas piden lugar para su gente y vos manejás tratos, ocupación y consumos. Sin hardware, sin planillas. | `PRODUCT.md`, frase canónica para garages | rastrea | 1,0 |
| `problema` | La cuadra: autos que dan vueltas a la manzana de una sede y, a 300 m, tu garage sin cartel, rodeado por los globos de un chat que no para | Plazas libres que nadie encuentra | Mientras las empresas de la zona no encuentran dónde estacionar, tus cocheras vacías no generan nada. Y lo que se arregla por WhatsApp o en papel no queda registrado. | `PRODUCT.md`, problema del lado del garage | orbita | 1,1 |
| `mapa` | La cámara sube: tu garage pasa a azul señal y lleva el cartel E; los anillos de las sedes lo alcanzan y sobre cada una aparece la distancia por la calle. Una flecha fina sale de tu garage hacia la tarjeta "Así te ve una empresa" | Las empresas cercanas te encuentran | Cuando una empresa busca garages cerca de una de sus sedes, ve el tuyo en el punto que marcaste, con la distancia, tus días y horario, las plazas disponibles y tus tarifas por hora para auto, moto y pickup. Desde ahí te pide cocheras. | Alta de garage (punto 6); búsqueda de `/gestion_garages`, su mapa y su tarjeta (puntos 1 a 3); claim de las tres tarifas | asciende | 2,2 |
| `trato` | Una línea azul recorre los 300 m desde la sede hasta tu garage; junto al garage, la solicitud pasa de "Pendiente" a "Trato aceptado" y el techo se pinta | Vos aceptás o rechazás cada pedido | Ves qué empresa pide, para qué sede, cuántas cocheras y si las paga la empresa o el empleado. Nada se activa sin tu confirmación, tampoco un cambio en la cantidad de cocheras. | Regla 5; respuesta del dueño (puntos 4 y 5) | se traza | 1,3 |
| `operacion` | Se levanta el techo: las plazas del trato se pintan a medida que se reservan y sobre cada una se apilan sus horas de uso | El detalle, reserva por reserva | Todo es 100% online: la ocupación la mueven las reservas y los ingresos con QR, nunca una carga a mano. Cada consumo queda con su tiempo, tarifa e importe, con 24 meses de historial y exportación a PDF y Excel. | Regla 4; consumos (punto 8); claims de 24 meses, PDF y Excel, y 100% online | se llena | 1,4 |
| `control` | La ciudad a media altura: con el interruptor, tu garage vuelve a la línea de trazos y los anillos pasan sin encontrarlo; al restaurarlo, se enciende de nuevo | Vos decidís cuándo aparecés | Si pasás un garage a borrador, deja de aparecer para las empresas, y lo restaurás cuando quieras. Cada dueño ve solo sus garages. | Reglas 6 y 7; borrador (punto 7) | alterna | 1,2 |
| `accion` | La ciudad entera: desde cada sede, una ruta punteada llega hasta tu garage, marcado en azul, y el logo de SmartLot sube y flota sobre él | Sumá tu garage al mapa | Creá tu cuenta de dueño, cargá tu garage y empezá a recibir pedidos de empresas. | Registro de dueño (punto 6) | converge | 1,0 |

CTA: "Registrá tu garage", igual en el hero, en la barra y en `accion`, hacia `/register?modo=garage`. El hero lleva solo esa acción. La secundaria es "Iniciar sesión", en la barra, para el dueño que ya tiene cuenta, como en la home. El tercer nivel es el enlace "Para empresas", hacia `/`, en la barra (escritorio) y en el pie (todos los tamaños). Con sesión, la barra muestra "Ir a mi panel".

Reglas de negocio en el relato:

- **4, la ocupación la mueve la operación real:** `operacion` lo dice, y en el dibujo las plazas se pintan con las reservas, no con un control.
- **5, nada se activa sin confirmación del dueño:** `trato`. El techo se pinta recién cuando la solicitud pasa a "Trato aceptado".
- **6, un garage en borrador no es visible para las empresas:** `control` y su interruptor.

### Piezas de la nota (datos de ejemplo)

- **`mapa`, "Así te ve una empresa":** réplica de la tarjeta del listado de búsqueda, con "0,3 km · 2 min", "Tu garage", "08:00 a 20:00 · Lun, Mar, Mié, Jue, Vie, Sáb", "25 de 40 disponibles", "Auto $ 1.200 · Moto $ 600 · Pickup $ 1.500" y el botón en su estado deshabilitado "Solicitud pendiente" (el que el producto muestra después de pedir cocheras), inerte. La distancia coincide con la cota de 300 m del dibujo. Con 3D, la tarjeta se ve en el dibujo, al final de la flecha que sale de tu garage, y en la nota queda la misma ficha como texto para lectores de pantalla (visualmente oculta, nunca `display: none`). Sin 3D se ve en la nota. Una sola fuente de marcado (`TarjetaBusqueda`) para las dos.
- **`operacion`, "Consumos por empresa":** las columnas de la pantalla del dueño (Empresa, Reservas, Tiempo, Importe generado), tres filas y un total que suman, sin scroll horizontal en 390 px. Al pie: "Son consumos generados, no cobros. Se exportan a PDF y Excel."
- **`control`, el interruptor "Tu garage en el mapa de las empresas":** Visible o En borrador, con el texto "Aparece cuando una empresa busca garages cerca de su sede." o "No aparece para las empresas. Lo restaurás cuando quieras.". Es lo único que el visitante maneja en la página.

En el dibujo, decorativas y dentro del escenario con `aria-hidden`: los globos del chat del lado del garage en `problema` (ficticios); la tarjeta de solicitud en `trato` ("Distribuidora Norte", "Sede Centro", "12 cocheras solicitadas · cubre la empresa", "Aceptar trato" y "Rechazar"), que pasa a "Trato aceptado" con el scroll; y los rótulos y las cotas.

### Qué pasa con la página actual

| Bloque actual | Destino | Por qué |
|---|---|---|
| Hero: título partido en líneas que vuelan, sin subtítulo ni botón | Se conserva el `h1`; se suman la frase canónica y la CTA | El hero tiene que decir qué es y qué hacer |
| Ticker con los cuatro claims | Se va el componente; los claims pasan al texto de `gancho`, `mapa` y `operacion` | El ticker y las cifras-héroe son marcas de plantilla (`DESIGN.md`) |
| Dolores, cuatro tarjetas | Se fusionan en `problema` y en el chat del dibujo | Una sección, una idea |
| Cómo funciona, pasos 01/02/03 | Se reparten entre `mapa`, `trato` y `operacion` | Los pasos son el relato. Se van "en minutos ya está publicado" y "cobrá por uso" |
| Bento, cuatro funciones | El alta con mapa va a `mapa`, las solicitudes a `trato` y los consumos a `operacion`. Se va "Portafolio con estado real" | El panel interno no ayuda a decidir el registro |
| Vitrina 4 / 78 % / 12 / 260 | Se va | Cifras de ejemplo usadas como héroe |
| Reportes, lista y tabla de ejemplo | `operacion`, con la tabla alineada a la pantalla real del dueño | Es la prueba con el producto |
| Seguridad, cuatro puntos | La aprobación va a `trato`, la ocupación a `operacion`, el borrador y "cada dueño ve solo sus garages" a `control`. Se va "Cuenta protegida" | Lo demás no es un argumento de la landing |
| Cierre con "empezar a generar esta semana", "sin costo de instalación" y "registro en minutos" | `accion` | Se van las promesas sin respaldo |
| Pie con "El estacionamiento del futuro" | El pie del plano, como en la home | Sin grandilocuencia |
| Partículas, logo que gira, ruido y vidrio | Se van | Los reemplaza el plano |

## Dirección de arte

Se hereda el estudio A, "Plano", sin tokens nuevos: papel `#F5F7FB`, tinta plena, media y tenue, azul señal para lo disponible, Archivo 800 en los títulos y DM Sans en el cuerpo, notas opacas con borde hairline y 2 px de radio, la barra de la home y el botón principal con su brillo (`DESIGN.md`, "Plano").

**La idea** (método de `design-taste-frontend`): en esta página, *la búsqueda de garages alrededor de la sede de una empresa* se vuelve *el plano de la ciudad, donde tu garage pasa de tinta a azul señal y lleva el cartel E cuando entra en esa búsqueda*. Prueba del competidor: otra plataforma de estacionamiento puede decir "aparecé en un mapa", pero no la búsqueda desde la sede, el pedido de cocheras y la confirmación del dueño, ni la ciudad de la home vista desde el garage.

**Notaciones nuevas, dentro del lenguaje del plano:**

- **Sede:** volumen en tinta plena con líneas de piso, como la oficina de la home, y el rótulo "Sede". La oficina de la home es una de las cuatro. Nunca va en azul.
- **Anillo de búsqueda:** un círculo fino en tinta media que crece desde la base de cada sede, como la marca de un compás. Con movimiento reducido queda quieto, con el radio que llega a tu garage.
- **Fuera del mapa:** tu garage en línea de trazos y tinta tenue, la notación de lo que todavía no está, sin cartel.
- **Flecha de la búsqueda:** una línea guía de 1 px en tinta, como las cotas, con un punto sobre el techo de tu garage, un quiebre y una punta abierta que toca la tarjeta "Así te ve una empresa". Se traza con el scroll desde el garage hacia la tarjeta y la tarjeta entra cuando la flecha llega. Reemplaza a las cotas del alta: los datos del alta son los de la tarjeta.
- **Distancia:** una cota azul sobre cada sede cuando su anillo encuentra tu garage, medida por la calle como la de 300 m de la home.

**Clichés que se evitan:**

1. El garage subterráneo oscuro con luces en fuga.
2. Billetes, monedas o gráficos que suben para hablar de ingresos.
3. El mapa de aplicación lleno de pines: acá cada garage lleva su cartel E y nada más.

Tampoco vuelven las marcas de la página actual.

**Capa HTML.** Su dueña es `design-taste-frontend`, dentro de las reglas de `DESIGN.md`:

- La composición de la nota es la de la home: hasta 480 px, a la izquierda en horizontal y abajo en vertical. En 390 × 844 la nota ocupa como mucho el 60 % del alto.
- Cada nota lleva como mucho una pieza, y las vecinas cambian de forma: texto en `gancho` y `problema`; tarjeta en `mapa` (al final de la flecha del dibujo con 3D, en la nota sin 3D); texto con la tarjeta en el dibujo en `trato`; tabla en `operacion`; interruptor en `control`; texto en `accion`.
- Las piezas son fragmentos reales del producto, marcados con `data-ui`. No agregan `h1` ni `h2` (a lo sumo `h3`) y dicen "Datos de ejemplo".
- No hay rótulos sobre los títulos, tarjetas con ícono, numeración en el contenido, cifras-héroe ni pastillas fuera de los fragmentos.
- No hay cajetín de entrada: es de la home y se ve una vez por sesión.
- Las micro-interacciones del interruptor y de los botones siguen a `emil-design-eng`, dueña de ese registro en el hub.

**Conflictos con `design-taste-frontend` que resuelve `DESIGN.md`.** Ganan las reglas del proyecto; se pasan como `--allow` al inspector y se informan:

- Las notas llevan borde hairline (`outlined-box`).
- El botón principal tiene brillo, por pedido del dueño del producto (`button-fx` y `shadow`), y los botones tienen 10 px de radio.
- La barra, el pie y el carril de la regla llevan borde hairline, como pide `DESIGN.md` (`hairline`).
- El cuerpo va en el texto secundario de 7,07:1, como en la home (`grey-body`).
- Los títulos pueden ocupar tres líneas en la nota de 480 px (`headline-lines`).
- Las "imágenes reales" son el dibujo, generado por código, y los fragmentos del producto (`few-pictures`).
- La regla de progreso numera las secciones, como en la home.

No se usa `draw.mjs`: la dirección la eligió el dueño del producto para la home y esta página la continúa.

## Alta y mapa en una sección (2026-11-23)

Pedido del usuario: "Unificá las secciones 3 y 4, diciendo lo de que las empresas te encuentran y que salga una flechita del garage 3D con los datos de cómo te ve una empresa." Se aplica sin esperar aprobación.

**Guion (siete secciones):**

| `id` | Título | `weight` |
|---|---|---|
| `gancho` | Aparecé en el mapa de las empresas | 1,0 |
| `problema` | Plazas libres que nadie encuentra | 1,1 |
| `mapa` | Las empresas cercanas te encuentran | 2,2 |
| `trato` | Vos aceptás o rechazás cada pedido | 1,3 |
| `operacion` | El detalle, reserva por reserva | 1,4 |
| `control` | Vos decidís cuándo aparecés | 1,2 |
| `accion` | Sumá tu garage al mapa | 1,0 |

**Qué se conserva.** El cuerpo de `mapa` dice lo del alta (el punto que marcaste, días y horario, plazas disponibles y tarifas por hora para auto, moto y pickup) dentro del mensaje de la búsqueda. Los cuatro claims siguen en los cuerpos. Ningún claim nuevo.

**Qué se va.** La escena `Alta` (el volumen dibujado arista por arista), las cotas del alta (`CotasAlta.jsx`, `alta.js`, `ROTULOS.alta`), la clave `alta` de `FX_CERO` (pasa a ser `ficha`, en 0 en la home) y el póster `alta`, que se generó en esta rama y nunca se publicó.

**Coreografía de `mapa`** (pantallas desde que la sección asoma; entrada de 0 a 1, estadía de 1 a 2,2). Ajustada el 2026-11-23 por el feedback del usuario: la tarjeta es parte de la pausa de la sección, no de la salida.

| fx | valor | desde | hasta | Qué se ve |
|---|---|---|---|---|
| `vueltas` | 0 | 0 | 0,45 | los autos de la cuadra dejan de dar vueltas mientras sube la cámara |
| `fuera` | 0 | 0,3 | 0,55 | tu garage pasa de la línea de trazos al azul señal con el cartel E |
| `busqueda` | 1 | 0,5 | 0,8 | los anillos de las sedes lo alcanzan y aparecen las distancias |
| `ficha` | 1 | 0,8 | 0,95 | la flecha corta sube desde tu garage y la tarjeta entra enseguida |

El fx de la ficha arranca apenas antes de 1 porque el dibujo amortiguado (0,2 s) va detrás del scroll: con la rueda a velocidad normal, la tarjeta llega entera al empezar la estadía y queda fija hasta el final (medido en la build: entera de 1,2 a 2,3 pantallas en 1440 y de 1,35 a 2,4 en 390). En `trato`, `ficha` vuelve a 0 entre 0 y 0,2, antes de la línea del pedido. Mientras está la ficha, las nubes se aclaran al 20 % (`Clima.jsx`, con `fx.ficha`, que vale 0 en la home), así ninguna tapa tu garage ni la flecha. Con movimiento reducido, la cámara salta al estado final de la sección: flecha entera y tarjeta quieta, con un fundido de opacidad corto y sin viaje.

**La flecha y la tarjeta.** Capa HTML anclada a tu garage (`three/FichaMapa.jsx`, mismo patrón que `Solicitud.jsx`): un SVG con la guía y una tarjeta que repite el marcado de `FichaBusqueda` (`TarjetaBusqueda`, rotulada "Datos de ejemplo"). Decorativa, dentro del escenario `aria-hidden`; anima solo `opacity`, `transform` y el trazo del SVG, nunca `visibility`. La flecha sale de la esquina derecha del techo de tu garage y sube, hacia arriba a la derecha, hasta el borde de abajo de la tarjeta. La tarjeta va arriba a la derecha de tu garage: en 1440, en la manzana baja entre la sede de 300 m y el garage con la E de la derecha, sin tapar ninguna sede, distancia ni garage; en 390 × 844, arriba, debajo de la barra, sin tapar tu garage ni bajar de la nota (el encuadre vertical de `mapa` baja el dibujo para dar ese lugar). En 390 tapa la sede de 300 m: quedan a la vista las distancias de 380, 430 y 740 m.

**La ficha de la nota.** Se queda: sin 3D es la única forma de ver la tarjeta, y con 3D es el texto accesible de la tarjeta del dibujo (regla: nunca contenido que exista solo en el Canvas). Con 3D se oculta solo a la vista, así la nota de 390 px vuelve a ser corta y deja lugar a la tarjeta; sin 3D se ve como siempre.

**Fidelidad con la tarjeta real.** `main` cambió `vistasAdmin/gestion_garages.jsx`: "Ver en mapa" aparece solo si el garage tiene ubicación y el mapa cargó, y la tarjeta solo es clicable en ese caso. La ficha conserva el orden y los datos de la tarjeta real (distancia y tiempo, nombre, horario y días, disponibles, tarifas y el botón deshabilitado) y deja afuera la dirección y "Ver en mapa": en la página la flecha hace ese papel, une la tarjeta con el garage en el mapa.

**Criterios de aceptación del cambio:**

- [ ] Siete secciones con los ids de la tabla; `garages.test.js`, `coreografiaGarages.test.js`, `ajustesGarages.test.js`, `paraGarages.source.test.js` y `mundo.test.js` al día y en verde.
- [ ] Con 3D, en 390 × 844 y 1440 × 900, durante la estadía de `mapa` se ven la flecha entera y la tarjeta, arriba a la derecha de tu garage, sin que la nota, la barra ni la regla las tapen y sin tapar tu garage; en 1440 tampoco las distancias de las sedes.
- [ ] Con la rueda a velocidad normal (100 px cada ~16 ms, con Lenis), la tarjeta está entera la mayor parte del tramo en que la nota de `mapa` queda quieta.
- [ ] La flecha y la tarjeta entran con el scroll, hacia adelante y hacia atrás; con movimiento reducido aparecen en su estado final.
- [ ] El árbol de accesibilidad de `mapa` tiene la ficha completa en las cuatro versiones; axe sin serious ni critical.
- [ ] Pósters regenerados (el de `alta` se va; el de `mapa` no cambia porque el encuadre horizontal es el mismo y va sin la tarjeta) y en total hasta 600 kB.
- [ ] La home idéntica (< 0,5 % de píxeles distintos con movimiento reducido) y los presupuestos de la tabla "Presupuestos".

## Logo 3D en el cierre (2026-11-25)

Pedido del usuario: "Lo que le falta es la landing para garages: usar el logo 3D en el final y hacer lo mismo que hice en la landing principal, que al final aparece ese logo 3D sobre la empresa; que en garages aparezca sobre el garage." Se aplica sin esperar aprobación. El recurso está documentado en `docs/logo-3d.md`.

**Qué se ve.** En `accion`, mientras las rutas punteadas de las sedes llegan a tu garage, el logo de SmartLot en volumen sube desde su techo de frente a la cámara y, al llegar, gira en el lugar sobre su eje vertical (una vuelta cada 10 s), con el hilo de 1 px que lo une al techo asomando sobre el cartel E. Es el mismo cierre que la home, donde el logo flota sobre la oficina: el relato termina con la marca sobre quien lo recibe.

**Una escena para las dos páginas.** `three/escenas/Logo.jsx` recibe por props el techo sobre el que flota (`base`), su tamaño (`tamano`) y el aire hasta el techo (`aire`), con la oficina de la home por defecto (mismo patrón que `Rotulos`, `Chats`, `Pulsos` y `Trato`). Garages lo monta en `ExperienceGarages.jsx` sobre el centro de `G1`, con `tamano` 13 y `aire` 9,5 (la home usa 12 y 4,6; antes del ajuste eran 17 y 8 en garages y 15 en la home): tu garage es bajo y lleva el cartel E encima, y con el aire de la home el cartel tapaba el pie del logo; la cámara de este cierre abre más que la de la home (zoom 0,56 contra 0,74 en vertical), por eso el logo es un poco más grande. Con el tamaño nuevo ya no toca la sede de 300 m en 1440. La geometría sale del código (`logo3d/formaLogo.js` + `geometriaLogo.js`); el GLB de alta de `modelos3d/` no entra al bundle.

**Coreografía de `accion`** (pantallas desde que la sección asoma; entrada de 0 a 1, `weight` 1):

| fx | valor | desde | hasta | Qué se ve |
|---|---|---|---|---|
| `llegan` | 1 | 0,3 | 0,9 | desde cada sede, una ruta punteada llega hasta tu garage |
| `logo` | 1 | 0,45 | 1 | el logo sube desde el techo de tu garage y queda flotando |

Es el mismo fx y el mismo tramo que el cierre de la home (`scroll/coreografia.js`); `logo` vale 0 en `FX_CERO` y en el resto de las secciones. Con movimiento reducido la cámara salta al estado final: el logo aparece quieto, de frente, sin subir ni girar.

**El giro.** Un ángulo acumulado en `Logo.jsx` avanza con el delta de `vivo.tiempo` a una vuelta cada 10 s, en sentido horario visto desde arriba, multiplicado por un *smoothstep* de `fx.logo` entre 0,4 y 0,7: arranca suave apenas el logo se ve, sin esperar al final del tramo (la llegada del logo termina en 0,8 de `accion`, porque según el alto de la pantalla el fondo de la página puede no completar el tramo y el giro no arrancaba) y, si se vuelve con el scroll, se frena donde está, sin saltar. Cuando el logo se oculta, el ángulo vuelve a 0 y la próxima vez sube de frente. `vivo.tiempo` no corre con movimiento reducido, así que ahí no gira. El giro va sobre el eje vertical del propio logo (la silueta está centrada en el origen) y el hilo queda fijo; la inclinación hacia el cursor de la home se mantiene. Se sacó el vaivén vertical para que gire en el lugar sin desplazarse.

**Versiones sin 3D y estática.** El póster de `accion` se regeneró con el logo (mismo script y parámetros que los demás) y su descripción lo nombra. Pósters de garages: 596,6 kB en total.

**Criterios de aceptación del cambio:**

- [x] Con 3D, en 390 × 844 y 1440 × 900, al final de `accion` el logo flota sobre tu garage, con el hilo visible sobre el cartel E, sin tapar la nota, la barra ni las distancias de las sedes.
- [x] Con movimiento reducido aparece en su estado final, sin viaje.
- [x] La home queda igual que en la rama del usuario (0 píxeles distintos con movimiento reducido en las 18 capturas de 390 y 1440).
- [x] `coreografiaGarages.test.js` cubre el logo en el cierre y el tramo igual al de la home; `formaLogo.test.js` en verde.
- [x] Pósters hasta 600 kB; 3D de garages por debajo de 350 kB gzip; LCP móvil menor a 2,5 s en las dos páginas.

## Arquitectura: un mundo, dos páginas

### Diagnóstico: hoy todo apunta a la home

| Pieza | Acople |
|---|---|
| `scroll/estado.js` | Arma `GUION` y `PESOS` al importarse, con `SECCIONES` y `COREOGRAFIA` de la home. `aplicarComparacion` es del deslizador de la home |
| `scroll/rig.js` | Singleton; arranca con el primer cuadro de la home |
| `scroll/useStoryTimeline.js` | Usa `PESOS` y `aplicarComparacion`, y escucha `comparar` |
| `scroll/coreografia.js` | `FX_CERO`, el vocabulario, y los encuadres de la home en el mismo archivo |
| `estado/store.js` | Singleton que mezcla lo común (`tier`, `sin3d`, `inicializado`, `contextoPerdido`, `seccion`) con lo de la home (`intro`, `comparar`, `diaElegido`) |
| `three/vivo.js` | Singleton; `Experience` lo reinicia al montarse |
| `three/Experience.jsx` | Lista fija de las escenas y capas de la home |
| `three/Rotulos.jsx`, `Chats.jsx`, `Celular.jsx`, `Reloj.jsx`, `Interaccion.jsx`, `Eleccion.jsx`, `jornada.js` | Importan el contenido de la home |
| `three/escenas/Pulsos.jsx`, `Pin.jsx`, `Red.jsx`, `Onda.jsx` | Anclas fijas en la oficina y en los garages de la home |
| `ui/Nav.jsx`, `Cta.jsx`, `Regla.jsx`, `Intro.jsx`, `ElegirDia.jsx` | Importan `CTA`, `NAVEGACION` o `SECCIONES` de la home |
| `ui/Seccion.jsx` | Importa las piezas de la home y arma la ruta del póster con el `id` |
| `vistasLanding/Landing.jsx` | El armazón (versiones, salto, barra, regla, pie) mezclado con el contenido de la home |
| `inmersiva.css` | Todo bajo `.plano`: sirve para las dos páginas sin cambios |

Los singletons pueden quedarse, porque hay una sola página montada por vez. Lo que hay que cortar son el contenido y la coreografía importados al cargar cada módulo.

### Propuesta

1. **La página es un parámetro.** Cada página es un objeto (`inmersiva/paginas/home.js` y `inmersiva/paginas/garages.js`) con su contenido, su CTA, sus piezas, sus pósters, su escena y su guion. Es el contrato entre la base y cada página (ver "Estilo de código").
2. **Un armazón común.** `ui/PaginaPlano.jsx` hace lo que hoy hace `Landing.jsx`: llama a `asegurarInicio()` antes del primer render, decide la versión (`mostrar3d`, `sinEscena`, el botón "Ver sin 3D"), inicia Lenis y el director, y arma el salto al contenido, la barra, la regla, las secciones y el pie. `Landing.jsx` queda en `<PaginaPlano pagina={PAGINA_HOME} />` y `ParaGarages.jsx` en `<PaginaPlano pagina={PAGINA_GARAGES} />`. Una página sin `escena` se muestra en el flujo sin 3D y sin el botón "Ver sin 3D".
3. **El guion se arma por página.** `scroll/guion.js` exporta `crearGuion(pagina)`, una función pura que devuelve los pesos, `componer` y `avancesFinales` a partir de las secciones y la coreografía de esa página, más un `inicial` opcional con los fx de arranque. `scroll/estado.js` sigue exportando lo de la home con los mismos nombres, armado con `crearGuion`, así `estado.test.js` no cambia. El director recibe la página; los controles de la nota que recomponen el dibujo entran por `guion.suscribir` y `guion.ajustar` (el deslizador de la home, el interruptor de garages).
4. **Un solo vocabulario de fx.** `FX_CERO` suma las claves de garages: `fuera`, `ficha`, `sedes`, `busqueda` y `llegan`. Cada clave nueva vale 0 en el estado de la home, así una escena compartida que la lea no cambia nada en la home. Garages reutiliza `vueltas`, `traza`, `trato`, `tapa`, `llenas` y `consumos`.
5. **El 3D: un escenario, dos composiciones.** `three/Escenario.jsx` sale de `Experience.jsx` con el Canvas, `PerformanceMonitor`, `CameraRig`, `FrameBridge`, el aviso del primer cuadro, el contexto perdido y los colores desde los tokens. `three/Experience.jsx` queda como la composición de la home, con el mismo archivo y la misma importación diferida, y `three/ExperienceGarages.jsx` es la de garages. Vite separa lo común (three, R3F, drei, maath, el mundo y las escenas compartidas) en un chunk compartido: la home no descarga las escenas de garages, y quien pasa de una página a la otra baja solo la parte propia.
6. **Escenas compartidas, con valores por defecto.** Las escenas que necesitan otro dato reciben props cuyo valor por defecto reproduce la home: `Rotulos` (la lista de rótulos), `Chats` (los mensajes y el ancla), `Pulsos` (los focos) y `Trato` (lee `fuera` para la línea de trazos de tu garage). `Red` y la nueva `Llegadas` comparten el trazado de recorridos por la calle en `three/trazos.js`. `Ciudad`, `Clima`, `Trafico`, `Vueltas` y `Garage` se reutilizan tal cual.
7. **Escenas nuevas.** `Sedes`, `Busqueda` y `Llegadas`, en `three/escenas/`, y dos capas HTML: la tarjeta de solicitud (`three/Solicitud.jsx`) y la flecha con la tarjeta de la búsqueda (`three/FichaMapa.jsx`). `mundo.js` suma `SEDES`: tres edificios altos en direcciones distintas desde tu garage, a entre 300 m y 1 km por la calle, que no quedan delante de él en la dirección de la cámara. Se eligen entre los edificios ya generados, así la ciudad de la home no cambia.
8. **El estado de garages, aparte.** El interruptor usa un store chico propio (`estado/garages.js`). `estado/store.js` no cambia.
9. **Estilos.** `inmersiva.css` sigue siendo de las dos páginas. Lo propio de garages (piezas y capas del dibujo) va en `inmersiva/garages.css`, con todos los selectores bajo `.plano` e importado solo por la página de garages, así la entrada no crece.
10. **La nota se desvanece solo con `opacity` (ya hecho, commit `3011f5c`).** `Seccion`, `useTituloCinetico` y `TablaConsumos` animan solo la opacidad; la nota del todo desvanecida lleva `data-desvanecida` y `pointer-events: none`, y con el foco del teclado se ve entera (`.plano-nota:has(:focus-visible)`). `notas_accesibles.source.test.js` prohíbe `autoAlpha` y `visibility` en `ui/` y `scroll/`, salvo en lo decorativo. Es un requisito vigente para todo lo nuevo de garages: piezas, revelados y capas. El test se extiende a las subcarpetas de `ui/` y a `paginas/` (lo hace la base).

### Qué se comparte y qué es de cada página

| | Común | Home | Garages |
|---|---|---|---|
| Contenido | `contenido/comun.js`: marca, ingresar, panel, saltar, sin 3D y regla | `contenido/secciones.js` | `contenido/garages.js` |
| Página | `ui/PaginaPlano.jsx`, `Seccion`, `Nav`, `Cta`, `Regla` | `paginas/home.js`, `Intro` y sus piezas | `paginas/garages.js` y sus piezas en `ui/garages/` |
| Scroll | `guion.js`, `useStoryTimeline`, `rig`, `rangos`, `smoothScroll` | `coreografia.js` y `aplicarComparacion` | `coreografiaGarages.js` y `ajustesGarages.js` |
| Estado | `estado/store.js` | `comparar`, `diaElegido` e `intro` | `estado/garages.js` |
| 3D | `Escenario`, `CameraRig`, `mundo`, `paleta`, `vivo`, `trazos` y las escenas compartidas | `Experience.jsx` | `ExperienceGarages.jsx` y sus escenas |
| CSS | `inmersiva.css` | — | `garages.css` |

### Carga

- `/para-garages` sigue con `lazy()` en `src/App.jsx` (ADR-006). El armazón y la capa DOM compartida ya están en la entrada, porque la home es eager: el chunk de la ruta solo trae el contenido, las piezas y el CSS de garages.
- El 3D entra después del primer render y solo con WebGL2, sin `?sin3d` y sin ahorro de datos (ADR-008).
- Riesgo: en el perfil móvil, la home pinta su hero a los 2180 ms, y una visita directa a `/para-garages` suma el viaje del chunk de la ruta, que la deja cerca de los 2,5 s. Primero se achica ese chunk. Si igual no alcanza, las salidas son volver eager la ruta (contradice ADR-006 y agranda la entrada para todos) o precargarla desde el enlace de la home (sirve para la navegación, no para la visita directa). Esa decisión va en un ADR, no en esta spec.

### Qué se retira

Revisado con `grep` el 2026-11-18: fuera de `/para-garages` nadie usa estos archivos ni estas clases. Login y registro tienen su propio vidrio en `src/pages/Login.css`.

- `src/componentesLanding/paraGarages/`: los once archivos.
- `src/componentesLanding/landing/`: `Navbar.jsx`, `StatsTicker.jsx`, `InteractiveBackground.jsx` y `landing.css`.
- `src/componentesLanding/CtaButton.jsx`, que solo usaban `Navbar` y `ParaGaragesCTA`.
- En `src/index.css`: `.bg-noise`, `.glass-nav`, `.glass-card`, `.content-visibility-auto` y `html:has(.landing-page)` con su variante de movimiento reducido. El token `--shadow-accent` queda: es de `DESIGN.md`.
- Las aserciones de `landing.source.test.js` que leen esos archivos se reemplazan por contratos de la página nueva.
- `public/logo.png` queda sin uso en `src/`, pero no se borra en esta spec: puede estar enlazada desde las plantillas de email del backend.

### Decisión a registrar

Un ADR nuevo, "El módulo `inmersiva` sirve a varias páginas", con el número 014 según el índice de `docs/decisions/README.md` (los archivos 008 y 009 están repetidos, así que el número sale del índice). Registra: la página como parámetro y el armazón común; un escenario 3D con una composición por página y su chunk compartido; el vocabulario de fx con el 0 como estado de la home; los singletons, que se quedan porque hay una página por vez; que `/para-garages` sigue en `lazy()` y deja el vidrio (la Regla del Vidrio queda solo para la autenticación); y que los presupuestos de ADR-008 valen por página. ADR-008 no se edita.

## Presupuestos

Medidos con las mismas herramientas que la línea base (ver "Estrategia de pruebas"), sobre la build de producción.

| Métrica | Antes (2026-11-18) | Objetivo |
|---|---|---|
| LCP móvil de `/para-garages` (mediana de tres) | 2752 ms; el elemento LCP es la marca de agua del logo | Menos de 2500 ms, con el `h1` o el párrafo del hero como elemento LCP |
| CLS, en la carga y con scroll | 0 | Menos de 0,1 |
| INP en el interruptor y en la CTA | Sin medir | Menos de 200 ms |
| JS gzip inicial de `/para-garages`, antes del 3D | 186 kB (entrada 165,8 + página ~20) | Hasta 186 kB; el chunk de la ruta, hasta 20 kB |
| Entrada `index-*.js` (gzip que informa Vite) | 171,7 kB | Hasta 174,7 kB |
| 3D que descarga `/para-garages` (chunk compartido y propio) | — | Hasta 350 kB gzip |
| 3D de la home | 263,6 kB según Vite (254,5 kB transferidos) | Hasta 5 kB más |
| LCP móvil de la home | 2180 ms | No empeora más de 100 ms |
| Pósters de garages | — | Hasta 600 kB en total |
| fps | — | 60 en notebook y al menos 30 en un celular medio (emulado) |
| Draw calls y triángulos | — | No más que la sección más cargada de la home (`renderer.info` en desarrollo) |
| axe | `color-contrast` y `scrollable-region-focusable` serious; objetivos de 40–42 px | Ningún serious ni critical en 390, 1440 y 390 reducido; objetivos de 44 px o más |

El JS propio antes del 3D que fija ADR-008 (hasta 150 kB) se cumple con margen: la capa DOM compartida y el chunk de la ruta suman unos 30 kB. El TBT con 3D sale inflado en este entorno, porque SwiftShader dibuja WebGL con la CPU: se compara entre builds del mismo entorno, como en la home.

## Comandos

```bash
npm run dev
npm test
npx eslint <archivos tocados>     # npm run lint arrastra deuda: se valida solo lo tocado
npm run build
# Mediciones sobre la build, en una carpeta fuera del repositorio
npx vite build --outDir <dir temporal> --emptyOutDir
npx vite preview --outDir <dir temporal> --port 4317 --strictPort
```

## Estructura del proyecto

- `src/vistasLanding/ParaGarages.jsx` → sigue siendo la ruta `/para-garages`, en `lazy()`. Solo arma la página con el armazón. Capa DOM.
- `src/vistasLanding/Landing.jsx` → sigue eager; arma la home con el armazón.
- `src/componentesLanding/inmersiva/contenido/garages.js` (+ `garages.test.js`) → todo el texto de garages: `META`, `CTA`, `ENLACE`, `PIE`, `SECCIONES` y los datos de ejemplo de las piezas y del dibujo (búsqueda, solicitud, consumos, chat, rótulos, interruptor).
- `inmersiva/contenido/comun.js` → la navegación común, que sale de `secciones.js` (que la reexporta).
- `inmersiva/paginas/home.js` e `inmersiva/paginas/garages.js` → los objetos de página. `paginas/garagesEscena.js` → la escena, el guion y los pósters de garages (un stub en `null` hasta la etapa 4).
- `inmersiva/ui/PaginaPlano.jsx` → el armazón común.
- `inmersiva/ui/garages/FichaBusqueda.jsx`, `TablaConsumosGarage.jsx` y `Visibilidad.jsx` → las piezas de la nota.
- `inmersiva/estado/garages.js` → el store del interruptor.
- `inmersiva/scroll/guion.js` (+ `guion.test.js`) → `crearGuion`.
- `inmersiva/scroll/coreografiaGarages.js` y `ajustesGarages.js` → encuadres, fx, `inicial` y el ajuste del interruptor (etapa 4).
- `inmersiva/three/Escenario.jsx`, `ExperienceGarages.jsx`, `trazos.js`, `Solicitud.jsx`, `FichaMapa.jsx` y `escenas/{Sedes,Busqueda,Llegadas}.jsx` → el 3D de garages (etapas 4 y 5).
- `inmersiva/garages.css` → estilos de la página y de sus piezas; `inmersiva/three/garages.css` → estilos de las capas del dibujo (solicitud, flecha y tarjeta de la búsqueda, rótulos de sede), que entran con el chunk 3D. Todos los selectores bajo `.plano`.
- `public/landing/posters/garages/` → pósters de las versiones sin 3D (etapa 6).

## Estilo de código

```js
// inmersiva/paginas/garages.js — el contrato que recibe ui/PaginaPlano.jsx.
// Capa DOM: no importa three; el 3D entra solo por lazy().
import { CTA, ENLACE, META, PIE, SECCIONES } from '../contenido/garages';
import { FichaBusqueda } from '../ui/garages/FichaBusqueda';
import { TablaConsumosGarage } from '../ui/garages/TablaConsumosGarage';
import { Visibilidad } from '../ui/garages/Visibilidad';
import { ESCENA, GUION, POSTERS } from './garagesEscena';
import '../garages.css';

export const PAGINA_GARAGES = {
  id: 'garages',
  meta: META,         // { titulo, descripcion }, para usePageMeta
  cta: CTA,           // { etiqueta: 'Registrá tu garage', destino: '/register?modo=garage' }
  enlace: ENLACE,     // { etiqueta: 'Para empresas', destino: '/' }: tercer nivel, en la barra y el pie
  pie: PIE,
  secciones: SECCIONES,
  // s.piezas = ['busqueda'] pone <FichaBusqueda /> en la nota. Las piezas que solo mueven
  // el dibujo se marcan { soloConEscena: true }, como el deslizador de la home.
  piezas: {
    busqueda: { componente: FichaBusqueda },
    consumos: { componente: TablaConsumosGarage },
    visibilidad: { componente: Visibilidad, reemplazaFigura: true },
  },
  // De paginas/garagesEscena.js (stub en null hasta la etapa 4):
  // ESCENA = lazy(() => import('../three/ExperienceGarages')), GUION = { coreografia, ajustar, suscribir },
  // POSTERS = '/landing/posters/garages' (etapa 6). Con null, la página va en el flujo sin 3D ni figuras.
  escena: ESCENA,
  guion: GUION,
  posters: POSTERS,
  intro: false,       // el cajetín de entrada es de la home
};
```

```js
// inmersiva/contenido/garages.js — todo el texto de /para-garages vive acá
export const SECCIONES = [
  {
    id: 'gancho',
    titulo: 'Aparecé en el mapa de las empresas',
    cuerpo: 'Publicás tu garage, las empresas piden lugar para su gente y vos manejás tratos, ocupación y consumos. Sin hardware, sin planillas.',
    movimiento: 'rastrea',
    weight: 1,
    cta: true,
    figura: 'Plano de una zona de la ciudad: cuatro sedes de empresas marcadas en tinta, dos garages con el cartel de estacionamiento y tu garage en línea de trazos, todavía fuera del mapa.',
  },
  // …
];
```

```jsx
// ui/Seccion.jsx — la nota pone las piezas que nombra la sección; no conoce ninguna página.
{s.piezas?.map((nombre) => {
  const pieza = piezas[nombre];
  if (!pieza || (pieza.soloConEscena && sinEscena)) return null;
  const Pieza = pieza.componente;
  return <Pieza key={nombre} sinEscena={sinEscena} posters={posters} />;
})}
{sinEscena && posters && !s.piezas?.some((n) => piezas[n]?.reemplazaFigura) && <Figura s={s} posters={posters} />}
```

Las animaciones de la nota usan solo `opacity` (ver la propuesta 10). Movimiento narrativo con `scrub: true` para la cámara y los fx; revelados de contenido de 0,6 a 1,0 s, como en la home. La interfaz (barra, botones, interruptor) sigue las reglas de micro-interacción del hub: menos de 300 ms, sin `transition: all` y con `:active` en `scale(0.97)`.

## Estrategia de pruebas

- Framework: `node:test`, junto a la fuente. Sin tests de render.
- `contenido/garages.test.js`:
  - entre cinco y ocho secciones, con `id` únicos en minúsculas;
  - títulos de 3 a 8 palabras y hasta 40 caracteres; cuerpos de 1 a 3 oraciones; `weight` entre 0,8 y 2,5; `figura` de más de 30 caracteres;
  - CTA solo en el hero y en la última sección, con "Registrá tu garage" hacia `/register?modo=garage`;
  - voseo (sin "Regístrate", "tú" ni "Crea tu"), sin IA, sin métricas de satisfacción y sin promesas ("esta semana", "en minutos", "sin costo", "cobrá");
  - los cuatro claims presentes y ninguna otra cifra fuera de los datos de ejemplo;
  - los datos de ejemplo dicen "Datos de ejemplo", y en la tabla las filas, el total y el tiempo por tarifa cierran;
  - las reglas 4, 5 y 6 están en el texto de `operacion`, `trato` y `control`.
- `scroll/guion.test.js`:
  - `crearGuion` con los datos de la home da exactamente lo que hoy exporta `estado.js`, en varias posiciones, horizontal y vertical;
  - para garages: encuadre horizontal y vertical en cada sección y fx con tramos válidos; al cargar, tu garage está afuera (`fuera = 1`) y las sedes marcadas; el relato es continuo y reversible, como en la home; el cierre termina con `fuera = 0`, `trato = 1`, `tapa = 0`, `consumos = 0` y `llegan = 1`;
  - `aplicarVisibilidad` pesa solo en `control`, y con "En borrador" lleva `fuera` a 1.
- `three/mundo.test.js` suma: las sedes son deterministas, caen sobre edificios existentes, quedan a entre 300 m y 1 km por la calle y no tapan tu garage; la ciudad de la home no cambió; los recorridos de la red de la home tienen la misma geometría que antes de `trazos.js`.
- `landing_dom_sin_three.source.test.js` recorre también las subcarpetas de `ui/`, `paginas/`, el armazón y `ParaGarages.jsx`; el 3D entra solo por `lazy()`; las escenas nuevas leen `vivo` y no escriben `rig`.
- `landing.source.test.js`: los contratos que hoy leen `Landing.jsx` pasan a leer el armazón con las mismas aserciones; se quitan los que leen archivos que se retiran.
- `notas_accesibles.source.test.js` (ya existe): se extiende a las subcarpetas de `ui/` y a `paginas/`, así cubre las piezas de garages.
- `vistasLanding/paraGarages.source.test.js` (nuevo): la ruta sigue en `lazy()`; la barra y la CTA llevan a `/register?modo=garage`; la página usa el armazón; no quedan archivos ni referencias de la página anterior ni clases de vidrio en `index.css`.
- **Verificación en navegador.** El MCP `chrome-devtools` del hub no corre en este contenedor; se usan las herramientas de la línea base, que están fuera del repositorio, en el directorio temporal del agente: `medir/medir.cjs` (carga y JS por ruta) y `medir/a11y.cjs` (axe, encabezados, foco, objetivos táctiles y árbol ARIA). Si ya no están, se rehacen con Playwright y axe-core fuera del repositorio. Sobre la build de producción con `vite preview`:
  - recorrido hacia adelante, hacia atrás y con un tirón rápido en 390 y 1440 px, en las cuatro versiones;
  - capturas de la home antes y después de cada etapa que toque lo compartido (movimiento reducido, estado final de cada sección), comparadas píxel a píxel;
  - Core Web Vitals en perfil móvil, e INP con la Event Timing API sobre el interruptor y la CTA (`medir.cjs` todavía no lo mide y se le suma);
  - teclado: el foco nunca cae en algo invisible, y una nota desvanecida vuelve a verse cuando el foco entra.

## Etapas

Cada etapa termina con su verificación. El coordinador hace un commit por etapa verificada en `refactor-landing-garages`. Por decisión del usuario no se espera ninguna aprobación: el guion de esta spec y los "Por defecto" de las preguntas abiertas valen como decididos.

1. **Spec entregada.** Se implementa con los supuestos por defecto.
2. **En paralelo:**
   - **2A. Base compartida (agente A):** el armazón y el guion por página, sin cambios visibles en la home.
   - **2B. Esqueleto HTML de `/para-garages` (agente B):** la página con el contenido real (incluidos los textos del dibujo), en el flujo sin 3D, y el retiro de la página anterior. Ya es publicable, aunque sin figuras deja vacía la columna derecha en escritorio.
3. **Revisión del guion con el esqueleto en pantalla.** No bloquea: si el dueño pide cambios, se ajustan el contenido y la coreografía antes del pase de arte.
4. **Director de scroll y escena gris** de garages, para validar tiempos y encuadres, con capturas para el dueño. Puede arrancar en cuanto 2A está integrada, en paralelo con el final de 2B.
5. **Escenas definitivas y pase de arte.**
6. **Tiers y respaldos:** los pósters de garages, el movimiento reducido y la versión estática.
7. **Verificación y entrega** (pasada de cierre del hub).

### Reparto de archivos

Cada archivo tiene un solo dueño por etapa, así 2A, 2B y el 3D pueden trabajar a la vez sin pisarse.

| Etapa | Archivos |
|---|---|
| **2A, base** | `src/vistasLanding/Landing.jsx`; en `inmersiva/`: `ui/PaginaPlano.jsx` (nuevo), `ui/Seccion.jsx`, `ui/Nav.jsx`, `ui/Cta.jsx`, `ui/Regla.jsx`, `ui/ElegirDia.jsx`, `paginas/home.js` (nuevo), `contenido/comun.js` (nuevo), `contenido/secciones.js`, `scroll/guion.js` y `guion.test.js` (nuevos), `scroll/estado.js`, `scroll/useStoryTimeline.js`, `inmersiva.css` (solo si el armazón lo necesita), `landing_dom_sin_three.source.test.js` y `notas_accesibles.source.test.js`; `src/vistasLanding/landing.source.test.js`; `docs/architecture.md`; el ADR nuevo y el índice de `docs/decisions/` |
| **2B, esqueleto** | `src/vistasLanding/ParaGarages.jsx`; en `inmersiva/`: `contenido/garages.js` y `garages.test.js`, `paginas/garages.js`, `paginas/garagesEscena.js` (un stub que exporta `ESCENA`, `GUION` y `POSTERS` en `null`), `ui/garages/*.jsx`, `estado/garages.js` y `garages.css` (todos nuevos); `src/vistasLanding/paraGarages.source.test.js` (nuevo); el retiro de `componentesLanding/paraGarages/`, `componentesLanding/landing/`, `CtaButton.jsx` y las reglas de vidrio de `src/index.css`; `DESIGN.md`; `PRODUCT.md`; el enlace en `docs/specs/SPEC-landing-inmersiva.md` |
| **Etapas 4 a 6, 3D** | `inmersiva/three/**` (incluidos `three/garages.css`, que importa `ExperienceGarages.jsx`, y `mundo.test.js`); `scroll/coreografia.js` (solo las claves nuevas de `FX_CERO`), `scroll/coreografiaGarages.js` y `scroll/ajustesGarages.js` con sus tests; `paginas/garagesEscena.js` (deja de ser stub); `public/landing/posters/garages/`. Lee el contenido del dibujo de `contenido/garages.js` sin editarlo: si hace falta un texto nuevo, se lo pide a B o espera a que 2B cierre |
| **Nadie en 2A ni 2B** | `src/App.jsx`, `inmersiva/three/**`, `scroll/coreografia.js`, `scroll/rig.js`, `estado/store.js`, `src/pages/**` y `componentesLanding/auth/**` |

**Interfaz compartida.** Ninguno la cambia sin avisar al otro:

- el objeto de página (ver "Estilo de código");
- `Seccion({ s, i, ultima, sinEscena, piezas, posters, cta })`: `h1` si `i === 0`; las piezas que nombra `s.piezas`, cada una con las props `{ sinEscena, posters }`; la CTA si `s.cta`; la figura solo si `sinEscena && posters` y ninguna pieza de la sección declara `reemplazaFigura` (el interruptor dibuja la suya: el póster visible o el de borrador);
- `paginas/garages.js` toma `escena`, `guion` y `posters` de `paginas/garagesEscena.js`, así el esqueleto y el 3D no editan el mismo archivo;
- `Nav({ cta, enlace })`, `Cta({ cta, chico })`, `EnlacePagina({ enlace, className })` (hoy `EnlaceGarage`) y `Regla({ secciones })`;
- las clases de `inmersiva.css` que usan las piezas: `plano-nota`, `plano-planilla`, `plano-boton`, `plano-boton-secundario` y `plano-enlace`.

**Puntos de encuentro:**

1. La primera tarea de A saca de `landing.source.test.js` las lecturas de los archivos que B va a retirar. B no borra nada antes.
2. B conecta `ParaGarages.jsx` al armazón cuando A entrega `PaginaPlano` con las firmas de arriba. Hasta entonces, B trabaja en el contenido, las piezas, el CSS, el store y los tests.
3. B cierra después de A: su verificación corre con la base ya integrada.

### Verificación de cada etapa

- **2A:** `npm test` en verde, con `estado.test.js`, `secciones.test.js`, `mundo.test.js` y `jornada.test.js` sin cambios. La home idéntica: capturas con movimiento reducido del estado final de cada sección en 390 y 1440 (menos del 0,5 % de píxeles distintos), el recorrido normal sin diferencias a ojo y las cuatro versiones. axe en la home: `page-has-heading-one` sigue pasando con el scroll al final y el árbol sigue teniendo los ocho `h2` de la home (lo arregló `3011f5c`; el armazón no puede romperlo). Entrada hasta 3 kB más; el 3D de la home no cambia (2A no toca `three/`). eslint limpio en lo tocado y `npm run build`.
- **2B:** `npm test` en verde, con `garages.test.js` y `paraGarages.source.test.js`. `/para-garages` en 390 y 1440: las secciones en el flujo, con `h1`, cuerpo y CTA en el primer render de la ruta; la CTA y la barra llevan a `/register?modo=garage`; están "Iniciar sesión" y "Para empresas", y con sesión "Ir a mi panel". El interruptor funciona con teclado y anuncia el estado, todavía sin efecto en el dibujo. `a11y.cjs` sin serious ni critical, un `h1` y un `h2` por sección, objetivos de 44 px o más y la tabla sin scroll horizontal en 390. `medir.cjs`: LCP móvil menor a 2,5 s, JS inicial hasta 186 kB y chunk de ruta hasta 20 kB. No quedan los archivos retirados ni sus referencias, y login y registro se ven igual que antes (capturas en 390 y 1440). `DESIGN.md` y `PRODUCT.md` al día en lo que cambió.
- **4:** la home idéntica otra vez, porque la extracción de `Escenario` y las props de las escenas compartidas tocan su 3D. Garages con cajas grises en las escenas nuevas, tiempos y encuadres validados con capturas hacia adelante y hacia atrás, y los tests del guion de garages.
- **5:** escenas definitivas, capa de solicitud y rótulos; la home idéntica; presupuestos del 3D, fps y draw calls.
- **6:** ocho pósters de garages (uno por sección y el del borrador), sacados del 3D con un script fuera del repositorio, en dos tamaños y hasta 600 kB en total. Sin 3D, el interruptor cambia de póster. Con movimiento reducido la cámara salta por sección y los anillos quedan quietos. La versión estática se ve igual que la sin 3D.
- **7, cierre del hub, en este orden:**
  1. `design-taste-frontend`: `inspect.mjs` sobre la build, con `--out` fuera del repositorio y los `--allow` de "Dirección de arte", y la ronda de mirar y corregir con `references/critique.md` (hasta tres vueltas). `lint.mjs` sobre los archivos nuevos de garages.
  2. `impeccable` audit, una sola pasada: se corrigen los P0 y P1 y el resto se informa.
  3. `review-animations` sobre el movimiento tocado: revelados, interruptor y escenas.
  4. `vercel-react-best-practices` sobre el React tocado: armazón, piezas y escenas.
  5. Accesibilidad y carga en el navegador, en las dos páginas, con `a11y.cjs` y `medir.cjs`, o con `a11y-debugging` y `debug-optimize-lcp` si el MCP `chrome-devtools` está conectado.
  6. `npm test`, eslint de lo tocado y `npm run build`, con la salida en el informe.
  7. Documentos al día.

## Límites

- **Siempre:** voseo y tono de `PRODUCT.md`; hero en HTML antes que el 3D; Canvas decorativo con `aria-hidden`; texto en notas opacas y nunca contenido que exista solo en el Canvas; datos de ejemplo rotulados; la home sin cambios visibles, con capturas antes y después de cada etapa que toque lo compartido; respetar el reparto de archivos de 2A y 2B; actualizar `DESIGN.md`, `PRODUCT.md` y `docs/architecture.md` en la etapa en que cambia lo que documentan.
- **Preguntar antes de:** agregar dependencias (esta spec no necesita ninguna); cambiar rutas o roles (no hace falta); volver eager `/para-garages`; tocar login o registro; borrar archivos de `public/`; cambiar el copy o el comportamiento de la home; cambiar la interfaz compartida entre 2A y 2B.
- **Nunca:** inventar métricas, testimonios, logos ni cuántas empresas hay cerca; prometer IA, ingresos o cobros; importar `three` desde la capa DOM; forzar snapping o secuestrar la rueda; ocultar notas con `visibility: hidden`; commitear (lo hace el coordinador).

## Documentos que se actualizan al implementar

- **`DESIGN.md`** (2B, y en la 5 lo del dibujo): "Plano (solo la home)" pasa a "Plano (home y `/para-garages`)"; el resumen deja de decir que `/para-garages` conserva el vidrio; Layout, Elevation, Shapes, Cards y Navigation dejan de describir el contenedor, el vidrio, los radios de 24 px y la barra de vidrio de `/para-garages`; la Regla del Vidrio queda solo para la autenticación; las notaciones de sede, anillo y "fuera del mapa" entran en "Plano"; "Do" dice "en las páginas Plano" donde hoy dice "en la home".
- **`PRODUCT.md`** (2B): la fuente de los claims de garages y del problema del garage pasa a `inmersiva/contenido/garages.js`, y se aplica el "Por defecto" de la pregunta sobre el cobro.
- **`docs/architecture.md`** (2A): la fila de `/para-garages` en la tabla de rutas, el armazón y los objetos de página, y la nota de estilos ("la home y `/para-garages` comparten `inmersiva.css`; `garages.css` suma lo propio").
- **`docs/decisions/`** (2A): el ADR nuevo y su fila en el índice.
- **`docs/specs/SPEC-landing-inmersiva.md`** (2B): en "Fuera de alcance", el enlace a esta spec.
- **`tasks/plan.md` y `tasks/todo.md`:** hoy son de la home; el plan de garages se escribe cuando esta spec esté aprobada.

## Fuera de alcance

- Login, registro y los paneles por rol.
- Cambios en el contenido, el guion o la coreografía de la home. Solo entra el refactor que la vuelve parametrizable, sin cambios visibles (el arreglo de accesibilidad de la nota ya está en `3011f5c`).
- En `/para-garages`: la mira, el realce y la ficha del mouse; el detalle del QR; la jornada; el cajetín de entrada.
- SSR, prerender e imagen de Open Graph.
- Claims nuevos de marketing.
- Borrar `public/logo.png` y limpiar tokens que ya estaban huérfanos (`--animate-border-spin`, `--color-brand-cream`).

## Preguntas abiertas

Para el dueño del producto. Mientras no responda, rige el "Por defecto" de cada una, que es lo que esta spec ya describe.

- [ ] **Nivel de intensidad.** La spec de la home anticipó "nivel 1 o 2" para esta página. ¿Nivel 3, el mundo continuo de la home visto desde el garage, o nivel 2, con 3D solo en el hero y en "aparecer"? Recomiendo el 3: el mensaje es un mapa, el mundo y el director ya existen y se comparten (el 2 obliga a construir un escenario nuevo), y quien llega desde la home ya tiene el 3D en caché. **Por defecto: nivel 3.** La base y el esqueleto no dependen de esta respuesta; si fuera el 2, cambian las etapas 4 a 6.
- [ ] **Cobro.** `PRODUCT.md` habla de "transparencia de cobro" y de "cobrar consumos", pero la pantalla del dueño dice "No confirman cobros, vencimientos ni pagos recibidos" y "Cobros, estados y conciliación: pendiente de integración". ¿La landing habla solo de consumos generados? Recomiendo que sí, con la aclaración en la tabla de ejemplo. **Por defecto: la página dice "consumos generados" y nunca "cobro" ni "cobrá"; `PRODUCT.md` cambia "Transparencia de cobro" por "Transparencia de consumos" y, en la tabla de audiencias, "cobrar consumos" por "ver los consumos generados", con una nota de que el cobro está pendiente de integración.**
- [ ] **Etiqueta de la CTA.** ¿"Registrá tu garage" o "Registrate", la misma de la home, también hacia `/register?modo=garage`? Recomiendo "Registrá tu garage": dice qué se hace y anticipa el alta de dueño, y entra en la barra del celular (unos 350 px de 390 con "Iniciar sesión"). **Por defecto: "Registrá tu garage" en el hero, la barra y el cierre.**
