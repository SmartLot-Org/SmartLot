# SmartLot — Reglas para agentes

Frontend SPA de gestión de estacionamientos: empresas, garages, reservas, pagos y control de acceso por QR. Este repositorio es **solo frontend** y consume la API REST del backend SmartLot (repo separado `SmartLot_API`) bajo `/api`. La UI y el código están en español.

## Stack

- React 19 + Vite 8, react-router-dom 7 con rutas `lazy()`
- Tailwind CSS v4 con tokens `@theme` en `src/index.css`
- Axios con cliente central en `src/api/client.js`; caché en memoria en `src/cache/cacheStore.js`
- Mercado Pago SDK, Google Maps, QR (`html5-qrcode`), SweetAlert2, GSAP, Recharts, ExcelJS/PDF
- Pruebas con `node:test` (sin framework externo)

## Comandos

| Comando | Uso |
|---|---|
| `npm install` | Instalar dependencias |
| `npm run dev` | Servidor de desarrollo; proxy `/api` → `http://localhost:3000` (`vite.config.js`) |
| `npm test` | `node --test src/**/*.test.js` |
| `npm run lint` | ESLint; tiene deuda preexistente: validar solo los archivos tocados |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Servir la build localmente |

## Convenciones de código

- Componentes en PascalCase `.jsx`; hooks `use*.js`; servicios `API_*.js` en `src/servicies/` (sic; typo histórico, no renombrar sin pedido).
- Vistas por rol en carpetas en español: `vistasEmpleados/`, `vistasAdmin/`, `vistasSuperadmin/`, `vistasGaragista/`, `vistasLanding/`, `vistasDueñoGarage/` (respetar la ñ exacta en paths).
- Copy de UI siempre en español; informes técnicos pueden ir en inglés.
- Estilos con utilidades Tailwind y tokens de `DESIGN.md`; evitar hex/rgb hardcodeados.
- Rutas nuevas: registrar con `lazy()` en `src/App.jsx` y proteger con `ProtectedRoute` usando `allowedRoles`.
- Comentarios en español y solo para explicar el porqué (patrón de `src/api/client.js` y `src/contexts/AuthProvider.jsx`).
- Pruebas junto a la fuente (`*.test.js`) o de contrato de fuente (`*.source.test.js`).

## Límites

- **Siempre:** respetar `DESIGN.md` como fuente del sistema visual; reutilizar componentes compartidos antes de crear nuevos; correr `npm test` y lint de lo tocado al cerrar una tarea; actualizar la documentación cuando cambie una decisión.
- **Preguntar antes de:** agregar dependencias, modificar el cliente HTTP o la caché, cambiar roles/rutas protegidas, reescribir la documentación funcional existente (`docs/reservation-limit.md`, `docs/estados-vacios.md`, `docs/pendientes-audit-ui.md`).
- **Nunca:** commitear `.env` ni secretos; asumir endpoints del backend no verificados en `src/servicies/`; borrar ADRs (se reemplazan, no se eliminan); commitear sin pedido explícito.

## Contexto del proyecto

- Índice de documentación: `docs/index.md`.
- Contexto de producto (qué es, reglas de negocio, glosario, tono): `PRODUCT.md` (leer antes de escribir UI o copy).
- Arquitectura y mapa de rutas: `docs/architecture.md`.
- Flujos de dominio: `docs/domain-flows.md`.
- Guía de desarrollo y pruebas: `docs/development.md`.
- Decisiones arquitectónicas: `docs/decisions/` (leer antes de proponer cambios estructurales).
- Sistema de diseño: `DESIGN.md` (raíz).
- Gotchas: los roles se identifican por número **y** por nombre (`src/helpers/roles.js`); la sesión usa cookies + refresh automático con cola (`src/api/client.js`); la caché se invalida por prefijos en cada mutación; `npm run lint` arrastra errores preexistentes documentados en `docs/reservation-limit.md`.

## Flujo de trabajo

1. Feature nueva, ambigua o de más de ~30 minutos: escribir spec en `docs/specs/` con la plantilla `docs/specs/TEMPLATE.md` y esperar aprobación antes de planificar o codificar.
2. Decisión que cambia arquitectura o es costosa de revertir: crear ADR en `docs/decisions/` siguiendo la convención `ADR-XXX-titulo.md`.
3. Implementar por tareas pequeñas y verificables; cerrar con `npm test`, lint dirigido y `npm run build` si el cambio es grande.
