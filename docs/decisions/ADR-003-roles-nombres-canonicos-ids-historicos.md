# ADR-003: Roles por nombre canónico con compatibilidad de IDs históricos

## Estado

Aceptado.

## Fecha

2026-10-09.

## Contexto

La API expone el rol como nombre (`tipo_rol`) en algunas respuestas y como ID numérico (`id_rol`) en otras; históricamente los IDs fueron admin 1, empleado 2, garagista 3, superadmin 4 y dueño de garage 5. Además existe el alias legacy `smartlot` para superadmin y hace falta distinguir admin de empresa (sin sede) de admin de sede (con sede) sin duplicar lógica en cada vista. Evidencia: `src/helpers/roles.js`, `src/components/ProtectedRoute.jsx`, `src/App.jsx`.

## Decisión

Centralizar todo en `src/helpers/roles.js`:

- `ROLE_NAMES` con nombres canónicos: `admin`, `empleado`, `garagista`, `superadmin`, `dueño_garage`.
- `HISTORICAL_ROLE_IDS` para aceptar roles numéricos y `normalizeRoleName` con alias (`smartlot` → `superadmin`).
- Helpers `userHasRole` (acepta número o nombre), `isEmpresaAdmin`, `isSedeAdmin`, `getUserHomeRoute`, `getUserProfileRoute`, `getUserRoleLabel`.

`ProtectedRoute` usa estos helpers, por lo que `allowedRoles` puede mezclar `[1]`, `["admin"]` o `["dueño_garage"]`.

## Alternativas consideradas

### Comparar strings/IDs sueltos en cada vista
- Pros: cero indirección.
- Contras: frágil ante renombres o nuevos roles; reglas duplicadas.
- Rechazada.

### Migrar de una vez todos los checks a nombres
- Pros: homogéneo.
- Contras: riesgo de romper rutas por respuestas que aún traen `id_rol`; no aporta al usuario.
- Rechazada: se prefirió compatibilidad y migración incremental.

### Guardar el rol en un contexto global
- Pros: un solo lugar de lectura.
- Contras: el rol ya viene en `usuario`; no agrega valor real.
- Rechazada.

## Consecuencias

- Todo código nuevo debe usar los helpers de `roles.js`, nunca `usuario.id_rol === 1` hardcodeado.
- Si el backend agrega o renombra roles, el único archivo a tocar es `roles.js` (más sus tests).
- La distinción empresa/sede es lógica del frontend basada en `id_sede`; el backend sigue validando.
- Los tests de `src/helpers/roles.test.js` protegen esta lógica.
