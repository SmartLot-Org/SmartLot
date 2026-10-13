# Auditoría UI de SmartLot — índice y estado

> **Empezá por acá.** Esta carpeta es el handoff completo de la auditoría UI (48 vistas + shell global)
> y de la ejecución de sus fixes, para poder retomarla en cualquier sesión nueva sin contexto previo.

**Última actualización:** 2026-10-10 (2.ª mitad de sesión: **scope público completo 17/17** y
**trabajo central P2 completo**; `npm run build` ejecutada ✅. Quedan P3, revisión visual y detector).
**Idioma:** los documentos van en español (idioma del proyecto). Código y rutas en su forma real.

---

## 1. Estado en una ojeada

| Área | Estado | Detalle |
|---|---|---|
| Auditoría (hallazgos) | ✅ Completa | 48/48 vistas + shell global. Ver `hallazgos-audit-ui.md`. |
| Plan de ejecución aprobado | ✅ Aprobado por el dueño | Ver `plan-de-ejecucion.md`. Decisiones: claims como ejemplos, JetBrains Mono se carga, superadmin **sin tocar colores** (ADR-007), 4 tandas. |
| Fixes — Empleado + Garagista | ✅ Hecho (sin commitear) | 24 archivos. Ver `cambios-realizados.md`. |
| Fixes — Admin + componentesAdmin | ✅ Hecho (sin commitear) | 39 archivos + 1 bloque de `App.jsx`. |
| Fixes — Superadmin (sin color) + compartidos | ✅ Hecho (sin commitear) | ~30 archivos + `superadmin_conflictos.css` nuevo. |
| Fixes — Dueño de garage | ✅ Hecho (sin commitear) | ~15 archivos. |
| Fixes — Público / Auth / Payment | ✅ Hecho (en sesión, sin commitear) | El subagente falló 2 veces; se re-ejecutó en sesión el 2026-10-10: 17/17 puntos aplicados + `npm test` 117/117 + ESLint limpio (deuda preexistente de PaymentStatus documentada). Ver `cambios-realizados.md` §6. |
| Trabajo central (coordinador) | ✅ Hecho (en sesión, sin commitear) | P2.1–P2.8 completos: ModalPortal (focus trap), formularios + combobox de sede, 4 headers, boton_generico, index.css (`--mono`, asterisco con `:has()`), JetBrains Mono en `index.html`, DESIGN.md, footer superadmin sin blur. Detalle en `cambios-realizados.md` §7. Queda revisión visual (P6). |
| Verificación global | ⚠️ Parcial | `npm test` 117/117 ✅; ESLint sin errores nuevos ✅ por scope (deuda preexistente documentada, p. ej. `PaymentStatus.jsx` ×4); `npm run build` ✅ 1.55s (2026-10-10). Detector de impeccable ❌ pendiente (correr al cerrar P3). Screenshots ❌ no hechos (sin browser en este entorno). |
| Commit | ❌ No hecho | Pedido explícito: solo commitear si el usuario lo pide. El working tree tiene 110+ archivos modificados **sin commitear** (y cambios previos de otras sesiones mezclados — ver §5). |

### Métricas de progreso (medidas el 2026-10-10 al cerrar)

| Métrica (grep en `src/**/*.{css,jsx}`) | Antes del audit | Ahora (2026-10-10, post-P1+P2) | Meta |
|---|---|---|---|
| `outline:none` | ~44 | 45 (los restantes tienen `:focus-visible`/`:focus` de reemplazo — verificar por caso en P6) | Todo `outline:none` con `:focus-visible` de reemplazo |
| `#94a3b8` (uso de muted) | ~97 | 49 | Solo en `:disabled` / placeholder decorativo (DESIGN.md) |
| `border-left: ≥3px` (side-stripes) | ~8 | 2 (los restantes son los diferidos del superadmin — P4) | 0 |
| Clases `eyebrow`/`kicker` | ~18 | 18 (quedan vistas de empleado + skeletons — P3.1) | 0 (craft floor los prohíbe) |

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
5. **Commits:** solo si el usuario los pide. Hoy no los pidió.

---

## 3. Mapa de documentos de esta carpeta

| Documento | Qué contiene | Cuándo leerlo |
|---|---|---|
| `README.md` (este) | Índice, estado, decisiones, cómo retomar | Primero, siempre |
| `hallazgos-audit-ui.md` | Informe consolidado del audit: 48/48 vistas, Top 10, hallazgos por vista (H/M/L con archivo:línea y fix), componentes compartidos, runtime checks | Para entender qué se encontró y por qué existe cada fix |
| `plan-de-ejecucion.md` | Plan aprobado: decisiones, lotes/tandas, metodología (5 agentes en paralelo + coordinador), **plantilla de prompt de agente** (reutilizable) | Para ejecutar lo que falta con el mismo método |
| `cambios-realizados.md` | Detalle archivo por archivo de TODO lo aplicado (4 scopes iniciales + scope público §6 + trabajo central P2 §7) + verificación + deudas | Para revisar/commitear lo hecho |
| `pendientes.md` | Backlog accionable: barridos finales (P3), diferidos por decisión (P4), runtime checks (P5) y verificación/cierre (P6). P1 y P2 quedaron completos (detalle histórico incluido). Cada tarea con Aceptación/Verificación/Archivos | Para trabajar: es la lista de tareas |

Relacionado: `docs/decisions/ADR-007-paleta-propia-superadmin.md` (en la carpeta de ADRs del proyecto).

---

## 4. Cómo retomar en una sesión nueva (checklist)

1. **Leer** este README completo, y luego `pendientes.md` (la lista de tareas).
2. **Correr el launcher de contexto del skill impeccable** una vez:
   `.agents/skills/impeccable/scripts/impeccable.cmd context` (Windows, sin `sh`) desde la raíz.
   - Si falla: leer `PRODUCT.md` y `DESIGN.md` directamente (fallback ya previsto por el skill).
   - Nota registrada por el skill: hay `CONTEXT_STALE` (PRODUCT.md sin schema stamp → el skill ofrece
     `init`; correrlo solo si el usuario lo pide) y una actualización disponible de Impeccable
     (mencionarla una vez; no correr `npx impeccable update` en la misma sesión).
3. **Verificar el estado real** antes de tocar nada:
   ```
   git status --short        # 110+ archivos modificados sin commitear + cambios previos de otras sesiones
   git log --oneline -5      # último commit al cierre: e8fc400 "cambios en continuar con google"
   npm test                  # baseline esperada: 117/117
   ```
4. **Queda pendiente, en este orden** (detalle en `pendientes.md`):
   - **P3 — Barridos finales**: P3.1 eyebrows/kickers que quedan en vistas de empleado + skeletons;
     P3.2 **requiere decisión del dueño**: unificar "cocheras"→"plazas" en la UI de producto;
     P3.3 re-correr métricas (§1) al cerrar.
   - **P5 — Runtime checks** con la app corriendo (tabla en `pendientes.md`; incluye 360px,
     contraste sobre vidrio, QR, Mercado Pago, reduced-motion).
   - **P6 — Verificación y cierre**: `npm run lint` completo, **detector de impeccable** (comando en
     `pendientes.md` §6), **revisión visual** (máx. 2 rondas, desktop + 360px: logo con teclado,
     asterisco de requeridos en `agregar_sede`, focus trap de modales, JetBrains Mono, toggle de
     registro), y **commit solo si el usuario lo pide**.
   - ✅ Ya hechos: P1 (17/17) y P2 (P2.1–P2.8), con `npm test` 117/117, ESLint limpio y
     `npm run build` ✅ 1.55s. Ver `cambios-realizados.md` §6–§7.
5. **Regla de oro:** al cerrar cada tanda, `npm test` + ESLint de lo tocado; y actualizar
   `cambios-realizados.md` + `pendientes.md` con lo hecho.

---

## 5. Gotchas y advertencias (leer antes de trabajar)

- **El working tree no está limpio y no todo es de esta auditoría.** Al 2026-10-10: ~159 líneas de
  `git status` (≈154 archivos modificados/eliminados de la auditoría + cambios previos mezclados).
  Ojo: `docs/cold-start-login-google.md` **aparece eliminado en el working tree** (no fue esta
  sesión — verificar antes de commitear). El histórico `docs/pendientes-audit-ui.md` se eliminó con
  aprobación (superado por esta carpeta). Antes de commitear: revisar `git diff` archivo por archivo
  y separar lo del audit de lo previo. **No commitear nada sin pedido del usuario.**
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

| Comando | Resultado al 2026-10-10 |
|---|---|
| `npm test` | **117 pass / 0 fail** (incluye `*.source.test.js` de garagista, ModalQrReserva, ConfirmarSolicitud, campana_notificaciones) |
| `npx eslint <archivos tocados>` por scope | Sin errores nuevos; solo deuda preexistente idéntica a HEAD (p. ej. `react-hooks/refs` en `admin_dashboard_boton.jsx`; `PaymentStatus.jsx`: `set-state-in-effect` ×2 + `no-empty` ×2). P1 y P2 incluidos: limpios. |
| `npm run build` | **✅ Ejecutado 2026-10-10: built in 1.55s** (solo warning preexistente de chunks >500 kB) |
| `impeccable detect --json` | **No ejecutado** (pendiente; correr al cerrar P3 — comando en `pendientes.md` §6) |
| Screenshots desktop/mobile | **No hechos** (sin herramienta de browser en este entorno; verificar en `npm run dev`) |
