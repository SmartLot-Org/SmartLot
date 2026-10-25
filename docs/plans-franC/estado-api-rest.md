# Estado del plan "API REST" — traspaso entre sesiones

> **Última actualización:** 2026-10-25, cierre de la Fase 6 (sesión 1). Documento vivo: se actualiza al cerrar cada punto (protocolo en [`README.md`](./README.md)).
> **Si el árbol real contradice este documento, gana el árbol:** corregir acá y anotarlo en la bitácora.

## 1. Resumen

- **Objetivo:** subir API REST de 6/10 a 8/10 (+0,26 en la ponderada) cerrando los 3 hallazgos ALTO y todos los MEDIO del Informe Docente 2.3 y publicando un contrato verificable. Plan: [`plan-api-rest.md`](./plan-api-rest.md).
- **Avance:** Fases **1 a 6 implementadas y verificadas** (backend + los cambios mínimos del frontend). Queda el **cierre administrativo**: autorización de commits, columna "Resuelto en" con hashes, prueba manual y decisiones sobre la deuda.
- **Commiteado y pusheado el 2026-10-25** (autorizado por el dueño): ver sección 12.
- **Estado de las pruebas:** backend 792 tests, 788 ok, 0 fallos, 4 skipped (línea base al empezar: 668 / 663 ok / 1 fallo / 4 skipped). Frontend 121/121.

## 2. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Frontend (este repo) | `C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot` — rama `docs/plan-api-rest` |
| Backend `SmartLot_API` | `C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot_API\SmartLot_API` — rama `api-rest-improvement` |
| Raíz git del backend | `…\SmartLot_API` (un nivel arriba): en `git status`/`git diff` los paths salen como `SmartLot_API/src/...` |
| Ruta del plan para el backend | El plan dice `C:\Users\49123639\SmartLot_API\SmartLot_API\src` (otra máquina). **En esta máquina es la de arriba.** |
| Plan y fuentes | Este directorio (`docs/plans-franC/`) |
| Entregables permanentes | Backend `docs/plans-franC/api-errores.md`; frontend `docs/decisions/ADR-008…011` (ver [`README.md`](./README.md)) |

## 3. Estado por fase

| Fase | Contenido | Estado | Evidencia |
|---|---|---|---|
| 0 | Línea base y preparación | ✅ | `npm install` en el backend (faltaba `@electric-sql/pglite`, declarado en el `package.json`/lockfile); 9 archivos de test SQL dejaron de fallar por módulo ausente |
| 1 | Errores que dicen la verdad (ALTO 1 y 3, MEDIO `authMiddleware`) | ✅ | `test/api-errores.test.js` (24 tests; 17 fallan contra el código anterior). ADR-008 |
| 2 | PUT vs PATCH (ALTO 2) | ✅ | `test/api-validacion.test.js`; tests SEG-04 de sede adaptados. ADR-009 |
| 3 | Validación de entrada homogénea (MEDIO) | ✅ | `test/api-validacion.test.js` (60 tests; 34 fallan contra el código anterior). ADR-011 |
| 4 | Pagos con las convenciones del resto (MEDIO) | ✅ (backend + `API_Pagos.js`) | `test/payment-read-access.test.js`, `payment-read-sql…`, `mp-webhook-auth…`, `mp-service…`; `npm run test:mp` verde. ADR-010 |
| 5 | BAJO: status puntuales, contrato, naming | ✅ (backend + 3 archivos del frontend) | `test/api-contrato.test.js` (14 tests) |
| 6 | Contrato publicado: `docs/plans-franC/api.md` + Postman | ✅ | `test/api-inventario.test.js` (9 tests); inventario de 137 endpoints generado del router real; Postman generado |
| Cierre | Commits, "Resuelto en", prueba manual, tabla final | ⏳ **Pendiente** | — |

Detalle tarea por tarea: [`tareas-api-rest.md`](./tareas-api-rest.md).

## 4. Cambios del trabajo (detalle por repo; ya commiteados, ver sección 12)

### Backend (`api-rest-improvement`): 72 archivos modificados + 11 nuevos

Nuevos: `src/helpers/httpError.js`, `src/helpers/httpStatus.js`, `docs/plans-franC/api-errores.md`, `docs/plans-franC/api.md`, `scripts/api-inventory.mjs`, `scripts/generate-api-inventory.mjs`, `scripts/generate-postman.mjs`, `test/api-errores.test.js`, `test/api-validacion.test.js`, `test/api-contrato.test.js`, `test/api-inventario.test.js`.

Modificados, por carpeta: `src/controllers` (16), `src/repositories` (13), `src/repos` (2), `src/services` (15), `src/helpers` (3), `src/middlewares` (3: `errorHandler`, `authMiddleware`, `rolesMiddleware` —este último solo suma metadato de roles—), `src/app.js`, `src/postman/SmartLot.postman_collection.json` (regenerada), `package.json` (2 scripts npm, **sin dependencias nuevas**), `test` (10 existentes adaptados), `docs` (6: SEG-03, SEG-08, seg03-provider-observations, frontend-mercadopago, mercado-pago-schema, seg04-tenant-writes) y `AGENTS.md`.

Tests existentes que se **modificaron** porque fijaban el comportamiento anterior (contratos que cambian a propósito): `password-login-sql.integration` (SEG-10A: `getByEmailAsync` ya no devuelve `null` ante error SQL), `tenant-writes-sql.integration` (sede: parcial → `PATCH`; alias de contraseña), `mp-webhook-auth`, `mp-controller`, `mp-integration`, `mp-service` (ampliado), `payment-read-access`, `payment-read-sql.integration`, `enterprise-payment-sql.integration` (GET → POST de verificación) y `solicitud-empresa-garage` (se eliminó un test de regex sobre el código fuente; lo cubre `api-contrato.test.js` por comportamiento).

### Frontend (`docs/plan-api-rest`)

Código (4 archivos, todos con el cambio mínimo del plan):

- `src/servicies/API_Pagos.js`: `PagosGetById` → `POST /api/payments/:id/verificar`; `PagosBuscar` con `external_reference` verifica (`POST /api/payments/verificar`) y luego lista.
- `src/vistasEmpleados/perfil_empleado.jsx` y `src/vistasDueñoGarage/perfil_dueño_garage.jsx`: ruta `…/contraseña` → `…/contrasenia`.
- `src/vistasAdmin/gestion_de_empleados.jsx`: se quitó el fallback a `limite_reservas_activas`.

Documentación: `docs/decisions/ADR-008…011` (nuevos) y `README.md` de decisiones; esta carpeta (`README`, `estado`, `tareas`, `bitácora` nuevos); `docs/index.md` y `AGENTS.md` (referencias). `docs/plans-franC/Devolucion-…` e `Informe-…` estaban sin trackear antes de empezar.

## 5. Verificación (comandos y resultados reales)

Backend (`cd C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot_API\SmartLot_API`):

| Comando | Resultado (2026-10-25) |
|---|---|
| `node --experimental-test-module-mocks --test --test-timeout=120000` (equivale a `npm test`) | 792 tests, **788 ok, 0 fallos, 4 skipped**, ~22 s |
| `npm run routes:inventory` / `npm run postman:generate` | 137 endpoints en 18 módulos; colección con 18 carpetas + 20 casos de error |
| `npm run test:mp` | 42 tests, 39 ok, 0 fallos, 3 skipped |
| `npm run check:syntax` | OK (100 archivos) |
| `npm run check:routes` | OK |

Frontend (`cd C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot`):

| Comando | Resultado |
|---|---|
| `npm test` | 121 ok |
| `npx eslint` sobre los 4 archivos tocados | 5 errores, **todos preexistentes** en `perfil_empleado.jsx` (idénticos en `HEAD`); los otros 3 archivos sin errores |
| `npm run build` | **No se corrió** (el cambio no es grande) |
| Prueba manual con `curl`/navegador (sección "Verificación" del plan) | **No se hizo** |

Línea base del backend al empezar: 668 tests, 663 ok, 1 fallo, 4 skipped. El único fallo (`webhook HTTP con firma valida pero pago inexistente…`) era una aserción desactualizada de `mp-integration.test.js` (faltaba `data.id` en la query desde SEG-08); se corrigió y ahora pasa.

## 6. Decisiones aceptadas (resumen; el porqué está en los ADRs)

- **ADR-008:** el repository no traga errores; un solo `errorHandler` traduce Postgres (`23505`/`23503` → 409; `23502`/`22P02`/`23514`/`22001`/`22003` → 400); un 5xx nunca borra la sesión; `authMiddleware` con la base caída responde 500.
- **ADR-009:** `PUT` = reemplazo completo (400 si falta un obligatorio), `PATCH` = parcial. `PUT /api/sede` conserva `id_empresa`/coordenadas no enviadas.
- **ADR-010:** los `GET` de pagos no escriben; la verificación es `POST …/verificar`; toda falla de Mercado Pago es 502 `MP_UPSTREAM_ERROR`; la firma inválida del webhook pasa a 401 (modifica SEG-08).
- **ADR-011:** los `:id` se validan con `router.param` (`idParam`), 400 antes del handler.

## 7. Desvíos respecto del plan (decididos durante la ejecución)

| # | Plan | Realidad / decisión |
|---|---|---|
| 1 | "74 `catch`… en 11 repos" | Eran 75 de una línea en 11 repos **más** variantes multilínea (sesiones y `getByEmail` de `usuarioRepository`, `usuarioGarageRepository`, `createWithClientAsync` de empresa, `EmailTemplateRepository`) que también trababan el error. Todos corregidos. |
| 2 | "se conserva el `42P01` de `cuentaCorrienteRepository.js:94`" | Esa referencia ya no existe en el código; no hay nada que conservar. |
| 3 | Quitar la limpieza de cookies en los 500 | Se removió de `errorHandler`; además se **conservaron** los middlewares de error por ruta de login y alta pública (ya no por las cookies, sino para que un error crudo de la base no se vuelva un 409 que revele si un correo existe: SEG-10A/10B). |
| 4 | `authMiddleware`: separar JWT de la consulta | Hecho. Además se corrigió `app.js`: el wrapper de `/api/payments` no devolvía la promesa de `authMiddleware`, así que una base caída dejaba el pedido colgado. |
| 5 | Fase 3: `router.param` | Además: `req.body ??= {}` en `app.js` (Express 5 lo deja `undefined` y daba `TypeError` → 500), mapeo `22003`, y validación de UUID en el refresh (una cookie de sesión alterada daba 400 al dejar de tragar errores; ahora es 401). |
| 6 | Fase 4: el webhook solo menciona la firma | Se llevó **todo** el webhook al formato estándar (503 sin secreto, 400 sobre inválido, 401 firma). Se removieron las comprobaciones muertas de `items`/`orderId` en `/preference` (siempre se sobrescriben) y se simplificó la ruta. |
| 7 | "Un 401/403 de MP pasa a 502" | Se aplicó a **toda** falla del SDK (también 400/429/5xx). El test viejo que esperaba 503 desde el proveedor ahora espera 502. |
| 8 | GET `/:paymentId` y `?external_reference` | Quedan puros; el GET por id **ya no acepta** el fallback `external_reference`/`preference_id` por query (eso es verificar, ahora va en el body del POST). |
| 9 | Fase 5: cambiar `ConfirmarSolicitud.source.test.js:35` | Esa línea afirma que la página no menciona la palabra "contraseña"; **no tiene relación** con la ruta. No se tocó. |
| 10 | "ya existe → 409" en `POST /garage/:id/dias` | El `INSERT … ON CONFLICT DO UPDATE` devolvía siempre una fila, así que "ya existe" era indetectable. Ahora reactiva solo un día inactivo (`WHERE activo = false`) y un día ya activo responde 409. |
| 11 | No previsto | `app.js`: ruta inexistente → 404 JSON (los alias retirados ahora devuelven 404 con el formato estándar). |
| 12 | Fase 6: inventario "con `scripts/check-routes.cjs` extendido" | `check-routes.cjs` solo valida con regex que `app.js` registre rutas; no puede leer roles. Se hizo un generador aparte que recorre el **router real** (con la base y el correo simulados) y `requireRole` expone sus roles como metadato. `check-routes.cjs` queda como estaba. |
| 13 | Fase 6: "actualizar" la colección Postman | La anterior (5 carpetas, sin auth, rutas viejas) se **reemplazó** por una generada desde el inventario. Si alguien editó esa colección a mano, su contenido se perdió (queda en el historial de git). |

## 8. Hallazgos y deuda fuera del alcance (para decidir)

- **`POST/PUT /api/modelo` no puede funcionar según `docs/schema.sql`:** `modelos.tipo_vehiculo` es `NOT NULL` y ni el repository ni el controller lo envían. El `catch` viejo escondía el error. Ahora devuelve 400 `DB_NOT_NULL_VIOLATION`. El frontend no usa estos endpoints. Falta decidir si se corrige (agregar `tipo_vehiculo` al alta, con trigger que impide cambiarlo).
- **Fuga de tenant retirada:** `GET /api/garage/:id/cercanos` consultaba la sede sin pasar el usuario (sin filtro de empresa). Se eliminó (el frontend usa `/cercanos`).
- **PUT parciales heredados sin migrar a PATCH:** `garage`, `vehiculo`, `usuario`, `reserva`, `conflicto`, `trato-empresa-garage` (documentado en `docs/plans-franC/api-errores.md` §6).
- `vehiculoService`: patente duplicada responde 400 (el resto de los duplicados usa 409). BAJO.
- Frontend: `TratosCreate` (`API_TratoEmpresaGarage.js`) sigue exportado sin llamadores y ahora el alta directa es solo superadmin → candidata a poda. `PagosGetById` ya no es un GET: conviene renombrarla a `PagosVerificar` (toca 4 pantallas).
- `test/mp-integration.test.js` golpea el sandbox real de Mercado Pago y la base real de `.env` dentro de `npm test`. Conviene aislarlo (o marcarlo como suite aparte).
- `revocarRefreshTokensAsync` en `usuarioService` no tiene llamadores.
- Diferencia `GET /api/usuario/me` (claims del token) vs. login (entidad de usuario): documentada en `docs/plans-franC/api.md` §5. Unificarlas toca `AuthProvider` (área frontend) y queda fuera del plan.
- El inventario no ve los códigos que lanzan los **services**: `docs/plans-franC/api.md` §7 los lista a mano para los endpoints principales; puede quedar corto.
- La colección Postman es generada: no se ejecutó con Postman/Newman contra un backend real.

## 9. Preguntas abiertas y aprobaciones pendientes

1. **¿Se autorizan los commits?** Propuesta: un commit por fase (1 a 5) en cada repo, y luego completar la columna "Resuelto en" de `docs/plans-franC/api-errores.md` con los hashes. Sin autorización explícita no se commitea.
2. **Prueba manual** (plan, sección Verificación): pendiente en el backend local con `curl` y recorrido en el frontend (perfil/cambio de contraseña, retorno de pago, gestión de empresas, marcas y sedes). La hace el dueño o se acuerda cómo hacerla.
3. **Modelo `tipo_vehiculo`** (sección 8): ¿se corrige dentro de este plan o se anota como deuda?
4. **Renombrar `PagosGetById` → `PagosVerificar`** y podar `TratosCreate`: ¿ahora o después?
5. ~~CodeGraph~~ **Resuelto:** se inicializó (`codegraph init -i`) en ambos repos (frontend 197 archivos; backend 140). `.codegraph/` es un índice local y se excluye en `.git/info/exclude` (no se versiona); tras cambios grandes, `codegraph sync`.

## 10. Trampas del entorno (para no redescubrirlas)

- **Fin de línea:** `core.autocrlf=true`. El índice guarda LF y el árbol CRLF. Al editar con scripts, preservar el fin de línea del archivo; con regex multilínea evitar `\s*` junto a `^` con flag `m` (JS trata `\r` como fin de línea y deja CR sueltos). `validatorHelper.js` termina en un `\r` suelto (preexistente; git lo trata como no-texto).
- **Los tests de `npm test` hablan con servicios reales** (`mp-integration`, que usa `.env`) y `emailService` abre su propio pool contra la base real al importarse: mockearlo siempre que un test importe `src/app.js`.
- **Un test que espera una promesa que nunca se resuelve cuelga la suite sin límite** (pasó con `enterprise-payment-sql`: usaba un GET que ya no llama al proveedor). Correr con `--test-timeout=120000`.
- Hay servidores del dueño corriendo: `npm run app` (backend, `node ./src/app.js`) y `npm run dev` (Vite). **No matarlos**: para limpiar una corrida de tests colgada, identificar el proceso por su línea de comandos (`--test`).
- `supabase` (MCP) falló al conectar en la sesión 1; no se usó. Ninguna comprobación se hizo contra Supabase.
- Los scripts de transformación usados (codemods) eran temporales y **no se conservaron**; el resultado está en el árbol y en los diffs.
- `git stash` en el repo del dueño: evitarlo (se usó una vez para comparar lint contra `HEAD`; se restauró y quedó vacío).

## 12. Commits y ramas

| Repo | Rama | Commits |
|---|---|---|
| Backend `SmartLot_API` | `api-rest-improvement` | `62cd310` código, tests y scripts · `6d22564` documentación (`docs/plans-franC/`, SEG-*, AGENTS.md) · un tercero con los hashes en la tabla de `api-errores.md` |
| Frontend `SmartLot` | `docs/plan-api-rest` | un commit con ADR-008…011, esta carpeta y los 4 cambios de código (`git log --oneline -3`) |

Se hicieron **2 commits en el backend en lugar de uno por fase**: los archivos se tocaron en varias fases y no se podían separar sin reconstruir cada una. Los documentos del backend viven ahora en `docs/plans-franC/` (`api-errores.md`, `api.md`); `AGENTS.md` se quedó en la raíz del backend porque las herramientas de agentes lo cargan desde ahí.

## 11. Próximo paso exacto

Quedan solo tareas que **requieren al dueño** (ver `tareas-api-rest.md` → Cierre):

1. ~~Autorización de commits (T7.1)~~ Hecho (sección 12).
2. Hacer (o acordar cómo hacer) la prueba manual (T7.2), incluyendo correr la colección Postman contra el backend local.
3. Decidir la deuda de las secciones 8 y 9 (T7.4).
4. Al cerrar: actualizar este documento, la bitácora y la nota de memoria del proyecto.
