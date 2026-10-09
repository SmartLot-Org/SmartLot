# SmartLot

Frontend SPA de gestión de estacionamientos: las empresas reservan lugares para su personal, los garages publican su oferta y el control de acceso se opera con QR. Construido con React y Vite; la experiencia se organiza por roles.

## Roles

| Rol | Área principal | Rutas |
|---|---|---|
| Empleado | Reservas, historial, vehículos y perfil | `/empleados_dashboard`, `/nueva_reserva`, `/historial_reserva`, `/agregar_vehiculo`, `/perfil_empleado` |
| Garagista | Control de acceso por QR y movimientos | `/garagista_dashboard`, `/control-acceso` |
| Admin de empresa/sede | Empleados, garages, zonas, sedes, pagos y reportes | `/admin_dashboard`, `/gestion_de_empleados`, `/gestion_garages`, `/admin_pagos`, ... |
| Dueño de garage | Publicación de garages, tratos y cuentas por cobrar | `/duenio-garage/dashboard`, `/duenio-garage/tratos`, ... |
| Superadmin | Usuarios, empresas, sedes, garages, conflictos y caché | `/superadmin_dashboard`, `/superadmin/gestion_usuarios`, ... |

El mapa completo de rutas y la autorización de cada una están en `docs/architecture.md`.

## Tecnologías

- React 19 + Vite 8, react-router-dom 7 (rutas con `lazy()`)
- Tailwind CSS v4 (tokens `@theme` en `src/index.css`)
- Axios con cliente central e interceptor de sesión (`src/api/client.js`)
- Caché en memoria con invalidación por prefijos (`src/cache/cacheStore.js`)
- Mercado Pago SDK, Google Maps, QR (`html5-qrcode`), SweetAlert2, GSAP, Recharts, ExcelJS y jsPDF
- Pruebas con `node:test` (sin framework externo)

## Requisitos

- Node.js `^20.19.0 || >=22.12.0` (requisito de Vite 8)
- npm
- Backend SmartLot disponible para las rutas `/api` (repo separado `SmartLot_API`)

## Instalación y desarrollo

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev
```

Abrir `http://localhost:5173`. En desarrollo, Vite hace proxy de `/api` hacia `http://localhost:3000` (`vite.config.js`).

## Variables de entorno

Todas usan el prefijo `VITE_` de Vite. Valores de referencia en `.env.example`; nunca commitear `.env`.

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL del backend en producción. Debe ser HTTPS (`src/api/client.js` lo verifica). En desarrollo se usa el proxy y no hace falta. |
| `VITE_MP_PUBLIC_KEY` | Clave pública de Mercado Pago (pantallas de pago y pagos-test). |
| `VITE_FRONTEND_URL` | URL pública del frontend para armar enlaces en plantillas de email (`superadmin_email_templates.jsx`). |
| `VITE_GOOGLE_MAPS_FRONTEND_KEY` | API key de Google Maps para mapas de garages (`GoogleMapsProvider.jsx`). |

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con proxy `/api`. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve localmente la build generada. |
| `npm run lint` | ESLint sobre el proyecto (arrastra errores preexistentes; ver `docs/development.md`). |
| `npm test` | Pruebas con `node:test` (`src/**/*.test.js`). |

## Estructura del proyecto

```text
SmartLot/
+-- public/                  # Archivos estáticos
+-- src/
|   +-- api/                 # Cliente HTTP, navegación programática y logout
|   +-- assets/              # Recursos visuales
|   +-- cache/               # Caché en memoria (TTL + invalidación por prefijos)
|   +-- components/          # Componentes generales (ProtectedRoute, ErrorBoundary, ...)
|   +-- componentesAdmin/    # Componentes del panel administrador
|   +-- componentesCompartidos/  # Campana, auditoría, estados vacíos, modales
|   +-- componentesDueñoGarage/  # Componentes del dueño de garage (ñ exacta en el path)
|   +-- componentesEmpleado/     # Componentes del empleado
|   +-- componentesLanding/      # Componentes de landing
|   +-- componentesShared/       # ToastUndo y compartidos menores
|   +-- componentesSuperadmin/   # Componentes del superadmin
|   +-- contexts/            # AuthProvider y GoogleMapsProvider
|   +-- helpers/             # Roles, fechas, patentes, precios, QR, errores (con tests)
|   +-- hooks/               # Hooks reutilizables
|   +-- Imagenes/            # Imágenes del proyecto
|   +-- pages/               # Páginas auxiliares (register, logout, payment status)
|   +-- servicies/           # Servicios de API_*.js (sic: typo histórico)
|   +-- util/                # Exportadores de Excel/PDF
|   +-- vistasAdmin/         # Vistas del administrador
|   +-- vistasDueñoGarage/   # Vistas del dueño de garage (ñ exacta en el path)
|   +-- vistasEmpleados/     # Vistas del empleado
|   +-- vistasGaragista/     # Vistas del garajista
|   +-- vistasLanding/       # Vistas públicas
|   +-- vistasSuperadmin/    # Vistas del superadmin
|   +-- App.jsx              # Definición de rutas
|   +-- index.css            # Tokens de Tailwind v4 (@theme)
|   +-- main.jsx             # Punto de entrada de React
+-- AGENTS.md                # Reglas para agentes de IA
+-- DESIGN.md                # Sistema de diseño "Azul Señal"
+-- docs/                    # Documentación (ver docs/index.md)
+-- package.json
+-- vercel.json              # Rewrites SPA y headers de caché
+-- vite.config.js           # Proxy /api en desarrollo
```

## Documentación

| Documento | Contenido |
|---|---|
| `docs/index.md` | Índice y guía de mantenimiento de la documentación. |
| `PRODUCT.md` | Qué es SmartLot, audiencias, reglas de negocio, glosario y tono. |
| `docs/architecture.md` | Capas, autenticación, roles, mapa completo de rutas y caché. |
| `docs/domain-flows.md` | Flujos de reserva, pagos, control de acceso y paneles. |
| `docs/development.md` | Entorno, pruebas, calidad y despliegue. |
| `docs/decisions/` | ADRs: decisiones arquitectónicas y su porqué. |
| `docs/specs/` | Especificaciones previas a features (flujo spec-driven). |
| `DESIGN.md` | Sistema de diseño: color, tipografía, componentes. |
| `AGENTS.md` | Reglas y límites para agentes de IA. |

## Build y despliegue

```bash
npm run build
```

La salida se genera en `dist/`. El despliegue previsto es estático en Vercel: `vercel.json` reescribe todas las rutas a `index.html` (necesario para el router del lado del cliente) y define headers de caché para assets y GIFs de marca. En producción, configurar `VITE_API_URL` con HTTPS.

## Licencia

Proyecto privado. Definir una licencia antes de distribuirlo públicamente.
