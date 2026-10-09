# ADR-004: Cliente HTTP único y caché en memoria con invalidación por prefijos

## Estado

Aceptado.

## Fecha

2026-10-09.

## Contexto

La app tiene decenas de vistas que consumen la misma API REST. Se necesitaba: manejo uniforme de errores y toasts, refresh de sesión (ADR-002), datos frescos tras cada mutación y evitar requests duplicadas cuando varios componentes piden lo mismo a la vez. Ya existía el patrón de servicios `API_*.js`. Evidencia: `src/api/client.js`, `src/cache/cacheStore.js`, `src/servicies/API_Reserva.js`.

## Decisión

Un único cliente Axios (`src/api/client.js`) con interceptores que concentran refresh, toasts e invalidación de caché. Una caché en memoria (`src/cache/cacheStore.js`) con:

- TTL por entrada (configurable por servicio, p. ej. 15 s en reservas).
- Deduplicación de requests en vuelo por clave (`pendingRequests`).
- Invalidación por clave exacta o por prefijo; cada recurso usa prefijos estables (`reservas:`, `usuarios:`, `garages:`, `tratos:`, `notificaciones:`, ...).
- `clearCache()` global para login/logout/impersonate.

El mapeo mutación → prefijos invalidados vive centralizado en el interceptor de `client.js`.

## Alternativas consideradas

### React Query / SWR
- Pros: caché, reintentos y estados de carga listos.
- Contras: dependencia adicional que reemplaza un patrón ya maduro del proyecto; migración amplia.
- Rechazada: el equipo prefirió el store propio con reglas explícitas.

### `fetch`/axios por vista sin capa común
- Pros: menos abstracción.
- Contras: errores, refresh y frescura inconsistentes entre pantallas.
- Rechazada.

### Invalidación total de caché en cada mutación
- Pros: simple y siempre fresca.
- Contras: recarga innecesaria de datos no relacionados.
- Rechazada: la invalidación por prefijos es más precisa.

## Consecuencias

- La caché es por pestaña y se pierde al recargar (no es persistente).
- Al agregar un recurso o endpoint, hay que elegir su prefijo de clave y registrar en `invalidateCacheForMutation` qué prefijos invalida cada mutación.
- `/superadmin/cache` permite inspeccionar y limpiar la caché (`getCacheStats`, `getCacheEntries`).
- Los servicios no deben llamar `axios` directo: siempre `apiClient`.
