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

## Trabajo Práctico: React Hook Form

Se eligió el flujo completo de registro de `/register`: tanto el formulario de empresa como el de dueño de garage. Se modificaron `RegisterEmpresaForm`, `RegisterGarageForm`, el campo reutilizable `RegisterField` y las pruebas fuente de la pantalla.

React Hook Form administra los valores, campos tocados, errores y estado de envío dentro de cada formulario mediante `useForm`. `RegisterEmpresaForm` y `RegisterGarageForm` generan el payload final y se lo entregan a `apiClient`, que lo envía al endpoint correspondiente. `RegisterField` recibe por props el registro del campo (`name`, `ref`, `onChange` y `onBlur`), su error y su estado visual; no crea una copia innecesaria del valor mediante `useState`. El único estado local que conserva es la visibilidad de las contraseñas.

Las validaciones frontend comprueban:

- nombre y apellido obligatorios, con un mínimo de 2 caracteres y compuestos sólo por letras;
- email obligatorio y con formato válido;
- teléfono opcional y, si se completa, de 7 a 15 dígitos;
- contraseña obligatoria, de al menos 8 caracteres, con al menos 2 caracteres especiales, 2 números y 2 mayúsculas;
- confirmación obligatoria y coincidente con la contraseña;
- para empresa, nombre obligatorio de al menos 2 caracteres y descripción opcional de hasta 1000 caracteres.

Antes del envío se recortan los textos, el email se normaliza a minúsculas, el teléfono vacío se convierte en `null` y la confirmación no se incluye en el payload. Los conflictos de email o usuario existente, el rate limit y las restricciones de la base de datos siguen dependiendo del backend y se muestran como errores generales.

Después de una respuesta exitosa se ejecuta `reset()`. En empresa, el formulario queda limpio antes de mostrar la confirmación; en garage, queda limpio antes de iniciar la sesión o redirigir. Al alternar entre empresa y garage, React desmonta el formulario anterior y monta una instancia nueva con valores, campos tocados y errores vacíos.

## Licencia

Proyecto privado. Definir una licencia antes de distribuirlo publicamente.
