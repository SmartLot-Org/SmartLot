# Índice de documentación — SmartLot

Este repositorio es el frontend SPA de SmartLot y consume la API del backend `SmartLot_API` bajo `/api`. La documentación se organiza en cuatro niveles: orientación, arquitectura, desarrollo y evolución.

Última revisión de este índice: 2026-10-09.

## Mapa de documentos

| Documento | Qué responde | Audiencia |
|---|---|---|
| [`README.md`](../README.md) | Qué es el proyecto, cómo instalarlo y correrlo | Todos |
| [`AGENTS.md`](../AGENTS.md) | Reglas, comandos y límites para agentes de IA | Agentes |
| [`PRODUCT.md`](../PRODUCT.md) | Qué es SmartLot, para quién, reglas de negocio, glosario y tono | Producto, diseño, frontend |
| [`DESIGN.md`](../DESIGN.md) | Sistema de diseño "Azul Señal": color, tipografía, componentes | Frontend, diseño |
| [`architecture.md`](./architecture.md) | Capas, autenticación, roles, mapa de rutas, API y caché, despliegue | Frontend |
| [`development.md`](./development.md) | Entorno, variables, pruebas, lint, build y mantenimiento | Frontend |
| [`domain-flows.md`](./domain-flows.md) | Flujos de negocio por rol (reserva, pagos, acceso, paneles) | Producto, frontend |
| [`decisions/README.md`](./decisions/README.md) | ADRs: decisiones arquitectónicas y su contexto | Arquitectos, agentes |
| [`specs/README.md`](./specs/README.md) | Cómo se especifican features antes de codificar | Producto, frontend, agentes |
| [`estados-vacios.md`](./estados-vacios.md) | Inventario de estados vacíos por pantalla y su acción | Frontend, QA |
| [`reservation-limit.md`](./reservation-limit.md) | Informe del límite de reservas activas por empleado (frontend + backend revisado) | Producto, backend |
| [`pendientes-audit-ui.md`](./pendientes-audit-ui.md) | Auditoría UI en curso: inventario de vistas y plan de trabajo | Frontend |
| [`cold-start-login-google.md`](./cold-start-login-google.md) | Bug de cold start del backend en el primer login con Google: causa, fix implementado y pendientes (handoff) | Frontend, backend |

## Fuentes de verdad

Ante contradicción entre documentos, prevalece en este orden:

1. Código en `src/` (comportamiento real).
2. `DESIGN.md` para todo lo visual.
3. ADRs en `docs/decisions/` para decisiones arquitectónicas.
4. Specs aprobadas en `docs/specs/` para alcance funcional de features.
5. Este índice y documentos de orientación.

## Cuándo actualizar qué

- **Cambia el sistema visual** → actualizar `DESIGN.md` y los tokens de `src/index.css` juntos.
- **Se agrega o cambia una ruta protegida** → actualizar la tabla de rutas de `architecture.md` (fuente: `src/App.jsx`).
- **Se toma una decisión costosa de revertir** → crear un ADR nuevo en `docs/decisions/` (no reescribir el anterior; se reemplaza).
- **Feature nueva o ambigua** → escribir spec en `docs/specs/` antes de planificar (ver `specs/README.md`).
- **Cambian comandos, variables de entorno o estrategia de pruebas** → actualizar `README.md` y `development.md`.
- **Cambia un flujo de negocio** → actualizar `domain-flows.md` y, si aplica, el documento funcional específico.
- **Cambia el alcance del producto, una regla de negocio o el tono** → actualizar `PRODUCT.md`.
- **Se cierra la auditoría UI** → actualizar `pendientes-audit-ui.md` y quitar el estado "en curso" de este índice.

## Documentos funcionales existentes

- `estados-vacios.md`, `reservation-limit.md` y `pendientes-audit-ui.md` son documentos de trabajo previos con valor histórico. **No se reescriben ni se mueven sin aprobación explícita** (regla en `AGENTS.md`).
