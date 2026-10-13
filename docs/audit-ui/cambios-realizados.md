# Cambios realizados — ejecución de fixes de la auditoría UI

> Detalle de lo aplicado el 2026-10-10 en los 4 scopes completados (empleado/garagista, admin,
> superadmin y dueño de garage), con verificación. **Todo está sin commitear.**
> El scope público/auth/payment se ejecutó **en sesión** el 2026-10-10 y quedó **completo** (17/17,
> §6); el trabajo central del coordinador (P2) también quedó **completo** (§7). Ver `pendientes.md`.

## 0. Estado del working tree (importante antes de commitear)

- `git status` al cierre de esta sesión (2026-10-10, tras P1+P2): **159 líneas de status** (≈154
  archivos modificados/eliminados + `docs/audit-ui/`, `ADR-007` y `superadmin_conflictos.css` sin
  trackear). Todos sin commitear. Último commit: `e8fc400 "cambios en continuar con google"`.
- **No todo lo modificado es de esta auditoría**: había cambios previos de otras sesiones. En
  particular, `docs/cold-start-login-google.md` **aparece eliminado en el working tree** (no fue
  esta sesión; verificar antes de commitear) y el histórico `docs/pendientes-audit-ui.md` se
  eliminó el 2026-10-10 con aprobación (superado por `docs/audit-ui/`). Antes de commitear,
  revisar `git diff` archivo por archivo y separar lo del audit de lo previo.
- Nuevo archivo creado en esta sesión: `src/vistasSuperadmin/superadmin_conflictos.css`.
- `src/App.jsx`: tocado **solo** en el bloque de la ruta `/agregar_garajista` (fix del flujo roto de
  "Agregar Garajista" desde `editar_zona`).

## 1. Verificación transversal (al cierre de los 4 scopes)

| Comando | Resultado |
|---|---|
| `npm test` | **117 pass / 0 fail** — ningún `*.source.test.js` se rompió; ninguno necesitó actualización. |
| `npx eslint <archivos tocados>` (por scope) | Sin errores nuevos. Solo deuda preexistente idéntica a HEAD: `react-hooks/refs` ×2 en `admin_dashboard_boton.jsx`, setState-in-effect + catch vacío en `perfil_admin.jsx`, catches vacíos + `Date.now` en handler + deps en `admin_pagos.jsx`, y deuda en `gestion_usuarios`/`superadmin_pagos_test`/`superadmin_dashboard_boton`/`ToastUndo` (12+8+3+1 issues) verificada contra `git HEAD`. |
| `npm run build` | **No ejecutado** (pendiente). |
| `impeccable detect` | **No ejecutado** (pendiente; comando en `pendientes.md` §6). |

## 2. Scope Empleado + Garagista (agente ✅ — 24 archivos)

**`src/vistasEmpleados/`**
| Archivo | Cambios |
|---|---|
| `empleados_dashboard.jsx` | **Bug de datos H-08**: `nro_plaza`/`nombre_zona` ya no usan día/mes de la fecha; mapean campos reales (`plaza/nro_plaza/numero_plaza/espacio`, `nombre_zona/nivel/piso/sector/zona`) con fallback honesto `"-"`; eliminados fallbacks inventados "Auto"/"Reserva". Modal de reporte migrado a **ModalPortal** (Escape + click en overlay) con `role="dialog" aria-modal="true"`. "Mostrar todas" con `aria-expanded`/`aria-controls`. Copy a voseo. |
| `empleados_dashboard.css` | Chip "Soporte" 34px → **44px**; `:focus-visible` del slider; `#64748b/#94a3b8` → `#475569`; reduced-motion para acordeón/toggle. |
| `historial_reserva.jsx` | **H-08**: el `.catch` ya no pinta error como vacío → estado de **error + "Reintentar"** (`role="alert"`); empty real solo con 0 items. Tildes ("Última reserva", "Mostrar más (N)"). Mojibake corregido. |
| `historial_reserva.css` | H1 a DM Sans 500 (jerarquía de producto); estilos de error con tokens; muted → `#475569`; reduced-motion. |
| `perfil_empleado.jsx` | h3→h2; `!isValid` → `touchAll()` (sin return silencioso); loading mantiene Header/Footer y usa `var(--font-body)`; GSAP con `gsap.matchMedia` + reduced-motion. Copy a voseo. |
| `agregar_vehiculo.jsx` | Autocomplete accesible: `role="combobox"` + listbox/option + ↑↓/Enter/Escape + `aria-activedescendant`. Errores del backend traducidos con `helpers/erroresMensajes.js`. Hexes → tokens. Copy unificado "Agregar vehículo". |
| `nueva_reserva.jsx/.css` | Copy a voseo; muted → `#475569`. |

**`src/componentesEmpleado/`**
| Archivo | Cambios |
|---|---|
| `tarjeta_reserva.jsx/.css` | Fallbacks honestos (`"Sector"` → `"-"`); labels de plaza 8.5/7.5px → **10px** con `#475569`; **tiles de estado con gradiente → superficie plana + badge semántico** (success `#15803D`, error `#B91C1C`, neutral `#475569`, todos AA). |
| `form_reserva.css/.jsx` | `system-ui` → DM Sans; **márgenes negativos eliminados** (scroll horizontal a 360px); `.dia-indicador-label` → `#2563EB` sobre `#DBEAFE` (AA); inline `#4481e2/#1164e8` → `#2563EB`; voseo. |
| `footer_empleado.css/.jsx` | **Footer de producto plano**: sin blur/vidrio; solo transform/opacity con `ease-out`; labels 9-10px → **11px** `#475569`; reduced-motion. |
| `formulario_PerfilPersonal.css` | Placeholder `#cbd5e1` (1.4:1) → `#475569`; `:focus-visible` real; `system-ui` → DM Sans. |
| `formulario_info_personal.jsx` | h3→h2; hexes → tokens. |
| `modal_editar_reserva.jsx/.css` | `role="dialog" aria-modal`; glyph `✕` → lucide `X`; submit inválido con `touchAll`; la fila "Vehículo" ahora muestra el vehículo real (antes el campo plaza); voseo. |
| `modal_detalle_reserva.jsx`, `modal_qr_reserva.css`, `confirmacion_reserva_paga.css` | `role="dialog"`; lucide `X`; `"—"` honesto; estados AA (`#B91C1C`/`#15803D`); muted → `#475569` (se conserva `#94a3b8` solo en `:disabled`). |

**`src/vistasGaragista/`**
| Archivo | Cambios |
|---|---|
| `garagista_dashboard.css` | `#7b8798` → `#475569`; `::placeholder` → `#475569`; **side-stripe eliminado** (`.access-card--inside` → borde/badge; el estado ya lo da `BadgeEstado`); `#172033` → `#1E293B`; radios 18-22 → **14px** (cards) y **10px** (botones); botones 42→**40**, CTAs/inputs **48**, chips/close **44**. |
| `garagista_dashboard.jsx` | Modal con `role="dialog" aria-modal="true"`; tildes ("todavía", "podrá", "Ocupación actual"). |
| `lector_qr_reserva.css` | `#64748b` → `#475569`. |

**Dejado fuera por este agente** (registrado para el coordinador):
- **Purge de eyebrows/kickers en vistas de empleado (~9 instancias + skeletons: "Agenda", "Resumen",
  "Operación diaria"…)** — interpreto la prohibición como "no introducir" y lo dejó al coordinador.
  → Está en `pendientes.md` §3/P3.
- Hexes decorativos que pasan AA pero no son tokens exactos (`#bfdbfe`, `#0544e2`, `#1d4ed8`…) —
  decisión: no re-tokenizar a ciegas porque un mapeo forzado rompería AA.
- Acordeones con `max-height` animado: se les agregó reduced-motion, no se cambió la mecánica.
- CSS muerto tras migrar a ModalPortal (`empleado-reporte-overlay`) — limpieza opcional.

## 3. Scope Admin (agente ✅ — 39 archivos + `App.jsx`)

**`src/vistasAdmin/`**
| Archivo | Cambios |
|---|---|
| `admin_dashboard.css/.jsx` | `:focus-visible` en cards; `system-ui` → DM Sans; `grey`/`#64748B` → tokens; copy voseo ("Gestión de empleados"); títulos de cards a h2; `aria-label` en skeleton. |
| `admin_dashboard_boton.jsx` | `back.out(1.4)` → `power2.out`; guard de reduced-motion; teclado Enter/Espacio; prop `TituloTag`. |
| `perfil_admin.jsx` | **Badge derivado del rol real** (`isEmpresaAdmin`/`isSedeAdmin`, helper `roles.js`) — ya no hardcodea "Administrador de Sede"; GSAP con reduced-motion; h3→h2; inline hexes → clases con tokens; badges AA. |
| `gestion_de_empleados.jsx/.css` | `aria-label` en volver/buscar/select; copy "Gestión de empleados"; placeholder "rol"; ModalPortal con `role="dialog"` en archivados; GSAP con reduced-motion ×3; `.input-moderno:focus-visible`; botón eliminar 44px; banner de contexto "Volver al garage". |
| `agregar_empleado.jsx/.css` | h1 con tokens; copy honesto; mensajes sin ❌/JSON (`mensajeToast`); `touchAll`; Cancelar secondary; botones 48px/10px; toast de éxito antes de navegar. |
| `gestion_garages.jsx/.css` | Modal trato → **ModalPortal**; side-stripe eliminado; "¿Solicitar…?"; "tratos" unificado (glosario); `--garage-subtle` → `#475569`. |
| `agregar_garage_propio.jsx/.css` | **Error de carga con Reintentar** (`loadError` + `reloadKey`); h1 "Crear garage propio" unificado. |
| `agregar_zona.jsx/.css` | `aria-label="Volver"`; kicker "AGREGAR GARAGE" eliminado; error sin emoji/JSON; motivo visible del disabled; `.form-error` con tokens; **`.btn-guardar-grande`/`.btn-cancelar-grande` → 48px / radio 10px / hover `#156FE5` / `:focus-visible`** (verificado en código). |
| `editar_zona.jsx/.css` | **Flujo roto H-09 reparado**: la ruta `/agregar_garajista` renderiza `GestionEmpleados` recibiendo `location.state`; la vista ofrece "Volver al garage" (restaura `state.garage`). Labels con `htmlFor/id`; contadores y archivar → **44px**; "Sin conexión"/WifiOff → "Garage cerrado" (PowerOff); badges AA. |
| `admin_panel_de_control.jsx/.css` | Modal de soporte → ModalPortal (sin eyebrow); `.conflict-priority--alta` → `#B91C1C`/`#FEF2F2` (~6.5:1); **`.conflicts-table-shell { overflow-x: auto }`** (verificado — ya no recorta entre 769-956px); buscador 48px + placeholder AA; botones 44px; `:focus-visible`; DM Sans. |
| `tabla_reservas_panelControl.jsx/.css` | Colapso con `<button aria-expanded>` (teclado); buscador con `aria-label`; popover accesible (tabIndex + focus/blur + `:focus-within`). |
| `admin_reportes_analisis.jsx/.css` | Back `aria-label="Volver"`; AnimatedNumber/SMIL sin overshoot y con reduced-motion; KPIs con tokens; **jerarquía variada (1 métrica destacada + 3 secundarias)**; export con feedback éxito/error; tildes. |
| `admin_pagos.jsx/.css` | PAGAR/clear → ≥44px; alturas 48px/radios 6-10-14; `#94a3b8` → `#475569`; inline hexes → tokens; **ExportarModal con Escape**; eyebrows eliminados; fondo gradiente → plano. |
| `gestion_sedes.jsx/.css` | h1→h2 (números como `strong`, no headings); GSAP reduced-motion; **error + Reintentar**; sin kicker; tokens. |
| `agregar_sede.jsx/.css` | Labels `htmlFor/id`; `touchAll` + mensajes; éxito con toast; `color="white"` eliminado; botones 48px/10px. |
| `agregar_admin_sede.jsx/.css` | h3→h1; botones 48px/10px sin `!important`; DM Sans; `touchAll`; toast de éxito. |

**`src/componentesAdmin/` (resto del scope)**
- `boton_reportes.css/.jsx`: gradiente → plano `#2563EB`/`#156FE5`; DM Sans; tildes.
- `footer_admin.css`: sin glass/blur; indicador sin gradiente; labels ≥11px `#475569`.
- `formularios.css`, `formulario_capacidad.css`, `selector_dias_operativos.css`, `tabla_reservas_panelControl.css`: tokens, `system-ui` → DM Sans, `:focus-visible` donde faltaba.

**Deuda preexistente verificada (no introducida):** `admin_dashboard_boton.jsx` (2× `react-hooks/refs`
patrón `contextSafe`), `perfil_admin.jsx` (setState en effect + catch vacío), `admin_pagos.jsx`
(catches vacíos ×2, `Date.now` en handler, deps de hook).

## 4. Scope Superadmin + compartidos (agente ✅ — ~30 archivos + 1 CSS nuevo)

> Aplicó el mandato **sin cambios de color**: no se tocó ningún valor de color del panel. Los fixes
> fueron de a11y, estados, confirmaciones, estructura, copy y motion.

| Archivo | Cambios |
|---|---|
| `superadmin_dashboard.jsx/.css` | **Error con Reintentar** (ceros solo si la API responde 0); franja `borderTop` de stat cards eliminada; GSAP con reduced-motion; `:focus-visible` en cards con el acento del panel; tildes. |
| `superadmin_dashboard_boton.jsx` | `back.out(1.4)` → `power2.out`; reduced-motion; Enter+Espacio. |
| `gestion_usuarios.jsx/.css` | `aria-label` (Volver/Cerrar/Eliminar/búsquedas) + `htmlFor`/`id` en filtros; **blur quitado de los 3 paneles glass** (colores de fondo conservados). Contraste del dark-modal: **diferido**. |
| `agregar_usuario.jsx` | `htmlFor`/`id` en 8 campos; voseo ("Corregí", "Tenés que", "Elegí un rol", "Le mandamos la notificación al email"). |
| `gestion_empresas.jsx/.css` | `Promise.all` con catch → error + Reintentar (skeleton no queda colgado); guard de doble envío + feedback de delete (Swal); `aria-label` en edición inline; jerarquía h1→h2→h3 (números dejan de ser headings). Focus ámbar: **diferido**. |
| `agregar_empresa.jsx` | Swal de éxito antes de navegar; voseo. |
| `agregar_sede.jsx/.css` | `htmlFor`/`id`; `touchAll` + mensaje; **asterisco quitado de "Descripción"** (`label-optional`); `backgroundColor:"grey"` → estilos del panel; `aria-label="Volver"`. |
| `superadmin_gestion_garages.jsx/.css` | try/catch + error con Reintentar (empty solo con 0); **selector `.btn-nueva-zona:hover` arreglado**; **"Último reporte" eliminado** (mostraba el nivel; no hay dato real — no se inventó). |
| `tarjeta_garages.jsx` | Card navegable con teclado (`role="button"`/`tabIndex`/onKeyDown); `alt=""` en fotos stock (decorativas). |
| `superadmin_conflictos.jsx` + **`superadmin_conflictos.css` (nuevo)** | `aria-label` + `:focus-visible` en select de estado; **semántica honesta del botón por estado** (ya no CheckCircle2 con `aria-label="Eliminar conflicto"`); Swal de confirmación para eliminar; SVG a mano → lucide `Rows2`. |
| `superadmin_reservas.jsx/.css` | Labels Día/Desde/Hasta/Empresa/Sede/Garage asociados + `aria-label` del buscador; clase propia `resv-btn-actualizar` (antes clases ajenas sin CSS); franjas `borderTop` eliminadas; tildes. Contrastes de estados: **diferidos**. |
| `superadmin_cache.jsx/.css` | Error con semántica de error (variante + `AlertTriangle`, **no** banner verde); `window.confirm` → **Swal**; eyebrow eliminado; grilla de cards idénticas → lista de entradas; `<code>` con wrap. |
| `superadmin_pagos_test.jsx/.css` | **Swal de confirmación para "Ejecutar reembolso"** (acción, pago e importe); `aria-label` del payment_id; `estadoClase` normaliza `_`/`.` → `-` (ahora matchea `mpt-badge--in-process` etc.); `EmptyTab` → `EmptyState`; 2 eyebrows eliminados. |
| `superadmin_email_templates.jsx/.css` | Swal para "Guardar en todas las plantillas"; eyebrow eliminado; `aria-label` en inputs de variables; copy → "Vista previa", "Encabezado y pie". |
| `ConfirmarSolicitud.jsx/.css` | Bloque de error con ícono/estilo de error (no el verde de éxito); h3→h1; "Solicitud {resuelta}" traducido (aceptada/rechazada/resuelta); glow blobs y blur quitados de la card. Contraste de "Aceptar solicitud": **diferido (paleta)**. |

**Compartidos (sí con tokens/contraste):**
- `UserDropdown.jsx`: flechas/Home/End + GSAP reduced-motion; tildes.
- `ErrorBoundary.jsx`: hexes → tokens; `:focus-visible`; DM Sans; radio 10px / min 40px.
- `ToastUndo.jsx/.css`: `role="status"` + `aria-live`; side-stripe eliminado; easing sin rebote; animación de `width` → `scaleX`; reduced-motion.
- `EmptyState.css`, `campana_notificaciones.css`, `AuditoriaPanel.css`: `#94a3b8`/`#64748b` de texto → `#475569`.
- `GestionTratosGarage.jsx`: 5 tiles hero-metric → lista simple (ícono+valor+label); contraste; kicker sobre el h2 eliminado.
- `AuditoriaPanel.jsx`: GSAP ya no anima `height` (transform+opacity) + reduced-motion.

**Diferido por decisión (paleta superadmin) — listado completo:**
1. `gestion_usuarios.css:640-651` — dark-modal: texto `#0F1A2E` sobre fondo oscuro (contraste roto).
2. `superadmin_reservas.css` — contraste de `.resv-estado--vencida` / `--curso`.
3. `ConfirmarSolicitud.css:46-63` — "Aceptar solicitud" blanco sobre `#16a34a` (~3.3:1).
4. `footer_superadmin.css:13-14` — blur glass en el footer del panel (no estaba en la lista del audit;
   se puede quitar el blur conservando colores — tarea del coordinador en `pendientes.md` §3).
5. Focus ámbar `#F59E0B` (agregar_usuario.css, gestion_empresas.css, agregar_empresa.css) — no se migró a azul señal.
6. Asterisco de requerido: la regla vive en `src/index.css` → coordinador.

**Cross-scope que el agente marcó como pendiente pero YA está hecho (verificado en código):**
- `admin_panel_de_control.css` `.conflicts-table-shell` → `overflow-x: auto` presente (línea 471).

## 5. Scope Dueño de garage (agente ✅ — ~15 archivos)

**`src/vistasDueñoGarage/`**
| Archivo | Cambios |
|---|---|
| `duenio_garage_dashboard.jsx/.css` | Hero sin kicker; 5 tiles hero-metric → `<dl class="duenio-metrics">` simple (sin íconos, sin blobs, sin mono kicker); **tabs ARIA completas** (roving tabindex, flechas ←→ + Home/End, `aria-selected/controls/labelledby`, `role="tabpanel"`) y ≥44px; fallo de carga → **error + Reintentar**; tildes. |
| `duenio_garage.css` | `--duenio-muted`/hero → `#475569`; `.duenio-metrics` reemplaza `.duenio-stats-grid`; side-stripes borrados (`.deal-toolbar::before`, `.deal-request-card--modificacion`); easing `duenioPendientesPop` → `ease-out`; focus rings → `#2563EB` sólido 3px; `prefers-reduced-motion`. |
| `crear_garage_dueño.jsx` | Eyebrow "ALTA DE ACTIVO" y nota de dev borrados; banner → `.duenio-feedback error` (tokens); schema con tildes + voseo; sin `JSON.stringify`; `touchAll`; Swal/beforeunload a voseo; back-button unificado. |
| `tratos_empresa_garage.jsx` | Kicker "Administrador de garage" borrado; "Tratos con empresas" sin espacio colgante; íconos decorativos `aria-hidden`. |
| `editar_garage_dueño.jsx` | Validación inline con `useLiveValidation` (igual que crear); error de carga con **Reintentar**; fieldset sin inline styles; voseo. Importa `duenio_garage.css` (antes no, riesgo en deep-link). |
| `cuentas_por_cobrar.jsx/.css` | Buscador con `aria-label`; **ExportarModal → ModalPortal** (`role="dialog"`, foco, `aria-label="Cerrar"`); KPIs hero-metric → `<dl>`; eyebrow borrado; error separado del empty (`cxc-empty--error` + `role="alert"` + Reintentar); side-stripes borrados; `.cxc-empty` → `#475569`; overlay propio eliminado. |
| `perfil_dueño_garage.jsx/.css` | GSAP con `matchMedia` reduced-motion; kicker borrado; h3→h2; "Cerrar sesión" → botón secundario (sin peligro rival); focus ring ≥3:1; `#e11d48` eliminado (confirm destructiva usa token `#EF4444`); `touchAll`; voseo. |

**`src/componentesDueñoGarage/`** (sin tocar `header_dueño_garage.jsx`, que era del coordinador)
- `footer_dueño_garage.css/.jsx`: footer de producto plano (sin blur/vidrio); solo transform/opacity
  con `ease-out`; labels ≥11px `#475569`; badge con `aria-label`; reduced-motion.
- `tarjeta_garage_dueño.jsx/.css`: eyebrow mono borrado; código muerto eliminado (imports y menú
  fantasma); entrada sin rebote + reduced-motion; botones 42→44px y **hover sin rotación/escala**;
  textos a tokens.
- `header_dueño_garage.css`: chrome sólido (sin glass); badge `#b91c1c`; easing sin rebote;
  `:focus-visible` en campana; reduced-motion. (JSX intacto — logo `<img onClick>` sigue pendiente
  para el coordinador.)
- `skeleton_admin_garage.*`: revisado, sin cambios necesarios.

**Dejado fuera por este agente:**
- `src/vistasAdmin/agregar_zona.css` `.btn-guardar-grande`: **ya corregido** (verificado: 48px/10px/#156FE5).
- `GestionTratosGarage.jsx` jerarquía h1→h3 y `.deal-summary` hero-metrics: **verificado que el kicker
  se eliminó y la jerarquía quedó h1 (página) → h2 (componente) → h3 (secciones)**; `.deal-summary`
  se dejó como está (componente compartido, se ajustó contraste/foco/side-stripe/motion).
- `ModalPortal`: el inline-centering pierde el look bottom-sheet del modal de exportar en ≤540px
  (mejora futura opcional; `pendientes.md` §3).
- `DetalleConsumo` (drawer): ya cumple Escape/foco/roles; no se migró a ModalPortal para no romper el
  drawer lateral.
- Copy "cocheras" vs "plazas" en chips de tratos (`tratos_empresa_garage.jsx:15`: "Empresas →
  solicitan cocheras → tus garages"; `GestionTratosGarage.jsx:152`: "cambio de cocheras") → barrido de
  copy pendiente del coordinador (`pendientes.md` §3/P3).

## 6. Scope Público / Auth / Payment (en sesión — 2026-10-10, progresivo)

> Se ejecuta en sesión porque el subagente falló 2 veces. El detalle punto por punto (con
> Aceptación/Verificación) está en `pendientes.md` §P1.

### Lote 1 — landing (puntos 1–7) ✅

| Archivo | Cambios |
|---|---|
| `componentesLanding/landing/Navbar.jsx` | **Menú mobile accesible** (antes los enlaces "Solución"/"Contacto" desaparecían bajo `md` sin menú): botón `md:hidden` con `aria-expanded`/`aria-controls`, panel colapsable, foco al primer enlace al abrir, Escape cierra y devuelve el foco al botón, targets ≥44px, íconos lucide `Menu`/`X` con `aria-label`. |
| `componentesLanding/landing/BentoGrid.jsx` | Eyebrow "Ecosistema Integral" borrado; elevación duplicada de las glass-cards resuelta (sin sombra de reposo: vidrio + borde; sombra solo en hover); import `Users` sin uso eliminado. |
| `componentesLanding/landing/StatsTicker.jsx` | Métricas (4.9/5, 4.8★…) rotuladas **"Datos de ejemplo"** (pill visible + mención en el texto `sr-only`), decisión D1. |
| `componentesLanding/paraGarages/ParaGaragesShowcase.jsx` | `text-brand-muted/80` → `text-brand-muted`; eyebrow "Visibilidad total" borrado; sombra de reposo duplicada quitada. |
| `componentesLanding/landing/landing.css` | `.garage-hero-title`: clamp tope 8.25rem → **6rem**; letter-spacing −0.05em → **−0.03em**. |
| `componentesLanding/paraGarages/ParaGaragesPains.jsx` | Grilla de cards idénticas (icon+heading+texto) → **lista con divisores** (`<ul>`/`<li>` + `divide-y`); eyebrow "El problema" borrado. |
| `componentesLanding/paraGarages/ParaGaragesSocial.jsx` | Testimonios rotulados **"Datos de ejemplo"** (pill visible); eyebrow "Casos" borrado. |

Verificación lote 1: `npx eslint` de los 6 JSX — limpio (además se removió un import sin uso
preexistente en `BentoGrid.jsx`).

### Lote 2 — auth + pages menores (puntos 8–15) ✅

| Archivo | Cambios |
|---|---|
| `componentesLanding/auth/LoginForm.jsx` | Beam del submit con `gsap.matchMedia` + **reduced-motion**; botón 60px/gradiente → **48px**, radio 10px, hover `#156FE5` (antes navy); "Espere" → **"Esperá"**; botón Google con `aria-label="Continuar con Google"` + logo `aria-hidden`; errores `text-red-600` → `text-error-strong`; "¿Olvidaste…?" `<a href>` → `Link` de react-router; carga unificada "Ingresando…". |
| `vistasLanding/AuthCallback.jsx` | Sin `access_token` ya no redirige en silencio: pasa `state.error` a `/login` (mostrado por LoginForm); "Iniciando sesión..." → **"Ingresando…"**. |
| `componentesLanding/auth/RegisterRoleToggle.jsx` | `role="tablist"`/`tab` sin tabpanel → **`radiogroup`** con `role="radio"`, `aria-checked` y roving `tabIndex`. |
| `componentesLanding/auth/RegisterGarageForm.jsx` / `RegisterEmpresaForm.jsx` | Salto h1→h3 corregido (**h2** en "Tus datos"/"Datos de tu empresa"); submit 48px/radio 10px/hover `#156FE5`; `text-red-600` → `text-error-strong`. |
| `componentesLanding/auth/RegisterField.jsx` | Validación live vinculada: **`aria-describedby`** (id del contenedor de `FieldValidation` + id del hint) y **`aria-invalid`** cuando hay errores. |
| `src/index.css` | Tokens semánticos `--color-error` (#EF4444) y `--color-error-strong` (#B91C1C) agregados al `@theme` (alineados con DESIGN.md; se usan en los mensajes de error). |
| `pages/Logout.jsx` | `return null` → pantalla de estado **"Cerrando sesión…"** (`role="status"`). |
| `pages/Unauthorized.jsx` | `h1`="403" → **`h1`="Acceso Denegado"** (el 403 queda decorativo `aria-hidden`); CTA engañosa "Volver al inicio" → **"Ir al inicio de sesión"**; hexes inline → tokens Tailwind; `:focus-visible`. |
| `pages/ForgotPassword.jsx` | "Espere" → "Esperá" (×5); carga "Ingresando…"; **reglas de contraseña unificadas con Register** (8+ caracteres, 2 especiales, 2 números, 2 mayúsculas — mismo `ESPECIALES_REGEX`); `h3` → `h2` en el éxito; todos los íconos decorativos con `aria-hidden`. |
| `pages/Login.css` | **Gradientes históricos eliminados** (`.login-boton`, `.login-brand-icon` → azul plano `#2563EB`, hover `#156FE5`, active `#1A73E8`); botón **48px/radio 10px**; secondary con peso 600 (jerarquía primario/secundario); glass de `.login-card` alineado al `.glass-card` compartido; `#0F1A2E` → `#1E293B`, `#64748B`/`#94A3B8` → `#475569` (contraste AA); foco de input al token de DESIGN (`#2563EB` + anillo `rgba(37,99,235,0.15)`); `:focus-visible` en el toggle de contraseña; `'Courier New'` → `'JetBrains Mono', Consolas`. |

Verificación lote 2: `npx eslint` de los 5 JSX — limpio.

### Lote 3 — PaymentStatus + barrido final (puntos 16–17) ✅

| Archivo | Cambios |
|---|---|
| `pages/PaymentStatus.jsx` | **(16a)** inputs de verificación manual: `outline:"none"` → clase `.mpt-input` con `:focus-visible` (anillo 3px `rgba(37,99,235,0.35)`); `:focus-visible` también para todos los botones de la página (`.mpt-page button`). **(16b)** `#94A3B8` → `#475569` (+ resto de textos fuera de token: `#0F1A2E`→`#1E293B`, `#64748B`/`#334155`→`#475569`, `#DC2626`→`#B91C1C`, `#16A34A`→`#15803D`, `#D97706`/`#9A3412`→`#B45309`, `#1D4ED8`→`#2563EB`; fondos `#F8FAFC`→`#F1F5F9`, `#EEF2FF`/`#EFF6FF`→`#DBEAFE`, `#FFF7ED`→`#FEFCE8`). **(16c)** "Liberar el lugar retenido" ahora pide **confirmación con Swal** antes de ejecutar. **(16d)** acciones de panel visibles a cualquiera → **gating por rol** (`useAuth` + `helpers/roles.js`): "Ver mis reservas" solo para `EMPLEADO`; "Ir a Testing de Pagos"/"Volver al dashboard" solo para `SUPERADMIN`. **(16e/17)** side-stripe `border-left: 4px` de la tarjeta de estado → borde hairline (el estado lo comunican ícono + `EstadoBadge`); copy a voseo ("Usá", "esperá", "reintentá", "Podés", "Revisá", "ingresá"). |
| `componentesLanding/paraGarages/ParaGaragesSteps.jsx`, `ParaGaragesSecurity.jsx`, `ParaGaragesReports.jsx`, `ParaGaragesBento.jsx` | Eyebrows restantes borrados ("Cómo funciona", "Tranquilidad", "Transparencia", "Tu panel de dueño") — craft floor: prohibidos. |
| `componentesLanding/auth/LoginForm.jsx`, `RegisterGarageForm.jsx`, `RegisterEmpresaForm.jsx` | "Espere" → **"Esperá"** en mensajes de cooldown restantes. |
| `pages/register.source.test.js` | Contrato de fuente del toggle actualizado: `role="radiogroup"` + `role="radio"`/`aria-checked` (antes `tablist`/`aria-selected`). |

Verificación lote 3: `npx eslint` de los 11 archivos tocados — limpio (la deuda preexistente de
`PaymentStatus.jsx` — 2 `react-hooks/set-state-in-effect` y 2 `no-empty` — es idéntica a HEAD y
queda documentada). `npm test`: **117 pass / 0 fail**.

## 7. Trabajo central / coordinador (P2) — en sesión (2026-10-10) ✅

| Archivo | Cambios |
|---|---|
| `componentesCompartidos/ModalPortal.jsx` | **Focus trap**: Tab/Shift+Tab ciclan dentro del modal; **foco inicial** en el primer control; **retorno de foco** al disparador al cerrar; Escape sigue cerrando; `zIndex` inline 2000 → **`Z_INDEX.MODAL`** (`helpers/zIndex.js`); contenedor del portal de `useRef(createElement)` → `useState` lazy (corrige `react-hooks/refs`). |
| `componentesAdmin/formulario_infoPersonal.jsx` | Campos con **`id` + `htmlFor`** (`info-personal-*`); dropdown de sede → **combobox accesible** (`role="combobox"` + `aria-expanded`/`aria-controls`/`aria-activedescendant`; listbox con `role="option"`/`aria-selected`; teclado ↑↓/Enter/Space/Escape; foco vuelve al disparador; resaltado con `.submenu-custom-option--activa`); chevron SVG → lucide `ChevronDown`; hex del estado deshabilitado → `#F1F5F9`; eliminados `roles`/`fixedRoles` sin uso (deuda ESLint). |
| `componentesAdmin/formulario_zona.jsx` | Mismas mejoras de accesibilidad (`zona-*`) y combobox; **copy corregido**: "Información general", "Definí la identidad y la ubicación del garage." (ya no dice "del nuevo garage" al editar) y "Ubicación" con tilde; chevron lucide. |
| `componentesAdmin/formularios.css` | Regla `.submenu-custom-option--activa` (resaltado por teclado del combobox). |
| `header_admin.jsx` / `header_superadmin.jsx` / `header_empleado.jsx` / `header_dueño_garage.jsx` | Logo `<img onClick>` → **`<button>`** con `aria-label="Ir al panel principal"` (Enter y Space navegan) y `:focus-visible` (anillo azul; en superadmin, ámbar por ADR-007 vía regla CSS propia); campana SVG dibujada a mano (superadmin y empleado) → **lucide `Bell`** decorativa (`aria-hidden`). |
| `componentesAdmin/boton_generico.css` | `.btn-primario`: `#1A73E8 !important` → **`#2563EB`**; hover `#1557b0` → **`#156FE5`**; 42px → **40px**; radio 12 → **10px**; `:focus-visible`; `!important` innecesarios eliminados (los overrides del superadmin siguen ganando por especificidad → paleta intacta). |
| `componentesAdmin/boton_generico.jsx` | Clase muerta `boton-base-smartlot` eliminada; `import React` sin uso eliminado. |
| `src/index.css` | `--mono` → `'JetBrains Mono', Consolas, monospace`; regla del **asterisco de requeridos** reescrita con `:has()` (`…:has(:is(input, select, textarea)[required], [role="combobox"]) label::after`) → solo campos realmente requeridos; tokens `--color-error`/`--color-error-strong` (ver §6). |
| `src/App.jsx` | `RouteFallback` → `role="status"` + `bg-brand-bg` (token; era `bg-slate-50`). |
| `index.html` | **JetBrains Mono** agregada a Google Fonts (`wght@400;500`). |
| `DESIGN.md` | Regla del Mono Dato actualizada: la fuente se carga desde Google Fonts; fallback Consolas (ya no miente). |
| `componentesSuperadmin/footer_superadmin.css` | `backdrop-filter: blur(14px)` eliminado (glass en producto); paleta intacta (`#0F1A2E` sólido) — cumple ADR-007 y la Regla del Vidrio Solo Landing. |
| `vistasSuperadmin/agregar_sede.css`, `agregar_empresa.css` | Parches locales `label.label-optional::after { content: none }` eliminados (innecesarios con la regla global `:has()`). |

Verificación P2: `npx eslint` de los 9 JSX — **limpio**; `npm test` — **117 pass / 0 fail**;
`npm run build` — **✅ built in 1.55s** (solo warning preexistente de chunks >500 kB).
Pendiente: **revisión visual** (P6) — logo con teclado, asterisco en `agregar_sede`, focus trap de
modales, fuente mono, combobox de sede.
