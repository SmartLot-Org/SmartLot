# Plan: subir la nota de "API REST" (hoy 6/10, 13 % de la ponderada)

## Contexto

El Informe Docente (2026-10-16, sección 2.3) pone API REST en 6/10 por **3 ALTO**, 7 MEDIO y varios BAJO. La Devolución (punto 4, "Errores y status codes que digan la verdad") resume el concepto: *"no encontré" es un resultado, "falló la consulta" es una excepción*, y PUT vs PATCH.

Los commits SEG-01 a SEG-06 del backend (`SmartLot_API`, de `9133f39` a `57d6ebb`) ya resolvieron parte de lo que el informe le cargaba a esta área. Estado verificado hoy en el código:

| Hallazgo 2.3 | Sev. | Estado actual |
|---|---|---|
| Repos que se tragan errores y devuelven `null` → 404/500 a ciegas | ALTO | **Pendiente**: 74 `catch { console.error; return null/false }` en 11 repos (`garageRepository` 18, `reservaRepository` 14, `usuarioRepository` 8, `ConflictoRepository` 7, `vehiculo` 7, `empresa` 6, `marca`/`modelo`/`rol` 4, `sede` 2, `repos/NotificacionRepository`) |
| PUT validado como parcial que pisa columnas | ALTO | **Parcial**: `sedeRepository.updateAsync` ya actualiza solo los campos presentes (SEG-04). Pendientes: `marcaRepository.js:33`, `modeloRepository.js:33`, `rolRepository.js:33`, `empresaRepository.js:77` |
| 404 que sale como 500 y desloguea | ALTO | **Pendiente**: `NotificacionService.js:22,32` sin `statusCode`; `errorHandler.js:6-9` borra cookies en todo 500; CORS (`app.js:66`) da 500 |
| `authMiddleware` responde 401 si cae la DB | MEDIO | **Pendiente** (`authMiddleware.js:25-56`) |
| `paymentController` con otro dialecto | MEDIO | **Pendiente**: `try/catch + next` en las 6 rutas, `'Items array is required'` (:274), `'idReserva is required'`, `{ error: 'Invalid signature' }` (:350), 404 armado a mano (:333) |
| GET con efectos secundarios en pagos | MEDIO | **Parcial**: ya hay autorización (SEG-03), pero `GET /:paymentId` y `GET /?externalReference` siguen escribiendo `pagos` (`paymentReadService.js:323` `updateAuthorizedLocalPayment`, `synchronizeByReference`) |
| Validación de `:id` inconsistente (`/api/marca/7abc` → 7) | MEDIO | **Pendiente**: `parseInt` ×42, `Number()` ×4, `isValidId` ×13, `parseId` local ×3 |
| Validación duplicada en PUT reserva | MEDIO | **Pendiente** (`reservaController.js:117-118` frente a la whitelist de `reservaService.js:242-247`) |
| Un endpoint que devuelve dos entidades | MEDIO | **Pendiente** (`tratoEmpresaGarageController.js:62-73`). El FE no lo usa: `TratosCreate` no tiene llamadores |
| Status codes puntuales, `authMiddleware` doble, naming, endpoints huérfanos, errores de MP reenviados | BAJO | Pendientes |
| Refund sin rol, listados globales, bug transaccional `savePaymentRecord` | — | **Resueltos** por SEG-01/02/03 (`requireRole(4)` en refund, `listAuthorizedPayments`, `db.query` en :47) |

**Meta:** cerrar los 3 ALTO y todos los MEDIO, y publicar un contrato verificable. Con eso el área tiene argumentos para 8/10 (+2 × 0,13 = +0,26 en la ponderada). Todo el trabajo va en el repo backend, salvo dos ajustes chicos del FE que se señalan.

## Reglas transversales

- Una política de errores única, escrita en `docs/plans-franC/api-errores.md` del BE: **repository** devuelve `null`/`[]`/`false` solo cuando "no hay filas" y deja propagar las excepciones; **service** lanza errores de dominio con `statusCode`; **controller** solo traduce `null` → 404 en GET/PUT/DELETE por id; **errorHandler** mapea las excepciones.
- Express 5 propaga los rechazos async, así que no se agregan `try/catch + next`.
- Tests de **comportamiento** con `supertest` (ya es devDependency) y `mock.module` sobre `db.js` (el patrón de `test/garage-responsables.test.js`). Nada de `readFile` + regex: el informe los marca como señal negativa.
- Cada fase cierra con `npm test` en el BE y es un commit independiente (solo si se pide commitear).

## Fase 1 — Errores que dicen la verdad (ALTO 1 y ALTO 3, MEDIO authMiddleware)

1. **Helper único de errores HTTP**: crear `src/helpers/httpError.js` con `httpError(message, statusCode = 500, extra)` y `throwError(...)`. Reemplazar las 13 copias locales de `throwError`/`fail` (`marcaController.js:9`, `paymentController.js`, `solicitudEmpresaGarageController.js:9`…) y reusar `writeError` de `helpers/writeAuthorization.js` como alias, para que no quede una cuarta variante. Así desaparece la divergencia "400 por defecto en un archivo, 500 en otro".
2. **`errorHandler.js`**:
   - Mapear códigos de Postgres: `23505` → 409, `23503` → 409, `23502`/`22P02`/`23514`/`22001` → 400, con un mensaje genérico en español y `code` en el payload (`DB_UNIQUE_VIOLATION`, etc.). Sin exponer el detalle del driver.
   - **Dejar de borrar cookies en los 500.** La sesión solo la invalidan `authMiddleware` (401) y logout.
   - Quitar el prefijo `[MP]` del log de 404 y el caso especial `isNotFoundCode` (los services van a lanzar `statusCode: 404` con su `code`).
3. **Repos**: sacar los 74 `try { … } catch (error) { console.error(error); return null; }`, repo por repo, dejando `rows[0] ?? null` / `rowCount > 0` como señal de "no existe". Excepciones que se conservan: los `catch` de `ConflictoRepository.js` que filtran `42703` como fallback de columna, y el `42P01` de `cuentaCorrienteRepository.js:94` (se documentan). Por cada repo, revisar los llamadores en services y controllers que trataban `null` como error:
   - En los controllers, quitar `if (!data) throwError('Error interno…', 500)` en POST y en listas (`marcaController.js:18,37`, `empresaController.js:18` y equivalentes). Una lista vacía es 200 `[]`.
   - Orden sugerido (de menor a mayor riesgo): marca, modelo, rol, vehiculo, sede, empresa, Notificacion, usuario, Conflicto, reserva, garage.
4. **Notificaciones**: `NotificacionService.js:22,32` → `throwError('Notificación no encontrada…', 404)`; `NotificacionController.js` valida `:id` (lo resuelve la Fase 3).
5. **`authMiddleware.js`**: separar `jwt.verify` (su `catch` → 401 + clearCookie, como hoy) de la consulta a la DB (un error de DB → `next(err)` → 500, **sin** limpiar cookies). La cola de refresh del FE solo reacciona al 401, así que **el FE no cambia**.
6. **CORS** (`app.js:66`): `callback(httpError('Origen no permitido.', 403))`.

**Tests nuevos** (`test/api-errores.test.js`):
- `db.query` que rechaza → `GET /api/marca/1` responde 500, no 404, y no manda `Set-Cookie` que borre la sesión.
- Error `23505` → 409. `PATCH /api/notificacion/999/leer` inexistente → 404 sin borrar cookies.
- DB caída en `authMiddleware` → 500, no 401.

## Fase 2 — PUT vs PATCH (ALTO 2)

Decisión que se documenta en `docs/plans-franC/api-errores.md` (sección "Semántica de escritura"): **PUT = reemplazo completo**, todos los campos obligatorios se exigen con 400. **PATCH = parcial.**

- `marcaController` (PUT exige `nombre`), `modeloController` (`id_marca` + `nombre`), `rolController` (`tipo_rol`) y `empresaController` (`nombre`; `descripcion` puede ser `null` explícito). Validación en el controller con `isValidString`/`isValidId`. Las queries quedan como están porque ahora siempre reciben el cuerpo completo.
- El FE ya manda cuerpos completos (`gestion_empresas.jsx:80` manda `{nombre, descripcion}`; `API_Marca/Modelo/Rol.js` mandan el objeto entero): no hace falta tocarlo.
- `sede` hoy es un PUT parcial (SEG-04). Para respetar la semántica: agregar `PATCH /api/sede/:id` con el mismo `updateAsync` parcial y hacer que el PUT exija los campos obligatorios (`nombre`, `ubicacion`). Antes de endurecer el PUT, verificar qué manda `API_Sede.js:113` y sus vistas.
- **Tests**: `PUT /api/marca/5 {}` → 400 (hoy da 404); `PUT /api/modelo/5 {nombre}` → 400; `PATCH /api/sede/5 {nombre}` conserva `id_empresa` y las coordenadas.

## Fase 3 — Validación de entrada homogénea (MEDIO)

- Agregar `parseIdParam(value, nombre = 'ID')` en `helpers/validatorHelper.js` (usa `isValidId` y lanza 400) y registrarlo con `router.param('id', …)` en cada router. Una línea por controller reemplaza las ~60 variantes y hace que `/api/marca/7abc` dé 400. Aplicar lo mismo a `:id_garage`. **No** aplicarlo a `:paymentId`, que sigue con su validación propia.
- Reemplazar los `parseInt(req.params.id)` / `Number(req.params.id)` / `parseId` locales por `req.params.id` ya normalizado.
- `reservaController.js:117-118`: quitar la validación de `id_usuario` (el service la descarta) y dejar la whitelist del service como única regla.
- **Tests**: `GET /api/marca/7abc` → 400; `GET /api/marca/0` → 400.

## Fase 4 — Pagos con las convenciones del resto (MEDIO)

- `paymentController.js`: quitar `try/catch + next` en las 6 rutas (conservar solo el `catch` del webhook que hace `markWebhookProcessed`). Pasar los mensajes a español (`'Se requiere al menos un ítem.'`, `'idReserva inválido.'`). La firma inválida pasa a `throwError('Firma de webhook inválida.', 401)` con el payload estándar. Borrar el 404 armado a mano de `GET /:paymentId`: `getAuthorizedPayment` ya lanza `statusCode 404` + `code`. Borrar también la variable sin uso.
- `mpService.js`: no reenviar el status del SDK. Un 401/403 de Mercado Pago pasa a **502** (`code: 'MP_UPSTREAM_ERROR'`), para que el FE no lo lea como sesión vencida.
- **GET con efectos secundarios** (decidido: mover a POST): la sincronización con MP pasa a `POST /api/payments/:paymentId/verificar` y `POST /api/payments/verificar` (con `externalReference`/`preferenceId` en el body), con la misma autorización (`requireRole(1, 2, 4)` + las reglas de `paymentReadService`). `getAuthorizedPayment` y `listAuthorizedPayments` se separan en una lectura pura (GET) y un `verifyAuthorizedPayment` que llama a `updateAuthorizedLocalPayment` / `synchronizeByReference`. Ningún GET escribe. El FE cambia `src/servicies/API_Pagos.js:43` (`get` → `post` a `/verificar`) y se revisa quién llama a la lista con `externalReference`. Ajustar `test/payment-read-access.test.js` y `payment-read-sql.integration.test.js`, y agregar un test de que el GET no ejecuta `UPDATE pagos`. Actualizar `docs/SEG-03.md`: la sección de sincronización autorizada pasa a nombrar el POST.
- Tests existentes de MP (`npm run test:mp`) en verde. Se agrega un test de firma inválida → 401 con `{ error: true, message, statusCode }`.

## Fase 5 — BAJO (status puntuales, contrato y naming)

- **Un recurso, una entidad**: `POST /api/trato-empresa-garage` pasa a `requireRole(4)` y se borra la rama que crea solicitudes (el FE usa `POST /api/solicitud-empresa-garage`, y `TratosCreate` no tiene llamadores).
- **Doble `authMiddleware`**: quitarlo de las 7 rutas de `reservaController.js` y de las 5 de `NotificacionController.js` (ya está en `app.js`).
- **Status puntuales**: `garageController` (POST `/:id/dias`, "ya existe" → 409), la rama muerta 500 de `reservaController.js:158`, y los `if (!data) 500` sobre listas.
- **Endpoints huérfanos o duplicados**: borrar `GET /api/garage/:id/cercanos` (el FE usa `/cercanos`) y el `DELETE` "alias histórico" de trato. Antes, confirmar con grep en el FE que no se usan.
- **Ruta no ASCII**: dejar `PATCH /api/usuario/:id/contrasenia` como canónica y borrar los otros dos alias. El FE cambia `perfil_empleado.jsx:263`, `perfil_dueño_garage.jsx:214` y `ConfirmarSolicitud.source.test.js:35`.
- **Contrato de usuario**: `usuarioController.js:25` deja de mandar `limite_reservas_activas` duplicado (el FE usa `limiteReservasActivas`; limpiar el fallback de `gestion_de_empleados.jsx:111`). `GET /me` sigue con los claims, y se documenta la diferencia con login. Unificarlo toca `AuthProvider` y es del área FE.
- **Naming**: no renombrar rutas existentes (rompe el FE). Se documenta la convención para rutas nuevas (kebab-case, plural, castellano) y la tabla de excepciones heredadas.
- **Números mágicos**: `src/helpers/httpStatus.js` con constantes (`OK`, `CREATED`, `BAD_REQUEST`…) usadas por el helper de errores. Sin dependencia nueva.

## Fase 6 — Contrato publicado (SUGERENCIA)

- `docs/plans-franC/api.md` en el BE: formato de error, tabla de status codes, PUT vs PATCH y el inventario de endpoints (método, ruta, roles, códigos posibles). El inventario se genera con el `scripts/check-routes.cjs` que ya existe, extendido para imprimirlo.
- Actualizar `src/postman/SmartLot.postman_collection.json` (hoy cubre ~30 de ~136): una carpeta por router, con los casos de error de las fases 1 a 3 como requests de ejemplo. Se queda en Markdown + Postman (decidido), sin OpenAPI ni dependencias nuevas.

## Archivos críticos (backend `C:\Users\49123639\SmartLot_API\SmartLot_API\src`)

- `middlewares/errorHandler.js`, `middlewares/authMiddleware.js`, `app.js`
- `helpers/httpError.js` (nuevo), `helpers/httpStatus.js` (nuevo), `helpers/validatorHelper.js`
- `repositories/*.js`, `repos/NotificacionRepository.js`
- `controllers/{marca,modelo,rol,empresa,sede,reserva,Notificacion,payment,tratoEmpresaGarage,garage,usuario}Controller.js`
- `services/NotificacionService.js`, `services/mpService.js`, `services/paymentReadService.js`
- `test/api-errores.test.js` y `test/api-validacion.test.js` (nuevos), `docs/plans-franC/api-errores.md` y `docs/plans-franC/api.md` (nuevos)
- FE (mínimo): `src/servicies/API_Pagos.js`, `perfil_empleado.jsx`, `perfil_dueño_garage.jsx`, `gestion_de_empleados.jsx`

## Verificación

1. BE: `npm test` antes de empezar (línea base) y al cerrar cada fase; `npm run test:mp` en la Fase 4; `npm run check:routes`.
2. Pruebas manuales con el BE local (`npm run app`) y `curl`:
   - `PUT /api/marca/5 -d '{}'` → 400
   - `GET /api/marca/7abc` → 400
   - `PATCH /api/notificacion/999999/leer` → 404 y la sesión sigue viva (`GET /api/usuario/me` → 200)
   - alta de marca duplicada → 409
   - con `DATABASE_URL` inválido, una request autenticada → 500, no 401
3. FE: `npm test`, lint de los archivos tocados y `npm run dev` contra el BE local. Recorrer el perfil (cambio de contraseña), el retorno de pago del empleado (verificación) y la gestión de empresas, marcas y sedes.
4. Al cerrar, actualizar la tabla de estado de arriba en `docs/plans-franC/api-errores.md` con la columna "resuelto en commit X", que sirve como evidencia para la defensa oral.
