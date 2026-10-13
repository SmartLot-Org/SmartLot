# Plan de ejecución de fixes — Auditoría UI

> Plan aprobado por el dueño del producto y metodología realmente ejecutada (5 agentes en paralelo por
> carpeta + un coordinador central). Este documento permite **repetir el método** para el scope que
> falta y para futuros fixes masivos de UI.

## 1. Objetivo y definición de terminado

Corregir los hallazgos del informe (`hallazgos-audit-ui.md`) en tandas verificables:

- **Hecho** = código editado + `npm test` verde + ESLint sin errores nuevos en lo tocado + entrada en
  `cambios-realizados.md` + tarea tildada en `pendientes.md`.
- **Cierre global** = `npm run build` OK + detector de impeccable corrido + revisión visual (desktop y
  mobile 360-390px) + documentación actualizada + commit **solo si el usuario lo pide**.

## 2. Decisiones de ejecución (aprobadas)

| # | Decisión | Resolución |
|---|---|---|
| D1 | Claims de marketing (4.9/5, 4.8★, testimonios) | **Rotular visiblemente como "Datos de ejemplo"** — es el pedido explícito que exige PRODUCT.md para tocar claims. |
| D2 | JetBrains Mono (DESIGN.md la define; nunca se carga) | **Cargarla** en el `<link>` de Google Fonts de `index.html`. Sin dependencias npm nuevas. |
| D3 | Paleta del superadmin | **No tocar colores** en `vistasSuperadmin`/`componentesSuperadmin`/CSS propios. Panel distinto a propósito. Ver `docs/decisions/ADR-007-paleta-propia-superadmin.md`. Los fixes no-color sí aplican. |
| D4 | Alcance | Las 4 tandas completas (H, M, L, verificación), documentando todo. |
| D5 | Commits | Solo con pedido explícito. |
| D6 | Dependencias nuevas | **Cero.** SweetAlert2, lucide-react y GSAP ya están instalados y cubren todo. |
| D7 | `docs/pendientes-audit-ui.md` | Documento histórico protegido (AGENTS.md). **Eliminado el 2026-10-10 con aprobación explícita** al quedar superado por esta carpeta; su contenido queda en el historial de git (ruta vieja en `HEAD`). |
| D8 | Verificación visual | Sin browser automation en el entorno: la hace el humano con `npm run dev` (desktop + 360px) sobre el checklist de `pendientes.md` §6. |

## 3. Tandas originales (H → M → L)

### Tanda 1 — Severidad H (bloqueos, a11y, datos erróneos)

| Lote | Alcance | Archivos clave |
|---|---|---|
| H-01 | Asociar labels↔inputs (`htmlFor`/`id`) y nombres accesibles en formularios y búsquedas | `formulario_infoPersonal.jsx`, `formulario_zona.jsx`, `agregar_sede.jsx` (admin), `agregar_usuario.jsx`, `superadmin/agregar_sede.jsx`, `editar_zona.jsx`, `gestion_usuarios.jsx`, `gestion_empresas.jsx`, `superadmin_reservas.jsx`, `tabla_reservas_panelControl.jsx`, `superadmin_pagos_test.jsx`, `superadmin_email_templates.jsx`, `cuentas_por_cobrar.jsx`, `gestion_de_empleados.jsx` |
| H-02 | `aria-label` en botones solo-icono (volver, eliminar, cerrar) | `gestion_de_empleados.jsx:493`, `agregar_zona.jsx:185`, `admin_reportes_analisis.jsx:989`, `superadmin_gestion_garages.jsx:218`, `gestion_usuarios.jsx:812,1156,1228`, `cuentas_por_cobrar.jsx:17`, `superadmin/agregar_sede.jsx:138`, `gestion_empresas.jsx:125` |
| H-03 | Logos `<img onClick>` → navegación con teclado (button/Link) | 4 headers (`header_admin/superadmin/empleado/dueño_garage.jsx`) |
| H-04 | Focus visible donde `outline:none` no tiene reemplazo (46 sitios medidos) | `admin_dashboard.css:49`, `gestion_de_empleados.css:189-204`, `admin_panel_de_control.css:565-577`, `superadmin_dashboard.css:101`, `PaymentStatus.jsx:513,536`, `perfil_dueño_garage.css:183-185`, `ErrorBoundary.jsx` |
| H-05 | Contraste AA: `#94a3b8`/`#64748b`/`#cbd5e1` → `#475569`/tokens; badges de estado | ~54 sitios restantes de `#94a3b8` (era ~97), badges en `admin_panel_de_control.css:550-553`, `superadmin_reservas.css:486-499` (diferido), `ConfirmarSolicitud.css:46-63` (diferido), `gestion_usuarios.css:640-651` (diferido) |
| H-06 | Modales: Escape + focus trap + foco inicial/retorno, unificados vía `ModalPortal` | `ModalPortal.jsx` (él mismo), `empleados_dashboard.jsx:784-839`, `gestion_garages.jsx:268`, `admin_panel_de_control.jsx:822-880`, `admin_pagos.jsx:54-60`, `cuentas_por_cobrar.jsx:17-30` |
| H-07 | Confirmación en acciones destructivas (SweetAlert2) | `superadmin_pagos_test.jsx:1000-1003`, `PaymentStatus.jsx:397-401`, `superadmin_email_templates.jsx:244-280`, `superadmin_conflictos.jsx:296-306`, deletes/archivar en gestiones |
| H-08 | Datos/estados incorrectos | `empleados_dashboard.jsx:237-238`, `superadmin_gestion_garages.jsx:339`, `superadmin_dashboard.jsx:76-86`, `historial_reserva.jsx:225-231`, `superadmin_cache.jsx:71,120`, `ConfirmarSolicitud.jsx:101`, `superadmin_gestion_garages.jsx:320-325`, `perfil_admin.jsx:95-98`, `superadmin_pagos_test.jsx:78-83`, `superadmin_conflictos.jsx:553-559` |
| H-09 | Flujos rotos + targets táctiles <44px | `editar_zona.jsx:703-708` + `App.jsx:169-173`, `PaymentStatus.jsx:403,557-569`, `editar_zona.css:311-312,535-536`, `admin_pagos.css:34,47`, tabs de `duenio_garage.css:214-227`, `admin_panel_de_control.css:598` |
| H-10 | Interacciones custom sin teclado/roles | `agregar_vehiculo.jsx:254-298`, `tarjeta_garages.jsx:19`, `tabla_reservas_panelControl.jsx:379-389`, dropdowns de `formulario_infoPersonal.jsx:115-146`/`formulario_zona.jsx:85-115`, `RegisterRoleToggle.jsx:22-46`, tabs de `duenio_garage_dashboard.jsx:251-268`, popover hover-only de `tabla_reservas_panelControl.jsx:440-467` |

### Tanda 2 — M: consistencia con DESIGN.md

| Lote | Alcance |
|---|---|
| M-01 | Hex/estilos inline → tokens `@theme` (admin_pagos, admin_reportes_analisis, perfil_admin, agregar_vehiculo, crear_garage_dueño, agregar_zona, Unauthorized, agregar_empleado, superadmin/agregar_sede…) |
| M-02 | Botones/inputs a 40-48px, radios 6/10/14, hover `#156FE5` (boton_generico, agregar_zona, agregar_admin_sede, LoginForm, RegisterGarageForm, CtaButton, garagista_dashboard, admin_pagos, admin_panel_de_control) |
| M-03 | Tipografía: quitar `system-ui`, orden de headings, JetBrains Mono (cargar o sacar de DESIGN.md) |
| M-04 | `alert()`/`confirm()` nativos → SweetAlert2 (grep global; caso detectado: `superadmin_cache.jsx:78-79`) |
| M-05 | Estados faltantes según `docs/estados-vacios.md`: errores con retry, submit inválido con `touchAll`, feedback de éxito, `AuthCallback`/`Logout`, `EmptyState` compartido |
| M-06 | Copy: voseo + tildes + terminología unificada (empleados/usuarios, cocheras/plazas, contraseña, verbos de login, sin emoji/JSON crudo) |
| M-07 | Bugs de CSS/selector y clases huérfanas (hover que no matchea en superadmin_gestion_garages, `boton-base-smartlot` sin CSS, `.btn-archivados` foreign, asterisco requerido, badges `mpt-*`, márgenes negativos de `reserva-form`) |

### Tanda 3 — M/L: craft y decoración prohibida

| Lote | Alcance |
|---|---|
| L-01 | Quitar side-stripes, eyebrows/kickers, hero-metric grids, glassmorphism de producto, gradientes decorativos |
| L-02 | Motion: `prefers-reduced-motion`, easing elástico → `power`/`ease-out`, layout props → transform/opacity |
| L-03 | Micro-craft: `RouteFallback` (`role="status"`), `FieldValidation` (iconos lucide), `ToastUndo` (`aria-live`), campana SVG muerta, alt de foto stock, `<code>` truncado, botones "peer" de ForgotPassword, gradientes históricos de Login.css |

### Tanda 4 — Verificación y cierre

1. Por tanda: `npm test` → `npm run lint` (solo tocados) → `npm run build` (si el cambio es grande).
2. Ronda acotada de verificación visual (máx. 2 rondas): screenshots desktop + mobile de las vistas
   tocadas → corregir todo en un batch → confirmación → parar.
3. Cierre: informe en `docs/audit-ui/`, checkboxes, commit solo si se pide.

## 4. Metodología ejecutada (repetible)

### Reparto de scopes (5 agentes `general` en paralelo + coordinador)

| Agente | Carpeta/scope | Estado |
|---|---|---|
| A — Público | `vistasLanding/**`, `componentesLanding/**`, `pages/` (Register, ForgotPassword, PaymentStatus, Logout, Unauthorized, Login.css) | ❌ falló 2 veces (resultado vacío / cancelado) — **re-lanzar** |
| B — Empleado/Garagista | `vistasEmpleados/**`, `componentesEmpleado/**` (sin `header_empleado`), `vistasGaragista/**` | ✅ hecho |
| C — Admin | `vistasAdmin/**`, `componentesAdmin/**` (sin formularios compartidos, `boton_generico`, `header_admin`, `tarjeta_garages`) | ✅ hecho |
| D — Superadmin | `vistasSuperadmin/**`, `componentesSuperadmin/**` (sin `header_superadmin`) + compartidos (`ErrorBoundary`, `UserDropdown`, `ToastUndo`, `EmptyState.css`, `campana_notificaciones.css`, `AuditoriaPanel`, `GestionTratosGarage`, `tarjeta_garages`) — **sin cambios de color** | ✅ hecho |
| E — Dueño | `vistasDueñoGarage/**`, `componentesDueñoGarage/**` (sin `header_dueño_garage`) | ✅ hecho |
| Coordinador (yo) | Docs + trabajo central (ModalPortal, formularios compartidos, 4 headers, `boton_generico`, `index.css`, `index.html`, DESIGN.md) + verificación global | ⚠️ solo docs hechas; el resto pendiente |

**Lección aprendida:** un agente puede devolver `completed` con resultado vacío sin haber editado
nada. **Siempre verificar con `git status`/grep que el agente tocó archivos** antes de dar por hecho
su scope. Y los reportes de agentes paralelos quedan desfasados entre sí: verificar en el código.

### Plantilla de prompt para agentes (usada; reutilizable)

```
Sos un senior frontend ejecutando fixes de auditoría UI en SmartLot (React 19 + Vite + Tailwind v4,
C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot). Es REFINAMIENTO: preservá la identidad visual;
no rediseñes. Lee PRODUCT.md y DESIGN.md en la raíz antes de editar. Copy en español rioplatense con
VOSEO, nunca "tú", con tildes.

SCOPE (editá SOLO esto): <carpetas/archivos>
NO toques: <archivos centrales y de otros scopes>; package.json; docs/*; DESIGN.md; PRODUCT.md.
Sin dependencias nuevas. No corras `npm run build`.

REGLAS DE DISEÑO (tokens DESIGN.md / src/index.css @theme):
- Colores: brand-deep #0C1E3F, brand-blue #2563EB, hover #156FE5, pressed #1A73E8, warm #1E293B,
  muted #475569, bg #F5F7FB, surface #FFF, elevated #F1F5F9, border #E2E8F0, border-strong #CBD5E1,
  accent-bg #DBEAFE, success #22C55E/#F0FDF4, warning #EAB308/#FEFCE8, error #EF4444/#FEF2F2,
  error-strong #B91C1C. JSX: utilidades Tailwind (text-brand-muted...). CSS: var(--text)/var(--accent)
  o el valor token. Sin hexes nuevos arbitrarios.
- CONTRASTE AA (texto ≥4.5:1): #94a3b8/#64748b en TEXTO → #475569; #cbd5e1 nunca como texto.
- Botones 40/48px, radio 10px, hover #156FE5; inputs 48px radio 6px; touch ≥44px.
- :focus-visible en todo control (anillo 3px rgba(37,99,235,0.35)); nunca quitar foco sin reemplazo.
- Iconos SOLO lucide-react; sin SVG a mano ni emojis; decorativos aria-hidden; solo-icono → aria-label.
- Modales propios → ModalPortal (Escape) + role="dialog" aria-modal="true". Confirmaciones/Swal.
- Estados: error ≠ empty ≠ loading (docs/estados-vacios.md); retry en fallos; submit inválido con
  touchAll; feedback de éxito; vacíos con EmptyState compartido.
- prefers-reduced-motion en todo; sin easing elástico; no animar width/height/top/left.
- PROHIBIDO (craft floor): eyebrows/kickers, side-stripes >1px, hero-metric grids, glassmorphism en
  producto, gradient text, tarjetas anidadas, emojis como íconos, system-ui.
- Un h1 por página, sin saltos h1→h3.

CAMBIOS A HACER (lista puntual con archivo:línea y fix): <detalle del scope>

VERIFICACIÓN: `npm test` + `npx eslint` de lo tocado al terminar; actualizar `*.source.test.js` si el
cambio de copy/estructura es intencional.
REPORTÁ: archivos tocados + qué cambiaste, dejado fuera y por qué, tests.
```

### Protocolo por tanda (obligatorio)

1. Editar solo el scope.
2. `npm test` (baseline 117/117).
3. `npx eslint <archivos tocados>` — sin errores nuevos (comparar deuda preexistente contra HEAD).
4. Anotar en `cambios-realizados.md` / `pendientes.md`.
5. Recién al final de todo: `npm run build` + detector + revisión visual.

## 5. Riesgos conocidos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Agente devuelve vacío / no edita | Verificar con `git status`; re-lanzar. Pasó 2 veces. |
| Reports cruzados desactualizados | Verificar en código antes de registrar como pendiente (ya pasó con `conflicts-table` y `.btn-guardar-grande`, ambos corregidos). |
| Working tree con cambios previos mezclados | No commitear sin pedido; si se commitea, revisar `git diff` por archivo y separar lo del audit. |
| Efectos colaterales en vistas no auditadas | Los componentes compartidos (formularios, headers, footers, ModalPortal) se tocan solo desde el coordinador; los agentes de scope no los editan. Verificar con `grep` los usos antes de cambiar un componente compartido. |
| Regresión visual no detectada | Revisión humana con `npm run dev` (desktop + 360px) sobre el checklist de `pendientes.md` §6; build al cierre. |
