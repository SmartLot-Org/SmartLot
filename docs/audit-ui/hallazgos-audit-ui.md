# Auditoría UI SmartLot — Informe consolidado de hallazgos

> **Cobertura:** 48/48 vistas + shell global. Los auditores aplicaron un tope por vista (máx. 4 hallazgos),
> así que los conteos son cotas inferiores.
> **Totales (hallazgos de vistas):** H ≈ 54 · M ≈ 110 · L ≈ 20 · componentes compartidos ≈ 20 ·
> ~109 hallazgos descartados por los topes → ~320 hallazgos en el universo completo.
> **Severidades:** H = bloqueo/bug/a11y grave · M = consistencia/estados · L = craft/detalle.
> Cada hallazgo cita `archivo:línea` verificada al momento de auditar (puede haber drift de líneas
> tras los fixes ya aplicados — usar como referencia de búsqueda, no como verdad absoluta).

---

## Top 10 de arreglos por impacto

1. **H — Asociar labels a inputs (`htmlFor`/`id`) en formularios admin/dueño/superadmin.** Campos
   sin nombre accesible bloquean lectores de pantalla (`formulario_infoPersonal.jsx:44-110`,
   `formulario_zona.jsx:53-77`, `agregar_sede.jsx:153-202`, `agregar_usuario.jsx:270-402`,
   `editar_zona.jsx:423-475`).
2. **H — Contraste AA en texto muted y badges.** `#94a3b8` ≈2.6:1, `#64748b` ≈3.9-4.4:1,
   `#cbd5e1` ≈1.4:1, badge `#991b1b` sobre `#ff6262` ≈2.8:1. Reemplazar por `#475569`/tokens error
   (~25 archivos afectados).
3. **H — Restaurar foco visible donde `outline: none` no tiene reemplazo** (`admin_dashboard.css:49`,
   `gestion_de_empleados.css:189-204`, `admin_panel_de_control.css:565-577`, `superadmin_dashboard.css:101`,
   `PaymentStatus.jsx:513,536`).
4. **H — Confirmar acciones destructivas:** "Ejecutar reembolso"
   (`superadmin_pagos_test.jsx:1000-1003`), "Liberar el lugar retenido" (`PaymentStatus.jsx:397-401`),
   "Guardar en todas las plantillas" (`superadmin_email_templates.jsx:244-280`), deletes en
   conflictos/gestiones.
5. **H — Datos engañosos/incorrectos:** la tarjeta de plaza del dashboard de empleado muestra día/mes
   como plaza/"Sector" (`empleados_dashboard.jsx:237-238`); "Último reporte" = nivel del garage
   (`superadmin_gestion_garages.jsx:339`); el dashboard superadmin renderiza stats en 0 tras fallo de API
   (`superadmin_dashboard.jsx:76-86`).
6. **H — Errores pintados como vacío/éxito:** `historial_reserva.jsx:225-231` (error → "No tenés
   reservas"), `superadmin_cache.jsx:71,120` (error en banner verde), `ConfirmarSolicitud.jsx:101`
   (ícono de error con verde de éxito), `superadmin_gestion_garages.jsx:320-325` (error → "No hay garages").
7. **H — Modales sin Escape/foco:** unificar vía `ModalPortal` (`ModalPortal.jsx:15-41` que a su vez
   carece de focus trap): trato-modal, overlay de reporte, ExportarModal, modal de soporte del panel,
   modales de superadmin.
8. **H — Botones solo-icono sin `aria-label`:** flechas de volver/Trash/close en
   `gestion_de_empleados.jsx:493`, `agregar_zona.jsx:185`, `admin_reportes_analisis.jsx:989`,
   `gestion_usuarios.jsx:1228`, `superadmin_gestion_garages.jsx:218`, `cuentas_por_cobrar.jsx:17`.
9. **H — Flujos rotos:** "Agregar Garajista" → el redirect pierde el estado
   (`editar_zona.jsx:703-708` + `App.jsx:169-173`); `PaymentStatus.jsx:403,557-569` muestra acciones de
   superadmin/empleado a cualquiera en una página pública.
10. **M — Barrido de consistencia del sistema:** botones 32-64px vs 40/48; radios 12-20px vs 6/10/14;
    hexes inline vs tokens; `system-ui` vs DM Sans; tuteo vs voseo; side-stripes/eyebrows/
    glassmorphism/easing elástico prohibidos.

---

## Hallazgos por vista

### Público / Landing / Auth

#### `/` — `src/vistasLanding/Landing.jsx` (M:4)
- **M · Responsive:** Navbar `hidden md:flex` elimina "Solución"/"Contacto" bajo md y no hay menú —
  `src/componentesLanding/landing/Navbar.jsx:51-61` — Fix: drawer mobile.
- **M · Anti-patrón:** eyebrow "Ecosistema Integral" se repite en cada sección —
  `landing/BentoGrid.jsx:83-85` — Fix: borrar kicker.
- **M · Sistema:** `glass-card rounded-[1.5rem] shadow-…` = glass + borde + sombra, radio 24px —
  `landing/BentoGrid.jsx:99-104` — Fix: declarar una sola elevación (el vidrio de landing es el mundo
  commiteado; ver nota al final).
- **M · Copy:** "Satisfacción del cliente 4.9/5", "Calificación en empresas 4.8★" sin rotular como
  ejemplos — `landing/StatsTicker.jsx:6-11` — Fix: "Datos de ejemplo" (decisión aprobada).

#### `/para-garages` (H:1 M:3)
- **H · Contraste:** `text-xs text-brand-muted/80` ≈4.33:1 — `paraGarages/ParaGaragesShowcase.jsx:44`
  — Fix: `text-brand-muted` completo.
- **M · Tipografía:** `.garage-hero-title` clamp 8.25rem, tracking −0.05em — `landing/landing.css:45-48`
  — Fix: tope 6rem, −0.03em.
- **M · Anti-patrón:** grilla idéntica de ícono + heading + texto en glass-card —
  `paraGarages/ParaGaragesPains.jsx:44-55` — Fix: lista con divisores.
- **M · Copy:** testimonios con usuarios nombrados presentados como hechos —
  `paraGarages/ParaGaragesSocial.jsx:5-28` — Fix: rotular como ejemplos.

#### `/login` (M:3 L:1)
- **M · Motion:** beam del submit con `repeat: -1` sin `prefers-reduced-motion` —
  `auth/LoginForm.jsx:43-51`.
- **M · Sistema:** botón `px-8 py-4` ≈60px + hover `bg-brand-deep` vs 40/48px + `#156FE5` —
  `auth/LoginForm.jsx:218-219`.
- **M · Copy:** "Espere ${cooldown}s" (usted) vs voseo "Ingresá"; botón de Google rotulado solo
  "Google" — `auth/LoginForm.jsx:220,227,262`.
- **L · Consistencia:** `text-red-600` fuera de token; "¿Olvidaste…?" es `<a href>` con full reload —
  `auth/LoginForm.jsx:225,142`.

#### `/auth/callback` (M:2)
- **M · Estados:** `access_token` ausente redirige a `/login` en silencio — `AuthCallback.jsx:19-21`
  — Fix: pasar estado de error.
- **M · Copy:** "Iniciando sesión..." vs "Ingresando..." — tres nombres para el login —
  `AuthCallback.jsx:46`.

#### `/register` (M:4)
- **M · A11y:** `role="tablist"`/`tab` sin `tabpanel`/`aria-controls`/roving tabindex —
  `auth/RegisterRoleToggle.jsx:22-46` — Fix: radiogroup.
- **M · Jerarquía:** h1 "Creá tu cuenta" salta a h3 — `RegisterGarageForm.jsx:151`,
  `RegisterEmpresaForm.jsx:177,242` — Fix: h2.
- **M · Sistema:** submit `px-8 py-4` ≈60px + hover navy — `RegisterGarageForm.jsx:217-219`.
- **M · Estados:** validación live `<ul>` sin `aria-describedby`/`aria-invalid` —
  `auth/RegisterField.jsx:43,77`.

#### `/logout` (M:1)
- **M · Estados:** `return null` en blanco mientras limpia la sesión — `Logout.jsx:21` —
  Fix: "Cerrando sesión…".

#### `/unauthorized` (M:2 L:1)
- **M · Copy:** "Volver al inicio" navega a `/login` — `Unauthorized.jsx:15-18`.
- **M · Sistema:** inline `#d32f2f`, `#666`, `#2563EB`; sin estilos de foco — `Unauthorized.jsx:4-19`.
- **L · Jerarquía:** h1 "403", el título real "Acceso Denegado" es h2 — `Unauthorized.jsx:9-10`.

#### `/recuperar-clave` (M:3 L:1)
- **M · Consistencia:** re-implementa inputs/botones (`login-*`) con gradiente + glass 24px —
  `src/pages/Login.css:44-48,67,193`.
- **M · Jerarquía:** dos botones primarios pares — `ForgotPassword.jsx:197-225`.
- **M · Copy:** reglas de contraseña distintas a Register — `ForgotPassword.jsx:89`.

#### `/payment/*` — `src/pages/PaymentStatus.jsx` (H:4)
- **H · A11y:** inputs manuales con `outline: "none"` sin foco — `PaymentStatus.jsx:513,536`.
- **H · Contraste:** `#94A3B8` ≈2.57:1 — `PaymentStatus.jsx:331,550,573`.
- **H · Estados:** "Liberar el lugar retenido" cancela sin confirmación — `PaymentStatus.jsx:397-401`.
- **H · Estado incorrecto:** página pública muestra "Ir a Testing de Pagos"/"Volver al dashboard"/
  "Ver mis reservas" a todos — `PaymentStatus.jsx:403,557-569`.

### Shell global
- **M · Anti-patrón:** `.glass-nav`/`.glass-card` + overlay de grano `.bg-noise` — `src/index.css:129-156`.
- **M · Sistema:** `--mono: ui-monospace` y `index.html` solo carga Archivo+DM Sans; JetBrains Mono
  nunca carga — `src/index.css:71`, `index.html:15-19`.
- **M · A11y:** `label::after { content: " *" }` marca campos opcionales como requeridos y comunica
  solo por color — `src/index.css:243-244`.
- **L · Pulido:** `RouteFallback` con `bg-slate-50` sin `role="status"` — `src/App.jsx:76-77`.

### Empleado / Garagista

#### `/empleados_dashboard` (H:2 M:2)
- **H · Datos:** la tarjeta de plaza bindea `fecha.slice(8,10)`/`formatReservaMonth` como
  plaza/"Sector" — `empleados_dashboard.jsx:237-238` → `tarjeta_reserva.jsx:118-122`.
- **H · A11y:** `.empleado-reporte-overlay` sin Escape/foco — `empleados_dashboard.jsx:784-839` —
  Fix: ModalPortal.
- **M · Tipografía:** labels de plaza 8.5px/7.5px — `tarjeta_reserva.css:113-138`.
- **M · A11y:** "Mostrar todas" sin `aria-expanded` — `empleados_dashboard.jsx:740-743`.

#### `/nueva_reserva` (H:1 M:3)
- **H · Contraste:** `.dia-indicador-label` `#3b82f6` sobre `#eff6ff` ≈3.4:1 — `form_reserva.css:239-245`.
- **M · Contraste:** inline `#4481e2` ≈3.8:1, `#1164e8`@0.9 ≈4.4:1 — `form_reserva.jsx:344-352`.
- **M · Responsive:** `.reserva-form-card` con márgenes negativos en % y 30% abajo — `form_reserva.css:43-45`.
- **M · Tipografía:** override `system-ui` — `form_reserva.css:8`.

#### `/historial_reserva` (H:1 M:1 L:2)
- **H · Estados:** el `.catch` limpia datos → vacío "No tenés reservas en tu historial." tras fallo —
  `historial_reserva.jsx:225-231`.
- **M · Tipografía:** h1 Archivo 34px/900 vs DM Sans 500-700 — `historial_reserva.css:38-46`.
- **L · Copy:** "Ultima reserva", "Mostrar mas (N)" — `historial_reserva.jsx:255,294`.
- **L · Anti-patrón:** tiles de estado con gradiente — `tarjeta_reserva.css:194-204`.

#### `/perfil_empleado` (M:3 L:1)
- **M · A11y:** salto h1→h3 — `formulario_info_personal.jsx:15`, `perfil_empleado.jsx:389`.
- **M · Estados:** `if (!isValid) return;` silencioso — `perfil_empleado.jsx:242-243`.
- **M · Estados:** el loading quita Header/Footer y `fontFamily: sans-serif` — `perfil_empleado.jsx:337-343`.
- **L · Motion:** GSAP sin reduced-motion — `perfil_empleado.jsx:228-236`.

#### `/agregar_vehiculo` (H:1 M:2 L:1)
- **H · A11y:** autocomplete `<li onClick>` sin teclado/roles de listbox — `agregar_vehiculo.jsx:254-298`.
- **M · Sistema:** hexes inline `#3b82f6`, `#eff6ff`, `#dbeafe`, `#cbd5e1` — `agregar_vehiculo.jsx:230-337`.
- **M · Estados:** error genérico "Error al crear el vehículo", se descarta la razón del servidor —
  `agregar_vehiculo.jsx:192-203`.
- **L · Copy:** "Añadir Vehículo" vs "Agregar vehículo" — `agregar_vehiculo.jsx:224,340`.

#### `/garagista_dashboard` + `/control-acceso` (H:2 M:2)
- **H · Contraste:** `.movement-row p` `#7b8798` ≈3.6:1 — `garagista_dashboard.css:546-548`.
- **H · Contraste:** `::placeholder` del search `#94a3b8` ≈2.6:1 — `garagista_dashboard.css:229-231`.
- **M · Anti-patrón:** `.access-card--inside { border-left: 4px solid #2563eb }` — `garagista_dashboard.css:311-313`.
- **M · Sistema:** `min-height: 42px`, radios 18-22px, `#172033` — `garagista_dashboard.css:4-5,299-301,406-411`.

### Admin

#### `/admin_dashboard` (H:2 M:2)
- **H · A11y:** `.dashboard-card` con `outline: none` sin `:focus` — `admin_dashboard.css:49`.
- **H · Contraste:** `#64748B` sobre `#DBEAFE` ≈3.90:1 — `admin_dashboard.css:37,71-83`.
- **M · Tipografía:** override `system-ui` — `admin_dashboard.css:6`.
- **M · Copy:** "Gestión de Usuarios" vs "Agregar empleado"; "Creá"/infinitivo mezclados —
  `admin_dashboard.jsx:69-78`.

#### `/perfil_admin` (M:4)
- **M · Estado incorrecto:** badge hardcodea "Administrador de Sede" también para admins de empresa —
  `perfil_admin.jsx:95-98` (`src/helpers/roles.js:17`).
- **M · Motion:** GSAP sin reduced-motion — `perfil_admin.jsx:37-44`.
- **M · A11y:** salto h1→h3 — `perfil_admin.jsx:94,112,161-162`.
- **M · Color:** inline `#1e293b`, `#64748b`, `#f1f5f9` — `perfil_admin.jsx:161-178`.

#### `/gestion_de_empleados` (H:2 M:2)
- **H · A11y:** botón volver solo-icono sin `aria-label` — `gestion_de_empleados.jsx:493-495`.
- **H · A11y:** `.input-moderno { outline: none }`, solo `:hover` — `gestion_de_empleados.css:189-204`.
- **M · A11y:** buscador/select solo placeholder, sin labels — `gestion_de_empleados.jsx:532-558,706-712`.
- **M · Copy:** "Gestión de Usuarios" vs "empleados"; placeholder "cargo" cuando el filtro es rol —
  `gestion_de_empleados.jsx:497-534,415`.

#### `/agregar_empleado` (M:3 L:1)
- **M · A11y:** título de página es `<h3 style={{color:"#1D4ED8"}}>`, sin h1 — `agregar_empleado.jsx:230`.
- **M · Copy:** "Configuración de nuevos usuarios y sus privilegios" — claim falso — `agregar_empleado.jsx:231`.
- **M · Color:** Cancelar `backgroundColor: "grey"` — `agregar_empleado.jsx:267`.
- **L · Copy:** "❌ Corrige los errores…" con emoji + tuteo — `agregar_empleado.jsx:151-164`.

#### `/gestion_garages` (H:2 M:2)
- **H · Contraste:** `--garage-subtle: #94a3b8` en texto de 11px ≈2.57:1 — `gestion_garages.css:6,201,232`.
- **H · A11y:** `div.trato-modal role="dialog"` sin Escape/foco — `gestion_garages.jsx:268`.
- **M · Anti-patrón:** `.trato-card--pending { border-left: 3px solid #f59e0b }` — `gestion_garages.css:217,225`.
- **M · Copy:** `Solicitar ${…}?` sin "¿"; "trato" vs "contratos" — `gestion_garages.jsx:134,234,239`.

#### `/agregar_garage_propio` (M:2 L:1)
- **M · Sistema:** `min-height: 58px`; `border-radius: 14px` — `agregar_zona.css:113-118`.
- **M · Estados:** error de carga de sedes sin retry — `agregar_garage_propio.jsx:62,91,286`.
- **L · Copy:** h1 "Agregar garage" vs "Crear garage propio" — `agregar_garage_propio.jsx:233,290`.

#### `/agregar_zona` (H:1 M:2 L:1)
- **H · A11y:** botón volver solo-icono sin `aria-label` — `agregar_zona.jsx:185-187`.
- **M · Color:** caja de error inline `#d32f2f`/`#ffebee` — `agregar_zona.jsx:240`.
- **M · Estados:** "Crear Garage" deshabilitado por `!idDueno` sin motivo; error inalcanzable en
  `:128` — `agregar_zona.jsx:127-129,246`.
- **L · Copy:** `❌ Error al crear garage: ${JSON.stringify(errorMsg)}` + kicker "AGREGAR GARAGE" —
  `agregar_zona.jsx:175,190-192`.

#### `/editar_zona` (H:3 M:1)
- **H · Flujo:** "Agregar Garajista" → `/agregar_garajista` solo redirige, se pierde el estado —
  `editar_zona.jsx:703-708`, `App.jsx:169-173`.
- **H · A11y:** labels "Nombre del garage" etc. sin `htmlFor`/`id` — `editar_zona.jsx:423-475`.
- **H · Responsive:** contadores 38×38px, botones de archivar 34×34px — `editar_zona.css:311-312,535-536`.
- **M · Copy:** "Inactivo" + WifiOff "Sin conexión" para un garage cerrado — `editar_zona.jsx:581-589`.

#### `/admin_panel_de_control` (H:4)
- **H · A11y:** modal de soporte `role="dialog"` sin Escape/foco — `admin_panel_de_control.jsx:822-880`.
- **H · Contraste:** `.conflict-priority--alta` `#991b1b` sobre `#ff6262` ≈2.84:1 —
  `admin_panel_de_control.css:550-553`.
- **H · A11y:** colapso de tabla con `onClick` en `<thead>` sin teclado —
  `tabla_reservas_panelControl.jsx:379-389`.
- **H · A11y:** buscador de reservas solo placeholder — `tabla_reservas_panelControl.jsx:347-356`.

#### `/admin_reportes_analisis` (H:1 M:3)
- **H · A11y:** botón volver solo-icono sin `aria-label` — `admin_reportes_analisis.jsx:989-994`.
- **M · Motion:** `AnimatedNumber` rAF, `trendDotPop` con overshoot, skeletons SMIL, sin
  reduced-motion — `admin_reportes_analisis.jsx:556-590`, `.css:196-209,587-598`.
- **M · Theming:** KPIs `#1d4ed8`/`#eff6ff`/`#059669`/`#d97706`/`#dc2626` inline —
  `admin_reportes_analisis.jsx:950-983,1031`.
- **M · Anti-patrón:** cuatro cards idénticas icon+kpi — `admin_reportes_analisis.jsx:1036-1054`,
  `.css:119-166`.

#### `/admin_pagos` (H:2 M:2)
- **H · Contraste:** `#94a3b8` en contenido real ≈2.6:1 — `admin_pagos.css:36,41,46`.
- **H · Responsive:** PAGAR `min-height: 32px`, clear 34px — `admin_pagos.css:34,47`.
- **M · Theming:** inline `#f0fdf4`/`#eff6ff`/`#64748b`/`#1e3a8a` — `admin_pagos.jsx:40-49,264-277`.
- **M · A11y:** ExportarModal sin Escape/foco (el drawer sí lo tiene) — `admin_pagos.jsx:54-60` vs `28-33`.

#### `/gestion_sedes` (H:1 M:3)
- **H · Contraste:** `.stats-sedes-card p` `#94a3b8` ≈2.6:1 — `gestion_sedes.css:98-101`.
- **M · A11y:** orden h1→h4→h2→h3 — `gestion_sedes.jsx:87,102,105,140`.
- **M · Motion:** GSAP de entrada sin reduced-motion — `gestion_sedes.jsx:67-75`.
- **M · Estados:** fallo de carga sin retry — `gestion_sedes.jsx:56,122-123`.

#### `/agregar_sede` (admin) (H:1 M:2 L:1)
- **H · A11y:** labels sin cablear (sin `for`/`id`) — `agregar_sede.jsx:153-202`,
  `src/hooks/useLiveValidation.js:68-75`.
- **M · Estados:** `if (!isValid) return;` silencioso, botón sigue habilitado — `agregar_sede.jsx:102-105,207-214`.
- **M · Consistencia:** la regla de asterisco de requerido no cubre `.input-group-sede-admin` —
  `src/index.css:236-246`, `agregar_sede.css:79-91`.
- **L · Copy:** icono `color="white"`; éxito sin confirmación — `agregar_sede.jsx:122-123,212`.

#### `/agregar_admin_sede` (M:4)
- **M · A11y:** título es h3, sin h1 — `agregar_admin_sede.jsx:146-148`.
- **M · Sistema:** botones `width:320px!important; height:60px!important; radius:20px!important` —
  `agregar_admin_sede.css:58-64`.
- **M · Tipografía:** override `system-ui` — `agregar_admin_sede.css:1-5`.
- **M · Estados:** `!isValid` silencioso — `agregar_admin_sede.jsx:109-112`.

### Dueño de garage

#### `/duenio-garage/dashboard` (H:1 M:2 L:1)
- **H · Contraste:** body del hero `#64748b` sobre `#f5f7fb` ≈4.44:1 — `duenio_garage.css:3,46-50`.
- **M · Anti-patrón:** hero + 5 tiles ícono/label/número, kicker mono, blobs azules —
  `duenio_garage_dashboard.jsx:197-244`, `.css:127-133,171-175`.
- **M · A11y:** `role="tablist"` sin tabpanel/flechas; tabs de 38px —
  `duenio_garage_dashboard.jsx:251-268`, `.css:214-227`.
- **L · Copy:** "Ocupacion media", "Todavia no tenes…" — `duenio_garage_dashboard.jsx:226,277-278`.

#### `/duenio-garage/crear-garage` (M:3 L:1)
- **M · Color:** banner inline `#d32f2f`/`#ffebee` — `crear_garage_dueño.jsx:229` — Fix: `.duenio-feedback error`.
- **M · Sistema:** `.btn-guardar-grande` 58px/14px/#156fe5 — `agregar_zona.css:113-148`.
- **M · Copy:** `JSON.stringify(mensaje)` filtrado; textos de schema en tuteo — `crear_garage_dueño.jsx:84-116,195`.
- **L · Copy:** eyebrow "ALTA DE ACTIVO"; nota de dev visible — `crear_garage_dueño.jsx:210-212`.

#### `/duenio-garage/tratos` (M:2 L:1)
- **M · Anti-patrón:** `border-left: 3px solid #2563eb` — `duenio_garage.css:717,751`.
- **M · Jerarquía:** kicker + chip + h1 compiten — `tratos_empresa_garage.jsx:15`.
- **L · Copy:** "Tratos con empresas " con espacio colgante; label de rol distinto —
  `tratos_empresa_garage.jsx:15`, `cuentas_por_cobrar.jsx:45`.

#### `/duenio-garage/garage/:id/editar` (M:2 L:1)
- **M · Estados:** validación solo al guardar con banner, sin inline (crear usa `useLiveValidation`) —
  `editar_garage_dueño.jsx:108-124`.
- **M · Estados:** error de carga sin retry/EmptyState — `editar_garage_dueño.jsx:149`.
- **L · Consistencia:** dos clases de back-button 46px vs 54px; estilos inline en fieldsets —
  `editar_garage_dueño.jsx:147,150`, `.css:317-321`.

#### `/duenio-garage/cuentas-por-cobrar` (H:2 M:2)
- **H · A11y:** buscador sin nombre accesible — `cuentas_por_cobrar.jsx:49`.
- **H · Contraste:** `.cxc-empty` `#94a3b8` ≈2.57:1, `{error}` ilegible — `cuentas_por_cobrar.css:41`, `.jsx:50`.
- **M · A11y:** ExportarModal close `<X/>` sin `aria-label`, sin Escape/foco — `cuentas_por_cobrar.jsx:17,30`.
- **M · Anti-patrón:** `border-left: 4px solid #ef4444`, grid hero-metric de KPIs — `cuentas_por_cobrar.css:20,53,12-18`.

#### `/duenio-garage/perfil` (H:1 M:2 L:1)
- **H · A11y:** focus ring `rgba(37,99,235,0.4)` ≈1.8:1, falla 3:1 — `perfil_dueño_garage.css:183-185`.
- **M · Motion:** GSAP ignora reduced-motion (el CSS solo anula transitions) — `perfil_dueño_garage.jsx:178-186`.
- **M · A11y:** salto h1→h3 — `perfil_dueño_garage.jsx:319,348,413`.
- **L · Semántica:** "Cerrar Sesión" estilizado danger `#e11d48` rivalizando con "Guardar Cambios" —
  `perfil_dueño_garage.jsx:149,320-323,438`, `.css:233-237`.

### Superadmin

> **Nota de ejecución:** por decisión del dueño (ADR-007), en el superadmin **no se cambiaron colores**.
> Los fixes aplicados fueron de a11y/estados/copy/estructura. Los hallazgos de color listados acá
> quedaron diferidos (ver `pendientes.md` §4).

#### `/superadmin_dashboard` (H:2 M:2)
- **H · Estados:** fallo de API muestra ceros como datos — `superadmin_dashboard.jsx:76-86`.
- **H · A11y:** `outline: none` en card con `tabIndex={0}`, sin `:focus-visible` —
  `superadmin_dashboard.css:101`, `superadmin_dashboard_boton.jsx:61`.
- **M · Anti-patrón:** `borderTop: 3px solid ${color}` + paleta hardcodeada — `superadmin_dashboard.jsx:36,147-156`.
- **M · Motion:** 7 cards idénticas, `back.out(1.4)` elástico, sin reduced-motion —
  `superadmin_dashboard.jsx:162-219`, `superadmin_dashboard_boton.jsx:27`.

#### `/superadmin/gestion_usuarios` (H:3 M:1)
- **H · A11y:** Trash2/back/close solo-icono sin `aria-label` — `gestion_usuarios.jsx:1228-1233,812-814,1156-1161`.
- **H · A11y:** búsquedas solo placeholder; labels de filtro sin `htmlFor` — `gestion_usuarios.jsx:872-877,904-920,1167-1172,1273-1277`.
- **H · Contraste:** headings del dark-modal `#0F1A2E !important` sobre `rgba(15,23,42,.95)` ≈1:1 —
  `gestion_usuarios.css:640-651` — **diferido por decisión**.
- **M · Anti-patrón:** glassmorphism "PANEL DESPLEGABLE (GLASSMORPHISM)" blur(12/16px) —
  `gestion_usuarios.css:173-181,621-626,1079-1084` (se quitó el blur; colores conservados).

#### `/superadmin/agregar_usuario` (H:1 M:2 L:1)
- **H · A11y:** labels (Nombre…Garage) nunca asociados — `agregar_usuario.jsx:270-402`.
- **M · Design:** focus ámbar `#f59e0b` en vez de azul señal — `agregar_usuario.css:127-132` — **diferido**.
- **M · Estados:** la regla de asterisco no cubre estos labels — `agregar_usuario.css:79-85`.
- **L · Copy:** "Se enviara una notificacion…", tuteo — `agregar_usuario.jsx:238,187`.

#### `/superadmin/gestion_empresas` (+ `/gestion_sedes`) (H:1 M:3)
- **H · A11y:** inputs de edición inline solo placeholder; guardar/cancelar solo-icono —
  `gestion_empresas.jsx:125,127`.
- **M · A11y:** h1→h4→h2→h3 con números como headings — `gestion_empresas.jsx:117-127`.
- **M · Estados:** `Promise.all` sin catch (skeleton colgado); sin feedback de delete; doble-submit —
  `gestion_empresas.jsx:47-54,88-114`.
- **M · Color:** focus ámbar + `#0F1A2E`/`#1A2744`/`#F59E0B` hardcodeados — `gestion_empresas.css:244-247` — **diferido**.

#### `/superadmin/agregar_empresa` (M:2 L:1)
- **M · Estados:** navegación con éxito silencioso — `agregar_empresa.jsx:55-56`.
- **M · Color:** focus ring ámbar — `agregar_empresa.css:112-114` — **diferido**.
- **L · Copy:** tuteo + error no accionable — `agregar_empresa.jsx:44,59`.

#### `/superadmin/agregar_sede` (H:2 M:2)
- **H · A11y:** labels sin asociar — `agregar_sede.jsx:152-188`.
- **H · Estados:** `if (!isValid) return;` no-op silencioso — `agregar_sede.jsx:112`.
- **M · Estado incorrecto:** "Descripción" opcional recibe required + asterisco rojo —
  `agregar_sede.jsx:176-184`, `src/index.css:236-243`.
- **M · Design:** Cancel `backgroundColor: "grey"`; back sin `aria-label` — `agregar_sede.jsx:228,138-140`.

#### `/superadmin/gestion_garages` (H:1 M:3)
- **H · A11y:** back solo-icono sin `aria-label` — `superadmin_gestion_garages.jsx:218-220`.
- **M · Estados:** sin try/catch (skeleton permanente); error pinta "No hay garages registrados." —
  `superadmin_gestion_garages.jsx:125-151,320-325`.
- **M · Estados:** `.btn-nueva-zona:hover` nunca matchea `btn-nueva-zona-superAdmin` → CTA sin hover —
  `superadmin_gestion_garages.css:80`, `.jsx:229`.
- **M · Dato engañoso:** `ultimoReporte={garage.piso ? "Nivel …" : "Sin nivel"}` bajo un ícono
  Clock — `superadmin_gestion_garages.jsx:339`.

#### `/superadmin/conflictos` (H:2 M:2)
- **H · Contraste:** `.conflict-priority--alta` ≈2.8:1 (CSS compartido) — `admin_panel_de_control.css:550-553`.
- **H · A11y:** `<select>` de estado sin nombre accesible + `outline:none` —
  `superadmin_conflictos.jsx:535-544`, `admin_panel_de_control.css:565-577`.
- **M · Responsive:** `.conflicts-table` min-width 860px dentro de shell con `overflow:hidden` —
  `admin_panel_de_control.css:466-478,1499-1505`.
- **M · Estados:** filas resueltas muestran CheckCircle2 pero conservan `aria-label="Eliminar conflicto"`
  y el delete — `superadmin_conflictos.jsx:553-559`.

#### `/superadmin/reservas` (H:2 M:2)
- **H · Contraste:** `.resv-estado--vencida` ≈2.9:1, `--curso` ≈3.4:1 — `superadmin_reservas.css:486-499` — **diferido**.
- **H · A11y:** buscador solo placeholder; labels "Día/Desde/Hasta" sin asociar — `superadmin_reservas.jsx:504-553`.
- **M · Sistema:** botón refresh estilizado con clase foreign `.btn-archivados`; `boton-base-smartlot`
  sin CSS — `superadmin_reservas.jsx:458-465`, `boton_generico.jsx:11`.
- **M · Anti-patrón:** `borderTop: "3px solid #3B82F6"` en stat cards — `superadmin_reservas.jsx:471-483`.

#### `/superadmin/cache` (M:2 L:2)
- **M · Estado incorrecto:** texto de error dentro del banner verde `.cache-message` — `superadmin_cache.jsx:71,120`, `.css:22`.
- **M · Sistema:** `window.confirm(...)` nativo — `superadmin_cache.jsx:78-79`.
- **L · Anti-patrón:** eyebrow "Mantenimiento del sistema" — `superadmin_cache.jsx:97`, `.css:7`.
- **L · Anti-patrón:** grilla de cards idénticas con ícono Database — `superadmin_cache.jsx:133-147`.

#### `/superadmin/pagos-test` (H:2 M:2)
- **H · Estados:** "Ejecutar reembolso" dispara de inmediato, irreversible — `superadmin_pagos_test.jsx:1000-1003`.
- **H · A11y:** input payment_id solo placeholder — `superadmin_pagos_test.jsx:627-632`.
- **M · Estados:** `estadoClase` conserva `_`/`.` y `mpt-badge--in_process` etc. no matchean CSS —
  `superadmin_pagos_test.jsx:78-83`, `.css:633-656`.
- **M · Sistema:** `EmptyTab` local en vez de `EmptyState` compartido — `superadmin_pagos_test.jsx:105-118,836,939`.

#### `/superadmin/email-templates` (H:1 M:2 L:1)
- **H · A11y:** inputs de override del preview sin nombre accesible — `superadmin_email_templates.jsx:576-584`.
- **M · Estados:** "Guardar en todas las plantillas" sobrescribe en masa sin confirmación —
  `superadmin_email_templates.jsx:244-280,327-339`.
- **L · Anti-patrón:** eyebrow "Personalización" — `superadmin_email_templates.jsx:322`, `.css:7`.
- **L · Copy:** "Preview en vivo" vs "Vista previa"; "Header y Footer" sin traducir —
  `superadmin_email_templates.jsx:195,414,565`.

#### `/solicitud-registro/revision` (H:2 M:2)
- **H · Semántica incorrecta:** bloque de error usa `login-ok-icon` (verde éxito `#22C55E`) —
  `ConfirmarSolicitud.jsx:101`, `src/pages/Login.css:345`.
- **H · Contraste:** "Aceptar solicitud" blanco sobre `#16a34a` ≈3.3:1 — `ConfirmarSolicitud.css:46-63` — **diferido (paleta)**.
- **M · A11y:** h3 sin h1; "Solicitud {resuelta}" interpola el estado crudo — `ConfirmarSolicitud.jsx:102,115-117`.
- **M · Anti-patrón:** panel Operate sobre `login-card` con blur(14px) + glow blobs — `ConfirmarSolicitud.jsx:80-83`, `Login.css:15-46`.

### Componentes compartidos (deduplicados)

- **H · Labels floating sin asociar** (sin `htmlFor`/`id`) — `src/componentesAdmin/formulario_infoPersonal.jsx:44-110`,
  `src/componentesAdmin/formulario_zona.jsx:53-77,148-205` — Afecta: agregar_empleado, agregar_admin_sede,
  agregar_garage_propio, agregar_zona, crear/editar garage del dueño.
- **H · Logo `<img onClick>` no operable con teclado** — `header_admin.jsx:16-22`,
  `header_superadmin.jsx:12-18`, `header_empleado.jsx:29`, `header_dueño_garage.jsx:14-19` —
  Afecta: toda vista autenticada.
- **H · Dropdown de sede custom (`div`/`li onClick`, sin roles/teclado)** —
  `formulario_infoPersonal.jsx:115-146`, `formulario_zona.jsx:85-115`.
- **H · `article onClick` sin rol/teclado** — `src/componentesAdmin/tarjeta_garages.jsx:19` —
  Afecta: `/superadmin/gestion_garages`.
- **H · Muted por debajo de AA:** labels de footer `#94a3b8` ≈2.6:1 (`footer_empleado.css:87-104,201`),
  placeholder `#cbd5e1` ≈1.4:1 (`formulario_PerfilPersonal.css:179-182`).
- **M · ModalPortal cierra con Escape pero sin focus trap/foco inicial; `zIndex: 2000` inline** —
  `src/componentesCompartidos/ModalPortal.jsx:15-41` — Afecta: todos los modales.
- **M · `.btn-primario` 42px/12px/#1A73E8** — `src/componentesAdmin/boton_generico.css:2-21`.
- **M · Footers:** glassmorphism blur(12px), `cubic-bezier(0.34,1.56,0.64,1)` elástico, props de layout
  animadas, labels 9-10px `#94a3b8` — `footer_empleado.css:12-30`, `footer_dueño_garage.css:6-20,94-110,238-245`.
- **M · Campana SVG dibujada a mano (affordance muerta) junto a íconos lucide** —
  `header_superadmin.jsx:22-25`, `header_empleado.jsx:34-36`.
- **M · UserDropdown sin navegación por flechas; GSAP sin reduced-motion** — `src/components/UserDropdown.jsx:55-91`.
- **M · ErrorBoundary con hexes inline, 100vh, botones sin `:focus-visible`** — `src/components/ErrorBoundary.jsx:24-45`.
- **M · CtaButton lg 64px/rounded-2xl vs 48px/10px** — `src/componentesLanding/CtaButton.jsx:10,21`.
- **M · GestionTratosGarage 5 tiles hero-metric; `#94a3b8` chico** — `GestionTratosGarage.jsx:127-158`.
- **M · AuditoriaPanel GSAP anima height, sin reduced-motion** — `AuditoriaPanel.jsx:33-56`.
- **M · ToastUndo sin `role="status"`/`aria-live`** — `src/componentesShared/ToastUndo.jsx:18-24`.
- **M · BotonReportes con gradiente + `system-ui` + tildes faltantes** — `boton_reportes.css:10,14,15`.
- **M · TarjetaGarageDueño eyebrow mono, entrada elástica, botones 42px con rotate en hover** —
  `tarjeta_garage_dueño.jsx:64-66`, `.css:16-17,217-221,376-383`.
- **M · Fotos stock Garage1-3.jpg con `alt={titulo}` que implica foto real** — `tarjeta_garages.jsx:21`.
- **M · FormularioZona con copy incorrecto en edición ("del nuevo garage"), tildes faltantes** —
  `formulario_zona.jsx:43-48,157`.
- **L · FieldValidation con SVGs a mano, `#16a34a`/`#dc2626` hardcodeados, slide-in sin guard** —
  `FieldValidation.jsx:14-30`, `FieldValidation.css:8,33,37`.

---

## Needs runtime check (agregado — verificar con la app corriendo)

- Márgenes negativos en `.reserva-form-card` e inputs `width:200%` → scroll horizontal a 360-390px.
  **(Ya corregido en el scope empleado; verificar visualmente.)**
- Contraste de texto sobre footers translúcidos/glass y `.panel-stats-card` con gradiente (píxeles
  compuestos). **(Los footers de producto ya pasaron a planos; quedan landing/auth que conservan vidrio.)**
- Tabla de conflictos recortada entre 769-956px; comportamiento de `min-width:860px`. **(Corregido:
  `overflow-x: auto` — verificar.)**
- Nombres accesibles del autocomplete de Google Maps (agregar/editar zonas y sedes).
- Carreras de cámara de `html5-qrcode`; polling de Mercado Pago / flujo de `window.open`.
- Entradas/hovers de GSAP con reduce-motion del SO; costura del marquee de `StatsTicker`;
  flipbook de `LogoWatermark` (~10MB) en 4G.

---

## Nota sobre el vidrio (glassmorphism) — interpretación final aplicada

DESIGN.md define **dos registros**: Persuade (landing/auth, con vidrio y animación expresiva) y
Operate (paneles, planos, sin vidrio). La ejecución siguió esa fuente:

- **Se quitó el vidrio de paneles de producto** (footers de empleado/dueño, paneles "glass" del
  superadmin, card de `ConfirmarSolicitud`).
- **Se conservó en landing/auth** como efecto del mundo commiteado (ahí el fix fue de elevación
  única: no acumular borde + sombra + blur).
