# ADR-008: Política de errores de la API: la base falla con excepciones y un solo `errorHandler` traduce

## Estado

Aceptado.

## Fecha

2026-10-25.

## Contexto

La devolución y el informe docente (2026-10-16, sección 2.3, punto 4 de la devolución) marcaron que en buena parte de los repositories del backend (`SmartLot_API`) un fallo de la base se registraba en consola y se devolvía `null`/`false`/`[]`. Más arriba, el controller interpretaba ese "nada" como "no existe" (404) o como "error interno" (500) según el caso: editar una marca existente con el cuerpo vacío respondía "la marca no existe". Además:

- `errorHandler` borraba las cookies de sesión en **todo** 500, así que un error de datos podía cerrar la sesión del usuario (una notificación inexistente salía como 500).
- `authMiddleware` respondía 401 ante cualquier excepción, incluida una base caída; el cliente (ADR-002) lee 401 como "sesión vencida" y dispara refresh/logout.
- Existían ~29 copias locales de `throwError`/`fail`/`writeError`/`httpError` con firmas y defaults distintos (400 en un archivo, 409 en otro, sin default en otros).

Evidencia: backend `docs/plans-franC/api-errores.md`; tests `test/api-errores.test.js` (17 de 24 fallan contra el código anterior).

## Decisión

1. **Una política por capa.** El repository devuelve `null`/`[]`/`false` solo cuando no hay filas y deja propagar las excepciones. El service lanza errores de dominio con `statusCode`. El controller valida y traduce `null` → 404 en GET/PUT/DELETE por id. No se agregan `try/catch + next(err)` (Express 5 propaga los rechazos async).
2. **Un solo helper** para lanzar errores con status: `httpError`/`throwError` en `src/helpers/httpError.js`, con constantes en `httpStatus.js`. **Sin status explícito el error es un 500.**
3. **`errorHandler` único** que arma el payload `{ error, message, statusCode, code? }` y traduce los errores de Postgres sin status (`23505`/`23503` → 409; `23502`/`22P02`/`23514`/`22001`/`22003` → 400) con mensajes genéricos y un `code` simbólico (`DB_*`). Sin exponer tablas ni columnas.
4. **Un 5xx nunca toca la sesión.** Solo invalidan la sesión `authMiddleware` (JWT inválido → 401), el logout y un rechazo 4xx en el refresh. Una base caída en `authMiddleware` es 500.
5. **Rutas públicas sensibles** (login, alta pública de solicitud) conservan un middleware de error por ruta que convierte cualquier error crudo de la base en 500 genérico, para que el mapeo a 409 no revele si un correo ya existe (SEG-10A/10B).
6. **Los `catch` en repositories se admiten solo para traducir un caso conocido y relanzar el resto** (p. ej. `23505` → 409 con mensaje de negocio, fallback `42703`, `ROLLBACK`).

## Alternativas consideradas

### Dejar los repositories como están y mejorar solo el controller
- Pros: sin cambios en la capa de datos.
- Contras: el controller no puede distinguir "no existe" de "falló"; el problema de raíz sigue.
- Rechazada.

### Una jerarquía de clases de error (`NotFoundError`, `ConflictError`, ...)
- Pros: más expresivo, `instanceof` en el handler.
- Contras: 29 sitios a migrar a una API nueva, más superficie que un helper de una línea; el proyecto ya usa `statusCode` en el objeto.
- Rechazada: el helper conserva la forma existente (`error.statusCode`) y reduce el cambio.

### Mapear los errores de Postgres en cada repository
- Pros: cada módulo decide su mensaje.
- Contras: es exactamente la duplicación que se quiere eliminar; fácil olvidarlo en un método.
- Rechazada: el mapeo genérico va en el `errorHandler`; el mensaje específico de negocio sigue siendo posible con un `catch` que traduce y relanza.

### Que `authMiddleware` siga respondiendo 401 ante cualquier fallo
- Pros: no cambia nada.
- Contras: una caída de la base desloguea a todos los usuarios activos.
- Rechazada.

## Consecuencias

- El frontend no cambia: su cola de refresh solo reacciona al 401. Algunas pantallas verán 500 donde antes veían un 404 engañoso; es el comportamiento correcto.
- Todo repository nuevo debe dejar propagar los errores; revisar los llamadores que trataban `null` como falla (código muerto que se elimina).
- Los mensajes de los `DB_*` son genéricos: un mensaje específico de negocio exige un `catch` que traduzca y relance.
- Los tests deben ser de comportamiento (`supertest` + base simulada), no de regex sobre el código fuente.
- El contrato completo (inventario de endpoints, roles y códigos) está en el backend: `docs/plans-franC/api.md`, generado del router real y verificado por `test/api-inventario.test.js`.
