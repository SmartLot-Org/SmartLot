# Plans-franC — seguimiento del plan "API REST"

Carpeta de trabajo del plan para subir la nota del área **API REST** (hoy 6/10, 13 % de la nota ponderada) tras el Informe Docente y la Devolución del 2026-10-16. Esta carpeta es el **punto de entrada para retomar el trabajo en cualquier sesión**, de un humano o de un agente.

> **Regla de oro (pedido explícito del dueño del trabajo, 2026-10-25):** a medida que se avanza, **todo se documenta** usando las tres skills de `.claude/skills/` — `spec-driven-development`, `documentation-and-adrs` y `context-engineering` — para que el trabajo se pueda seguir de una sesión a la otra sin reconstruir contexto. Si hiciste algo y no está documentado acá, para la próxima sesión no existe.

## Retomar en 5 minutos (orden de lectura)

1. [`estado-api-rest.md`](./estado-api-rest.md) — **dónde estamos**: estado por fase, qué queda, árbol de trabajo, comandos de verificación y resultados, trampas del entorno, preguntas abiertas.
2. [`tareas-api-rest.md`](./tareas-api-rest.md) — **qué falta**, tarea por tarea, con criterio de aceptación y cómo verificar.
3. [`bitacora-sesiones.md`](./bitacora-sesiones.md) — **qué pasó** en cada sesión (cronológico, con hallazgos y desvíos).
4. [`plan-api-rest.md`](./plan-api-rest.md) — el **plan aprobado** (spec + plan). Es la fuente del alcance; los desvíos se registran en `estado-api-rest.md`, no se reescribe el plan en silencio.
5. Antes de tocar código: `AGENTS.md` de **este** repo y `AGENTS.md` del **backend**, y `git status` real de ambos repos (no confiar en que lo escrito sigue siendo cierto: ver "Fuentes de verdad").

## Qué hay en la carpeta

| Archivo | Rol | Skill que lo gobierna | Se actualiza |
|---|---|---|---|
| `README.md` | Índice y protocolo (este archivo) | `documentation-and-adrs` | Cuando cambia el protocolo |
| `estado-api-rest.md` | Traspaso entre sesiones: estado, árbol de trabajo, verificación, preguntas abiertas | `context-engineering` (límites de sesión reiniciable) | **Al cerrar cada punto de trabajo** |
| `tareas-api-rest.md` | Lista de tareas con aceptación y verificación | `spec-driven-development` (fase Tasks) | **Al cerrar cada tarea** |
| `bitacora-sesiones.md` | Registro cronológico de sesiones | `context-engineering` | Al cerrar cada sesión |
| `plan-api-rest.md` | Plan aprobado (alcance y fases) | `spec-driven-development` (Specify + Plan) | Solo si cambia el alcance, con aprobación |
| `Informe-Docente-2026-10-16.md` | Fuente: hallazgos del docente | — (documento recibido) | Nunca |
| `Devolucion-Alumno-2026-10-16.md` | Fuente: devolución conceptual | — (documento recibido) | Nunca |

Los **entregables permanentes** del plan no viven acá sino junto al código que describen:

| Entregable | Repo | Ruta |
|---|---|---|
| Política de errores, semántica PUT/PATCH, tabla de estado de hallazgos | backend | `docs/plans-franC/api-errores.md` |
| Contrato publicado (inventario de endpoints, códigos, roles; se regenera con `npm run routes:inventory -- --write`) | backend | `docs/plans-franC/api.md` |
| Colección Postman generada (una carpeta por módulo + casos de error) | backend | `src/postman/SmartLot.postman_collection.json` (`npm run postman:generate`) |
| Decisiones costosas de revertir | frontend | `docs/decisions/ADR-008` a `ADR-011` |
| Reglas para agentes (convenciones de la API) | backend | `AGENTS.md` |
| Contratos de pagos actualizados | backend | `docs/SEG-03.md`, `SEG-08.md`, `seg03-provider-observations.md`, `frontend-mercadopago.md`, `mercado-pago-schema.md` |

## Protocolo de documentación (cerrar CADA punto de trabajo así)

Un "punto" es una tarea de `tareas-api-rest.md` o cualquier cambio que deje el árbol en un estado coherente. Al cerrarlo, **en este orden**:

1. **Verificar** (context-engineering, nivel 4): correr los comandos de la sección "Verificación" de `estado-api-rest.md` y anotar el resultado real, no el esperado. Si algo falla, anotarlo tal cual.
2. **Tareas** (spec-driven-development, fase Tasks): marcar la tarea en `tareas-api-rest.md`; si apareció trabajo nuevo, agregarlo con aceptación y verificación. Si cambió el alcance, registrarlo como desvío en `estado-api-rest.md` y pedir aprobación antes de seguir.
3. **Decisiones** (documentation-and-adrs): si se tomó una decisión costosa de revertir o se eligió entre alternativas, escribir un ADR en `docs/decisions/` (numeración secuencial, en español, índice en `decisions/README.md`, **nunca borrar**: se reemplaza). Si cambió un contrato de la API, actualizar `docs/plans-franC/api-errores.md` / `docs/plans-franC/api.md` **en el mismo punto**.
4. **Reglas** (context-engineering, nivel 1): si cambió una convención que un agente debe respetar, actualizar `AGENTS.md` (backend y/o frontend).
5. **Traspaso** (context-engineering, límites de sesión reiniciable): actualizar `estado-api-rest.md` con los cinco datos mínimos — alcance y decisiones aceptadas, tarea actual y **próxima tarea pendiente**, archivos cambiados y estado del árbol (¿commiteado?), comandos de verificación con su resultado, preguntas abiertas/aprobaciones pendientes.
6. **Bitácora**: agregar una entrada a `bitacora-sesiones.md` (qué se hizo, qué se descubrió, qué se descartó y por qué).

Lo que **no** se documenta: código evidente, comentarios que repiten lo que hace el código, intentos fallidos sin conclusión útil (de un intento fallido se conserva la conclusión, no el recorrido).

## Reglas del proyecto que rigen este trabajo

Resumen de lo que ya dicen los `AGENTS.md` (leerlos completos):

- **No commitear sin pedido explícito.** Todo el trabajo hecho hasta hoy está **sin commitear** (ver `estado-api-rest.md`). Si se pide commitear: un commit por fase, mensaje descriptivo, y completar la columna "Resuelto en" de la tabla de `docs/plans-franC/api-errores.md` con el hash.
- **Preguntar antes de:** agregar dependencias, modificar `src/api/client.js` o la caché del frontend, cambiar roles/rutas protegidas, reescribir los documentos funcionales existentes (`docs/reservation-limit.md`, `docs/estados-vacios.md`, `docs/pendientes-audit-ui.md`).
- **Nunca:** commitear `.env` o secretos, asumir endpoints del backend sin verificarlos, borrar ADRs.
- **Cerrar cada tarea con** `npm test` en el repo que se tocó (más lint dirigido en el frontend; `npm run lint` arrastra errores preexistentes).
- Copy y comentarios en español; comentarios solo para explicar el porqué.

## Fuentes de verdad (si dos documentos se contradicen)

1. El código y los tests en ejecución (`git status`, `npm test`).
2. `docs/plans-franC/api-errores.md` (backend) para el contrato de errores y escritura.
3. Los ADRs de `docs/decisions/`.
4. `estado-api-rest.md` → `tareas-api-rest.md` → `bitacora-sesiones.md` → `plan-api-rest.md`.

Si el estado escrito no coincide con el árbol real, **gana el árbol**; corregir el documento y anotar la discrepancia en la bitácora.
