# ADR-010: La verificación de pagos es una acción `POST`; las fallas del proveedor son `502`

## Estado

Aceptado.

## Fecha

2026-10-25.

## Contexto

Informe docente 2.3 (MEDIO): "GET con efectos secundarios en pagos". `GET /api/payments/:paymentId` y `GET /api/payments?external_reference=` consultaban a Mercado Pago **y escribían** en `pagos` (`updateAuthorizedLocalPayment`, `synchronizeByReference`). Un `GET` que escribe rompe la semántica HTTP (caches, reintentos, prefetch, crawlers) y mezcla autorización de lectura con una acción.

Otros problemas del mismo módulo:

- `paymentController` usaba otro "dialecto": `try/catch + next` en las 6 rutas, mensajes en inglés (`'Items array is required'`), cuerpos `{ error: 'Invalid signature' }` y un 404 armado a mano.
- Los errores del SDK de Mercado Pago se reenviaban con su propio status. Un 401/403 del proveedor (credenciales de la app mal configuradas) llegaba al frontend como 401, y el interceptor de ADR-002/ADR-004 lo lee como **sesión vencida**: dispara refresh y puede cerrar la sesión del usuario por un problema ajeno a él.
- SEG-08 (webhook autenticado) fijó `400 { error: "Invalid signature" }` para la firma inválida.

## Decisión

1. **Los `GET` de pagos son lectura pura** del estado local ya autorizado: no consultan a Mercado Pago ni escriben.
2. **La sincronización es una acción `POST`** con la misma autorización (roles 1, 2, 4 + reglas de `paymentReadService`):
   - `POST /api/payments/:paymentId/verificar` (cuerpo opcional `{ externalReference, preferenceId }` para correlacionar un pago aún no vinculado).
   - `POST /api/payments/verificar` (cuerpo `{ externalReference, preferenceId? }`; sincroniza y devuelve el listado local resultante).
3. **Toda falla del proveedor es `502`** con `code: "MP_UPSTREAM_ERROR"` y mensaje genérico; el status del SDK no se reenvía. La única excepción es "pago no encontrado" (`404`, `payment_not_found`).
4. **El webhook usa el formato de error estándar:** firma inválida → `401 "Firma de webhook inválida."` (antes 400), sobre inválido → `400`, sin secreto → `503`. Este ADR **modifica el contrato de SEG-08** para la firma inválida.
5. El controller de pagos adopta las convenciones del resto (ADR-008): sin `try/catch + next` (se conserva solo el `catch` del webhook que marca el evento con error y relanza), mensajes en español.

## Alternativas consideradas

### Mantener el `GET` y documentar el efecto secundario
- Pros: el frontend no cambia.
- Contras: un `GET` que escribe sigue siendo un defecto de diseño señalado por el informe.
- Rechazada.

### Quitar la sincronización de la API y dejarla solo al webhook
- Pros: sin acción manual.
- Contras: en desarrollo local el webhook no llega, y el retorno del pago necesita confirmar el estado enseguida (el frontend lo hace al volver de Checkout Pro).
- Rechazada.

### `PUT`/`PATCH` sobre `/payments/:id` para sincronizar
- Pros: parece "actualizar el recurso".
- Contras: el cliente no envía una representación nueva; es una orden de verificación, no una modificación de datos.
- Rechazada: un verbo de acción (`/verificar`) con `POST` es más honesto.

### Reenviar el status del proveedor pero con un `code` distinto
- Pros: no cambia el status.
- Contras: el interceptor decide por el status; el 401 ajeno seguiría disparando el refresh.
- Rechazada.

## Consecuencias

- **El frontend cambia en `src/servicies/API_Pagos.js`:** `PagosGetById` pasa a `POST /api/payments/:id/verificar` y `PagosBuscar` con `external_reference` primero verifica (`POST /api/payments/verificar`) y luego lista. Los nombres exportados no cambian para no tocar las cuatro pantallas que los usan; `PagosGetById` ya no describe lo que hace (candidata a renombrarse `PagosVerificar`).
- `GET /api/payments/:paymentId` devuelve 404 mientras el pago no se haya sincronizado; la pantalla de retorno debe verificar con el `POST`.
- Los tests de pagos del backend se reescribieron: las verificaciones usan `POST`; se agregaron pruebas de que ningún `GET` toca el proveedor ni `pagos`.
- Documentos actualizados: `SEG-03.md`, `SEG-08.md`, `seg03-provider-observations.md`, `frontend-mercadopago.md`, `mercado-pago-schema.md`.
- Un fallo de Mercado Pago deja de poder cerrar la sesión del usuario.
