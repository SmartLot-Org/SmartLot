# ADR-006: Code splitting por ruta e imports diferidos de dependencias pesadas

## Estado

Aceptado.

## Fecha

2026-10-09.

## Contexto

La app routea ~48 vistas, muchas de ellas paneles que un usuario promedio nunca abre. Un bundle único obligaría a todos a descargar el código de todos los roles, además de dependencias pesadas (SweetAlert2 ~50 kB gzip, Google Maps, GSAP, ExcelJS, jsPDF). Evidencia: `src/App.jsx` (comentarios de `lazy`/eager), `src/api/client.js` (import dinámico de SweetAlert2), `src/contexts/GoogleMapsProvider.jsx` (carga bajo demanda).

## Decisión

- Todas las vistas se registran con `lazy()` y se renderizan dentro de `<Suspense fallback={<RouteFallback />}>`, **excepto la Landing**, que se importa eager para evitar un round-trip antes del primer paint.
- Dependencias pesadas se importan dinámicamente en el punto de uso: SweetAlert2 en el interceptor de errores; el SDK de Google Maps solo cuando una vista llama `requestMapsLoad()`.
- La configuración del loader de Google Maps es única y centralizada (`GoogleMapsProvider`), con idioma `es` y región `AR`.

## Alternativas consideradas

### Bundle único
- Pros: simple; sin flashes de carga entre rutas.
- Contras: descarga inicial enorme con código que el usuario no usará.
- Rechazada.

### Precarga agresiva de todos los chunks
- Pros: navegación instantánea posterior.
- Contras: contradice el objetivo de arranque liviano; desperdicia datos móviles.
- Rechazada: Vite ya hace precarga inteligente de chunks enlazados.

### Cargar Google Maps globalmente al iniciar
- Pros: sin espera al abrir un mapa.
- Contras: costo de red para usuarios que nunca ven un mapa.
- Rechazada.

## Consecuencias

- Al agregar una vista, **debe** registrarse con `lazy()` y actualizar la tabla de `docs/architecture.md`.
- Aparece un fallback breve (`RouteFallback`) al navegar por primera vez a cada chunk.
- Persiste una advertencia de Vite por chunks >500 kB (deuda conocida, ver `docs/reservation-limit.md`).
- `Landing` es la única excepción deliberada al patrón lazy.
