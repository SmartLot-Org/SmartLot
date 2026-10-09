# ADR-002: Sesión por cookies con refresh automático y cola de reintentos

## Estado

Aceptado.

## Fecha

2026-10-09.

## Contexto

La app maneja datos sensibles (pagos, reservas, personal) y funciona como SPA. Un token accesible por JavaScript queda expuesto a XSS. El backend emite cookies de sesión. Hacía falta además una experiencia que no expulse al usuario ante expiraciones normales, evitando múltiples refreshes concurrentes cuando varias pantallas hacen requests a la vez. Evidencia: `src/api/client.js`, `src/contexts/AuthProvider.jsx`, `src/api/token.js`.

## Decisión

Usar la cookie de sesión del backend (`withCredentials: true`) como única credencial: el frontend no almacena tokens. Ante un 401, `apiClient` ejecuta un único `POST /api/usuario/refresh`, encola las requests concurrentes (`failedQueue`) y las reintenta cuando el refresh termina. Si el refresh falla, se limpia la caché, se emite `smartlot:session-expired` y se navega a `/login`.

## Alternativas consideradas

### JWT en `localStorage`
- Pros: simple; no depende de cookies.
- Contras: accesible desde JavaScript, vulnerable a XSS.
- Rechazada: cookies del backend ya disponibles y más seguras.

### JWT en memoria con renovación proactiva por temporizador
- Pros: evita el 401 inicial.
- Contras: se pierde al recargar; relojes/desfases generan renovaciones innecesarias o tardías.
- Rechazada: el refresh reactivo con cola cubre el caso real.

### Expulsar al usuario en cada 401
- Pros: implementación trivial.
- Contras: mala experiencia con expiraciones normales.
- Rechazada.

## Consecuencias

- El frontend nunca ve el token; la seguridad depende de flags de cookie del backend (HttpOnly, SameSite).
- Los flags por request `_skipAuthRedirect` y `_skipToast` existen para casos especiales (arranque de sesión, requests silenciosas); documentados en `docs/architecture.md`.
- La impersonación de superadmin necesita persistir estado de UI entre recargas, por lo que guarda el usuario impersonado (no credenciales) en cookies propias de primer origen (`src/helpers/superadminSession.js`).
- Login/logout/impersonate limpian la caché completa para no filtrar datos entre sesiones.
