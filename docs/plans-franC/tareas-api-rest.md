# Tareas del plan "API REST"

> Lista de tareas en el formato de la fase *Tasks* de `spec-driven-development`: cada tarea con **Aceptación** (qué debe ser cierto) y **Verificación** (cómo se comprueba). Alcance y justificación: [`plan-api-rest.md`](./plan-api-rest.md). Estado general y traspaso: [`estado-api-rest.md`](./estado-api-rest.md).
> **Última actualización:** 2026-10-25 (cierre de la Fase 6; queda el cierre administrativo). `[x]` = hecha y verificada; `[ ]` = pendiente. Marcar la tarea **en el mismo punto** en que se cierra (protocolo en [`README.md`](./README.md)).

Convenciones: **BE** = backend `SmartLot_API`, **FE** = este repo. Salvo que se diga otra cosa, la verificación de las tareas del BE es `npm test` (con `--test-timeout=120000` desde automatización) y la del FE es `npm test` más lint dirigido.

## Fase 0 — Preparación

- [x] **T0.1 Línea base del backend**
  - Aceptación: se conoce el resultado de `npm test` antes de tocar nada.
  - Verificación: 668 tests, 663 ok, 1 fallo (webhook de MP, aserción desactualizada), 4 skipped. Antes hubo que correr `npm install` (faltaba `@electric-sql/pglite`).

## Fase 1 — Errores que dicen la verdad (ADR-008)

- [x] **T1.1 Helpers únicos** — `httpError`/`throwError` y `httpStatus`.
  - Aceptación: no queda ninguna definición local de `throwError`/`fail`/`writeError`; sin status el error es 500.
  - Verificación: búsqueda de definiciones locales sin resultados; tests verdes. Archivos: `src/helpers/httpError.js`, `httpStatus.js` y ~29 archivos migrados.
- [x] **T1.2 `errorHandler`** — mapeo Postgres, sin borrar cookies en 5xx, sin `[MP]`/`isNotFoundCode`.
  - Aceptación: `23505` → 409, `23503` → 409, `23502/22P02/23514/22001/22003` → 400, sin detalle del driver; un 500 no envía `Set-Cookie`.
  - Verificación: `test/api-errores.test.js`. Archivo: `src/middlewares/errorHandler.js`.
- [x] **T1.3 Repositories no tragan errores** — 75 `catch … return null/false/[]` + variantes multilínea; revisar llamadores.
  - Aceptación: una falla de la base en un GET por id es 500 (no 404); un listado vacío es `200 []`; se eliminaron los `if (!data) → 500` de controllers y las guardas muertas de services.
  - Verificación: `test/api-errores.test.js`; búsqueda de `return null` tras `console.error` en `src/repositories` y `src/repos` sin resultados. Archivos: 13 repositories, 2 repos, 16 controllers, `ConflictoService`, `reservaService`, `usuarioService`, `geolocalizacionService`.
- [x] **T1.4 Notificaciones 404** — id inexistente → 404 sin tocar la sesión.
  - Verificación: `test/api-errores.test.js` (PATCH y DELETE inexistentes).
- [x] **T1.5 `authMiddleware`** — JWT inválido → 401 + limpia cookies; base caída → 500 sin limpiar.
  - Verificación: `test/api-errores.test.js` (incluye el wrapper de `/api/payments` en `app.js`, que ahora devuelve la promesa).
- [x] **T1.6 CORS y refresh** — origen no permitido → 403; refresh con cookie mal formada → 401, con base caída → 500 sin desloguear.
  - Verificación: `test/api-errores.test.js`. Archivos: `src/app.js`, `usuarioController.js`, `usuarioService.js`.
- [x] **T1.7 Test de comportamiento** — `test/api-errores.test.js` (24 tests; 17 fallan contra `HEAD`).
- [x] **T1.8 `docs/plans-franC/api-errores.md` (BE)** — política, formato, tabla Postgres, estado de hallazgos. (La columna "Resuelto en" lleva la fase; el hash falta hasta commitear.)

## Fase 2 — PUT vs PATCH (ADR-009)

- [x] **T2.1 PUT estricto** en marca (`nombre`), modelo (`nombre`, `id_marca`), rol (`tipo_rol`), empresa (`nombre` + `descripcion` explícita).
  - Aceptación: `PUT /api/marca/5 {}` → 400 (no 404) y no ejecuta el `UPDATE`; sin cuerpo → 400 (no `TypeError`).
  - Verificación: `test/api-validacion.test.js`.
- [x] **T2.2 Sede:** `PUT` exige `nombre` y `ubicacion` explícita; nuevo `PATCH /api/sede/:id` parcial.
  - Aceptación: `PATCH {nombre}` actualiza solo `nombre` y conserva `id_empresa` y coordenadas; `PATCH {}` → 400. Antes se verificó que el FE manda `ubicacion` siempre (puede ser `''`).
  - Verificación: `test/api-validacion.test.js`; `test/tenant-writes-sql.integration.test.js` (118 ok tras pasar los casos parciales a `PATCH`).
- [x] **T2.3 `PUT` parcial heredado documentado** como deuda (garage, vehiculo, usuario, reserva, conflicto, trato) en `docs/plans-franC/api-errores.md` §6.

## Fase 3 — Validación de `:id` homogénea (ADR-011)

- [x] **T3.1 `parseIdParam` / `idParam`** en `validatorHelper.js` y `router.param` en los 14 routers con ids.
  - Aceptación: `/api/marca/7abc`, `0`, `-1`, `1.5`, `1e3` y enteros no seguros → 400 sin consultar la base; el handler recibe un número; el `:id` fuera del rango de la columna → 400.
  - Verificación: `test/api-validacion.test.js` (34 rutas + 6 formas inválidas).
- [x] **T3.2 Reemplazar `parseInt`/`Number`/`parseId` locales** por `req.params.id`.
- [x] **T3.3 Quitar la validación duplicada de `id_usuario` en `PUT /reserva/:id`.**
  - Verificación: `test/api-validacion.test.js` (llega al service y devuelve 404).

## Fase 4 — Pagos (ADR-010)

- [x] **T4.1 `paymentController`** sin `try/catch + next` (se conserva el `catch` del webhook que marca el evento), mensajes en español, firma inválida → 401 estándar, 404 manual eliminado, comprobaciones muertas de `/preference` eliminadas.
  - Verificación: `test/mp-controller.test.js`, `test/mp-webhook-auth.test.js`.
- [x] **T4.2 `mpService`** — toda falla del SDK → 502 `MP_UPSTREAM_ERROR` (el 404 de "pago no encontrado" se conserva).
  - Verificación: `test/mp-service.test.js` (6 estados × 6 operaciones + red + 404).
- [x] **T4.3 GET sin efectos / POST de verificación** — `getAuthorizedPayment`/`listAuthorizedPayments` puros; `verifyAuthorizedPayment` y `verifyAuthorizedPaymentsByReference`; rutas `POST /:paymentId/verificar` y `POST /verificar`.
  - Aceptación: ningún GET llama a Mercado Pago ni ejecuta `INSERT/UPDATE/DELETE` sobre `pagos`.
  - Verificación: `test/payment-read-access.test.js`, `test/payment-read-sql.integration.test.js` (SQL real), `test/enterprise-payment-sql.integration.test.js`.
- [x] **T4.4 FE `API_Pagos.js`** — `PagosGetById` → POST `/verificar`; `PagosBuscar` verifica antes de listar.
  - Verificación: FE `npm test` (121 ok) y lint sin errores nuevos. **Falta la prueba manual del retorno de pago** (ver T7.2).
- [x] **T4.5 Documentos de pagos** actualizados (SEG-03, SEG-08, seg03-provider-observations, frontend-mercadopago, mercado-pago-schema).
- [x] **T4.6 `npm run test:mp` en verde** (42 tests, 3 skipped). El test de integración que fallaba desde antes de empezar se corrigió y pasa contra el sandbox real.

## Fase 5 — BAJO: status, contrato y naming

- [x] **T5.1 Un recurso, una entidad:** `POST /api/trato-empresa-garage` solo superadmin (sin rama que crea solicitudes).
- [x] **T5.2 `authMiddleware` único:** quitado de las 7 rutas de reserva y las 5 de notificación (lo aplica `app.js`).
  - Verificación: `test/api-contrato.test.js` (sigue exigiendo sesión; corre una sola vez).
- [x] **T5.3 Status puntuales:** día ya registrado → 409; rama muerta 500 de `liberar-retencion` eliminada; los `if (!data) 500` ya salieron en T1.3.
- [x] **T5.4 Endpoints retirados:** `GET /api/garage/:id/cercanos` y `DELETE /api/trato-empresa-garage/:id` (se confirmó con búsqueda en el FE que no se usan).
- [x] **T5.5 Ruta de contraseña ASCII:** `PATCH /api/usuario/:id/contrasenia`; alias con `ñ` eliminados. FE: `perfil_empleado.jsx`, `perfil_dueño_garage.jsx`.
- [x] **T5.6 Contrato de usuario:** se deja de enviar `limite_reservas_activas`; FE: `gestion_de_empleados.jsx`.
- [x] **T5.7 Naming:** convención para rutas nuevas y tabla de retirados en `docs/plans-franC/api-errores.md` §8. Constantes en `httpStatus.js`.
- [x] **T5.8 Extra:** ruta inexistente → 404 JSON (`app.js`).
  - Verificación de la fase: `test/api-contrato.test.js` (14 tests).
- [x] **T5.9 Documentar la diferencia `GET /api/usuario/me` vs. login.**
  - Verificación: `docs/plans-franC/api.md` §5 (tabla comparativa de ambas respuestas).

## Fase 6 — Contrato publicado (SUGERENCIA)

- [x] **T6.1 `docs/plans-franC/api.md` (BE)**
  - Aceptación: formato de error, tabla de status, PUT vs PATCH, e **inventario completo de endpoints** (método, ruta, roles, códigos posibles) que coincide con las rutas montadas; incluye la diferencia `/me` vs. login (T5.9).
  - Hecho: el inventario (137 endpoints, 18 módulos) se genera recorriendo el **router real de Express** (`scripts/api-inventory.mjs` + `scripts/generate-api-inventory.mjs`, `npm run routes:inventory -- --write`); `requireRole`/`requireRoleOrSelf` ahora llevan sus roles como metadato. Los códigos de error salen del código de cada handler; los que agregan los services van en una tabla aparte (§7).
  - Verificación: `test/api-inventario.test.js`. Archivos: `scripts/api-inventory.mjs`, `scripts/generate-api-inventory.mjs`, `docs/plans-franC/api.md`, `src/middlewares/rolesMiddleware.js`, `package.json`.
- [x] **T6.2 Colección Postman** (antes 5 carpetas, sin auth; ahora 137 requests en 18 carpetas + 20 casos de error)
  - Aceptación: una carpeta por router; casos de error de las fases 1 a 3 como requests de ejemplo con tests de Postman; JSON válido; sin secretos.
  - Hecho: generada con `npm run postman:generate` (`scripts/generate-postman.mjs`); auth Bearer con `{{accessToken}}` que guarda el request de login; variables `email`/`password` vacías.
  - Verificación: `test/api-inventario.test.js` (cobertura de endpoints, casos de error con test, sin credenciales). **No se ejecutó la colección en Postman/Newman** (ver T7.2).
  - Decisión ya tomada: Markdown + Postman, **sin OpenAPI ni dependencias nuevas**.
- [x] **T6.3 Test de contrato del inventario** — `docs/plans-franC/api.md` y la colección Postman fallan en `npm test` si no coinciden con el router (`test/api-inventario.test.js`, 9 tests).

## Cierre

- [x] **T7.1 Autorización de commits** *(autorizados el 2026-10-25; ver hashes en `estado-api-rest.md` §12)* — y, una vez dada, un commit por fase por repo; completar la columna "Resuelto en" de `docs/plans-franC/api-errores.md` con los hashes. *(Requiere aprobación explícita del dueño.)*
- [ ] **T7.2 Prueba manual** (sección "Verificación" del plan): `PUT /api/marca/5 -d '{}'` → 400; `GET /api/marca/7abc` → 400; `PATCH /api/notificacion/999999/leer` → 404 y `GET /api/usuario/me` → 200; marca duplicada → 409; con `DATABASE_URL` inválido, request autenticada → 500. En el FE: perfil (cambio de contraseña), retorno de pago, gestión de empresas, marcas y sedes.
- [ ] **T7.3 `npm run build` del FE** (opcional; el cambio no es grande).
- [ ] **T7.4 Decidir deuda de `estado-api-rest.md` §8–9** (modelo `tipo_vehiculo`, renombrar `PagosGetById`, podar `TratosCreate`, aislar `mp-integration`).
- [ ] **T7.5 Actualizar la tabla final de `docs/plans-franC/api-errores.md`, `estado-api-rest.md` y la bitácora** al cerrar.
