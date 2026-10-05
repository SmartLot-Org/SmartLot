# Límite de reservas por empleado — revisión del 5 de octubre de 2026

Se revisaron los checkouts locales de SmartLot y SmartLot_API, incluyendo su estado de trabajo. El backend ya incluía la implementación y la migración. En este trabajo se completó el frontend; no se cambiaron código backend, Mercado Pago, webhooks ni Supabase remoto. No se ejecutó pull, reset, checkout ni se descartaron cambios.

## Comportamiento y backend revisado

- `NULL`: sin máximo; `0`: bloquear nuevas reservas; entero entre 1 y 32767: máximo global por empleado, independiente del garage, trato, cupo y responsable de pago.
- Una reserva cuenta si `Borrado = false` y cumple alguna condición: pendiente de pago con `retencion_pago_hasta > NOW()`; o confirmada con `salio = false` y (`fecha_salida >= NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires'` o `entro = true`). Las fechas de reserva conservan timestamps sin zona con hora argentina; la retención es timestamptz.
- Bajar el límite no cancela ni modifica reservas o pagos existentes. Guardar `NULL` elimina el máximo.
- `PATCH /api/usuario/:id/limite-reservas`, body `{ "limiteReservasActivas": 2 }` o `null`. Rechaza valores omitidos, strings, decimales, negativos y valores fuera de smallint. Responde solamente `idUsuario` y `limiteReservasActivas`; actualiza `UpdateBy` y `UpdateAt`.
- Usa JWT y los middlewares/roles actuales. Administrador general: empleados activos de su empresa; administrador con sede: además la misma sede; superadmin: todas las empresas. Un empleado no puede configurar el límite. La identidad y el tenant salen de `req.usuario`, no del body/query. Respuestas 400/401/403/404 según validación, sesión, autorización o empleado inexistente.
- La creación transaccional expira retenciones, bloquea `usuarios` con `FOR UPDATE OF u`, lee el límite y cuenta reservas en otra consulta posterior al bloqueo. El lock se mantiene hasta COMMIT/ROLLBACK. La segunda creación concurrente espera y cuenta el insert ya confirmado. También se serializa la actualización administrativa del límite.
- Al alcanzar el máximo devuelve 409 y `RESERVATION_LIMIT_REACHED` con `details.limit/current`. Los errores de conteo se propagan. La regla diaria hardcodeada ya fue eliminada.
- La cotización informa `politicaReservas`; no sustituye la validación de creación. La edición conserva un único lugar y no puede reactivar reservas no vigentes ni modificar estado/pago/titular mediante el PUT.

Migración **ya existente**, conservada y probada dos veces sobre PostgreSQL local: `SmartLot_API/migrations/20261001_001_add_user_active_reservation_limit.sql`. Documenta `20261001123359_add_user_active_reservation_limit`, usa columna/índice `IF NOT EXISTS` y comprobación de constraint. No se creó otra migración ni tabla equivalente.

## Cambios frontend

- `src/vistasAdmin/gestion_de_empleados.jsx`: indicador por empleado, acción y modal de configuración. Permite sin límite, entero, cero, guardar/cancelar, loading y errores reales. Bloquea doble envío y cierre durante el guardado. Usa la respuesta del PATCH para actualizar sólo el empleado, sin recargar la aplicación.
- `src/servicies/API_Usuario.js`: `UsuariosPatchLimiteReservas`, usando apiClient, body con lista blanca e invalidación sólo del prefijo `usuarios:`. Conserva mensajes de error del servidor.
- `src/vistasAdmin/agregar_empleado.jsx`: configuración opcional; inicia sin límite y envía `null`.
- `src/componentesAdmin/ReservationLimitFields.jsx` y `.css`: controles compartidos entre alta y edición, con estilos responsive del modal.
- `src/helpers/reservationPolicy.js`: validación del input, etiquetas y mensajes de política/error.
- `src/helpers/reservationPolicy.test.js`: cuatro pruebas de validación, etiquetas, código de error y cotización.
- `src/helpers/erroresMensajes.js`: interpreta `RESERVATION_LIMIT_REACHED` antes de los patrones genéricos; elimina el mensaje de dos reservas diarias.
- `src/vistasEmpleados/nueva_reserva.jsx`: muestra vigentes/restantes de la cotización y mensaje de bloqueo para cero. Usa el mensaje específico tanto en creación corporativa como al retener un lugar pago. Conserva la reutilización de retenciones vigentes al volver del checkout.

React continúa usando exclusivamente la API. Se conservan rutas, navegación, headers, sidebars y las animaciones existentes.

## Verificación de esta revisión

| Comando | Resultado |
| --- | --- |
| Backend: pruebas dirigidas de política, repositorio e integración PostgreSQL | 23 aprobadas, ninguna fallida u omitida |
| Backend: todos los archivos test excepto mp-integration.test.js | 213 aprobadas, ninguna fallida u omitida |
| Backend: npm test completo | 215 aprobadas, 3 fallidas, 3 omitidas |
| Backend: npm run check:syntax | Aprobado |
| Backend: npm run check:routes | Aprobado |
| Backend: npm run check:security | Falló por hallazgos preexistentes detallados abajo |
| Frontend: npm test | 100 aprobadas, ninguna fallida u omitida |
| Frontend: npm run lint | 113 errores y 6 advertencias preexistentes; ninguno en archivos modificados |
| Frontend: ESLint dirigido de los ocho archivos JS/JSX nuevos o modificados | Aprobado |
| Frontend: npm run build | Aprobado; advertencia de chunks mayores a 500 kB |
| Ambos: git diff --check | Aprobado |

Las pruebas PostgreSQL usaron un servidor temporal local en 127.0.0.1:55439, sesión UTC y esquemas aislados, eliminados al terminar. Incluyen NULL/cero/dos, retenciones válidas/vencidas, futuras/en uso/completadas/canceladas/expiradas/borradas, garages propios/externos, pagos empresa/empleado, cupos/extra, disminución/NULL/auditoría, edición, concurrencia real HTTP y espera observada del lock, autorización por empresa/sede y regresiones de vehículo/tipo/tarifa/solapamiento/capacidad/trato. Se ejecutaron también las suites existentes de pagos, QR y cuentas corrientes.

`npm test` se ejecutó con DATABASE_URL local, token MP sin credenciales y un preload temporal que bloqueaba fetch externo. Fallos de `test/mp-integration.test.js`, archivo sin modificar:

- Línea 41: `crea preferencia de pago real y devuelve init_point`, MPConnectionError: External HTTP disabled for local verification.
- Línea 55: `busca pagos reales por external_reference`, mismo error.
- Línea 120: `webhook HTTP con firma valida pero pago inexistente marca el evento con error`, esperaba 404 y obtuvo 500 porque falta `webhook_eventos` en la base local. No se alteraron tablas/webhooks para esa integración. Tres casos que requieren credenciales MP quedaron omitidos.

`check:security` reportó templates SQL en `solicitudEmpresaGarageRepository.js:86,91,97` y `tratoEmpresaGarageRepository.js:16,17,18,21,22`, un log en `mpService.js:126` y la presencia del .env local. Ninguno fue modificado. El chequeo heurístico no equivale a confirmar vulnerabilidades.

Archivos con errores/advertencias del lint global, todos sin modificar:

| Archivo | Errores | Advertencias |
| --- | --- | --- |
| .agents/skills/impeccable/scripts/live-browser-dom.js | 1 | 0 |
| .agents/skills/impeccable/scripts/live-browser.js | 38 | 0 |
| .agents/skills/impeccable/scripts/modern-screenshot.umd.js | 10 | 0 |
| src/componentesAdmin/admin_dashboard_boton.jsx | 3 | 0 |
| src/componentesAdmin/boton_generico.jsx | 1 | 0 |
| src/componentesAdmin/boton_reportes.jsx | 1 | 0 |
| src/componentesAdmin/formulario_infoPersonal.jsx | 2 | 0 |
| src/componentesCompartidos/ModalPortal.jsx | 1 | 0 |
| src/componentesDueñoGarage/tarjeta_garage_dueño.jsx | 3 | 0 |
| src/componentesEmpleado/formulario_detalles_vehiculo.jsx | 2 | 0 |
| src/componentesEmpleado/modal_editar_reserva.jsx | 0 | 2 |
| src/componentesLanding/landing/BentoGrid.jsx | 1 | 0 |
| src/componentesShared/ToastUndo.jsx | 0 | 1 |
| src/componentesSuperadmin/superadmin_dashboard_boton.jsx | 3 | 0 |
| src/pages/PaymentStatus.jsx | 4 | 0 |
| src/vistasAdmin/admin_dashboard.jsx | 1 | 0 |
| src/vistasAdmin/admin_pagos.jsx | 3 | 1 |
| src/vistasAdmin/perfil_admin.jsx | 3 | 0 |
| src/vistasEmpleados/empleados_dashboard.jsx | 11 | 1 |
| src/vistasEmpleados/historial_reserva.jsx | 2 | 0 |
| src/vistasEmpleados/perfil_empleado.jsx | 5 | 0 |
| src/vistasSuperadmin/gestion_usuarios.jsx | 12 | 0 |
| src/vistasSuperadmin/superadmin_pagos_test.jsx | 6 | 1 |

## Pendiente

No se ejecutó verificación manual en navegador ni checkout real de Mercado Pago. Quedan esas verificaciones en un entorno adecuado y los hallazgos globales de lint/seguridad fuera del alcance de esta funcionalidad. No hay decisiones funcionales pendientes.
