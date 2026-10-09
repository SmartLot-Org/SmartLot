# Desarrollo — SmartLot Frontend

Guía operativa: requisitos, entorno, comandos, pruebas, calidad y despliegue. Última revisión: 2026-10-09.

## Requisitos

- Node.js `^20.19.0 || >=22.12.0` (requisito declarado por Vite 8). Referencia de trabajo actual: Node 24.
- npm.
- Backend `SmartLot_API` corriendo en `http://localhost:3000` para desarrollo con datos reales (el proxy de Vite apunta ahí).

## Puesta en marcha

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev
```

- Vite sirve la app en `http://localhost:5173`.
- El proxy de `vite.config.js` redirige `/api` → `http://localhost:3000`, por lo que en desarrollo no se necesita `VITE_API_URL`.
- Si el backend no está levantado, la app carga pero las pantallas que dependen de `/api` muestran errores de conexión controlados.

## Variables de entorno

Definidas en `.env` (ignorado por git); plantilla en `.env.example`. Todas requieren el prefijo `VITE_`.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_API_URL` | Solo producción | URL HTTPS del backend. En DEV se usa el proxy. |
| `VITE_MP_PUBLIC_KEY` | Para pagos | Clave pública de Mercado Pago (pantallas de pago y pagos-test). |
| `VITE_FRONTEND_URL` | Para emails | URL pública del frontend usada al armar plantillas de email. |
| `VITE_GOOGLE_MAPS_FRONTEND_KEY` | Para mapas | API key de Google Maps (restringir por dominio). |

Regla dura: **nunca commitear `.env` ni valores reales**. `.env.example` solo lleva placeholders.

## Comandos

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `npm run dev` | Servidor de desarrollo con HMR y proxy `/api`. | Trabajo diario. |
| `npm test` | `node --test src/**/*.test.js`. | Antes de cerrar cualquier tarea. |
| `npm run lint` | ESLint sobre el repo (config flat en `eslint.config.js`). | Con criterio: arrastra deuda preexistente. |
| `npm run build` | Build de producción en `dist/`. | Cambios grandes o antes de desplegar. |
| `npm run preview` | Sirve la build generada localmente. | Verificación post-build. |

### Lint dirigido

`npm run lint` reporta cientos de errores preexistentes (detalle y listado en `docs/reservation-limit.md`). Para no ahogarse en ruido, validar solo lo tocado:

```bash
npx eslint src/ruta/al/archivo.jsx src/otro/archivo.js
```

Un archivo nuevo o modificado debe quedar sin errores propios.

## Pruebas

- Framework: `node:test` nativo (sin Jest/Vitest) + `node:assert`. No hay entorno DOM: no se testean componentes renderizados.
- Ubicación: junto a la fuente (`src/**`), con dos variantes:
  - `*.test.js`: lógica pura (helpers como `roles`, `patente`, `prices`, `reservaDateTime`, `controlAcceso`, `reservationPolicy`).
  - `*.source.test.js`: pruebas de contrato de fuente; leen el archivo y verifican convenciones/estructura (por ejemplo `ConfirmarSolicitud.source.test.js`, `landing.source.test.js`, `register.source.test.js`).
- Correr un solo archivo:

```bash
node --test src/helpers/roles.test.js
```

- Al agregar lógica a un helper, agregar o extender su test. Para cambios de estructura de vistas, considerar un `.source.test.js` siguiendo el patrón existente.

## Calidad y deuda conocida

- **Lint global**: errores/advertencias preexistentes en varios archivos de vistas y en scripts de skills. No es bloqueante para una tarea si lo tocado queda limpio.
- **Bundle**: Vite advierte chunks >500 kB. No es un fallo; el code splitting por ruta ya existe (ver `docs/architecture.md`).
- **Sin CI configurado**: no hay workflows en `.github/`; la verificación es local.
- **Backend externo**: no modificar contratos desde este repo; los endpoints se consumen según `src/servicies/API_*.js`.

## Convenciones de código

Resumen operativo; el detalle está en `AGENTS.md`.

- Código y copy en español; informes técnicos pueden ir en inglés.
- Componentes `PascalCase.jsx`; hooks `use*.js`; servicios `API_*.js` en `src/servicies/` (sic).
- Carpetas de vistas por rol con nombres en español, incluida la ñ (`vistasDueñoGarage/`).
- Estilos con Tailwind v4 y tokens `brand-*` de `src/index.css`; la especificación es `DESIGN.md`.
- Rutas nuevas: `lazy()` + `ProtectedRoute` en `src/App.jsx`, y actualizar la tabla de `docs/architecture.md`.
- Comentarios solo para explicar el porqué, en español (patrón de `src/api/client.js`).

## Flujo de trabajo

1. **Feature nueva o ambigua**: escribir spec en `docs/specs/` con `docs/specs/TEMPLATE.md` y esperar aprobación antes de planificar o codificar.
2. **Decisión arquitectónica o costosa de revertir**: crear ADR en `docs/decisions/` (convención `ADR-XXX-titulo.md`); no borrar ADRs, se reemplazan.
3. **Implementación**: tareas pequeñas y verificables; cerrar con `npm test`, lint dirigido y `npm run build` si el cambio es grande.
4. **Documentación**: si cambia una decisión, un comando, una ruta o un flujo, actualizar el documento correspondiente según `docs/index.md`.
5. **Commits**: solo cuando el usuario lo pide explícitamente.

## Despliegue

```bash
npm run build
```

- Salida estática en `dist/`, pensada para Vercel (`vercel.json` reescribe todas las rutas a `index.html` y define cachés de assets).
- Configurar `VITE_API_URL` (HTTPS) en el entorno de producción. El cliente HTTP avisa por consola si la URL no es HTTPS.
- Los headers de caché de `vercel.json` aplican a `/assets/*` (inmutable) y `/GIF_IMGS_LOGO/*` (larga + revalidate).
