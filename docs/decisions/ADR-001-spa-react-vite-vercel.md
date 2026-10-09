# ADR-001: SPA con React + Vite desplegada como estático en Vercel

## Estado

Aceptado.

## Fecha

2026-10-09.

## Contexto

SmartLot es un producto con paneles autenticados (empleado, garagista, admin, dueño de garage, superadmin) más una landing pública. El backend ya existe como API REST separada (`SmartLot_API`). El equipo es chico y no hay requisitos de SSR ni de contenido dinámico indexable: la landing es informativa y los paneles viven detrás de login. Evidencia: `vite.config.js`, `vercel.json`, `src/App.jsx`.

## Decisión

Construir el frontend como SPA con React 19 y Vite 8, generar un build estático (`dist/`) y desplegarlo en Vercel con rewrite de todas las rutas a `index.html` para que funcione el router del lado del cliente.

## Alternativas consideradas

### Next.js (SSR/SSG)
- Pros: SEO y primer paint mejores; rutas con file-system.
- Contras: complejidad adicional (servidor Node, convenciones) no justificada por paneles autenticados.
- Rechazada: la landing cabía con meta tags estáticos en `index.html`.

### Create React App
- Pros: ecosistema conocido.
- Contras: herramienta sin mantenimiento activo y sin Tailwind v4 integrado.
- Rechazada: Vite ofrece build más rápido y configuración moderna.

### Servir el SPA desde el backend
- Pros: un solo despliegue.
- Contras: acopla ciclos de release del API y de la UI; el backend ya se despliega aparte.
- Rechazada: se prefirió separación de despliegues.

## Consecuencias

- Las rutas profundas dependen del rewrite de `vercel.json`; sin él, un refresh en `/admin_pagos` daría 404.
- SEO limitado: solo la landing con meta tags estáticos (`index.html`).
- Assets con caché inmutable (`/assets/*`) y liberación de versiones sin servidor.
- El code splitting pasa a ser responsabilidad del frontend (ver ADR-006).
- `VITE_API_URL` debe ser HTTPS en producción; `src/api/client.js` lo advierte.
