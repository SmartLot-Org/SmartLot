# Tareas del plan "API REST"

> Lista de tareas en el formato de la fase *Tasks* de `spec-driven-development`: cada tarea con **Aceptación** (qué debe ser cierto) y **Verificación** (cómo se comprueba). Alcance y justificación: [`plan-api-rest.md`](./plan-api-rest.md). Estado general y traspaso: [`estado-api-rest.md`](./estado-api-rest.md).
> **Última actualización:** 2026-11-17 (sesión 2: deuda de T7.4 resuelta; queda la prueba manual T7.2). `[x]` = hecha y verificada; `[ ]` = pendiente. Marcar la tarea **en el mismo punto** en que se cierra (protocolo en [`README.md`](./README.md)).

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
- [x] **T7.3 `npm run build` del FE** — OK el 2026-11-17 (solo la advertencia preexistente de chunks > 500 kB).
- [x] **T7.4 Deuda de `estado-api-rest.md` §8–9** — el dueño pidió trabajar lo pendiente (2026-11-17). Resuelto:
  - Modelo `tipo_vehiculo`: `POST` y `PUT /api/modelo` lo exigen (`auto`/`moto`/`pickup`) y el repositorio lo persiste. BE `4633989`. Verificación: `test/api-validacion.test.js` (PUT sin tipo o con tipo inválido → 400 sin `UPDATE`; POST lo inserta).
  - `mp-integration` fuera de `npm test`: corre solo con `npm run test:mp` o `MP_INTEGRATION=1`. BE `9d4e1f8`. Verificación: `npm test` sin fallos en un entorno sin red ni base.
  - `PagosGetById` → `PagosVerificar` (4 pantallas) y `TratosCreate` eliminado. FE `12f9260`. Verificación: FE `npm test`, `npm run build` y lint dirigido sin problemas nuevos.
  - Extra de §8: patente duplicada → 409 (BE `bf19325`, `test/vehiculo-tipo.test.js`) y `revocarRefreshTokensAsync` (más sus dos helpers del repositorio) eliminados por no tener llamadores (BE `af9b622`).
  - Queda como deuda **documentada y fuera de alcance**: PUT parciales heredados (`api-errores.md` §6), `/me` vs. login (`api.md` §5), códigos de services listados a mano (`api.md` §7).
- [x] **T7.6 Sesión 2 — limpieza encontrada al verificar** (2026-11-17)
  - `test/conflicto-repository.test.js` (agregado en `ef940a1`) no corría: mockeaba `db.js` con `exports`, opción que `mock.module` no reconoce. Ahora usa `defaultExport`; sus 4 casos pasan sobre PGlite y confirman la corrección de placeholders de `ef940a1`. BE `ef0a46d`.
  - `cookies.txt` versionado en la raíz del BE, sin uso: eliminado (BE `99677e5`). Si tenía sesiones reales, rotarlas (quedan en el historial).
  - Lint del FE: `.agents/` (scripts de skills de terceros) excluido en `eslint.config.js`; `npm run lint` pasa de 112 a 63 problemas, todos preexistentes. FE `454f232`.
- [x] **T7.7 Perfiles: guardado de teléfono y contraseña** (2026-11-17, pedido del dueño; mejora de UX fuera del plan original)
  - Aceptación: si falla el cambio de contraseña no se guarda el teléfono; si la contraseña se guardó y falla el teléfono, la pantalla lo dice y cierra la sesión (el backend ya la revocó); solo se envía lo que cambió; el error muestra el mensaje del backend, no el genérico de axios.
  - Hecho: `src/helpers/perfilGuardado.js` (`guardarCambiosPerfil`, `mensajeErrorServidor`) usado por `perfil_empleado.jsx` y `perfil_dueño_garage.jsx`. No se usó un solo `PUT` con la contraseña porque ese camino no revoca sesiones ni avisa por correo, y `PATCH …/contrasenia` sí.
  - Verificación: `src/helpers/perfilGuardado.test.js` (4 tests); FE `npm test` 125 ok, `npm run build` OK, lint dirigido sin problemas nuevos. Falta probarlo en el navegador (T7.2).
- [x] **T7.8 Auditoría final contra el Informe Docente 2.3** (2026-11-17): se repasaron los 13 hallazgos de API REST contra el código de `api-rest-improvement`. Dos seguían abiertos aunque la tabla los daba por resueltos:
  - [BAJO] `paymentController` "agrupa tres causas bajo un 403" (preferencia de reserva): ahora 409 `RESERVATION_HOLD_EXPIRED` / 404 / 409, y el `UPDATE` que expira la retención filtra por el empleado. BE `20fca6a`, `test/payment-preference-reserva.test.js`.
  - [ALTO, patrón] "elijan un PUT y manden un solo campo": `PUT /api/conflicto/:id {estado}` dejaba `id_usuario`, `descripcion` y `prioridad` en `NULL`. El service combina con la fila actual. BE `def75d9`, `test/conflicto-put-parcial.test.js` (PGlite). Los otros cinco PUT heredados ya combinaban.
  - Quedan, conscientes y documentados: `/:id/cancel` de reserva sin renombrar (no se renombran rutas existentes), `/me` vs. login (documentado en `api.md` §5), PUT heredados sin migrar a `PATCH` (no pisan columnas).
  - Verificación: BE `npm test` 806 / 797 ok / 0 fallos / 9 skipped. **`master` sigue en `447f4c5`**: estos 3 commits están solo en `api-rest-improvement` hasta que el dueño apruebe el fast-forward.
- [ ] **T7.5 Actualizar la tabla final de `docs/plans-franC/api-errores.md`, `estado-api-rest.md` y la bitácora** al cerrar.
