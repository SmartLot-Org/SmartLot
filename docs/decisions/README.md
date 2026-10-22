# Decisiones arquitectónicas (ADRs) — SmartLot Frontend

Los ADRs registran decisiones técnicas significativas: contexto, decisión, alternativas y consecuencias. Explican el **porqué**, que el código por sí solo no muestra.

## Convención

- Ubicación: `docs/decisions/`.
- Nombre: `ADR-XXX-titulo-en-minusculas.md`, numeración secuencial, sin reiniciar.
- Idioma: español.
- Estados: `Propuesto` | `Aceptado` | `Reemplazado por ADR-XXX` | `Obsoleto`.
- **No se borran**: cuando una decisión cambia, se escribe un ADR nuevo que referencia y reemplaza al anterior.

## Cuándo escribir uno

- Elección de framework, librería o dependencia mayor.
- Modelo de datos, autenticación o arquitectura de API.
- Cualquier decisión costosa de revertir.

## Nota sobre ADRs retrospectivos

Los ADRs de esta carpeta son **retrospectivos**: documentan decisiones ya implementadas, reconstruidas a partir del código y de los documentos del repositorio (2026-10-09) — excepto **ADR-007** (2026-10-10), **ADR-008** (2026-10-12) y **ADR-010** (2026-10-22), que registran decisiones vivas tomadas durante la ejecución de la auditoría UI, y **ADR-009** (2026-10-22), una propuesta pendiente de decisión del dueño. El contexto refleja lo verificable; las alternativas listadas son las razonables en el momento de la decisión, no un registro literal de la discusión original.

## Índice

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](./ADR-001-spa-react-vite-vercel.md) | SPA con React + Vite desplegada como estático en Vercel | Aceptado |
| [ADR-002](./ADR-002-sesion-cookies-refresh-automatico.md) | Sesión por cookies con refresh automático y cola de reintentos | Aceptado |
| [ADR-003](./ADR-003-roles-nombres-canonicos-ids-historicos.md) | Roles por nombre canónico con compatibilidad de IDs históricos | Aceptado |
| [ADR-004](./ADR-004-cliente-http-unico-cache-prefijos.md) | Cliente HTTP único y caché en memoria con invalidación por prefijos | Aceptado |
| [ADR-005](./ADR-005-sistema-diseno-azul-senal.md) | Sistema de diseño "Azul Señal" con tokens de Tailwind v4 | Aceptado |
| [ADR-006](./ADR-006-code-splitting-por-ruta.md) | Code splitting por ruta e imports diferidos de dependencias pesadas | Aceptado |
| [ADR-007](./ADR-007-paleta-propia-superadmin.md) | Paleta propia del panel superadmin (excepción deliberada a la Regla del Token) | Aceptado |
| [ADR-008](./ADR-008-terminologia-plazas-ui-producto.md) | Terminología "plazas" en la UI de producto (copy unificado; campos de API intactos) | Aceptado |
| [ADR-009](./ADR-009-overlay-modales-producto-sin-blur.md) | Overlay de los modales de producto sin blur (cumplir la Regla del Vidrio Solo Landing) | **Propuesto** (espera al dueño) |
| [ADR-010](./ADR-010-verificacion-runtime-perfil-aislado-cdp.md) | Verificación runtime de la auditoría con perfil de navegador aislado y CDP, solo lectura | Aceptado |
