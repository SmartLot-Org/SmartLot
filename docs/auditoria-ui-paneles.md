# Auditoría UI de los paneles — márgenes, jerarquía y organización de la información

Fecha: 2026-11-16. Alcance: los cinco paneles por rol (empleado, garagista, admin, dueño de garage, superadmin), 40 vistas. La landing y las pantallas de autenticación quedan fuera; se tratan aparte.

Este documento reemplaza el plan de `docs/pendientes-audit-ui.md` en lo que respecta a paneles: la auditoría que ese plan dejó pendiente está hecha acá, con otro método.

## Cómo se hizo

- La app se compiló (`vite build`) y se sirvió en local. La API se simuló por rol interceptando `/api/*` desde el navegador, con datos argentinos verosímiles (empresas, sedes, garages, reservas, tratos, consumos). No se tocó ningún backend ni el código del proyecto.
- Cada vista se abrió en 1440, 820 y 390 px de ancho (más 1920 en una pasada). En cada una se midió en el navegador: bordes del contenido, título, familias y tamaños tipográficos, paddings, márgenes y gaps, radios, sombras, alturas de botones e inputs, texto cortado, desbordes y objetivos táctiles.
- Cada vista se cargó de dos maneras: **directa** (URL o F5) y **navegando** por el panel sin recargar. Las diferencias entre ambas están en la sección 2.1.
- Sobre el código se corrió el detector de `impeccable` (1.748 hallazgos) y un análisis propio del grafo de imports de CSS.
- Los números de este documento salen del build de producción.

### Límites

- Los datos son simulados. Los hallazgos de layout no dependen de ellos; los de contenido (por ejemplo, conteos) están verificados en el código y se citan con archivo y línea.
- Rendimiento no se midió. Los mapas de Google no cargaron (no hay API key en el entorno) y el lector de QR no se probó con cámara.
- Modales, drawers y menús: se revisaron ocho representativos, no todos.
- Superadmin: por ADR-007 no se propone ningún cambio de color. Todo lo que se lista de ese panel es estructura, espaciado, jerarquía o copy.
- La revisión visual y la medición mecánica las hizo una sola sesión, en ese orden. El método de `impeccable critique` pide dos evaluadores aislados; acá no los hubo.

## 1. Veredicto

Pantalla por pantalla, la mayoría de las vistas se ve cuidada. El problema es que **no hay un sistema detrás**: cada vista trae su propio CSS, su propio ancho de columna, su propio título y sus propios botones. El resultado es un producto que se siente como cinco aplicaciones distintas, y que en algunos casos se rompe según por dónde se haya entrado.

Lo que funciona y conviene conservar:

- **Consumos generados** del admin (`/admin_pagos`) es la vista más sólida: una sola columna de alineación, cabecera con acción a la derecha, KPIs, filtros y tabla con versión mobile. Sirve de modelo para el resto.
- Los flujos del **empleado en celular** están bien pensados: una tarea por pantalla, estados vacíos con acción, modal de reserva claro.
- Hay buena base de estados: `EmptyState` compartido, esqueletos de carga, reintentos, papelera con restauración, toast con deshacer.

### Puntajes

Heurísticas de Nielsen (0 a 4):

| # | Heurística | Puntaje | Motivo principal |
|---|---|---|---|
| 1 | Visibilidad del estado del sistema | 3 | Carga, vacío y error están cubiertos. |
| 2 | Lenguaje del usuario | 2 | Jerga interna en pantalla y mezcla de voseo y tuteo (sección 2.8). |
| 3 | Control y libertad | 3 | Volver, cancelar, deshacer y papelera presentes. |
| 4 | Consistencia y estándares | 1 | 18 tamaños de título, 16 márgenes de página, 27 alturas de botón. |
| 5 | Prevención de errores | 3 | Confirmaciones y validación en vivo; falla en acciones destructivas pegadas a la principal. |
| 6 | Reconocer antes que recordar | 2 | Secciones que no están en la navegación; estados cortados con "…". |
| 7 | Flexibilidad y eficiencia | 2 | Listas en tarjetas sin densidad ni paginado; sin acciones masivas. |
| 8 | Diseño minimalista | 2 | Métricas-héroe, tarjetas anidadas y cabeceras duplicadas. |
| 9 | Recuperación de errores | 3 | Mensajes accionables en general; hay errores sin estilo y con emoji. |
| 10 | Ayuda | 2 | Canal de soporte y textos de ayuda en formularios. |
| | **Total** | **23/40** | Aceptable: necesita mejoras significativas. |

Calidad técnica (0 a 4): accesibilidad 2, tokens y theming 1, responsive 2, integridad de implementación 1. Rendimiento sin medir. **6/16**.

## 2. Causas raíz

Ocho causas explican casi todos los hallazgos por vista. Arreglarlas primero evita corregir 40 pantallas una por una.

### 2.1 El CSS se carga por ruta y es global: una pantalla se ve distinta según por dónde llegaste

Cada vista importa su propio `.css`, que queda cargado para el resto de la sesión. Dos efectos:

**Vistas que usan clases cuyo CSS no importan.** Se ven bien si antes pasaste por la vista que sí lo importa, y rotas si entrás directo o apretás F5.

| Vista | Clases que usa sin importar su CSS | Qué pasa al entrar directo |
|---|---|---|
| `vistasDueñoGarage/cuentas_por_cobrar.jsx:45` | `duenio-garage-page`, `duenio-garage-main` (solo en `duenio_garage.css`) | Sin contenedor: el contenido arranca en x=0, las tarjetas tocan los dos bordes de la pantalla y el título queda centrado. |
| `vistasDueñoGarage/perfil_dueño_garage.jsx` | las dos anteriores y `duenio-back-button` | Igual: tarjetas a sangre y flecha de volver de 20 px pegada al borde. |
| `vistasSuperadmin/agregar_sede.jsx:150-163` | `btn-guardar-grande`, `btn-cancelar-grande` (en `agregar_empresa.css` y tres CSS de admin) | "Guardar sede" como texto plano y "Cancelar" como botón gris nativo. Además, los campos quedan sin estilo **siempre**: las reglas de `input-group-superadmin` están atadas a `.agregar-empresa-form` (`agregar_empresa.css:70-118`) y `agregar_sede.css` no define ninguna para etiquetas ni inputs. |
| `vistasSuperadmin/superadmin_reservas.jsx` | `btn-archivados` (en `gestion_usuarios.css`) | Botón "Actualizar" sin estilos. |
| `vistasAdmin/agregar_garage_propio.jsx`, `agregar_zona.jsx`, `editar_zona.jsx` | `garage-price-fields`, `garage-price-grid` (solo en `duenio_garage.css`) | Los campos de precio nunca reciben su grilla: un admin no pasa por las vistas del dueño. |
| `vistasAdmin/agregar_sede.jsx` | `skl-line` (en `gestion_sedes.css`) | Esqueleto de carga sin estilo. |

**Clases con el mismo nombre en varios archivos.** Hay 91 nombres de clase definidos en dos o más CSS. `.boton-back` está en 13 archivos; `.active` en 10; `.btn-guardar-grande` y `.btn-cancelar-grande` en 4; `.btn-primario`, `.footer-item`, `.input-group` y `.header` en 3. Gana el último que se cargó. Caso medido: `/admin_reportes_analisis` muestra el título a 29 px en x=48 con el subtítulo corrido a la derecha si se entra directo, y a 35 px en x=108 con el subtítulo debajo si antes se visitó Panel de control (`.admin-panel__title` está en `admin_panel_de_control.css` y en `admin_reportes_analisis.css`).

Además hay clases usadas en JSX que no existen en ningún CSS: `form-error` (3 usos), `boton-base-smartlot`, `form-card-header`, `icon-badge-box`, `btn-add-vehicle`, `error-message`, `textos-titulos`, `info-personal-wrapper-card`.

**Arreglo.** Inmediato: agregar los imports que faltan en las seis vistas de la tabla. De fondo: estilos por componente (CSS Modules o utilidades Tailwind con los tokens) para que ninguna clase dependa del orden de carga. Es una decisión de arquitectura: va con ADR.

### 2.2 La base tipográfica es 18 px en escritorio y 16 px en el resto

`src/index.css:73` define `font: 18px/145%` en `:root`, y `src/index.css:83-85` lo baja a 16 px hasta 1024 px. Consecuencias:

- Todo lo escrito en `rem` (206 declaraciones de tamaño de fuente y buena parte de los espaciados) se agranda 12,5 % en escritorio y cae fuera de la grilla: `0.6rem` da 10,8 px, `0.85rem` da 15,3 px, `1.1rem` da 19,8 px.
- Las utilidades de Tailwind también son `rem`: `p-4` mide 18 px, `h-10` mide 45 px, `max-w-6xl` mide 1296 px y no los 1152 que documenta `DESIGN.md`.
- En 33 de las 40 vistas, más del 40 % de los paddings, márgenes y gaps no es múltiplo de 4. En nueve vistas (las seis del dueño, los perfiles de admin y empleado, y garages del superadmin) es entre el 94 % y el 100 %, con cientos de valores fraccionarios.
- Al cruzar los 1024 px todo lo que está en `rem` se achica de golpe y lo que está en `px` no.

**Arreglo.** Volver la raíz a 16 px y aplicar 18 px solo donde se quiera texto de lectura. Las vistas hechas en `rem` hay que recalibrarlas, porque fueron ajustadas a ojo con la base de 18. Va en la misma spec que los tokens (2.4).

### 2.3 Texto centrado por herencia y tracking de título pensado para 56 px

- `src/index.css:110`: `#root { text-align: center }`, resto de la plantilla de Vite. Cada vista tiene que acordarse de volver a alinear a la izquierda, y donde no lo hace el texto queda centrado: 129 bloques en gestión de usuarios (superadmin), 82 en gestión de garages (superadmin), 44 en gestión de usuarios (admin), 26 en agregar garage. De ahí salen los títulos de tarjeta centrados sobre descripciones alineadas a la izquierda en pagos-test, plantillas de email y caché.
- `src/index.css:181-189`: todo `h1` hereda `letter-spacing: -1.68px` y `margin: 32px 0`. El tracking está calculado para 56 px; aplicado a títulos de 24 px equivale a −7 % y las letras se pegan ("Gestión de Usuarios", "Reservas del Sistema", "Empresas y sedes").

**Arreglo.** Quitar el `text-align` de `#root`. Reemplazar el `h1` y el `h2` globales por dos o tres estilos de título de producto con tracking proporcional (en `em`).

### 2.4 No hay escala: cada archivo inventa sus valores

Sobre los 66 archivos CSS de paneles (21.945 líneas):

| Propiedad | Valores distintos | `DESIGN.md` dice |
|---|---|---|
| Tamaño de fuente | 117 | Cuatro niveles |
| Peso de fuente | 11 (400 a 950) | DM Sans se carga solo en 400, 500, 600 y 700 |
| Padding, margen y gap | 144 | 4, 8, 16, 24, 32 |
| Radio de borde | 36 | 6, 10, 14, full |
| Sombra | 194 | Cuatro |
| Tracking | 40 | — |
| Breakpoints | 27 | 640, 768, 1024, 1280 |
| `z-index` | 15 | Centralizado en `helpers/zIndex.js` |
| Colores hex | 176 (2.683 usos) | Solo tokens |
| `!important` | 428 | — |

En pantalla eso se ve así: hasta 18 tamaños de fuente en una sola vista (tratos y edición de garage), 17 en crear garage, 16 en el dashboard del empleado. Entre 12,2 y 14,1 px el dashboard del dueño usa seis tamaños que el ojo no distingue. Los pesos 750, 800, 850, 900 y 950 aplicados a DM Sans se dibujan todos como 700, porque no hay archivo de fuente para esos pesos y `font-synthesis` está en `none`.

Además de Archivo y DM Sans, el CSS de paneles declara otras cuatro familias: `-apple-system`/Roboto (`admin_dashboard.css:6`, `agregar_admin_sede.css:4`, `agregar_sede.css:4`, `gestion_sedes.css:4`, `form_reserva.css:8`, `formulario_PerfilPersonal.css:33`), Inter (`gestion_de_empleados.css:141`), Poppins (`superadmin_gestion_garages.css:265`) y monoespaciada para rótulos (`duenio_garage.css:174`). Ninguna se carga, así que cada sistema operativo muestra una distinta.

**Arreglo.** Declarar en `@theme` de `src/index.css` las escalas de espaciado, tipo, radio y sombra, y migrar vista por vista. Escala tipográfica sugerida para producto: 12, 13, 14, 16, 20, 24, 30.

### 2.5 No hay contenedor de página ni cabecera de página compartidos

A 1440 px, el contenido de las 40 vistas arranca en 16 posiciones distintas: 0, 20, 39, 48, 54, 58, 138, 220, 320, 338, 362, 394, 428, 450, 500 y 518 px. Las columnas centradas miden 404, 440, 482, 540, 623, 716, 764, 772, 800 y 951 px. En 390 px los márgenes laterales son 0, 14, 16, 18, 20 o 24.

El contenedor documentado (`src/index.css:223-231`) usa `padding: 40px 4%` y `max-width: none !important`: el margen lateral cambia con el ancho de la ventana (58 px en 1440, 77 en 1920) y no hay ancho máximo, así que en monitores grandes las filas se estiran sin límite.

El título de página tiene 18 tamaños entre 24 y 54 px, cinco pesos, dos alineaciones y dos vistas que no tienen `h1` (`agregar_empleado.jsx:230` y `agregar_admin_sede.jsx` usan un `h3`). El botón de volver tiene cuatro formas. La acción principal aparece arriba a la derecha (gestión de garages, gestión de usuarios), abajo a la izquierda (gestión de sedes), centrada en el medio de la página (empresas del superadmin) o como barra de ancho completo (garages del superadmin).

**Arreglo.** Un componente `PageShell` con contenedor (ancho máximo y padding fijos por breakpoint) y un `PageHeader` con cinco ranuras: volver, rótulo opcional, título, descripción y acciones. Tres anchos de contenido alcanzan: formulario (alrededor de 640 px), lectura (alrededor de 960) y datos (alrededor de 1280).

### 2.6 La navegación es una barra flotante de celular en todos los tamaños

- En 1440 px la navegación es una píldora de 700 × 90 px fija abajo y centrada (`componentesAdmin/footer_admin.css:1-22`). Flota sobre tablas y formularios y tapa filas mientras se hace scroll.
- Tiene fondo de vidrio (`footer_admin.css:13-14`), que `DESIGN.md` reserva para la landing, y anima ancho, alto y padding.
- Su separación del borde es `margin-bottom: 2%` del ancho: 29 px en escritorio, 8 px en celular.
- En celular las etiquetas miden 10 px, y 9 px por debajo de 400 px de ancho (`footer_admin.css:180` y `:201`).
- Existen cuatro copias casi iguales: admin, empleado, superadmin y dueño, unas 1.050 líneas en total.
- Faltan destinos. Admin: Sedes y Control de acceso solo se alcanzan desde los mosaicos del inicio; Reportes, desde un botón dentro de Panel de control (`componentesAdmin/boton_reportes.jsx:10`). Superadmin: la barra tiene 4 secciones de 9 (`componentesSuperadmin/footer_superadmin.jsx:18-33`); Garages, Reservas, Caché, Pagos de prueba y Plantillas quedan fuera.
- Desaparece en algunos formularios (agregar empleado, agregar sede, agregar admin de sede, altas del superadmin) y se mantiene en otros (agregar garage).
- La barra superior tiene tres implementaciones (`.header`, `.header-superadmin`, `header.duenio-header`). En el empleado mide 64 px en dashboard e historial y 70 px en las otras tres pantallas (`vistasEmpleados/empleados_dashboard.css:9-27`, `historial_reserva.css:9-27`), así que el logo cambia de tamaño al navegar. El logo se ubica con `margin-left: -19%` y `height: 20% !important` (`componentesAdmin/header_admin.css:70-77`): su caja mide 150 × 82 px dentro de una barra de 70 y arranca 4 px fuera de la pantalla.
- Al editar un garage, el superadmin ve la barra clara del admin (`/editar_zona` reutiliza la vista de admin).

**Arreglo.** Un solo `AppHeader` y un solo `AppNav` configurados por rol. En celular, barra inferior fija y opaca con etiquetas de 11 px o más. Desde 1024 px, barra lateral con todas las secciones del rol.

### 2.7 La jerarquía de la información no sigue la tarea de cada rol

- **Admin, inicio.** El "dashboard" es un menú: seis mosaicos de 180 px que repiten la navegación (`vistasAdmin/admin_dashboard.jsx:58`). No muestra ningún dato. Lo que el admin necesita al entrar (ocupación de hoy, solicitudes de trato pendientes, conflictos abiertos, consumo del mes) está a un clic en tres pantallas distintas.
- **Garagista, celular.** En 844 px de alto, los primeros 556 px son título, tarjeta de "Garage asignado" con fecha y contador, buscador y pestañas. La primera reserva empieza al 66 % de la pantalla. "Escanear QR" se repite en cada tarjeta y siempre abre el mismo lector (`vistasGaragista/garagista_dashboard.jsx:974`).
- **Dueño, inicio.** Un titular de 49,5 px en dos líneas y cinco tarjetas de KPI antes de los garages. En celular los garages empiezan en el píxel 1.263.
- **Dueño, tratos.** La pantalla existe para aceptar o rechazar solicitudes, y las solicitudes aparecen en el píxel 1.149 en celular: antes hay dos cabeceras que dicen lo mismo (`tratos_empresa_garage.jsx:15` y `componentesCompartidos/GestionTratosGarage.jsx:123`) y cinco KPIs en una grilla de cuatro, con el quinto solo en su fila (`GestionTratosGarage.jsx:118`).
- **Admin, reportes.** Lo primero y más grande de la página son dos botones de exportar de 665 × 94 px, uno verde y uno rojo. El rojo es el color de error del sistema y acá marca una acción inofensiva.
- **Admin, panel de control.** Una barra con degradado y un "66 %" de 62 px ocupa el primer lugar. `DESIGN.md` prohíbe las métricas-héroe.
- **Superadmin, garages.** El `h2` "Listado de Garages" mide 57,6 px y el `h1` de la página 48,6: el subtítulo pesa más que el título (`superadmin_gestion_garages.jsx:223` y `:282`). Los números de los KPI están marcados como `h2`.
- **Listas en tarjetas.** Cada empleado es una tarjeta de unos 340 px con el botón "Configurar límite de reservas" repetido. Doce empleados son 4.955 px de scroll en celular. En escritorio una tabla mostraría los mismos doce en una pantalla.
- **Tarjetas dentro de tarjetas** en 16 vistas, pese a la regla de `DESIGN.md`.

### 2.8 El copy mezcla voseo, tuteo y notas internas

`PRODUCT.md` pide voseo y registro operativo. En pantalla aparecen:

- Tuteo: "Desde aquí puedes acceder…" (`admin_dashboard.jsx:59`), "Controla tus garages…" y "Visualiza tus propiedades…" (`duenio_garage_dashboard.jsx:200-202`), "Selecciona un garage", "Reserva tu plaza…", "Visualiza el rendimiento…" (`admin_reportes_analisis.jsx:998`).
- Notas de desarrollo: "…desde una consola separada del flujo admin" (`duenio_garage_dashboard.jsx:202`), "Esta funcion ahora pertenece al rol dueño de garage" (`crear_garage_dueño.jsx:212`), "Cobros, estados y conciliación: pendiente de integración" (`cuentas_por_cobrar.jsx:24`), "Revisa la consola" con emoji ❌ en errores de `agregar_empleado.jsx`.
- Tildes faltantes en títulos: "Reportes y Analisis", "Ocupacion Total", "Informacion General", "Ultima reserva", "Vehiculo".
- Mayúsculas sin criterio: "Gestión de Usuarios" junto a "Gestión de garages"; "Guardar Cambios" junto a "Nueva reserva".
- Nombres que no coinciden: la pantalla se titula "Gestión de Usuarios", la navegación dice "Gestión" y el botón "Agregar empleado". El alta de garage del superadmin se titula "Nuevo Garage" y su descripción habla de "zona".

## 3. Hallazgos por rol

Severidad: **P1** dificulta la tarea o se ve roto; **P2** molesta y tiene rodeo; **P3** pulido. No hay P0: ninguna tarea queda bloqueada.

### Empleado

| Sev | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| P1 | No hay versión de escritorio: una columna de 404 a 540 px centrada en 1440 px, con el 72 % de la pantalla vacío. Las cinco pantallas usan tres anchos y tres bordes izquierdos (518, 500 y 450). | `empleados_dashboard.css:31`, `nueva_reserva.css:30`, `formulario_PerfilPersonal.css` | Un solo ancho de columna; desde 1024 px, dos columnas (reservas a la izquierda, vehículos y acciones a la derecha). |
| P1 | El mes y el estado de la reserva se cortan con "…": "NOVIEM…", "COMPLETA…", "SIN REGIST…". Son textos de 7,5 a 9 px dentro de una caja de 52 a 58 px. | `componentesEmpleado/tarjeta_reserva.css:114-137` y `:182-191` | Mes abreviado ("NOV") a 11 px como mínimo; el estado como badge fuera de la caja de fecha. |
| P1 | En el modal "Detalle de reserva", el campo "Vehiculo" muestra `reservaNorm.plaza`: el número de plaza cuando la reserva lo trae, y la patente solo cuando no. | `componentesEmpleado/modal_editar_reserva.jsx:153-154` | Mostrar patente, marca y modelo del vehículo. |
| P1 | La misma tarjeta de reserva se titula con la dirección en el inicio y con el nombre del garage en el historial. | `vistasEmpleados/empleados_dashboard.jsx:221-237` | Nombre del garage como título; dirección como segunda línea. |
| P2 | En el inicio, la acción principal ("Nueva reserva", 56 px) queda tercera, debajo de "Generar QR" y "Mostrar todas". Son tres controles de ancho completo con tres estilos. | `empleados_dashboard.jsx` | Un botón principal por pantalla; el QR dentro de la tarjeta de la reserva activa. |
| P2 | El título de página cambia en cada pantalla: 34 px peso 900 a la izquierda, 28 px peso 700, 34 px centrado, 35,1 px. | ver 2.5 | `PageHeader` único. |
| P2 | En "Nueva reserva" el título arranca en x=500 y la tarjeta del formulario en x=510; las etiquetas están centradas sobre campos alineados a la izquierda. | `nueva_reserva.css:30` y `:138` | Mismo ancho para título y formulario; etiquetas a la izquierda. |
| P2 | En el perfil, "Guardar Cambios" y "Cerrar Sesión" están apilados y miden lo mismo. | `perfil_empleado.jsx` | Cerrar sesión al menú de usuario o al final, como enlace. |
| P2 | En "Añadir vehículo" el botón que guarda es punteado y "Cancelar" es un bloque rosa más pesado. | `agregar_vehiculo.jsx` | Guardar como botón principal; cancelar como secundario. |
| P2 | La campana del encabezado es un dibujo sin acción, dentro de una zona con cursor de mano. | `componentesEmpleado/header_empleado.jsx:34-36` | Quitarla o conectar las notificaciones. |
| P3 | El asterisco de obligatorio se aplica a toda etiqueta de formulario, sea o no obligatoria. | `src/index.css:236-246` | Marcarlo por campo. |

### Garagista

| Sev | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| P1 | En celular, 556 px de cabecera antes de la primera reserva (ver 2.7). | `garagista_dashboard.jsx`, `garagista_dashboard.css` | Cabecera de una línea (garage y "2 / 120 dentro"); buscador y pestañas pegados arriba. |
| P1 | "Escanear QR" repetido en cada tarjeta abre siempre el mismo lector. | `garagista_dashboard.jsx:974` | Un único botón fijo en la zona del pulgar; en la tarjeta, solo "Patente manual". |
| P1 | Pestañas de 38 px y botones de 42 px de alto: por debajo de los 44 px táctiles. | `garagista_dashboard.css` | 48 px en esta vista: se usa de pie y con una mano. |
| P2 | En escritorio, dos columnas iguales aunque una esté vacía: el estado vacío ocupa media pantalla. | `garagista_dashboard.css` | Columna vacía colapsada a una línea. |
| P2 | Borde lateral de color en las tarjetas de "Autos dentro". | `garagista_dashboard.css:312` | Badge de estado, sin franja. |

### Admin

| Sev | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| P1 | El inicio es un menú sin datos (ver 2.7). El `h1` de la página es "Acciones Rápidas". | `admin_dashboard.jsx:58-59` | Inicio con cuatro indicadores accionables y la lista de pendientes; los accesos pasan a la barra lateral. |
| P1 | Agregar empleado: tarjeta de 500 px centrada y, debajo, el bloque "Reservas vigentes" a 1.400 px de ancho, con los radios en el borde izquierdo de la pantalla. Sin `h1`, sin volver y sin navegación. El error del formulario no tiene estilo. | `agregar_empleado.jsx:230`, `:234`, `:253`, `:254`, `:267` | Meter el bloque dentro de la tarjeta; `PageHeader`; estilo de error del sistema. |
| P1 | Panel de control: dos conteos que se contradicen a la vista, "Conflictos reportados (3)" y "Activos (5)". El primero cuenta los no resueltos; el segundo, todos los no borrados. | `admin_panel_de_control.jsx:571` y `:602` | "Abiertos (3)" y "Todos (5)", o un solo conteo. |
| P1 | Reportes: exportar como elemento principal, en verde y rojo (ver 2.7). La cabecera cambia según la navegación previa (ver 2.1). | `admin_reportes_analisis.jsx:996-1013` | Exportar como botón secundario en la cabecera, con menú de formato, igual que en Consumos. |
| P1 | Gestión de usuarios: lista en tarjetas de baja densidad (ver 2.7). | `gestion_de_empleados.jsx`, `gestion_de_empleados.css` | Tabla en escritorio; fila compacta con detalle en celular; el límite de reservas dentro del detalle. |
| P2 | Panel de control: métrica-héroe con degradado y franjas laterales de color en filas y tarjetas. | `admin_panel_de_control.css:804`, `:1070`, `:1252` | KPI en fila de tarjetas planas; prioridad como badge. |
| P2 | Gestión de sedes: un KPI solo ("Total sedes 3") centrado como héroe; "Nueva sede" debajo y a la izquierda; texto centrado junto a ícono a la izquierda. | `gestion_sedes.jsx`, `gestion_sedes.css` | Conteo en el título ("Sedes · 3"); acción en la cabecera. |
| P2 | Agregar garage: títulos de sección centrados; el campo "Nivel / Planta" corto deja un hueco a su derecha; `width: 200%` en una regla mobile. | `componentesAdmin/formulario_zona.css:322-324` | Grilla de dos columnas con campos de ancho coherente. |
| P2 | Consumos: a 820 px de ancho la página desborda 128 px hacia la derecha. El texto oculto "Acciones" del encabezado de la tabla es `position: absolute` y se escapa del contenedor con scroll, que no está posicionado. | `admin_pagos.css:29` | `position: relative` en `.pagos-table-wrap`. |
| P2 | Consumos: el subtítulo termina en una raya suelta ("…de tu empresa —"). | `admin_pagos.jsx:246` | Cerrar la frase. |
| P2 | Modal de límite de reservas: "Cancelar" y "Guardar" son texto plano, sin jerarquía. La leyenda "Reservas vigentes" no describe el control. | `componentesAdmin/ReservationLimitFields.jsx:4`, `ReservationLimitFields.css:10` | Botones del sistema; leyenda "Límite de reservas activas". |

### Dueño de garage

| Sev | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| P1 | "Por cobrar" y "Perfil" se rompen al entrar directo o con F5 (ver 2.1). | `cuentas_por_cobrar.jsx:8`, `perfil_dueño_garage.jsx` | Importar `duenio_garage.css`. |
| P1 | Inicio: titular de marketing y cinco KPIs antes de los garages (ver 2.7). | `duenio_garage_dashboard.jsx:200-202` y `:247-248` | Título "Mis garages", KPIs en una fila compacta, garages primero. |
| P1 | Tratos: doble cabecera y KPIs antes de las solicitudes (ver 2.7). | `tratos_empresa_garage.jsx:15`, `GestionTratosGarage.jsx:118-130` | Una cabecera; solicitudes pendientes arriba; KPIs después o en una línea. |
| P2 | Crear y editar garage en celular: 102 px vacíos entre "Hora de apertura" y "Hora de cierre". `flex: 1 1 140px` pasa a aplicarse al alto cuando la fila cambia a columna. | `componentesAdmin/formulario_zona.css:48-51` y `:332-336` | `flex: 0 0 auto` en la regla mobile. |
| P2 | "Por cobrar": un aviso informativo con estilo de error (rojo y franja lateral). | `cuentas_por_cobrar.css:20` | Variante info del sistema. |
| P2 | Entre 15 y 18 tamaños de fuente por pantalla, todos fraccionarios; rótulos en monoespaciada. | `duenio_garage.css`, `:174` | Escala de 2.4. |
| P2 | En el inicio, las tarjetas de garage de una misma fila no alinean sus bloques internos cuando cambia la cantidad de días. | `componentesDueñoGarage/tarjeta_garage_dueño.css` | Subgrid o alturas mínimas por bloque. |

### Superadmin

Sin cambios de color (ADR-007).

| Sev | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| P1 | Agregar sede: campos sin estilo siempre y botones sin estilo al entrar directo (ver 2.1). | `vistasSuperadmin/agregar_sede.jsx:150-163`, `agregar_empresa.css:70-118` | Usar el mismo componente de campo y de botón que Agregar empresa. |
| P1 | Garages: jerarquía de títulos invertida (ver 2.7); "Nuevo Garage" como barra de ancho completo; nombres de garage a tres líneas en tarjetas de cuatro columnas. | `superadmin_gestion_garages.jsx:223`, `:233`, `:282` | Un `h1`; acción en la cabecera; nombre a 16 o 18 px en una línea con elipsis y `title`. |
| P1 | Garages: la página desborda 12 px en todos los anchos. | `superadmin_gestion_garages.css:121-122` (`right: -12px`) | `overflow: hidden` en la tarjeta o `right: 0`. |
| P1 | Cuatro secciones en la navegación para nueve existentes (ver 2.6). | `componentesSuperadmin/footer_superadmin.jsx:18-33` | Barra lateral con las nueve. |
| P2 | Títulos de 24 px con tracking de −1,68 px (ver 2.3). | `src/index.css:181-189` | Tracking en `em`. |
| P2 | Reservas: seis filtros en una fila y "Garage" solo en la segunda. | `superadmin_reservas.css` | Grilla de filtros que reparta parejo. |
| P2 | Empresas y sedes: dos KPIs que ocupan todo el ancho con un número cada uno, y "Nueva empresa" centrado entre los KPIs y la lista. | `gestion_empresas.jsx`, `gestion_empresas.css` | Conteos en la cabecera; acción a la derecha. |
| P2 | Inicio: siete mosaicos en grilla de dos, con el último solo; "Acciones Rápidas" centrado mientras el título de la página va a la izquierda. | `superadmin_dashboard.jsx`, `superadmin_dashboard.css` | Reemplazar por la barra lateral; inicio con estado del sistema. |
| P2 | Alta de garage: tres estilos de control en un mismo formulario (selects nativos con borde, checkboxes nativos, inputs rellenos con etiqueta flotante). | `vistasAdmin/agregar_zona.jsx` | Un solo estilo de campo. |
| P3 | Pagos de prueba, plantillas y caché: títulos de tarjeta centrados sobre descripciones a la izquierda. | ver 2.3 | Se corrige con 2.3. |

### Componentes compartidos

| Sev | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| P2 | Botones: 27 alturas distintas entre 20 y 94 px (`DESIGN.md` dice 40 y 48) y 12 radios. | todos los paneles | Un `Button` con tres tamaños y cuatro variantes. |
| P2 | Campos: tres estilos (blanco con borde, gris relleno con etiqueta flotante, nativo sin estilo) y alturas de 42 a 64 px. Las etiquetas flotantes (`#94a3b8` sobre `#e2e8f0`) dan 2,1:1 de contraste; el mínimo AA es 4,5:1. | `componentesAdmin/formularios.css:38` y `:162`, `formulario_zona.css` | Un `Field` de 48 px con etiqueta arriba. |
| P2 | Tarjetas: más de 20 paddings (de 14 a 40 px) y radios de 12 a 32 px. | todos los paneles | Padding 16 o 24; radio 10 o 14. |
| P2 | Franjas laterales de color en 11 lugares. | `garagista_dashboard.css:312`, `admin_panel_de_control.css:804`, `:1070`, `:1252`, `gestion_garages.css:217`, `:225`, `cuentas_por_cobrar.css:20`, `:53`, `:76`, `duenio_garage.css:751`, `componentesShared/ToastUndo.css:19` | Badge o ícono de estado. |
| P3 | Notificaciones: cada ítem lleva un botón azul "Ir a tratos"; el panel es una pila de botones iguales. | `componentesCompartidos/CampanaNotificaciones.jsx:144-147` | Fila entera clicable con flecha. |
| P3 | Easing con rebote en 9 lugares y texto con degradado en uno. | `admin_panel_de_control.css:181`, `:1076`, `admin_reportes_analisis.css:197`, `:362`, `:587`, `duenio_garage.css:708`, `campana_notificaciones.css:40`, `footer_dueño_garage.css:109`, `header_dueño_garage.css:91`, `ToastUndo.css:25` | Curvas sin rebote; color sólido. |

## 4. `DESIGN.md` y el código no coinciden

Antes de migrar hay que decidir cuál manda en cada punto, y actualizar los dos juntos.

| Tema | `DESIGN.md` | Código | Recomendación |
|---|---|---|---|
| Título de producto | DM Sans 500, 56 px | Archivo 500 a 900, 24 a 54 px | Corregir el documento: 56 px no sirve para una pantalla de trabajo. Definir 24 y 30 px. |
| Fuente de producto | DM Sans | Títulos en Archivo por la regla global | Decidir si los títulos de panel van en DM Sans o en Archivo y dejarlo escrito. |
| Radios | 6, 10, 14, full | 12, 16, 18 y 24 dominan | Elegir una escala y migrar. |
| Padding de tarjeta | 16 px | 14 a 40 px | 16 y 24. |
| Altura de botón | 40 y 48 | 20 a 60 | 32, 40 y 48. |
| Grilla | 4 px | Rota por la base de 18 px | Ver 2.2. |
| Vidrio | Solo landing | Navegación inferior y panel de notificaciones | Fondo opaco en paneles. |
| Excepción superadmin | Pendiente de documentar (ADR-007) | — | Agregarla a las reglas con nombre. |

## 5. Plan de arreglo

**Fase 0. Roturas (cambios chicos, sin rediseño). Aplicada el 2026-11-16.**

Verificada sobre un build nuevo, entrando directo a cada URL. `npm test`: 121 de 121. El lint de los archivos tocados no suma errores (los 8 de `empleados_dashboard.jsx` ya existían).

1. **CSS faltante.** `cuentas_por_cobrar.jsx` y `perfil_dueño_garage.jsx` importan `duenio_garage.css`. Los estilos de precios pasaron a `componentesCompartidos/FormularioPreciosGarage.css`, que importa el propio componente. El esqueleto de `vistasAdmin/agregar_sede.css` y el botón "Actualizar" de `superadmin_reservas.css` tienen su regla local. "Agregar sede" del superadmin reutiliza el formulario y los botones de "Agregar empresa".
2. **Horarios en celular.** `formulario_zona.css`: `flex: 0 0 auto` en la fila en columna. El hueco pasó de 102 a 16 px.
3. **Desborde en garages del superadmin.** `superadmin_gestion_garages.css`: `position: relative` en `.stats-card`. El ícono decorativo no tenía tarjeta de referencia y se salía de la página.
4. **Desborde en consumos a 820 px.** `admin_pagos.css:29`: `position: relative` en `.pagos-table-wrap`.
5. **Modal de reserva.** `modal_editar_reserva.jsx`: "Vehículo" muestra patente, marca y modelo.
6. **Agregar empleado.** El bloque de límite y el error quedan en una columna de 500 px, igual que la tarjeta. `form-error` tiene estilo y `role="alert"`.
7. **Conteos de conflictos.** "Conflictos reportados (3 sin resolver)" y pestaña "Todos (5)", en admin y en superadmin.
8. **Tarjeta de reserva.** Mes abreviado a 11 px; "Dentro" pasa a ser un badge de 12 px junto al título; el estado del historial va a 12 px (11 en celular) sin mayúsculas y sin corte.

Se agregaron a `src/index.css` las variables `--border-strong`, `--error`, `--error-strong` y `--error-bg`, que `DESIGN.md` y el ADR-005 ya declaraban.

Un cambio toca color en superadmin y conviene que lo sepas por ADR-007: el botón "Cancelar" de "Agregar sede" tenía un `backgroundColor: "grey"` en línea; se quitó para que use el mismo estilo que el "Cancelar" de "Agregar empresa".

Quedó sin tocar: "Reservado" ya no se muestra en la tarjeta (era el estado por defecto de toda la lista); el copy de los errores de `agregar_empleado.jsx` (emoji y "Revisa la consola") va con la Fase 4.

**Fase 1. Fundaciones.** Requiere spec en `docs/specs/` y un ADR, porque cambia la arquitectura de estilos.

1. Tokens de espaciado, tipo, radio y sombra en `@theme`; base de 16 px; quitar el centrado de `#root`; títulos de producto.
2. `PageShell`, `PageHeader`, `AppHeader` y `AppNav` (barra lateral desde 1024 px).
3. `Button`, `Field`, `Card`, `Badge` y `DataTable` únicos.
4. Estrategia de CSS por componente.

**Fase 2. Migración por rol**, en este orden: empleado y garagista (los que más se usan y los más chicos), admin, dueño, superadmin.

**Fase 3. Jerarquía.** Inicio del admin con datos, garagista con escaneo en primer plano, tratos con solicitudes primero, listas como tablas.

**Fase 4. Copy y pulido.** Voseo, tildes, nombres consistentes, objetivos táctiles, tamaños mínimos de texto.

### Decisiones tomadas (2026-11-16)

- **Navegación:** barra lateral con todas las secciones del rol desde 1024 px; barra inferior opaca en celular. Entra en la spec de la Fase 1.
- **Landing:** se rehace como sitio inmersivo con 3D y scroll narrativo. Construida según `docs/specs/SPEC-landing-inmersiva.md` y ADR-008.
- **Base tipográfica:** la raíz queda en 18 px (16 px hasta 1024 px). La propuesta de bajarla a 16 px de la sección 2.2 no se aplica. Consecuencia para la Fase 1: los tokens de espaciado y de tipografía se definen en px, no en rem, para que la retícula de 4 px se cumpla con cualquier raíz.
- **`DESIGN.md` contra el código (sección 4):** no hay una regla general. Cada diferencia se le consulta al dueño del producto antes de elegir qué manda.
- **Fuentes:** Archivo y DM Sans pasaron a estar autoalojadas (`src/fuentes.css`), con los mismos rangos de peso que servía Google Fonts. Las pilas de fuentes que no se cargan siguen pendientes para la Fase 1.

## 6. Apéndice: mediciones por vista

Medido a 1440 px sobre el build de producción, antes de aplicar la Fase 0. "Fuera de grilla" es el porcentaje de paddings, márgenes y gaps que no es múltiplo de 4 px.

| Rol | Vista | Borde izq. y ancho del contenido | Título: px, peso, alineación | Tamaños de fuente | Fuera de grilla | Alturas de botón | Margen lateral a 390 px |
|---|---|---|---|---|---|---|---|
| Empleado | `/agregar_vehiculo` | 450 px, 540 px | 35.1, 700, izq. | 5 | 92 % | 3 | 16 px |
| Empleado | `/empleados_dashboard` | 518 px, 404 px | 34, 900, izq. | 16 | 75 % | 8 | 18 px |
| Empleado | `/historial_reserva` | 518 px, 404 px | 34, 900, centro | 11 | 62 % | 3 | 16 px |
| Empleado | `/nueva_reserva` | 500 px, 440 px | 28, 700, izq. | 3 | 29 % | 2 | 16 px |
| Empleado | `/perfil_empleado` | 450 px, 540 px | 35.1, 700, izq. | 4 | 95 % | 2 | 16 px |
| Garagista | `/garagista_dashboard` | 48 px, 1344 px | 42, 900, izq. | 10 | 69 % | 1 | 16 px |
| Admin | `/admin_dashboard` | 58 px, 1324 px | 32, 700, izq. | 3 | 77 % | 1 | 16 px |
| Admin | `/admin_pagos` | 58 px, 1324 px | 30, 700, izq. | 9 | 41 % | 3 | 16 px |
| Admin | `/admin_panel_de_control` | 48 px, 1344 px | 35, 700, izq. | 14 | 48 % | 6 | 0 px |
| Admin | `/admin_reportes_analisis` | 48 px, 1344 px | 29, 700, izq. | 7 | 7 % | 4 | 0 px |
| Admin | `/agregar_admin_sede` | 20 px, 1400 px | sin h1 (h3 de 24), 600, centro | 6 | 52 % | 1 | 20 px |
| Admin | `/agregar_empleado` | 39 px, 1362 px | sin h1 (h3 de 24), 600, centro | 4 | 57 % | 1 | 20 px |
| Admin | `/agregar_garage_propio` | 338 px, 764 px | 50.4, 800, izq. | 15 | 89 % | 3 | 14 px |
| Admin | `/agregar_sede` | 338 px, 764 px | 50.4, 800, izq. | 5 | 39 % | 2 | 14 px |
| Admin | `/control-acceso` | 48 px, 1344 px | 42, 900, izq. | 9 | 69 % | 1 | 16 px |
| Admin | `/gestion_de_empleados` | 58 px, 1324 px | 38, 850, izq. | 9 | 62 % | 4 | 16 px |
| Admin | `/gestion_garages` | 58 px, 1324 px | 30, 700, izq. | 8 | 65 % | 4 | 16 px |
| Admin | `/gestion_sedes` | 58 px, 1303 px | 26, 700, centro | 7 | 57 % | 3 | 16 px |
| Admin | `/perfil_admin` | 220 px, 951 px | 29.25, 800, izq. | 7 | 98 % | 2 | 24 px |
| Dueño | `/duenio-garage/crear-garage` | 320 px, 800 px | 50.4, 800, izq. | 17 | 96 % | 3 | 24 px |
| Dueño | `/duenio-garage/cuentas-por-cobrar` | 0 px, 1417 px | 48.6, 500, centro | 12 | 100 % | 3 | 0 px |
| Dueño | `/duenio-garage/dashboard` | 54 px, 1332 px | 49.5, 800, izq. | 15 | 100 % | 3 | 24 px |
| Dueño | `/duenio-garage/garage/1/editar` | 320 px, 800 px | 46.8, 800, izq. | 16 | 94 % | 3 | 24 px |
| Dueño | `/duenio-garage/perfil` | 0 px, 1402 px | 43.2, 800, izq. | 8 | 99 % | 2 | 0 px |
| Dueño | `/duenio-garage/tratos` | 54 px, 1332 px | 46.8, 800, izq. | 18 | 100 % | 4 | 24 px |
| Superadmin | `/agregar_zona` | 338 px, 764 px | 50.4, 800, izq. | 16 | 84 % | 3 | 14 px |
| Superadmin | `/editar_zona` | 362 px, 716 px | 54, 800, izq. | 18 | 92 % | 6 | 16 px |
| Superadmin | `/solicitud-registro/revision` | 543 px, 354 px | 28, 800, centro | 5 | 43 % | 1 | 45 px |
| Superadmin | `/superadmin_dashboard` | 58 px, 1324 px | 32, 700, izq. | 5 | 58 % | 2 | 16 px |
| Superadmin | `/superadmin/agregar_empresa` | 394 px, 623 px | 24, 700, centro | 5 | 11 % | 2 | 16 px |
| Superadmin | `/superadmin/agregar_sede` | 428 px, 482 px | 24, 700, centro | 3 | 21 % | 2 | 16 px |
| Superadmin | `/superadmin/agregar_usuario` | 320 px, 772 px | 24, 700, centro | 5 | 14 % | 2 | 16 px |
| Superadmin | `/superadmin/cache` | 58 px, 1324 px | 28, 500, centro | 8 | 59 % | 2 | 16 px |
| Superadmin | `/superadmin/conflictos` | 48 px, 1344 px | 35, 700, izq. | 7 | 17 % | 3 | 16 px |
| Superadmin | `/superadmin/email-templates` | 58 px, 1324 px | 28, 500, centro | 8 | 64 % | 5 | 16 px |
| Superadmin | `/superadmin/gestion_empresas` | 58 px, 1324 px | 24, 700, centro | 9 | 43 % | 5 | 16 px |
| Superadmin | `/superadmin/gestion_garages` | 58 px, 1324 px | 48.6, 500, centro | 12 | 99 % | 3 | 16 px |
| Superadmin | `/superadmin/gestion_usuarios` | 58 px, 1324 px | 24, 700, centro | 8 | 45 % | 7 | 16 px |
| Superadmin | `/superadmin/pagos-test` | 138 px, 1142 px | 28, 700, izq. | 9 | 75 % | 5 | 16 px |
| Superadmin | `/superadmin/reservas` | 58 px, 1324 px | 24, 700, centro | 7 | 48 % | 3 | 16 px |

Notas: en `/admin_reportes_analisis` el borde izquierdo se corrigió a mano (la librería de gráficos deja un elemento de medición fuera de pantalla). `/editar_zona` y `/agregar_admin_sede` se abrieron con un clic desde la vista anterior porque dependen del estado de navegación.

### Detector de impeccable

1.748 hallazgos sobre vistas y componentes de paneles: 1.251 colores fuera de la paleta de `DESIGN.md` y 464 radios fuera de escala (ambos informativos), 11 franjas laterales, 10 fuentes no declaradas, 9 easings con rebote y 1 texto con degradado. Las ubicaciones de los últimos cuatro grupos están en las secciones 2.4 y 3.
