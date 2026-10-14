# Auditoría UI de SmartLot — índice y estado

> **Empezá por acá.** Esta carpeta es el handoff completo de la auditoría UI (48 vistas + shell global)
> y de la ejecución de sus fixes, para poder retomarla en cualquier sesión nueva sin contexto previo.

**Última actualización:** 2026-10-14 (cierre técnico de métricas P6: side-stripes 2→0, warnings `layout-transition` 2→0, auditoría `outline:none` 45/45, `#94a3b8` de texto fuera de superadmin a `#475569`, toast del panel unificado en `ToastUndo`; `npm test` 130/130 y build OK; commiteado y pusheado en `audit-ui` a pedido del usuario: `68094ac`).
Quedan P5 (validaciones runtime en navegador/dispositivo/API), la revisión visual P6 y3 hallazgos nuevos accionables registrados en `pendientes.md` (barras con `transition: width`, blur del overlay de `ModalPortal`, CSS muerto de `.conflict-card*`).
**Idioma:** los documentos van en español (idioma del proyecto). Código y rutas en su forma real.

---

## 1. Estado en una ojeada

| Área | Estado | Detalle |
|---|---|---|
| Auditoría (hallazgos) | ✅ Completa | 48/48 vistas + shell global. Ver `hallazgos-audit-ui.md`. |
| Plan de ejecución aprobado | ✅ Aprobado por el dueño | Ver `plan-de-ejecucion.md`. Decisiones: claims como ejemplos, JetBrains Mono se carga, superadmin **sin tocar colores** (ADR-007), 4 tandas. |
| Fixes — Empleado + Garagista | ✅ Hecho (commiteado en rama audit-ui) | 24 archivos. Ver `cambios-realizados.md`. |
| Fixes — Admin + componentesAdmin | ✅ Hecho (commiteado en rama audit-ui) | 39 archivos + 1 bloque de `App.jsx`. |
| Fixes — Superadmin (sin color) + compartidos | ✅ Hecho (commiteado en rama audit-ui) | ~30 archivos + `superadmin_conflictos.css` nuevo. |
| Fixes — Dueño de garage | ✅ Hecho (commiteado en rama audit-ui) | ~15 archivos. |
| Fixes — Público / Auth / Payment | ✅ Hecho (en sesión, commiteado en rama audit-ui) | El subagente falló 2 veces; se re-ejecutó en sesión el 2026-10-10: 17/17 puntos aplicados + `npm test` 117/117 + ESLint limpio (deuda preexistente de PaymentStatus documentada). Ver `cambios-realizados.md` §6. |
| Trabajo central (coordinador) | ✅ Hecho (en sesión, commiteado en rama audit-ui) | P2.1–P2.8 completos: ModalPortal (focus trap), formularios + combobox de sede, 4 headers, boton_generico, index.css (`--mono`, asterisco con `:has()`), JetBrains Mono en `index.html`, DESIGN.md, footer superadmin sin blur. Detalle en `cambios-realizados.md` §7. Queda revisión visual (P6). |
| Verificación global | ⚠️ Parcial | `npm test` 130/130 ✅ (2026-10-14); `npm run build` ✅ 3.67s con Vite 8.2.2 (warning de chunks); lint global: 99 errores/4 warnings ⚠️ (registrado el 2026-10-13); ESLint dirigido limpio (`admin_panel_de_control.jsx`, único JSX de la última tanda; deuda previa en `gestion_usuarios.jsx`/`admin_pagos.jsx`/`superadmin_pagos_test.jsx` sin cambios); revisión estática P5 #1–#8 ✅ y fixes #5–#7 aplicados. Métricas P6 cerradas el 2026-10-14 (side-stripes 0, `layout-transition` 0, foco 45/45, muted en texto 0 fuera de superadmin). Edge headless dio evidencia parcial de vistas públicas (#2/#7/#8), pero runtime protegido/dispositivo/sandbox y ronda visual formal siguen pendientes; detector no repetido por descarga del engine. |
| Commit de base | ✅ Los fixes P1–P3 están commiteados en `audit-ui` (2026-10-12), pusheada a `origin`; P5 de 2026-10-13 (`0303d08`) y la tanda de métricas P6 del 2026-10-14 (`68094ac`, a pedido del usuario) también; `main` solo tiene documentación general (ver §5). |

### Métricas de progreso (última medición: 2026-10-14, post cierre técnico P6)

| Métrica (grep en `src/**/*.{css,jsx}`) | Antes del audit | Ahora (2026-10-14) | Meta |
|---|---|---|---|
| `outline:none` | ~44 | 45 (**45/45 con foco visible verificado**: 44 con `:focus`/`:focus-visible`/`:focus-within` + el combobox de sede corregido el 2026-10-14) | ✅ Cumplida |
| `#94a3b8` (uso de muted) | ~97 | **43** (era 49; 6 textos → `#475569`). Fuera de superadmin: 14, todos `:disabled`/`::placeholder`/decorativos | ✅ Cumplida fuera de superadmin (ADR-007 lo congela dentro) |
| `border-left: ≥3px` (side-stripes) | ~8 | **0** (era 2) | ✅ Cumplida |
| Clases `eyebrow`/`kicker` | ~18 | **0** | ✅ Cumplida |
| `transition` sobre `width/height/max-height/margin/top/left` | s/d | 3 restantes (barras de progreso; hallazgo nuevo en `pendientes.md`) | 0 |

> Extras medidos el 2026-10-10: `Espere` (tuteo) = **0** en todo `src/`; `tracking-[0.2em]`
> (patrón de eyebrow) = **0** en landing/paraGarages.

> Estas métricas son la forma rápida de medir avance en la próxima sesión. Repetir el grep y comparar.

---

## 2. Decisiones tomadas (y dónde están)

1. **Paleta propia del superadmin — intencional.** El panel superadmin usa una paleta oscura distinta
   a propósito. **No se le cambian colores** (ni hex→token, ni contraste, ni badges, ni focus color).
   Documentado en `docs/decisions/ADR-007-paleta-propia-superadmin.md`. Los hallazgos de color/contraste
   del superadmin quedan listados como *diferidos por decisión* en `pendientes.md` §4.
2. **Claims de marketing rotulados como ejemplos.** "4.9/5", "4.8★" (StatsTicker) y los testimonios de
   `ParaGaragesSocial` se rotulan visiblemente como datos de ejemplo. Es un pedido explícito del dueño
   del producto (PRODUCT.md exige pedido explícito para tocar claims). Estado: **hecho** (2026-10-10,
   lote landing del scope público).
3. **JetBrains Mono se carga.** Se agrega a Google Fonts en `index.html` (DESIGN.md la define como
   tipografía de datos y hoy nunca se carga). Estado: **hecho** (2026-10-10; `--mono` y la Regla
   del Mono Dato actualizados).
4. **Ejecución en 4 tandas** (H → M → L → verificación) con `npm test` + ESLint de archivos tocados al
   cerrar cada una. El plan original está en `plan-de-ejecucion.md`.
5. **Commits:** solo si el usuario los pide. Se pidieron el 2026-10-12 para la rama `audit-ui`.

---

## 3. Mapa de documentos de esta carpeta

| Documento | Qué contiene | Cuándo leerlo |
|---|---|---|
| `README.md` (este) | Índice, estado, decisiones, cómo retomar | Primero, siempre |
| `hallazgos-audit-ui.md` | Informe consolidado del audit: 48/48 vistas, Top 10, hallazgos por vista (H/M/L con archivo:línea y fix), componentes compartidos, runtime checks | Para entender qué se encontró y por qué existe cada fix |
| `plan-de-ejecucion.md` | Plan aprobado: decisiones, tandas, metodología, **plan de continuación P5/P6 (§6)** y plantilla de prompt | Para seguir el orden de cierre sin reabrir P1–P3 |
| `cambios-realizados.md` | Detalle archivo por archivo de TODO lo aplicado (4 scopes iniciales + scope público §6 + trabajo central P2 §7 + P3 §8 + P5 §9 + cierre de métricas P6 §10) + verificación + deudas | Para revisar/commitear lo hecho |
| `pendientes.md` | Backlog accionable con estados y TODO: barridos finales (P3), diferidos (P4), runtime checks (P5), hallazgos nuevos del barrido 2026-10-14 y cierre (P6) | Para trackear cada check y registrar evidencia |

Relacionado: `docs/decisions/ADR-007-paleta-propia-superadmin.md` (en la carpeta de ADRs del proyecto).

---

## 4. Cómo retomar en una sesión nueva (checklist)

1. **Leer** este README completo, y luego `pendientes.md` (la lista de tareas).
2. **Correr el launcher de contexto del skill impeccable** una vez:
   `.agents/skills/impeccable/scripts/impeccable.cmd context` (Windows, sin `sh`) desde la raíz.
   - En esta sesión (2026-10-14) se intentó, pero no se pudo descargar el engine 0.1.5 desde GitHub (mismo bloqueo del 2026-10-13). Se usó el fallback y se leyeron `PRODUCT.md` y `DESIGN.md`; no reintentar ni correr `init` en la misma sesión.
   - Si falla: leer `PRODUCT.md` y `DESIGN.md` directamente (fallback ya previsto por el skill).
   - Nota registrada por el skill: hay `CONTEXT_STALE` (PRODUCT.md sin schema stamp → el skill ofrece
     `init`; correrlo solo si el usuario lo pide) y una actualización disponible de Impeccable
     (mencionarla una vez; no correr `npx impeccable update` en la misma sesión).
3. **Verificar el estado real** antes de tocar nada:
   ```
    git status --short        # revisar qué hay sin commitear (último commit de la auditoría: 68094ac)
    git log --oneline -5      # rama audit-ui: commits de la auditoría sobre main
    npm test                  # 130/130 (2026-10-14)
    npm run lint              # 99 errores / 4 warnings; deuda global registrada
    npm run build             # OK, Vite 8.2.2, 3.67s (2026-10-14)
   ```
   - Si el checkout no tiene `node_modules`, correr `npm ci` primero (pasó el 2026-10-14: sin
     dependencias, `npm test` falla solo en `arranqueApi.test.js` por el import de `axios`).
4. **Queda pendiente, en este orden** (detalle en `pendientes.md`):
    - **P5 — Runtime checks**: se corrigieron los riesgos de QR (#5), popup/polling (#6) y reduced-motion
      (#7), con tests fuente. Edge headless cubrió parcialmente rutas públicas; quedan `/nueva_reserva`,
      conflictos protegidos, Maps/lector, cámara, preferencia real del SO y sandbox. Ver el TODO por
      punto en `pendientes.md` §P5.1.
    - **P6 — Verificación y cierre**: las métricas medibles cerraron el 2026-10-14 (side-stripes 0,
      `layout-transition` 0, foco 45/45, muted en texto 0 fuera de superadmin). Sigue la **revisión
      visual** (máx. 2 rondas, desktop + 360px: logo con teclado, asterisco de requeridos en
      `agregar_sede`, focus trap de modales, JetBrains Mono, toggle de registro, toast del panel sin
      side-stripe). El detector no pudo correr por descarga del engine; commit solo si se pide. Hay
      además 3 hallazgos nuevos accionables en `pendientes.md` (barras `transition: width`, blur del
      overlay de `ModalPortal`, CSS muerto de `.conflict-card*`).
   - ✅ Ya hechos: P1 (17/17), P2 (P2.1–P2.8) y **P3 (P3.1–P3.3, 2026-10-12)**, con `npm test`
     117/117, ESLint sin issues nuevos, `npm run build` ✅ 1.56s y detector de impeccable corrido.
     Ver `cambios-realizados.md` §6–§8. Decisión P3.2 en `docs/decisions/ADR-008-terminologia-plazas-ui-producto.md`.


5. **Regla de oro:** al cerrar cada tanda, `npm test` + ESLint de lo tocado; y actualizar
   `cambios-realizados.md` + `pendientes.md` con lo hecho.

---

## 5. Gotchas y advertencias (leer antes de trabajar)

- **Working tree y commits.** Al 2026-10-12 la auditoría está commiteada en la rama `audit-ui`, no en `main`. `main` solo tiene documentación general. El borrado de `docs/cold-start-login-google.md` fue **intencional** (cold start terminado) y quedó en `main`. El histórico `docs/pendientes-audit-ui.md` se eliminó con aprobación (superado por esta carpeta, en `audit-ui`). **No commitear nada sin pedido del usuario.**
- **`task` puede devolver resultados vacíos.** Pasó 2 veces (Grupo 1 de la sesión anterior y el agente
  de scope público de esta sesión: `completed` sin contenido y sin haber editado nada). Protocolo:
  tras lanzar un agente, verificar con `git status`/grep que realmente editó archivos; si no, re-lanzarlo.
- **Agentes en paralelo ven versiones desfasadas entre sí.** Varios reportes cruzados quedaron
  inconsistentes (p. ej. "falta overflow en conflicts-table" o "`.btn-guardar-grande` sin ajustar");
  ambos ya estaban corregidos. **Verificar en el código, no en los reportes.**
- **ESLint arrastra deuda preexistente** (documentada en `docs/reservation-limit.md`). Validar solo
  archivos tocados y comparar contra `git show HEAD:<archivo>` si hay dudas.
- **`rg` no está disponible en este entorno Windows** (PowerShell 5.1). Usar las herramientas de
  búsqueda del agente o `Select-String`.
- **No commitear `.env` ni secretos** (AGENTS.md). No agregar dependencias nuevas: SweetAlert2,
  lucide-react y GSAP ya están instalados y cubren todos los fixes.
- **Roles por número y nombre** (`src/helpers/roles.js`); la sesión usa cookies + refresh con cola
  (`src/api/client.js` — no tocar). La caché se invalida por prefijos.

---

## 6. Verificación registrada al cierre (para comparar en la próxima sesión)

| Comando | Resultado registrado |
|---|---|
| `npm test` | **130 pass / 0 fail**, ejecutado 2026-10-14 (checkout sin `node_modules`; se corrió `npm ci` con lockfile sin cambios). |
| `npm run lint` | **Ejecutado 2026-10-13: 99 errores / 4 warnings**. Incluye errores del bundle `modern-screenshot.umd.js` dentro de `.agents/` y deuda preexistente en `src/`; el lint global no está verde. |
| ESLint dirigido | `admin_panel_de_control.jsx` (2026-10-14, único JSX tocado): **limpio**. Deuda sin cambios: `admin_pagos.jsx` 3 errores/1 warning; `gestion_usuarios.jsx` 12 errores; `superadmin_pagos_test.jsx` 5 errores/1 warning (HEAD tenía 6/1). El CSS no aplica al parser de ESLint. |
| `npm run build` | **✅ Ejecutado 2026-10-14: built in 3.67s con Vite 8.2.2** (warning de chunks >500 kB). |
| `impeccable detect --json` | **No ejecutado**: `impeccable context` no pudo descargar el engine 0.1.5 desde GitHub (también el 2026-10-14). La última corrida registrada es la del 2026-10-12. |
| Revisión P5 | **Revisión estática de 8 checks + smoke parcial con Edge headless** (rutas públicas, 360px, `prefers-reduced-motion` y requests del flipbook); evidencia/límites en `pendientes.md` §P5.1. Los checks completos siguen abiertos. |
| Screenshots/revisión visual | Capturas Edge de rutas públicas quedaron en Temp, no en el repo. No se hizo la ronda visual formal ni se revisaron rutas protegidas; requieren API/sesión y evidencia conservada según el checklist P6. |
