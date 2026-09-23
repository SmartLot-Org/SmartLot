# SmartLot

SmartLot es una aplicacion front-end para la gestion de estacionamientos. Esta construida con React y Vite, y organiza la experiencia por roles: empleados, garajistas, administradores y superadministradores.

## Tecnologias

- React 19
- Vite 8
- React Router DOM
- Axios
- GSAP y `@gsap/react`
- SweetAlert2
- Recharts
- Lucide React y React Icons
- Tailwind CSS
- ESLint

## Funcionalidades principales

- Landing publica con paginas informativas.
- Autenticacion, registro, cierre de sesion y callback de autenticacion.
- Rutas protegidas por rol.
- Panel para empleados con reservas, historial, perfil y vehiculos.
- Panel para garajistas.
- Panel administrativo con gestion de empleados, garajes, zonas, reportes y perfil.
- Panel de superadministracion con gestion de usuarios, empresas, sedes, garajes y conflictos.
- Cliente HTTP centralizado con manejo de errores, refresh de sesion e invalidacion de cache.

## Requisitos

- Node.js
- npm
- Backend de SmartLot disponible para las rutas `/api`

## Instalacion

```bash
npm install
```

## Variables de entorno

Para produccion, configurar la URL del backend:

```env
VITE_API_URL=https://tu-api.example.com
```

En desarrollo, el cliente usa rutas relativas para permitir el proxy o la configuracion local de Vite.

## Ejecutar en desarrollo

```bash
npm run dev
```

Luego abrir:

```text
http://localhost:5173
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

- `dev`: inicia el servidor de desarrollo.
- `build`: genera la version de produccion.
- `preview`: sirve localmente la build generada.
- `lint`: ejecuta ESLint sobre el proyecto.

## Estructura del proyecto

```text
SmartLot/
+-- public/                 # Archivos estaticos
+-- src/
|   +-- api/                 # Cliente HTTP y navegacion programatica
|   +-- assets/              # Recursos visuales
|   +-- cache/               # Utilidades de cache
|   +-- componentesAdmin/    # Componentes del panel administrador
|   +-- componentesCompartidos/
|   +-- componentesEmpleado/
|   +-- componentesLanding/
|   +-- componentesSuperadmin/
|   +-- components/          # Componentes generales
|   +-- contexts/            # Contextos de React
|   +-- helpers/             # Funciones auxiliares
|   +-- hooks/               # Hooks reutilizables
|   +-- Imagenes/            # Imagenes del proyecto
|   +-- pages/               # Paginas auxiliares
|   +-- servicies/           # Servicios de datos
|   +-- util/                # Utilidades generales
|   +-- validators/          # Validaciones
|   +-- vistasAdmin/         # Vistas del administrador
|   +-- vistasEmpleados/     # Vistas del empleado
|   +-- vistasGaragista/     # Vistas del garajista
|   +-- vistasLanding/       # Vistas publicas
|   +-- vistasSuperadmin/    # Vistas del superadministrador
|   +-- App.jsx              # Definicion de rutas
|   +-- main.jsx             # Punto de entrada de React
+-- package.json
+-- vite.config.js
```

## Build de produccion

```bash
npm run build
```

La salida se genera en `dist/`.


## Licencia

Proyecto privado. Definir una licencia antes de distribuirlo publicamente.
