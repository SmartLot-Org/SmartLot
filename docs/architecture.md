# Arquitectura — SmartLot Frontend

Este documento describe cómo está armada la SPA: capas, autenticación, autorización por roles, mapa de rutas, cliente API, caché, estilos y despliegue. Fuente primaria: el código en `src/`. Última revisión: 2026-10-09.

## Visión general

- **SPA estática** con React 19 y Vite 8, desplegada en Vercel. No hay SSR.
- **Un solo backend**: la API REST de `SmartLot_API`, consumida bajo `/api`. En desarrollo, Vite hace proxy a `http://localhost:3000`; en producción se usa `VITE_API_URL` (HTTPS obligatorio).
- **Autorización por roles en el cliente**: las rutas se protegen con `ProtectedRoute`; el backend sigue siendo la autoridad real de cada endpoint.
- **Estado de servidor con caché en memoria**: sin Redux ni librerías de data-fetching; patrón propio de servicios `API_*.js` + `cacheStore`.

## Capas y arranque

```
main.jsx
└── StrictMode
    └── AuthProvider                     (sesión: /api/usuario/me)
        └── App
            ├── BrowserRouter
            ├── ScrollToTop
            ├── ErrorBoundary            (errores de render)
            └── GoogleMapsProvider       (carga diferida del SDK de Maps)
                └── AppRoutes
                    └── Suspense > Routes > ProtectedRoute > Vista
```

- `src/main.jsx`: monta React y envuelve la app en `AuthProvider`.
- `src/App.jsx`: define el router, registra todas las vistas con `lazy()` (excepto `Landing`, eager para el primer paint), conecta `setNavigate` para la navegación desde el cliente HTTP y aplica el catch-all.
- `src/components/ErrorBoundary.jsx`: límite de errores de render a nivel app.
- `src/contexts/GoogleMapsProvider.jsx`: único call-site de `useJsApiLoader`; el script se carga recién cuando un consumidor llama `requestMapsLoad()`, con `language: 'es'`, `region: 'AR'` y librería `places`. Clave: `VITE_GOOGLE_MAPS_FRONTEND_KEY`.

## Autenticación y sesión

La sesión vive en una **cookie gestionada por el backend** (`withCredentials: true`); el frontend no almacena tokens en `localStorage`. Piezas:

| Pieza | Archivo | Rol |
|---|---|---|
| Bootstrap de sesión | `src/contexts/AuthProvider.jsx` | `GET /api/usuario/me` con timeout de 10 s y `AbortController`; setea `usuario` o lo deja en `null`. |
| Cliente HTTP | `src/api/client.js` | Interceptor de 401: `POST /api/usuario/refresh` una sola vez; las requests concurrentes esperan en cola (`failedQueue`) y se reintentan. |
| Expiración definitiva | `src/api/client.js` | Si el refresh falla: `clearCache()`, evento `smartlot:session-expired` y navegación a `/login`. `AuthProvider` escucha el evento y limpia el estado. |
| Logout | `src/api/token.js` | `POST /api/usuario/logout`; el interceptor limpia la caché en login/logout/impersonate. |
| Impersonación | `src/helpers/superadminSession.js` | Guarda el usuario impersonado y un backup del superadmin en cookies propias de primer origen (max-age 1 día) para que la UI sobreviva recargas. |
| Redirección | `src/components/ProtectedRoute.jsx` | Sin usuario → `/login?redirect=<ruta actual>`. |

Flags por request entendidos por el interceptor:

- `_skipAuthRedirect`: no redirige a login ante 401 (usado por el arranque de sesión).
- `_skipToast`: silencia el toast de error, pero **no** impide el refresh ni el reintento.

## Autorización por roles

Fuente única: `src/helpers/roles.js`.

| Concepto | Detalle |
|---|---|
| Nombres canónicos | `admin`, `empleado`, `garagista`, `superadmin`, `dueño_garage` (`ROLE_NAMES`). |
| Alias | `smartlot` se normaliza a `superadmin`. |
| Compatibilidad numérica | `HISTORICAL_ROLE_IDS`: admin 1, empleado 2, garagista 3, superadmin 4, dueño_garage 5. `userHasRole` acepta número o nombre. |
| Admin de empresa vs sede | `isEmpresaAdmin(usuario)`: admin **sin** `id_sede`; `isSedeAdmin(usuario)`: admin **con** `id_sede`. |
| Rutas home/perfil | `ROLE_HOME_ROUTES` y `ROLE_PROFILE_ROUTES` centralizan los destinos post-login. |

`ProtectedRoute` combina `userHasRole(...allowedRoles)` con `requireEmpresaAdmin` cuando aplica. Si el usuario está autenticado pero no autorizado, muestra un toast de advertencia una vez y navega a su home.

> **Gotcha:** conviven roles numéricos (`allowedRoles={[1]}`) y por nombre (`allowedRoles={["dueño_garage"]}`). Para código nuevo, preferir `ROLE_NAMES` de `roles.js`.

## Mapa de rutas

Fuente: `src/App.jsx`. Al agregar rutas, actualizar esta tabla en el mismo cambio.

### Públicas

| Ruta | Vista | Notas |
|---|---|---|
| `/` | `vistasLanding/Landing.jsx` | Única vista eager (primer paint). |
| `/para-garages` | `vistasLanding/ParaGarages.jsx` | Lazy. |
| `/login` | `vistasLanding/Auth.jsx` | Acepta `?redirect=`. |
| `/register` | `pages/Register.jsx` | Alta pública. |
| `/logout` | `pages/Logout.jsx` | Cierra sesión. |
| `/unauthorized` | `pages/Unauthorized.jsx` | Página de no autorizado. |
| `/auth/callback` | `vistasLanding/AuthCallback.jsx` | Callback de autenticación. |
| `/recuperar-clave` | `pages/ForgotPassword.jsx` | Recupero de contraseña. |
| `/payment/success`, `/payment/failure`, `/payment/pending` | `pages/PaymentStatus.jsx` | Retorno de Mercado Pago; verificación interna por `payment_id` / `external_reference`. |

### Empleado (`allowedRoles={[2]}`)

| Ruta | Vista |
|---|---|
| `/empleados_dashboard` | `vistasEmpleados/empleados_dashboard.jsx` |
| `/nueva_reserva` | `vistasEmpleados/nueva_reserva.jsx` |
| `/historial_reserva` | `vistasEmpleados/historial_reserva.jsx` |
| `/perfil_empleado` | `vistasEmpleados/perfil_empleado.jsx` |
| `/agregar_vehiculo` | `vistasEmpleados/agregar_vehiculo.jsx` |

### Garagista

| Ruta | Vista | Roles |
|---|---|---|
| `/garagista_dashboard` | `vistasGaragista/garagista_dashboard.jsx` | `[3]` |
| `/control-acceso` | `vistasGaragista/garagista_dashboard.jsx` | `[1, 3]` (admin también opera acceso) |

### Admin

| Ruta | Vista | Protección |
|---|---|---|
| `/admin_dashboard` | `vistasAdmin/admin_dashboard.jsx` | `[1]` |
| `/perfil_admin` | `vistasAdmin/perfil_admin.jsx` | `[1]` |
| `/gestion_de_empleados` | `vistasAdmin/gestion_de_empleados.jsx` | `[1]` |
| `/agregar_empleado` | `vistasAdmin/agregar_empleado.jsx` | `[1]` |
| `/agregar_garajista` | Redirect → `/gestion_de_empleados` | `[1]` |
| `/gestion_garages` | `vistasAdmin/gestion_garages.jsx` | `[1]` |
| `/agregar_garage_propio` | `vistasAdmin/agregar_garage_propio.jsx` | `[1]` |
| `/agregar_zona` | `vistasAdmin/agregar_zona.jsx` | `[4]` (según `App.jsx`) |
| `/editar_zona` | `vistasAdmin/editar_zona.jsx` | `[4]` (según `App.jsx`) |
| `/admin_panel_de_control` | `vistasAdmin/admin_panel_de_control.jsx` | `[1]` |
| `/admin_reportes_analisis` | `vistasAdmin/admin_reportes_analisis.jsx` | `[1]` |
| `/admin_pagos` | `vistasAdmin/admin_pagos.jsx` | `[1]` |
| `/gestion_sedes` | `vistasAdmin/gestion_sedes.jsx` | `[1]` + `requireEmpresaAdmin` |
| `/agregar_sede` | `vistasAdmin/agregar_sede.jsx` | `[1]` + `requireEmpresaAdmin` |
| `/agregar_admin_sede` | `vistasAdmin/agregar_admin_sede.jsx` | `[1]` + `requireEmpresaAdmin` |
| `/admin/tratos-garages` | Redirect → `/gestion_garages` | `["admin"]` |

### Dueño de garage (`allowedRoles={["dueño_garage"]}`)

| Ruta | Vista |
|---|---|
| `/duenio-garage/dashboard` | `vistasDueñoGarage/duenio_garage_dashboard.jsx` |
| `/duenio-garage/crear-garage` | `vistasDueñoGarage/crear_garage_dueño.jsx` |
| `/duenio-garage/tratos` | `vistasDueñoGarage/tratos_empresa_garage.jsx` |
| `/duenio-garage/garage/:id/editar` | `vistasDueñoGarage/editar_garage_dueño.jsx` |
| `/duenio-garage/cuentas-por-cobrar` | `vistasDueñoGarage/cuentas_por_cobrar.jsx` |
| `/duenio-garage/perfil` | `vistasDueñoGarage/perfil_dueño_garage.jsx` |
| `/duenio-garage/solicitudes` | Redirect → `/duenio-garage/tratos` |

### Superadmin (`allowedRoles={[4]}`)

| Ruta | Vista |
|---|---|
| `/superadmin_dashboard` | `vistasSuperadmin/superadmin_dashboard.jsx` |
| `/superadmin/gestion_usuarios` | `vistasSuperadmin/gestion_usuarios.jsx` |
| `/superadmin/agregar_usuario` | `vistasSuperadmin/agregar_usuario.jsx` |
| `/superadmin/gestion_empresas` | `vistasSuperadmin/gestion_empresas.jsx` |
| `/superadmin/gestion_sedes` | `vistasSuperadmin/gestion_empresas.jsx` (mismo componente) |
| `/superadmin/agregar_empresa` | `vistasSuperadmin/agregar_empresa.jsx` |
| `/superadmin/agregar_sede` | `vistasSuperadmin/agregar_sede.jsx` |
| `/superadmin/gestion_garages` | `vistasSuperadmin/superadmin_gestion_garages.jsx` |
| `/superadmin/conflictos` | `vistasSuperadmin/superadmin_conflictos.jsx` |
| `/superadmin/reservas` | `vistasSuperadmin/superadmin_reservas.jsx` |
| `/superadmin/cache` | `vistasSuperadmin/superadmin_cache.jsx` |
| `/superadmin/pagos-test` | `vistasSuperadmin/superadmin_pagos_test.jsx` |
| `/superadmin/email-templates` | `vistasSuperadmin/superadmin_email_templates.jsx` |
| `/solicitud-registro/revision` | `vistasSuperadmin/ConfirmarSolicitud.jsx` |

### Catch-all

`*` → fallback de carga o redirección: si no hay usuario a `/login`; si hay, a `/`. Las rutas con redirect se mantienen por compatibilidad con enlaces viejos.

## Cliente HTTP y servicios

### Cliente central — `src/api/client.js`

- `baseURL`: en DEV vacío (rutas relativas + proxy); en PROD `VITE_API_URL` o `http://localhost:3000`. Si en PROD la URL no empieza con `https://`, se loguea un error de consola.
- `withCredentials: true`, `timeout: 15000`, `Content-Type: application/json`.
- Interceptor de respuesta:
  - Login/logout/impersonate → `clearCache()` (sesión nueva, datos nuevos).
  - Mutaciones (`post`/`put`/`patch`/`delete`) → invalidación por prefijo según recurso (ver `invalidateCacheForMutation`). El refresh queda excluido.
- Interceptor de error:
  - 401 → refresh con cola (ver Autenticación).
  - Toasts solo para mutaciones (los GET muestran su error en pantalla); dedupe de 5 s; SweetAlert2 se importa dinámicamente.
  - Manejo especial de errores TLS (certificado self-signed) y de red; 403/429 como warning; 413 y 5xx con mensajes genéricos.
- Navegación programática: `setNavigate` (registrado por `AppRoutes`) + `navigateTo` con fallback a `window.location` (`src/api/navigation.js`).

### Servicios — `src/servicies/API_*.js`

Un módulo por recurso (`API_Reserva`, `API_Usuario`, `API_Garage`, ...). Convenciones observadas:

- Usan exclusivamente `apiClient` (nunca `fetch` ni `axios` suelto).
- Devuelven objetos estructurados (`{ respuesta, datos }` u homólogos) en lugar de lanzar crudo.
- Leen con `getFromCache(clave, fetcher, { ttlMs, force })` y usan claves con prefijo de recurso (`reservas:`, `usuarios:`, `garages:`, `tratos:`, ...). Ejemplo: `API_Reserva` usa TTL de 15 s para `reservas:all`.
- `logApiError` solo imprime en DEV.
- Las respuestas del backend varían (`data`, `datos`, `mensaje`, `message`); los servicios normalizan (ver `normalizarPayloadQr` en `API_Reserva.js`).

## Caché — `src/cache/cacheStore.js`

- Basada en `Map` en memoria; se pierde al recargar la página.
- `getFromCache`: respeta TTL (`ttlMs`) y **deduplica requests en vuelo** por clave (`pendingRequests`); `force: true` evita leer y escribir caché.
- `invalidateByPrefix`: borra entradas y pendientes que empiezan con el prefijo. Es el mecanismo principal de frescura tras mutaciones.
- `clearCache`: todo (login/logout/refresh fallido).
- `getCacheStats` / `getCacheEntries`: alimentan la pantalla `/superadmin/cache`.
- Regla práctica: **toda mutación relevante debe invalidar los prefijos que afecta**, y esa lógica vive centralizada en `client.js`.

## Estado global, hooks y utilidades

- **Contextos**: `AuthContext` (`usuario`, `loading`, `setUsuario`, `roleTransition`, `setRoleTransition`) y `GoogleMapsContext` (carga diferida del SDK). No hay Redux/Zustand.
- **Hooks** (`src/hooks/`): `useNotificaciones` (campana), `useSolicitudesPendientesCount` (contadores por rol), `useLiveValidation` (validación en vivo de formularios), `usePageMeta` (title/meta por vista), `useFooterCompacto`.
- **Helpers** (`src/helpers/`): roles, fechas de reserva (`reservaDateTime`), patentes (`patente`), precios (`prices`), QR (`qrReserva`), control de acceso (`controlAcceso`), tratos, usuarios, días (`diasSemana`), política de reservas (`reservationPolicy`), mensajes de error (`erroresMensajes`), sesión de superadmin, `toast`, `zIndex`.
- **Exportadores** (`src/util/`): Excel (`exportar_reportes_excel`, `exportar_cuentas_corrientes`, `exportar_deudas_garage`) y PDF (`exportar_reporte_pdf`) con ExcelJS/jsPDF.

## Estilos y sistema de diseño

- `DESIGN.md` (raíz) es la especificación: dirección "Azul Señal", tipografías Archivo (display/landing) y DM Sans (producto), radios, sombras, alturas de botón, badges.
- Los tokens viven en `@theme` de `src/index.css` y generan utilidades `brand-*` (`bg-brand-blue`, `text-brand-muted`, ...). Evitar hex/rgb hardcodeados.
- Las fuentes se cargan en `index.html` (Google Fonts) con `lang="es-AR"`.
- `prefers-reduced-motion` está contemplado al menos para el smooth scroll de landing.

## Errores y feedback

- `ErrorBoundary` captura errores de render y muestra recuperación.
- `src/helpers/erroresMensajes.js` traduce errores del backend (y códigos como `RESERVATION_LIMIT_REACHED` vía `reservationPolicy`) a mensajes en español orientados a la acción.
- Toasts de SweetAlert2 con patrón "toast" para errores de mutación; `helpers/toast.js` para avisos de UI.
- `src/components/FieldValidation.jsx` centraliza validación visual de campos; `useLiveValidation` la conecta a formularios.

## Rendimiento

- **Code splitting por ruta**: todas las vistas usan `lazy()`; `Landing` es la excepción intencional (evitar round-trip antes del primer paint). El fallback es `RouteFallback` (spinner).
- **Dependencias diferidas**: SweetAlert2 se importa dinámicamente en el interceptor (comentario en `client.js`: ~50 kB gzip fuera del arranque). Google Maps se carga solo cuando una vista lo pide.
- El build de Vite emite una advertencia por chunks >500 kB (deuda conocida, ver `docs/reservation-limit.md`).

## Despliegue

- Build estático (`npm run build` → `dist/`) servido en Vercel.
- `vercel.json`: rewrite de todas las rutas a `index.html` (SPA), cache inmutable para `/assets/*` y caché larga con `stale-while-revalidate` para `/GIF_IMGS_LOGO/*`.
- En producción `VITE_API_URL` debe ser HTTPS; el cliente lo advierte en consola si no lo es.

## Frontera con el backend

- Este repo **no contiene** el backend. Los contratos (endpoints, payloads, códigos de error) se infieren de `src/servicies/API_*.js`; no asumir endpoints nuevos sin verificarlos contra la API real o el repo `SmartLot_API`.
- Comportamientos de negocio ya auditados (límite de reservas, retenciones, concurrencia) están documentados en `docs/reservation-limit.md`.
