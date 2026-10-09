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

Los ADRs de esta carpeta son **retrospectivos**: documentan decisiones ya implementadas, reconstruidas a partir del código y de los documentos del repositorio (2026-10-09). El contexto refleja lo verificable; las alternativas listadas son las razonables en el momento de la decisión, no un registro literal de la discusión original.

## Índice

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](./ADR-001-spa-react-vite-vercel.md) | SPA con React + Vite desplegada como estático en Vercel | Aceptado |
| [ADR-002](./ADR-002-sesion-cookies-refresh-automatico.md) | Sesión por cookies con refresh automático y cola de reintentos | Aceptado |
| [ADR-003](./ADR-003-roles-nombres-canonicos-ids-historicos.md) | Roles por nombre canónico con compatibilidad de IDs históricos | Aceptado |
| [ADR-004](./ADR-004-cliente-http-unico-cache-prefijos.md) | Cliente HTTP único y caché en memoria con invalidación por prefijos | Aceptado |
| [ADR-005](./ADR-005-sistema-diseno-azul-senal.md) | Sistema de diseño "Azul Señal" con tokens de Tailwind v4 | Aceptado |
| [ADR-006](./ADR-006-code-splitting-por-ruta.md) | Code splitting por ruta e imports diferidos de dependencias pesadas | Aceptado |
