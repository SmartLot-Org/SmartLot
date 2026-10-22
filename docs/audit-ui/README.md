# Auditoría UI de SmartLot — índice y estado

> **Empezá por acá.** Esta carpeta es el handoff completo de la auditoría UI (48 vistas + shell global)
> y de la ejecución de sus fixes, para poder retomarla en cualquier sesión nueva sin contexto previo.

**Última actualización:** 2026-10-22 (revisión de paneles con sesión superadmin + suplantación de admin: `agregar_sede` sin estilos corregido y eyebrow «SUPERADMIN» eliminado en 4 vistas, §13 de `cambios-realizados.md`; ronda visual P6 de rutas públicas con backend local: 3 defectos corregidos —pill del ticker, hero de `/para-garages`, header móvil—, §12 de `cambios-realizados.md`; antes, resueltos 2 de los 3 hallazgos nuevos de P6: barras de progreso `transition: width` 3→0 con `translateX` y borrado de 209 líneas de CSS muerto `.conflict-card*`; `npm test` 130/130, ESLint de lo tocado limpio y build OK 2.68s; **sin commitear**, a la espera de pedido). Antes: 2026-10-14, cierre técnico de métricas P6 (`68094ac`).
Quedan P5 (validaciones runtime en navegador/dispositivo/API), la revisión visual P6 **de rutas protegidas** (necesita usuarios de prueba por rol) y 1 hallazgo que espera decisión del dueño (blur del overlay de `ModalPortal`, registrado en `pendientes.md`).
**Idioma:** los documentos van en español (idioma del proyecto). Código y rutas en su forma real.

> **Spec de cierre:** lo que falta y cómo se da por terminada la auditoría está en
> [`docs/specs/SPEC-cierre-auditoria-ui.md`](../specs/SPEC-cierre-auditoria-ui.md) (estado: *en revisión*, espera
> aprobación del dueño antes de planificar). Resumen en §7 de este README.

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
| Verificación global | ⚠️ Parcial | `npm test` 130/130 ✅ (2026-10-22); `npm run build` ✅ 2.68s con Vite 8.2.2 (3.67s el 2026-10-14; warning de chunks); lint global: 99 errores/4 warnings ⚠️ (registrado el 2026-10-13); ESLint dirigido limpio (`admin_panel_de_control.jsx`, `selector_dias_operativos.jsx` y `admin_reportes_analisis.jsx`, los JSX de la última tanda; deuda previa en `gestion_usuarios.jsx`/`admin_pagos.jsx`/`superadmin_pagos_test.jsx` sin cambios); revisión estática P5 #1–#8 ✅ y fixes #5–#7 aplicados. Métricas P6 cerradas el 2026-10-14 (side-stripes 0, `layout-transition` 0, foco 45/45, muted en texto 0 fuera de superadmin). Edge headless dio evidencia parcial de vistas públicas (#2/#7/#8), pero runtime protegido/dispositivo/sandbox y ronda visual formal siguen pendientes; detector no repetido (descarga del engine bloqueada; el 2026-10-22 el `.cmd` del launcher quedó bloqueado por directiva de grupo de Windows). |
| Commit de base | ✅ **2026-10-22 (a pedido del usuario):** fixes de las sesiones §11–§13 y la documentación de cierre (ADR-009/010 + spec) commiteados y pusheados en `audit-ui` (ver `git log --oneline -5`). Antes: los fixes P1–P3 están commiteados en `audit-ui` (2026-10-12), pusheada a `origin`; P5 de 2026-10-13 (`0303d08`) y la tanda de métricas P6 del 2026-10-14 (`68094ac`, a pedido del usuario) también; `main` solo tiene documentación general (ver §5). |

### Métricas de progreso (última medición: 2026-10-22, post hallazgos nuevos de P6)

| Métrica (grep en `src/**/*.{css,jsx}`) | Antes del audit | Ahora (2026-10-22) | Meta |
|---|---|---|---|
| `outline:none` | ~44 | 45 (**45/45 con foco visible verificado**: 44 con `:focus`/`:focus-visible`/`:focus-within` + el combobox de sede corregido el 2026-10-14) | ✅ Cumplida |
| `#94a3b8` (uso de muted) | ~97 | **43** (era 49; 6 textos → `#475569`). Fuera de superadmin: 14, todos `:disabled`/`::placeholder`/decorativos | ✅ Cumplida fuera de superadmin (ADR-007 lo congela dentro) |
| `border-left: ≥3px` (side-stripes) | ~8 | **0** (era 2) | ✅ Cumplida |
| Clases `eyebrow`/`kicker` | ~18 | **0** | ✅ Cumplida |
| `transition` sobre `width/height/max-height/margin/top/left` | s/d | **0** (eran 3 barras de progreso; pasaron a `translateX` el 2026-10-22) | ✅ Cumplida |

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
| `cambios-realizados.md` | Detalle archivo por archivo de TODO lo aplicado (4 scopes iniciales + scope público §6 + trabajo central P2 §7 + P3 §8 + P5 §9 + cierre de métricas P6 §10 + barras de progreso y CSS muerto §11 + ronda visual pública §12 + paneles superadmin/admin §13) + verificación + deudas | Para revisar/commitear lo hecho |
| `pendientes.md` | Backlog accionable con estados y TODO: barridos finales (P3), diferidos (P4), runtime checks (P5), hallazgos nuevos del barrido 2026-10-14 y cierre (P6) | Para trackear cada check y registrar evidencia |

Relacionado (carpeta de ADRs `docs/decisions/`): `ADR-007` (paleta propia del superadmin), `ADR-008` (plazas en la UI de producto), `ADR-009` (**propuesto**: overlay de modales sin blur, espera al dueño) y `ADR-010` (método de verificación runtime con perfil aislado y CDP). Spec de cierre: `docs/specs/SPEC-cierre-auditoria-ui.md`.

---

## 4. Cómo retomar en una sesión nueva (checklist)

1. **Leer** este README completo, y luego `pendientes.md` (la lista de tareas).
2. **Correr el launcher de contexto del skill impeccable** una vez:
   `.agents/skills/impeccable/scripts/impeccable.cmd context` (Windows, sin `sh`) desde la raíz.
   - Intentos fallidos: 2026-10-13 y 2026-10-14 (no se pudo descargar el engine 0.1.5 desde GitHub) y 2026-10-22 (la directiva de grupo de Windows bloquea ejecutar el `.cmd`). Se usó el fallback y se leyeron `DESIGN.md` y la craft floor; no reintentar ni correr `init` en la misma sesión.
   - Si falla: leer `PRODUCT.md` y `DESIGN.md` directamente (fallback ya previsto por el skill).
   - Nota registrada por el skill: hay `CONTEXT_STALE` (PRODUCT.md sin schema stamp → el skill ofrece
     `init`; correrlo solo si el usuario lo pide) y una actualización disponible de Impeccable
     (mencionarla una vez; no correr `npx impeccable update` en la misma sesión).
3. **Verificar el estado real** antes de tocar nada:
   ```
    git status --short        # revisar qué hay sin commitear (último commit de la auditoría: 68094ac)
    git log --oneline -5      # rama audit-ui: commits de la auditoría sobre main
    npm test                  # 130/130 (2026-10-22)
    npm run lint              # 99 errores / 4 warnings; deuda global registrada
    npm run build             # OK, Vite 8.2.2, 2.68s (2026-10-22)
   ```
   - Si el checkout no tiene `node_modules`, correr `npm ci` primero (pasó el 2026-10-14 y el 2026-10-22: sin
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
      side-stripe, y ahora también las 3 barras de progreso). El detector no pudo correr; commit solo si
      se pide. De los 3 hallazgos nuevos quedan resueltos barras `transition: width` y CSS muerto
      `.conflict-card*` (2026-10-22); **sigue abierto** el blur del overlay de `ModalPortal`, que espera
      decisión del dueño (ver `pendientes.md`).
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
- **Entorno Windows de esta máquina (2026-10-22):** no hay Python; PowerShell bloquea algunas operaciones y el `.cmd` de Impeccable
  por directiva de grupo (usar Bash/Node para scripts); el checkout puede venir sin `node_modules` (`npm ci`).
- **Verificación runtime:** seguir ADR-010 (Edge con perfil aislado + CDP, la persona inicia sesión, solo lectura sobre
  datos reales). Una pestaña en segundo plano (`visibilityState: hidden`) pausa GSAP y genera falsos defectos; forzar
  foco antes de capturar. Las capturas con `--virtual-time-budget` salen a mitad de las animaciones.
- **Las métricas por grep no ven todo:** un `<p>SUPERADMIN</p>` suelto era un eyebrow que la métrica `eyebrow|kicker`
  (por clase) no detectaba; verificar también visualmente.
- **No commitear `.env` ni secretos** (AGENTS.md). No agregar dependencias nuevas: SweetAlert2,
  lucide-react y GSAP ya están instalados y cubren todos los fixes.
- **Roles por número y nombre** (`src/helpers/roles.js`); la sesión usa cookies + refresh con cola
  (`src/api/client.js` — no tocar). La caché se invalida por prefijos.

---

## 6. Verificación registrada al cierre (para comparar en la próxima sesión)

| Comando | Resultado registrado |
|---|---|
| `npm test` | **130 pass / 0 fail**, ejecutado 2026-10-22 (checkout sin `node_modules`; se corrió `npm ci` con lockfile sin cambios). |
| `npm run lint` | **Ejecutado 2026-10-13: 99 errores / 4 warnings**. Incluye errores del bundle `modern-screenshot.umd.js` dentro de `.agents/` y deuda preexistente en `src/`; el lint global no está verde. |
| ESLint dirigido | `admin_panel_de_control.jsx`, `selector_dias_operativos.jsx`, `admin_reportes_analisis.jsx` (2026-10-22, JSX tocados): **limpios**. Deuda sin cambios: `admin_pagos.jsx` 3 errores/1 warning; `gestion_usuarios.jsx` 12 errores; `superadmin_pagos_test.jsx` 5 errores/1 warning (HEAD tenía 6/1). El CSS no aplica al parser de ESLint. |
| `npm run build` | **✅ Ejecutado 2026-10-22: built in 2.68s** (2026-10-14: 3.67s con Vite 8.2.2; warning de chunks >500 kB). |
| `impeccable detect --json` | **No ejecutado**: `impeccable context` no pudo descargar el engine 0.1.5 desde GitHub (2026-10-13/14) y el 2026-10-22 el `.cmd` lo bloqueó la directiva de grupo de Windows. La última corrida registrada es la del 2026-10-12. |
| Revisión P5 | **Revisión estática de 8 checks + smoke parcial con Edge headless** (rutas públicas, 360px, `prefers-reduced-motion` y requests del flipbook); evidencia/límites en `pendientes.md` §P5.1. Los checks completos siguen abiertos. |
| Screenshots/revisión visual | **2026-10-22: ronda visual de rutas públicas hecha** (1440/360 px, backend local, Edge CDP; capturas en Temp, no en el repo; ver `cambios-realizados.md` §12). Paneles superadmin/admin revisados el 2026-10-22 (§13; faltan focus trap, barras con valor ≠ 0 y vistas de empleado/garagista/dueño); requieren API/sesión y evidencia conservada según el checklist P6. |

---

## 7. Handoff de sesión (contrato para retomar)

> Formato de «límite de sesión reiniciable»: lo que hay que persistir para que una sesión nueva siga sin contexto previo.

| Elemento | Estado al 2026-10-22 |
|---|---|
| **Alcance aceptado** | P1, P2, P3, P5 (parte de código) y métricas P6 hechos. P4 diferido por ADR-007. Spec de cierre en revisión. |
| **Tarea pendiente siguiente** | Aprobación de `SPEC-cierre-auditoria-ui.md` y decisión de ADR-009; luego revisión visual P6 ronda 2 con sesión de cada rol. |
| **Archivos cambiados** | Ver `cambios-realizados.md` §11–§13 (código: barras de progreso, CSS muerto, ticker, hero y navbar de landing, formulario y eyebrows de superadmin) y los docs de `docs/audit-ui/`, `docs/decisions/` (ADR-009/010) y `docs/specs/`. |
| **Verificación** | `npm test` 130/130; ESLint dirigido limpio; `npm run build` OK (≈1 s). Lint global 99 errores/4 warnings (deuda). `impeccable detect` no corrido. |
| **Decisiones/aprobaciones abiertas** | ADR-009 (blur del overlay), usuarios de prueba por rol, quién ejecuta P5 #5/#6/#7, aceptar cierre sin `detect`. Detalle en la spec. |
| **Estado del working tree** | Ver `git status` y `git log --oneline -5`; el último commit de la sesión queda registrado en la sección «Commit de base» de §1. |

**Cómo retomar:** (1) leer este README y `SPEC-cierre-auditoria-ui.md`; (2) `git status` + `git log`; (3) `npm ci` si falta
`node_modules`; (4) para runtime, seguir ADR-010; (5) al cerrar cada tanda, actualizar `cambios-realizados.md`,
`pendientes.md` y este README.
