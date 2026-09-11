# Informe del rol: Dueño de Garage

**Producto:** SmartLot
**Rol interno:** `dueño_garage` (referenciado como "Administrador del garage" en varias pantallas)
**Fecha del informe:** 11/09/2026
**Fuentes analizadas:** `src/vistasDueñoGarage/` y `src/componentesDueñoGarage/` (más componentes compartidos y servicios consumidos por esas vistas)
**Propósito:** insumo para diseñar una **landing page específica** para este tipo de usuario.

---

## 1. Definición del rol y su lugar en la aplicación

El **Dueño de Garage** es el usuario propietario de uno o más garages que SmartLot conecta con empresas que necesitan cocheras para sus empleados. Su rol es el de **oferente / administrador de activos operativos**: da de alta garages, define precios y disponibilidad, recibe y resuelve solicitudes de empresas, y consulta los consumos generados por las reservas utilizadas en sus propiedades.

Relaciones del rol dentro del sistema:

```
Usuario (dueño_garage)
   └── posee 1..N Garages (activos o en borrador)
          ├── recibe Solicitudes de empresas (nuevas y de modificación de cocheras)
          │      └── al aceptar se crea un Trato vigente con la empresa/sede
          └── genera Consumos (reservas utilizadas) facturables a empresas
```

Puntos que distinguen al rol (confirmados en rutas y UI):

- Tiene un **área propia y separada del flujo admin**: todas sus rutas viven bajo `/duenio-garage/*` (`src/App.jsx:189-204`).
- Es un **rol protegido**: cada ruta usa `ProtectedRoute allowedRoles={["dueño_garage"]}`.
- Su **home** es `/duenio-garage/dashboard` y su **perfil** es `/duenio-garage/perfil` (`src/helpers/roles.js:5-6`).
- Los garages que crea quedan **asociados a su usuario como propietario** (`src/vistasDueñoGarage/crear_garage_dueño.jsx:212`).
- La gestión comercial es **empresa → solicita cocheras → tus garages** (`tratos_empresa_garage.jsx:15`).
- Convive con otros roles del sistema: admin, empleado, garagista y superadmin (este último puede impersonarlo, comportamiento visible en el perfil).

---

## 2. Mapa de navegación y rutas

| Ruta | Vista | Propósito |
|---|---|---|
| `/duenio-garage/dashboard` | `duenio_garage_dashboard.jsx` | Panel principal: métricas y portafolio de garages (Activos / Borrador) |
| `/duenio-garage/crear-garage` | `crear_garage_dueño.jsx` | Alta de un nuevo garage |
| `/duenio-garage/garage/:id/editar` | `editar_garage_dueño.jsx` | Edición de un garage propio |
| `/duenio-garage/tratos` | `tratos_empresa_garage.jsx` | Solicitudes de empresas y tratos vigentes |
| `/duenio-garage/solicitudes` | — | Redirección a `/duenio-garage/tratos` |
| `/duenio-garage/cuentas-por-cobrar` | `cuentas_por_cobrar.jsx` | Consumos generados por reservas en sus garages |
| `/duenio-garage/perfil` | `perfil_dueño_garage.jsx` | Cuenta, datos personales, contraseña y logout |

### Header (`componentesDueñoGarage/header_dueño_garage.jsx`)

- Logo SmartLot que navega al dashboard.
- **Campana de notificaciones** (`CampanaNotificaciones`) con CTA contextual "Ir a tratos" hacia `/duenio-garage/tratos`.
- **UserDropdown** con perfil y cierre de sesión.

### Footer (`componentesDueñoGarage/footer_dueño_garage.jsx`)

Barra de navegación inferior con 5 accesos e indicador animado:

1. **Garages** → dashboard
2. **Crear** → alta de garage
3. **Tratos** → badge numérico de solicitudes pendientes (`useSolicitudesPendientesCount`, tope visual "99+")
4. **Por cobrar** → cuentas por cobrar
5. **Perfil** → perfil

Además: modo compacto según viewport (`useFooterCompacto`) y persistencia del índice activo en `sessionStorage`.

---

## 3. Funcionalidades detalladas por módulo

### 3.1. Panel / Portafolio de garages (`duenio_garage_dashboard.jsx`)

**Métricas del resumen (KPIs):**

- Garages propios (cantidad de activos)
- Ocupación media (promedio del % de ocupación de cada garage)
- Tratos vigentes
- Capacidad total (suma de plazas)
- Garages en borrador

**Portafolio con pestañas:**

- **Activos:** grilla de tarjetas de garage.
- **Borrador:** grilla de garages movidos a borrador (soft delete) con opción de restaurar.
- Estados vacíos con CTA ("Creá tu primer garage…", "No hay garages en borrador…").
- Manejo de error específico de permisos (403: "No tenés permiso para consultar estos garages").
- Carga con skeletons (`SkeletonGarages`, `SkeletonValorMetrica`).

**Cada tarjeta (`tarjeta_garage_dueño.jsx`) muestra:**

- Estado: **Operativo / Cerrado / Borrador**.
- Precios por hora: **Auto, Moto, Pickup**.
- Nombre, ubicación, capacidad (plazas), nivel/piso, horario de apertura y cierre.
- Días operativos de la semana.
- Barra de **ocupación actual (%)** calculada como `(ocupacion_reservas + ocupacion_no_reservas) / capacidad`.

**Acciones del dueño:**

- Ver/editar detalle del garage (navega a la edición).
- **Mover a borrador** (con confirmación Swal; el garage deja de estar visible para empresas y puede restaurarse).
- **Restaurar** un garage desde borrador (con confirmación; vuelve a ser visible para empresas).

### 3.2. Alta de garage (`crear_garage_dueño.jsx`)

Formulario de creación con validación en vivo (`useLiveValidation`) y detección de cambios sin guardar:

- **Identidad y ubicación** (`FormularioZona`):
  - Nombre (mínimo 3 caracteres)
  - Nivel / planta (entero)
  - Ubicación con **Google Maps Places Autocomplete**: al elegir una dirección se capturan **latitud/longitud** y se valida que exista una ubicación válida del mapa.
  - Horario de apertura y cierre en formato `HH:MM` con regla "apertura anterior al cierre".
- **Capacidad** (`FormularioCapacidad`):
  - Cocheras para **reservas** y para **no reservas** (enteros ≥ 0). La capacidad total se calcula como la suma de ambas.
- **Días operativos** (`SelectorDiasOperativos`): exige al menos un día.
- **Precios por hora** (`FormularioPreciosGarage`): Auto, Moto y Pickup, con payload normalizado por `buildGaragePricesPayload`.
- **Comportamiento:**
  - Si hay datos cargados y el usuario intenta salir, se pide confirmación (además de aviso `beforeunload`).
  - Al crear: toast de éxito y redirección al dashboard.
  - Errores de API mostrados en pantalla con el mensaje del backend.
  - El garage nace en estado activo, con ocupaciones en 0 y **asociado al dueño**.

### 3.3. Edición de garage (`editar_garage_dueño.jsx`)

- Carga el garage por ID (`GaragesGetById`), con manejo de error de permisos.
- Campos editables: nombre, ubicación, capacidad total, días operativos y precios (auto/moto/pickup). También estado del garage.
- Las **ocupaciones no son editables** por el dueño: "se administran desde los flujos operativos" (nota visible en la UI).
- Validaciones: capacidad entero ≥ 0 y al menos un día de disponibilidad.
- Control de cambios sin guardar (comparación de campos + `beforeunload` + confirmación al salir).
- Toast de éxito "Garage guardado correctamente".
- Carga con `SkeletonFormularioGarage`.

### 3.4. Tratos con empresas (`tratos_empresa_garage.jsx` + `componentesCompartidos/GestionTratosGarage.jsx`)

Pantalla comercial central del rol. Título: "Tratos con empresas". Subtítulo: revisar propuestas de empresas y administrar acuerdos vigentes.

**Resumen (5 métricas):**

- Solicitudes pendientes
- Cambios pendientes (modificación de cocheras)
- Tratos vigentes
- Cocheras comprometidas (suma de cocheras de todos los tratos)
- Garages administrados

**Solicitudes de empresas (nuevas):**

- Tarjeta por solicitud con: empresa, garage solicitado, sede y su ubicación, cantidad de cocheras, **modalidad de pago** ("paga el empleado" o "cubre la empresa"), descripción.
- Acciones **Aceptar trato** / **Rechazar**, con confirmación explícita. Al aceptar se crea el trato vigente.

**Solicitudes de cambio de cocheras (modificación de tratos):**

- Muestra la transición `cantidad actual → cantidad propuesta`, empresa, garage y sede.
- Acciones **Autorizar cambio** / **Rechazar**.

**Tratos vigentes:**

- Tabla y versión en tarjetas (responsive) con: empresa asociada, sede, garage, fecha de inicio, cantidad de cocheras, modalidad de pago, tarifa auto y tarifa pickup.
- Estados vacíos explicativos ("Todavía no hay tratos vigentes…").
- Aviso si la cuenta **no tiene garages asociados**: sin garages no se pueden recibir ni aceptar solicitudes.
- Botón **Actualizar** para refrescar; tras cada acción se recarga, se notifica al hook de pendientes (`notifySolicitudesChanged`) y se confirma con Swal.

### 3.5. Consumos generados / Cuentas por cobrar (`cuentas_por_cobrar.jsx`)

Módulo de **reporte económico** del dueño. Encabezado: "Consumos generados" — importes generados por las reservas utilizadas en sus garages.

**KPIs:**

- Importe generado (ARS)
- Reservas utilizadas
- Tiempo utilizado (h y min)
- Empresas con consumo

**Filtros:**

- Búsqueda con debounce por **empresa, sede o garage** (350 ms).
- Selector **Garage** ("Todos mis garages" o uno puntual).
- Selector **Período** (últimos 24 meses).
- Botón **Limpiar filtros**.

**Tabla de consumos por empresa** (con versión mobile en tarjetas):

- Empresa, sede, garage, período, reservas utilizadas, tiempo, **importe generado** y columna "Cobro" (aún sin datos).
- Botón **Ver detalle** por fila.

**Detalle de consumo (drawer lateral accesible, cierre con Escape):**

- Importe generado destacado.
- Período, garage, reservas utilizadas y tiempo total.
- Listado de **movimientos**: `Reserva #id · tipo de vehículo`, rango fecha/hora, minutos utilizados, **tarifa por hora aplicada** e importe generado.
- Nota clara: "Estos datos son consumos generados. No confirman cobros, vencimientos ni pagos recibidos. Cobros, estados y conciliación: pendiente de integración."

**Exportación:**

- Modal para elegir formato con la cantidad de resultados filtrados.
- **PDF** (`jspdf` + `autotable`): reporte "SmartLot · Consumos generados" con garage y período.
- **Excel** (`exceljs` + `file-saver`): planilla con datos reales y formato de moneda ARS.

### 3.6. Perfil (`perfil_dueño_garage.jsx`)

- Encabezado con nombre, badge **"Dueño de Garage"** y barra de estado: Rol, **Garages asociados** (contador real), **Estado: Cuenta activa**.
- **Información personal:** nombre, apellido y correo son de solo lectura; el **teléfono es editable** con validación (solo números/`+`/espacios/`()`/`-`, mínimo 7 dígitos). Al guardar se actualiza también la sesión local.
- **Cambiar contraseña:** mínimo 8 caracteres, al menos 2 caracteres especiales, 2 números y 2 mayúsculas. Al cambiarla, se fuerza un **nuevo inicio de sesión** por seguridad.
- **Cerrar sesión** (soporta salir de una impersonación de superadmin y volver al panel de superadmin).
- Confirmaciones por cambios sin guardar + `beforeunload`.
- Animaciones de entrada con **GSAP** (timeline en cascada).
- Loading de sesión ("Cargando sesión segura...").

### 3.7. Notificaciones (`CampanaNotificaciones` + `useNotificaciones`)

- Contador de no leídas (tope "99+"), panel desplegable accesible (Escape / click afuera).
- Acciones: **marcar todas como leídas**, eliminar una notificación, eliminar leídas al abrir, y navegar a tratos desde la notificación.
- Tipos de evento soportados (icono y tono por tipo):
  - `solicitud_enviada` / `solicitud_modificacion` (ámbar, novedad)
  - `solicitud_aceptada` / `modificacion_autorizada` (éxito)
  - `solicitud_rechazada` / `modificacion_rechazada` (error)
  - `trato_cancelado` / `solicitud_cancelada` (error)
  - `trato_modificado` (ámbar)
- Estado vacío: "Cuando haya novedades sobre tus garages, aparecerán acá."
- El badge de **solicitudes pendientes** se comparte entre header/footer/página de tratos mediante un hook con caché y listeners.

### 3.8. UX transversal del rol

- **Skeletons** dedicados: valor de métrica, grilla de garages, formulario de garage y panel de tratos (`skeleton_admin_garage.jsx`).
- **Toasts** de éxito/error consistentes (top-end, autocierre).
- **Confirmaciones** con SweetAlert2 antes de acciones destructivas o irreversibles.
- **Protección de cambios sin guardar** en alta, edición y perfil.
- **Diseño responsive** (tablas → tarjetas en mobile, footer compacto).
- **Accesibilidad**: roles `tablist`/`tab`, `aria-*`, foco al cerrar paneles, cierre con Escape.
- **Caché de datos** con TTL de 5 minutos en tratos y garages, con invalidación al mutar (`API_TratoEmpresaGarage.js`).
- **Idioma**: español rioplatense (voseo: "Creá tu primer garage", "Revisá las propuestas…").

---

## 4. Reglas de negocio y validaciones clave

| Regla | Detalle |
|---|---|
| Propiedad | Todo garage creado queda asociado al usuario dueño; solo ve sus propios garages |
| Visibilidad | Un garage en **borrador** deja de ser visible para empresas; es restaurable |
| Ocupaciones | El dueño **no** las edita; las administran los flujos operativos |
| Tratos | Sin garages asociados no se pueden recibir ni aceptar solicitudes |
| Aceptación | Aceptar una solicitud **crea un trato** empresa–sede–garage |
| Modificaciones | Los cambios de cantidad de cocheras requieren **autorización** del dueño |
| Modalidad de pago | `empleado_paga_todo` (paga el empleado) o cobertura de la empresa |
| Consumos | Los importes son **generados por reservas utilizadas**; no confirman cobros/pagos |
| Horario | Apertura debe ser anterior al cierre, formato `HH:MM` |
| Capacidad | Dos bolsas: reservas y no reservas; enteros ≥ 0 |
| Días | Al menos un día operativo |
| Contraseña | 8+ caracteres, 2 especiales, 2 números, 2 mayúsculas |
| Teléfono | Mínimo 7 dígitos; se guarda solo con dígitos |

---

## 5. Integraciones y servicios consumidos

| Servicio | Uso principal |
|---|---|
| `API_Garage` | `GaragesGetAll`, `GaragesGetById`, `GaragesCreate`, `GaragesUpdate`, `GaragesGetPapelera`, `GaragesMoveToPapelera`, `GaragesRestore` |
| `API_TratoEmpresaGarage` | `TratosGetAll`, `TratosGetByEmpresa`, `TratosGetByGarage`, `TratosCreate/Update/Delete`, `TratosUpdatePaymentModality` |
| `API_SolicitudEmpresaGarage` | `SolicitudesGetRecibidas`, `SolicitudesAceptar`, `SolicitudesRechazar`, `SolicitudesAutorizarModificacion`, `SolicitudesRechazarModificacion` |
| `API_CuentasCorrientes` | `CuentasCorrientesDuenoGet` (`/api/cuentas-corrientes/dueno`), `CuentasCorrientesGaragesGet` |
| `API_Usuario` | `UsuariosGetById`; `PUT /api/usuario/:id` (teléfono) y `PATCH /api/usuario/:id/contraseña` |
| Google Maps Places | Autocomplete de dirección + coordenadas en el alta de garage |
| jspdf / jspdf-autotable | Exportación PDF de consumos |
| exceljs / file-saver | Exportación Excel de consumos |
| GSAP | Animaciones del perfil |

---

## 6. Modelo de datos observable

**Garage:** `id`, `nombre`, `piso` (nivel), `ubicacion`, `latitud`, `longitud`, `hora_apertura`, `hora_cierre`, `estado`, `capacidad`, `capacidad_reservas`, `capacidad_para_no_reservas`, `ocupacion_reservas`, `ocupacion_no_reservas`, `dias`, `precio_auto`, `precio_moto`, `precio_pickup`, `en_papelera`.

**Solicitud:** `id`, `id_empresa`, `empresa_nombre`, `id_sede`, `sede_nombre`, `sede_ubicacion`, `id_garage`, `garage_nombre`, `cantidad_cocheras`, `cantidad_actual_trato` (en modificaciones), `modalidad_pago`, `descripcion`, `estado` (`pendiente`, …), `tipo_solicitud` (`modificacion` o nueva).

**Trato:** `id`, `id_empresa`, `id_sede`, `id_garage`, nombres resueltos, `cantidad_cocheras`, `modalidad_pago`, `precio_auto`, `precio_pickup`, `created_at`.

**Consumo (cuentas por cobrar):** `idEmpresa`, `empresa`, `idSede`, `sede`, `idGarage`, `garage`, `periodo`, `reservasUtilizadas`, `minutosTotales`, `importeGenerado`, `movimientos[]` (`idConsumo`, `idReserva`, `tipoVehiculo`, `fechaInicio`, `fechaFin`, `minutosUtilizados`, `tarifaHoraAplicada`, `importeGenerado`).

---

## 7. Inventario de archivos analizados

**`src/vistasDueñoGarage/`**

- `duenio_garage_dashboard.jsx` + `duenio_garage.css` — panel y portafolio
- `crear_garage_dueño.jsx` — alta de garage
- `editar_garage_dueño.jsx` — edición de garage
- `tratos_empresa_garage.jsx` — página de tratos
- `cuentas_por_cobrar.jsx` + `cuentas_por_cobrar.css` — consumos y exportaciones
- `perfil_dueño_garage.jsx` + `perfil_dueño_garage.css` — perfil y seguridad

**`src/componentesDueñoGarage/`**

- `header_dueño_garage.jsx` + `.css` — cabecera
- `footer_dueño_garage.jsx` + `.css` — navegación inferior
- `tarjeta_garage_dueño.jsx` + `.css` — tarjeta de garage
- `skeleton_admin_garage.jsx` + `.css` — estados de carga

**Soporte compartido consultado:** `GestionTratosGarage.jsx`, `FormularioPreciosGarage.jsx`, `CampanaNotificaciones.jsx`, `useSolicitudesPendientesCount.js`, `useNotificaciones`, `API_TratoEmpresaGarage.js`, `API_CuentasCorrientes.js`, `exportar_deudas_garage.js`, `formulario_zona.jsx`, `App.jsx` (rutas), `roles.js`, `UserDropdown.jsx`.

---

## 8. Insumos para la landing del Dueño de Garage

### 8.1. Público objetivo

Dueños y administradores de estacionamientos/garages (urbanos, con o sin múltiples niveles) que buscan **monetizar plazas ociosas** alquilándolas a empresas para el estacionamiento de sus empleados, sin perder control operativo ni visibilidad económica.

### 8.2. Dolores que resuelve

- Plazas vacías que no generan ingresos.
- Acuerdos con empresas manejados por WhatsApp/papel, sin trazabilidad.
- Falta de visibilidad de la ocupación real y de los ingresos generados.
- Miedo a comprometer capacidad sin poder controlar altas y cambios.
- Cobros y conciliación manuales y poco claros.

### 8.3. Propuesta de valor (borrador de hero)

**Título:** "Convertí tus cocheras vacías en ingresos recurrentes"
**Subtítulo:** "SmartLot conecta tu garage con empresas que necesitan estacionamiento para sus equipos. Vos definís precios, capacidad y horarios; la plataforma gestiona solicitudes, tratos y consumos."
**CTAs sugeridos:** "Registrar mi garage" / "Ver cómo funciona"

### 8.4. Bloques de beneficios (basados en funcionalidades reales)

1. **Publicá tus garages y controlá su estado** — Alta guiada con ubicación en mapa, niveles, horarios, días y capacidades. Activalos, cerralos o movelos a borrador cuando quieras.
2. **Definí tus precios** — Tarifas por hora diferenciadas para auto, moto y pickup.
3. **Recibí solicitudes de empresas y decidí vos** — Aceptá o rechazá cada propuesta; autorizá o rechazá cambios de cantidad de cocheras.
4. **Gestioná acuerdos vigentes** — Todo el detalle del trato: empresa, sede, garage, cocheras comprometidas, modalidad de pago y tarifas.
5. **Mirá la ocupación en tiempo real** — Ocupación media, capacidad total y % por garage.
6. **Controlá lo que generás** — Consumos por empresa, reservas utilizadas, tiempo e importes, con filtros por garage y período y **exportación a PDF/Excel**.
7. **Notificaciones al día** — Avisos de solicitudes, aceptaciones, rechazos, modificaciones y cancelaciones.

### 8.5. Secciones sugeridas para la landing

1. Hero con CTA doble y visual del dashboard/portafolio.
2. "Cómo funciona en 3 pasos": Creá tu garage → Recibí solicitudes de empresas → Gestioná tratos y cobrá por consumo.
3. Grilla de funcionalidades (los 7 bloques anteriores).
4. Sección "Panel de control a medida" con métricas destacadas (ocupación media, tratos vigentes, cocheras comprometidas, importe generado).
5. Sección de reportes/exportaciones (PDF y Excel) como diferenciador de transparencia.
6. Seguridad y confianza: cuenta con contraseña robusta, permisos por rol, datos de solo lectura sensibles.
7. Testimonios/casos (a completar cuando existan).
8. FAQ: ¿Cuánto cuesta? ¿Puedo ocultar un garage? ¿Quién define los precios? ¿Cómo se factura a las empresas? ¿Qué pasa si una empresa pide cambiar la cantidad de cocheras?
9. CTA final + formulario de contacto / registro.

### 8.6. Tono y estilo

- Español rioplatense, cercano y profesional, con voseo ("Controlá", "Definí", "Recibí").
- Enfoque en **control, transparencia e ingresos**, no en tecnicismos.
- Estética coherente con la app: azules/celestes de marca, tarjetas, iconografía Lucide.

### 8.7. Frases reales de la app reutilizables como copy

- "Controla tus garages como activos operativos."
- "Visualiza tus propiedades, disponibilidad y tratos con empresas."
- "Revisá las propuestas que las empresas envían a tus garages y administrá los acuerdos comerciales vigentes."
- "Consultá los importes generados por las reservas utilizadas en tus garages."
- "Creá tu primer garage para que las empresas puedan solicitar acceso operativo."

---

## 9. Observaciones y brechas

- **Cobros/conciliación pendientes:** la pantalla de consumos aclara que los datos son importes generados, no pagos recibidos; la columna "Cobro" aún muestra "—". La landing no debería prometer cobro automatizado todavía.
- **Ocupaciones no editables** por el dueño: se administran desde los flujos operativos (reservas/garagista).
- **Perfil limitado:** nombre, apellido y email no se editan desde esta vista.
- **Sin gestión de empleados/garagistas propia:** no existen vistas en este módulo para administrar personal.
- **Roles duplicados en nomenclatura:** la UI mezcla "Dueño de garage" y "Administrador del garage" según la pantalla; conviene unificar para la landing.
- **Dependencia de Google Maps** para el alta (clave de API en el frontend).
