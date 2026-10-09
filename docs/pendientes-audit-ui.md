# SmartLot — Paso a paso de todo lo que falta por hacer

> **Contexto:** esta sesión inició una auditoría de UI de **todas las vistas routeadas** de SmartLot
> (pedida como *"check every view and find UI that can be changed for better, list it with the error
> and where to find it"*, delegada a subagentes tipo `general`). El usuario tuvo que cerrar la sesión,
> así que este documento deja el plan completo y ejecutable para retomarlo sin perder contexto.
>
> **Modo original:** plan (solo lectura). **Modo actual:** build (ediciones permitidas).
> **Idioma de la app / del código:** español. Informes técnicos en inglés (como se pidió).

---

## 1. Qué ya está hecho (NO repetir)

1. **Orientación del proyecto (completada):**
   - Estructura leída: `README.md`, `package.json`, `DESIGN.md` (raíz), `src/`, `docs/`.
   - Stack confirmado: React 19, Vite 8, Tailwind CSS v4 (tokens en `@theme` en `src/index.css`),
     react-router-dom v7, lucide-react + react-icons, recharts, GSAP, SweetAlert2.
   - Especificación de estados vacíos: `docs/estados-vacios.md` (referencia para auditoría).
2. **Mapa de rutas completo (completado)** desde `src/App.jsx` — **48 vistas routeadas** en 6 áreas de
   rol + shell global (lista completa en la sección 3).
3. **Contexto de diseño (completado):** `DESIGN.md` — sistema *"Azul Señal"*:
   - Tipografías: Archivo (display landing), DM Sans (producto), JetBrains Mono (datos).
   - Tokens de color (`--color-brand-*`, `--accent*`, semánticos), radios (6/10/14/full),
     sombras (`--shadow-sm/md/lg/accent`), botones 40px/48px, inputs con floating label, badges.
4. **División del trabajo en 7 grupos de subagentes (diseñada)** con prompt base único (sección 4).
5. **Primer intento de delegación (parcial):** el subagente del Grupo 1 devolvió resultado **vacío**
   (`ses_ee1456cb0ffewbgEVqhGy5WrZm`, estado completed pero sin contenido). Los demás `task` calls
   fallaron o fueron cancelados por un tool call mal formado. **Los resultados NO existen: hay que
   re-ejecutar todos los grupos.**

### Pendientes de contexto (opcionales, no bloqueantes)
- **No existe `PRODUCT.md`** → correr `init` del skill impeccable para capturar contexto de producto
  (el skill lo rutea antes de `new-work`; ofrecerlo al usuario, no correrlo sin pedir).
- **No existe `.codegraph/`** → sugerir `codegraph init -i` al usuario.
- **El launcher de impeccable NO se corrió** (`impeccable context`) porque en plan mode puede escribir
  un binario a disco. Antes de trabajo de edición con el skill, correr una sola vez:
  `.agents/skills/impeccable/scripts/impeccable.cmd context` (Windows, sin `sh`) desde la raíz del
  proyecto. Si falla, seguir con fallback: leer `DESIGN.md` directamente (ya hecho).

---

## 2. Objetivo final (definición de terminado)

Una **lista consolidada de hallazgos de UI**, cubriendo las 48 vistas routeadas, donde cada hallazgo
trae:

- **Severidad** (H / M / L)
- **El error** (qué está mal, citando `className` o texto en español)
- **Dónde está** (`ruta/relativa/al/proyecto.ext:línea(s)` — verificado, leído, no inventado)
- **El fix concreto** (cambio propuesto en ≤15 palabras)

Agrupado por vista, deduplicando los hallazgos que vienen de componentes compartidos, más una lista
**Top 5 / Top 10 de arreglos por impacto**.

> Luego, y solo con aprobación explícita del usuario, viene la fase 2: **aplicar** los fixes
> (edits + `npm run lint` + `npm run build`, y verificación visual con screenshots en desktop y
> mobile en una sola ronda acotada, según el piso de craft del skill).

---

## 3. Inventario de vistas (48 routeadas + shell global)

Fuente: `src/App.jsx`. Ruta → archivo.

### Públicas / Landing / Auth
| Ruta | Archivo |
|---|---|
| `/` | `src/vistasLanding/Landing.jsx` |
| `/para-garages` | `src/vistasLanding/ParaGarages.jsx` |
| `/login` | `src/vistasLanding/Auth.jsx` |
| `/auth/callback` | `src/vistasLanding/AuthCallback.jsx` |
| `/register` | `src/pages/Register.jsx` |
| `/logout` | `src/pages/Logout.jsx` |
| `/unauthorized` | `src/pages/Unauthorized.jsx` |
| `/recuperar-clave` | `src/pages/ForgotPassword.jsx` |
| `/payment/success`, `/payment/failure`, `/payment/pending` | `src/pages/PaymentStatus.jsx` |

### Empleado (role 2)
| Ruta | Archivo |
|---|---|
| `/empleados_dashboard` | `src/vistasEmpleados/empleados_dashboard.jsx` |
| `/nueva_reserva` | `src/vistasEmpleados/nueva_reserva.jsx` |
| `/historial_reserva` | `src/vistasEmpleados/historial_reserva.jsx` |
| `/perfil_empleado` | `src/vistasEmpleados/perfil_empleado.jsx` |
| `/agregar_vehiculo` | `src/vistasEmpleados/agregar_vehiculo.jsx` |

### Garagista (role 3 / 1,3)
| Ruta | Archivo |
|---|---|
| `/garagista_dashboard`, `/control-acceso` | `src/vistasGaragista/garagista_dashboard.jsx` |
| *(no routreado directamente)* | `src/vistasGaragista/LectorQrReserva.jsx` → verificar si se renderiza dentro del dashboard; si no, listar como unrouted |

### Admin (role 1 / 4)
| Ruta | Archivo |
|---|---|
| `/admin_dashboard` | `src/vistasAdmin/admin_dashboard.jsx` |
| `/perfil_admin` | `src/vistasAdmin/perfil_admin.jsx` |
| `/gestion_de_empleados` | `src/vistasAdmin/gestion_de_empleados.jsx` |
| `/agregar_empleado` | `src/vistasAdmin/agregar_empleado.jsx` |
| `/gestion_garages` | `src/vistasAdmin/gestion_garages.jsx` |
| `/agregar_garage_propio` | `src/vistasAdmin/agregar_garage_propio.jsx` |
| `/agregar_zona` | `src/vistasAdmin/agregar_zona.jsx` |
| `/editar_zona` | `src/vistasAdmin/editar_zona.jsx` |
| `/admin_panel_de_control` | `src/vistasAdmin/admin_panel_de_control.jsx` |
| `/admin_reportes_analisis` | `src/vistasAdmin/admin_reportes_analisis.jsx` |
| `/admin_pagos` | `src/vistasAdmin/admin_pagos.jsx` |
| `/gestion_sedes` | `src/vistasAdmin/gestion_sedes.jsx` |
| `/agregar_sede` | `src/vistasAdmin/agregar_sede.jsx` |
| `/agregar_admin_sede` | `src/vistasAdmin/agregar_admin_sede.jsx` |
| `/agregar_garajista` | *(solo redirect → `/gestion_de_empleados`)* |
| `/admin/tratos-garages` | *(solo redirect → `/gestion_garages`)* |

### Dueño de Garage
| Ruta | Archivo |
|---|---|
| `/duenio-garage/dashboard` | `src/vistasDueñoGarage/duenio_garage_dashboard.jsx` |
| `/duenio-garage/crear-garage` | `src/vistasDueñoGarage/crear_garage_dueño.jsx` |
| `/duenio-garage/tratos` | `src/vistasDueñoGarage/tratos_empresa_garage.jsx` |
| `/duenio-garage/garage/:id/editar` | `src/vistasDueñoGarage/editar_garage_dueño.jsx` |
| `/duenio-garage/cuentas-por-cobrar` | `src/vistasDueñoGarage/cuentas_por_cobrar.jsx` |
| `/duenio-garage/perfil` | `src/vistasDueñoGarage/perfil_dueño_garage.jsx` |
| `/duenio-garage/solicitudes` | *(solo redirect → `/duenio-garage/tratos`)* |

### Superadmin (role 4)
| Ruta | Archivo |
|---|---|
| `/superadmin_dashboard` | `src/vistasSuperadmin/superadmin_dashboard.jsx` |
| `/superadmin/gestion_usuarios` | `src/vistasSuperadmin/gestion_usuarios.jsx` |
| `/superadmin/agregar_usuario` | `src/vistasSuperadmin/agregar_usuario.jsx` |
| `/superadmin/gestion_empresas` | `src/vistasSuperadmin/gestion_empresas.jsx` |
| `/superadmin/gestion_sedes` | `src/vistasSuperadmin/gestion_empresas.jsx` *(¡mismo componente que gestión_empresas!)* |
| `/superadmin/agregar_empresa` | `src/vistasSuperadmin/agregar_empresa.jsx` |
| `/superadmin/agregar_sede` | `src/vistasSuperadmin/agregar_sede.jsx` |
| `/superadmin/gestion_garages` | `src/vistasSuperadmin/superadmin_gestion_garages.jsx` |
| `/superadmin/conflictos` | `src/vistasSuperadmin/superadmin_conflictos.jsx` |
| `/superadmin/reservas` | `src/vistasSuperadmin/superadmin_reservas.jsx` |
| `/superadmin/cache` | `src/vistasSuperadmin/superadmin_cache.jsx` |
| `/superadmin/pagos-test` | `src/vistasSuperadmin/superadmin_pagos_test.jsx` |
| `/superadmin/email-templates` | `src/vistasSuperadmin/superadmin_email_templates.jsx` |
| `/solicitud-registro/revision` | `src/vistasSuperadmin/ConfirmarSolicitud.jsx` |

### Shell global (reportar bajo heading "Global shell")
- `src/App.jsx` líneas 74–80 (`RouteFallback`)
- `src/index.css` (tokens `@theme`, clases globales)
- `index.html` (fonts, meta, lang)
- Componentes shell usados por todas las vistas: `src/components/ProtectedRoute`,
  `src/components/ErrorBoundary`, `src/components/ScrollToTop`

---

## 4. Los 7 grupos de subagentes (prompt base + scope)

**Cada grupo = 1 llamada a `task` con `subagent_type: "general"`.**
El prompt base (idéntico para los 7) es el texto que se armó en la sesión; se reproduce aquí en la
sección 4.1 para poder re-emitarlo tal cual. **No correr los grupos en paralelo de a 7 de nuevo sin
revisar por qué el Grupo 1 devolvió vacío** — ver Paso 4.

### 4.1 Prompt base (reutilizar textualmente en los 7 calls)

```
You are doing a READ-ONLY UI/UX critique of routed views in the SmartLot React app.
Find every UI element in your scope that can be changed for the better, and report each with
the error, its exact location (file path and line numbers), and a concrete fix.
Report only what you verified in code.

HARD RULES
1. READ-ONLY. Do not create, edit, move, rename, or delete any file. Do not run npm, npx, node,
   vite, eslint, builds, dev servers, or any impeccable launcher or script under
   .agents\skills\impeccable\scripts (they can write to disk). Use only Read, Glob, Grep, and
   read-only inspection.
2. No guessing. Each finding must cite a file you opened, with line numbers you confirmed by
   reading it. If a problem only shows at runtime, put it under "Needs runtime check".
3. The app is not running. This is a static, code-based review.

PROJECT CONTEXT
- Root: C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot
- Stack: React 19, Vite 8, Tailwind CSS v4 (brand tokens in @theme in src\index.css),
  react-router-dom v7, lucide-react and react-icons, recharts, GSAP, SweetAlert2.
- All UI copy is Spanish. Quote Spanish strings verbatim. Write your report in English.
- Design system: DESIGN.md at the project root ("Azul Señal": color tokens, font roles
  DM Sans / Archivo / JetBrains Mono, radii, shadows, button heights 40/48px, floating-label
  inputs, badge rules). Judge against it.
- Empty-state spec: docs\estados-vacios.md (read it if your views show empty states).
- Critique rubric: read .agents\skills\impeccable\reference\critique.md,
  .agents\skills\impeccable\reference\audit.md, and the absolute-bans section of
  .agents\skills\impeccable\reference\craft-floor.md. If a file is missing, say so and continue.
- Surface mode: landing and auth pages are Persuade. Role panels (empleado, garagista, admin,
  dueño de garage, superadmin) are Operate (scanability, consistency, task completion).

SCOPE
Only the views listed under YOUR SCOPE. For each one, confirm which route renders it in
src\App.jsx. Follow imports into components only when they define markup for that view.
Components used beyond your scope go in section C.

CHECKS (apply to every view)
1. Hierarchy and layout: no clear primary action; competing focal points; weak grouping; uneven
   spacing; tables or cards hard to scan; misalignment.
2. Typography: font roles vs DESIGN.md; too many sizes or weights; small or low-contrast text;
   truncation without title or tooltip.
3. Color and contrast: hardcoded hex/rgb/arbitrary values (text-[#...], bg-[...]) bypassing
   DESIGN.md tokens; text below WCAG AA (4.5:1 body, 3:1 large text, 3:1 UI components/focus);
   status by color alone; wrong semantic color. State computed ratios when you calculate them.
4. Accessibility: inputs without accessible name (floating label still needs real label
   association); icon-only buttons without aria-label; img without alt; outline-none without
   replacement focus style; onClick on div/span without role or keyboard handling; modals without
   Escape/focus management; skipped heading levels; touch targets under 44px on mobile; motion
   without prefers-reduced-motion handling.
5. Responsive: fixed pixel sizes (w-[NNNpx]); tables/wide content without overflow handling at
   360–390px; grids that do not collapse; hover-only interactions; 100vh on mobile.
6. States: missing/inconsistent hover, focus, disabled, loading, empty, error states; forms
   without inline validation; destructive actions without confirmation; async without feedback;
   native alert()/confirm() mixed with SweetAlert2.
7. Copy (Spanish): vague button labels ("Aceptar", "Enviar", "OK"); placeholder used as only
   label; errors that do not say how to fix; inconsistent terms (reserva vs reservación,
   garaje vs garage, empleado vs usuario).
8. System consistency: re-implemented buttons/inputs/badges/cards instead of shared components;
   radii/shadows/heights differing from DESIGN.md; same concept styled differently across roles;
   two icon libraries for the same icon kind.
9. Visual craft and anti-patterns (impeccable absolute bans): colored side-stripe borders;
   gradient text; default glassmorphism; identical icon+heading+text card grids; hero-metric
   layouts; emoji as icons; bounce/elastic easing; animating layout properties; nested cards;
   modals where inline UI works. Flag only what is clearly present.
10. UI performance: large images without size constraints; heavy computation in render;
    GSAP/useEffect animations without cleanup; charts/maps without loading or error fallback.

Useful searches (inside your scope only): text-\[#, bg-\[#, w-\[[0-9]+px\], <img, onClick= on
div or span, outline-none, alert(, confirm(, placeholder=, aria-label, prefers-reduced-motion,
overflow-x, min-w-, <table. Confirm every hit by reading the surrounding code.

SEVERITY
- H: blocks or misleads the task; WCAG A or AA failure; broken/overflowing mobile layout;
  destructive action without confirmation; wrong state shown.
- M: hierarchy, consistency, or clarity problem; DESIGN.md violation; missing empty/loading/error
  state; inconsistent terminology.
- L: polish (micro-spacing, copy tone, decorative excess).

OUTPUT: this is the only thing I receive. Keep it under 1,500 words. No preamble and no closing
summary. Sections:
A) Coverage: one line per view: `<route(s)> — <file> — H:<n> M:<n> L:<n>`. Name any file you
   could not open.
B) Findings grouped by view. Heading per view: `### <route> — <file>`. Maximum 4 findings per
   view, most severe first, one line each:
   `- [H|M|L] <Category>: Error: <what is wrong; quote the className or text; 25 words max> — <path>:<line(s)> — Fix: <concrete change; 15 words max>`
   If a view has no findings, write `- No issues found.` If you dropped findings, add `(+N more omitted)`.
C) Shared components defined outside your scope, one line each:
   `- [H|M|L] <Category>: <error> — <path>:<line(s)> — Affects: <views in your scope>`
D) Top 5 fixes in your scope, ranked by impact, one line each.
E) Needs runtime check: short bullets.

Write paths relative to C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot with forward slashes.

YOUR SCOPE (group N of 7: <nombre>). Route in brackets, file after the arrow:
<SCOPE_AQUÍ>
```

### 4.2 Bloques SCOPE por grupo

**Grupo 1 — público / auth / shell global** (`group 1 of 7: public, auth, and global shell`)
```
- [/] src\vistasLanding\Landing.jsx
- [/para-garages] src\vistasLanding\ParaGarages.jsx
- [/login] src\vistasLanding\Auth.jsx
- [/auth/callback] src\vistasLanding\AuthCallback.jsx
- [/register] src\pages\Register.jsx
- [/logout] src\pages\Logout.jsx
- [/unauthorized] src\pages\Unauthorized.jsx
- [/recuperar-clave] src\pages\ForgotPassword.jsx
- [/payment/success, /payment/failure, /payment/pending] src\pages\PaymentStatus.jsx
- Global shell, report under heading "### Global shell": src\App.jsx lines 74–80
  (RouteFallback), src\index.css, index.html
```

**Grupo 2 — empleado + garagista**
```
- [/empleados_dashboard] src\vistasEmpleados\empleados_dashboard.jsx
- [/nueva_reserva] src\vistasEmpleados\nueva_reserva.jsx
- [/historial_reserva] src\vistasEmpleados\historial_reserva.jsx
- [/perfil_empleado] src\vistasEmpleados\perfil_empleado.jsx
- [/agregar_vehiculo] src\vistasEmpleados\agregar_vehiculo.jsx
- [/garagista_dashboard and /control-acceso] src\vistasGaragista\garagista_dashboard.jsx
- src\vistasGaragista\LectorQrReserva.jsx is not imported in App.jsx. Check whether the garagista
  dashboard renders it. If it does, review it under the dashboard heading. If not, list it in
  Coverage as unrouted.
```

**Grupo 3 — admin parte A**
```
- [/admin_dashboard] src\vistasAdmin\admin_dashboard.jsx
- [/perfil_admin] src\vistasAdmin\perfil_admin.jsx
- [/gestion_de_empleados] src\vistasAdmin\gestion_de_empleados.jsx
- [/agregar_empleado] src\vistasAdmin\agregar_empleado.jsx
- [/gestion_garages] src\vistasAdmin\gestion_garages.jsx
- [/agregar_garage_propio] src\vistasAdmin\agregar_garage_propio.jsx
- [/agregar_zona] src\vistasAdmin\agregar_zona.jsx
- [/editar_zona] src\vistasAdmin\editar_zona.jsx
```

**Grupo 4 — admin parte B**
```
- [/admin_panel_de_control] src\vistasAdmin\admin_panel_de_control.jsx
- [/admin_reportes_analisis] src\vistasAdmin\admin_reportes_analisis.jsx
- [/admin_pagos] src\vistasAdmin\admin_pagos.jsx
- [/gestion_sedes] src\vistasAdmin\gestion_sedes.jsx
- [/agregar_sede] src\vistasAdmin\agregar_sede.jsx
- [/agregar_admin_sede] src\vistasAdmin\agregar_admin_sede.jsx
```

**Grupo 5 — dueño de garage**
```
- [/duenio-garage/dashboard] src\vistasDueñoGarage\duenio_garage_dashboard.jsx
- [/duenio-garage/crear-garage] src\vistasDueñoGarage\crear_garage_dueño.jsx
- [/duenio-garage/tratos] src\vistasDueñoGarage\tratos_empresa_garage.jsx
- [/duenio-garage/garage/:id/editar] src\vistasDueñoGarage\editar_garage_dueño.jsx
- [/duenio-garage/cuentas-por-cobrar] src\vistasDueñoGarage\cuentas_por_cobrar.jsx
- [/duenio-garage/perfil] src\vistasDueñoGarage\perfil_dueño_garage.jsx
```

**Grupo 6 — superadmin parte A**
```
- [/superadmin_dashboard] src\vistasSuperadmin\superadmin_dashboard.jsx
- [/superadmin/gestion_usuarios] src\vistasSuperadmin\gestion_usuarios.jsx
- [/superadmin/agregar_usuario] src\vistasSuperadmin\agregar_usuario.jsx
- [/superadmin/gestion_empresas and /superadmin/gestion_sedes (same component)] src\vistasSuperadmin\gestion_empresas.jsx
- [/superadmin/agregar_empresa] src\vistasSuperadmin\agregar_empresa.jsx
- [/superadmin/agregar_sede] src\vistasSuperadmin\agregar_sede.jsx
- [/superadmin/gestion_garages] src\vistasSuperadmin\superadmin_gestion_garages.jsx
```

**Grupo 7 — superadmin parte B**
```
- [/superadmin/conflictos] src\vistasSuperadmin\superadmin_conflictos.jsx
- [/superadmin/reservas] src\vistasSuperadmin\superadmin_reservas.jsx
- [/superadmin/cache] src\vistasSuperadmin\superadmin_cache.jsx
- [/superadmin/pagos-test] src\vistasSuperadmin\superadmin_pagos_test.jsx
- [/superadmin/email-templates] src\vistasSuperadmin\superadmin_email_templates.jsx
- [/solicitud-registro/revision] src\vistasSuperadmin\ConfirmarSolicitud.jsx
```

---

## 5. Plan de acción paso a paso (lo que falta hacer)

### Fase A — Recuperar la auditoría (solo lectura)

1. **[ ] Diagnóstico del fallo del Grupo 1.** El intento previo (`ses_ee1456cb0ffewbgEVqhGy5WrZm`)
   terminó `completed` con `task_result` vacío. Decidir: (a) re-lanzar el Grupo 1 con el mismo
   prompt, o (b) si vuelve vacío, partirlo en dos (1a: Landing + ParaGarages + Auth; 1b: pages/* +
   shell) para bajar el volumen. Registrar el resultado en este documento.
2. **[ ] Re-lanzar los 7 grupos** con el prompt base (sección 4.1) + scope (4.2), subagente
   `general`. Sugerencia: lanzar **de a 3–4 en paralelo** como máximo (el intento masivo de 7
   llamadas coincidió con tool calls cancelados). Cada grupo debe devolver exactamente las
   secciones A–E.
   - Nota: **no usar el parámetro `command`** en `task` (se asoció al intento fallido).
   - Si un grupo devuelve vacío, reintentarlo una vez; si insiste, hacerlo manual con Glob+Read
     en la sesión principal.
3. **[ ] Verificar cobertura.** Cruzar las secciones A de los 7 grupos contra el inventario de la
   sección 3 (48 archivos + shell). Cada archivo debe aparecer con su conteo H/M/L. Si falta
   alguno, releerlo en la sesión principal (lectura directa, sin subagente).
4. **[ ] Merge y deduplicación.** Unificar hallazgos:
   - Los hallazgos de la sección C (componentes compartidos: Navbar/Sidebar/tarjetas/tablas
     comunes) probablemente se repitan entre grupos → dejar **uno** con "Affects:" mergeado.
   - Ordenar cada vista por severidad H → M → L y truncar a los 4 más relevantes si hay más
     (manteniendo el (+N more omitted)).
5. **[ ] Consolidado final.** Producir el entregable: lista agrupada por vista con
   `severidad | error | archivo:línea | fix`, más **Top 10 global de arreglos por impacto**.
   Mostrarlo al usuario (en chat) para aprobación.

### Fase B — Decisión del usuario (gate)

6. **[ ] Presentar el consolidado y pedir aprobación** antes de tocar código. Ofrecer opciones:
   arreglar todo, arreglar solo severidad H, o arreglar por rol/vista. **No editar sin aprobación.**
7. **[ ] Ofrecer (sin ejecutar sin pedir):** correr `impeccable context` una vez para fijar
   contexto, y `init` (alias `teach`) para crear el faltante `PRODUCT.md`. También ofrecer
   `codegraph init -i` si el usuario quiere exploración semántica.

### Fase C — Aplicar fixes (solo con aprobación; ahora en modo build)

8. **[ ] Cargar el piso de craft:** leer
   `.agents/skills/impeccable/reference/craft-floor.md` **justo antes del primer edit** (ya que
   esto pasa a trabajo de edición), además de la referencia del comando que se use (p. ej.
   `critique.md`, `polish.md`, `audit.md`).
9. **[ ] Aplicar por tandas,** en este orden sugerido:
   1. **H — accesibilidad y bloqueos:** labels/aria, focus styles, confirmaciones destructivas,
      tablas sin overflow en móvil, contraste AA.
   2. **M — consistencia con `DESIGN.md`:** tokens vs hex hardcodeados, alturas de botón 40/48,
      radios/sombras, floating labels, systema de alertas (SweetAlert2 vs alert() nativo),
      unificar término de copy (reserva/reservación, garaje/garage, empleado/usuario).
   3. **M — estados faltantes:** empty (seguir `docs/estados-vacios.md`), loading, error, inline
      validation en formularios.
   4. **L — craft:** anti-patrones prohibidos (side-stripes de color, gradient text, emoji como
      icono, bounce easing), micro-spacing, copy de botones específicos.
   - Cada tanda: edit → `npm run lint` → `npm run build`.
10. **[ ] Reglas de edición:** seguir convenciones existentes (Tailwind v4 tokens, componentes
    compartidos ya presentes en `src/components/`, `componentesCompartidos/` y afines). No
    introducir librerías nuevas. No romper copy factual ni agregar claims. Cero comentarios en el
    código salvo pedido explícito.
11. **[ ] Verificación acotada (máximo 2 rondas):** una ronda batch de screenshots desktop +
    mobile (360–390px) de las vistas tocadas + `npm run lint` + `npm run build`; corregir todo lo
    que esa ronda muestre en un solo batch; una segunda ronda de confirmación como máximo; parar.
    Evitar QA auto-abierto en bucle.

### Fase D — Cierre

12. **[ ] Actualizar `docs/pendientes-audit-ui.md`:** marcar cada checkbox completado y anotar el
    informe final (o moverlo a `docs/audit-ui-hallazgos.md` si se prefiere un entregable aparte).
13. **[ ] Reporte al usuario:** resumen de lo auditado (48 vistas), hallazgos por severidad, fixes
    aplicados y verificación (lint/build/screenshots).
14. **[ ] Commit solo si el usuario lo pide explícitamente** (nunca por iniciativa propia).

---

## 6. Riesgos y notas conocidas

- **Subagentes con resultado vacío:** ya pasó 1 vez. Mitigar lanzando de a pocos y reintentando
  una vez; si persiste, hacer la revisión directa con Glob+Read+Grep en la sesión principal.
- **Volumen:** 48 vistas; el prompt base limita a <1500 palabras y 4 hallazgos/vista por agente
  para que la respuesta no se trunque. No relajar esos límites.
- **Rutas duplicadas / redirects:** `/superadmin/gestion_sedes` reutiliza `GestionEmpresas`;
  `/agregar_garajista`, `/admin/tratos-garages` y `/duenio-garage/solicitudes` son solo
  redirects — no cuentan como vistas propias.
- **Roles mixtos numéricos vs string** en `ProtectedRoute` (`allowedRoles={[2]}` vs
  `["dueño_garage"]`/`["admin"]`) — posible bug de autorización, **fuera del alcance de UI**
  pero conviene reportarlo aparte si aparece.
- **Nombre de carpeta con ñ:** `src/vistasDueñoGarage/` — respetar el carácter exacto en paths.
- **`vite-dev.err` en la raíz:** artifact previo; no confiar en un dev server corriendo.
