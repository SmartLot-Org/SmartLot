# Pendientes — Auditoría UI SmartLot

> Backlog accionable para continuar la ejecución de fixes. Cada tarea tiene **Aceptación**,
> **Verificación** y **Archivos**. El estado global está en `README.md`; lo ya hecho en
> `cambios-realizados.md`.
>
> **Orden recomendado:** P1 (scope público) → P2 (trabajo central) → P3 (barridos finales) →
> P4 (diferidos, solo si se decide) → P5 (runtime checks) → P6 (verificación y cierre).

---

## P1 — Scope público / auth / payment  ✅ COMPLETO (en sesión, 2026-10-10)

El subagente de este scope falló 2 veces: la primera devolvió reporte vacío sin editar nada; la
segunda fue cancelada por el usuario. **Se re-ejecutó en sesión (coordinador) el 2026-10-10 y
quedó completo.** El prompt de abajo queda como especificación histórica de los 17 puntos.

| Punto | Qué | Estado |
|---|---|---|
| 1 | Navbar: menú mobile accesible (botón `aria-expanded`, panel, foco gestionado) | ✅ 2026-10-10 |
| 2 | BentoGrid: eyebrow borrado + una sola elevación en glass-cards | ✅ 2026-10-10 |
| 3 | StatsTicker: métricas rotuladas "Datos de ejemplo" (pill + `sr-only`) | ✅ 2026-10-10 |
| 4 | ParaGaragesShowcase: `text-brand-muted/80` → `text-brand-muted` | ✅ 2026-10-10 |
| 5 | `landing.css`: `.garage-hero-title` tope 6rem + tracking −0.03em | ✅ 2026-10-10 |
| 6 | ParaGaragesPains: grilla de cards idénticas → lista con divisores | ✅ 2026-10-10 |
| 7 | ParaGaragesSocial: testimonios rotulados "Datos de ejemplo" | ✅ 2026-10-10 |
| 8 | LoginForm: beam con reduced-motion, botón 48px/10px/hover #156FE5, "Esperá", Google con nombre accesible, errores con token, `Link` a recupero | ✅ 2026-10-10 |
| 9 | AuthCallback: `access_token` faltante → `/login` con estado de error; "Ingresando…" unificado | ✅ 2026-10-10 |
| 10 | RegisterRoleToggle: `tablist` sin tabpanel → `radiogroup` (`role="radio"`, `aria-checked`, roving tabindex) | ✅ 2026-10-10 |
| 11 | RegisterGarageForm/RegisterEmpresaForm: salto h1→h3 corregido a h2; submit 48px/10px/hover #156FE5 | ✅ 2026-10-10 |
| 12 | RegisterField: validación vinculada (`aria-describedby`/`aria-invalid` + ids) | ✅ 2026-10-10 |
| 13 | Logout: "Cerrando sesión…" en vez de `return null` | ✅ 2026-10-10 |
| 14 | Unauthorized: h1="Acceso Denegado", CTA honesta "Ir al inicio de sesión", tokens, `:focus-visible` | ✅ 2026-10-10 |
| 15 | ForgotPassword + Login.css: sin gradientes, tokens/contraste, botón 48px/10px, reglas de contraseña unificadas con Register, iconos decorativos `aria-hidden` | ✅ 2026-10-10 |
| 16 | PaymentStatus: foco visible en inputs (`:focus-visible`), contraste AA, "Liberar el lugar retenido" con confirmación Swal, acciones de panel por rol (`useAuth` + `helpers/roles.js`), hexes → tokens, side-stripe eliminado | ✅ 2026-10-10 |
| 17 | Barrido del resto del scope: eyebrows restantes borrados (4 en `paraGarages/`), copy a voseo ("Esperá", "Usá", "Podés"…), hexes fuera de token | ✅ 2026-10-10 |

> **Notas de la ejecución:** `src/index.css` recibió los tokens `--color-error`/`--color-error-strong`
> (alineados con DESIGN.md) para los mensajes de error; `src/pages/register.source.test.js` se
> actualizó al nuevo contrato ARIA del toggle (`radiogroup`, era `tablist`). ESLint de
> `PaymentStatus.jsx` conserva 4 errores de deuda **preexistente** idéntica a HEAD (2
> `react-hooks/set-state-in-effect` con `eslint-disable-line` y 2 `no-empty` en `catch`).

### P1.1 — Lanzar el agente con el prompt listo

**Prompt para copiar/pegar** (mismo formato que los 4 agentes exitosos; ver plantilla en
`plan-de-ejecucion.md` §4):

```
Ejecutá fixes de auditoría UI en SmartLot (React 19 + Vite + Tailwind v4,
C:\Users\TOTO\OneDrive\Desktop\Proyectos\SmartLot). REFINAMIENTO: preservá la identidad visual; no
rediseñes. Lee PRODUCT.md y DESIGN.md en la raíz. Copy en español rioplatense con VOSEO ("Ingresá",
"Creá"), nunca "tú", con tildes. IMPORTANTE: hacé los edits de verdad (edita los archivos); al final
reportá qué cambiaste. No devuelvas un reporte vacío.

SCOPE (SOLO esto):
- src/vistasLanding/** (incluye AuthCallback.jsx)
- src/componentesLanding/** (landing/*, paraGarages/*, auth/*, CtaButton.jsx)
- src/pages/Register.jsx, Register.css, ForgotPassword.jsx, PaymentStatus.jsx, Logout.jsx,
  Unauthorized.jsx, Login.css
NO toques: src/index.css, index.html, src/api/client.js, src/cache/*, src/componentesCompartidos/*,
src/componentesAdmin/*, src/componentesSuperadmin/*, src/componentesEmpleado/*,
src/componentesDueñoGarage/*, otras vistas, package.json, docs/*, DESIGN.md, PRODUCT.md.
Sin dependencias nuevas. No corras `npm run build`.

REGLAS:
- Tokens: brand-deep #0C1E3F, brand-blue #2563EB, hover #156FE5, pressed #1A73E8, warm #1E293B,
  muted #475569, bg #F5F7FB, surface #FFF, elevated #F1F5F9, border #E2E8F0, border-strong #CBD5E1,
  accent-bg #DBEAFE, success #22C55E/#F0FDF4, warning #EAB308/#FEFCE8, error #EF4444/#FEF2F2,
  error-strong #B91C1C. JSX: utilidades Tailwind (text-brand-muted...). CSS: var(--text)/var(--accent)
  o valor token. Sin hexes arbitrarios nuevos.
- CONTRASTE AA (≥4.5:1 texto): en TEXTO #94a3b8/#64748b → #475569; #cbd5e1 nunca como texto.
  El glass de landing/auth está PERMITIDO (mundo "Persuade" de DESIGN.md) — si un texto sobre vidrio
  falla contraste, oscurecé el texto, no quites el vidrio.
- Botones 40px md / 48px lg, radio 10px, hover #156FE5. Inputs 48px, radio 6px. Touch ≥44px.
- Focus: todo control interactivo necesita :focus-visible (anillo 3px rgba(37,99,235,0.35)); donde
  haya outline:none sin reemplazo, agregalo.
- Iconos SOLO lucide-react (sin SVG a mano ni emojis). Decorativos aria-hidden. Solo-icono → aria-label.
- Modales propios → src/componentesCompartidos/ModalPortal.jsx (tiene Escape) + role="dialog"
  aria-modal="true". Confirmaciones/alerts → SweetAlert2 (Swal). NUNCA alert()/confirm() nativos.
- Estados: error ≠ empty ≠ loading. Un .catch NUNCA pinta empty de éxito. Fallo de carga → error +
  Reintentar. Submit inválido → marcar campos tocados + mensajes (nada de return silencioso).
  Éxito → feedback antes de navegar.
- Movimiento: prefers-reduced-motion en todo. Prohibido easing con rebote y animar width/height/top/left.
- PROHIBIDO: eyebrows/kickers sobre headings (BORRARLOS), side-stripes (border-left/right color >1px),
  hero-metric grids como estructura, gradient text, emojis como íconos.

CAMBIOS (audit oficial):
1. componentesLanding/landing/Navbar.jsx (~51-61): bajo md se ocultan "Solución"/"Contacto" sin menú →
   menú mobile accesible (botón con aria-expanded + panel colapsable, foco gestionado).
2. componentesLanding/landing/BentoGrid.jsx (~83-85): borrar eyebrow "Ecosistema Integral" (y kickers
   repetidos). En ~99-104 el glass-card acumula glass+border+shadow → una sola elevación (conservá el
   vidrio; quitá la sombra O el borde duplicado).
3. componentesLanding/landing/StatsTicker.jsx (~6-11): métricas (4.9/5, 4.8★…) son datos de ejemplo →
   rotular visiblemente "Datos de ejemplo" sin romper el diseño (pedido explícito del dueño).
4. componentesLanding/paraGarages/ParaGaragesShowcase.jsx (~44): text-brand-muted/80 →
   text-brand-muted.
5. componentesLanding/landing/landing.css (~45-48): .garage-hero-title clamp 8.25rem → tope 6rem;
   letter-spacing -0.05em → -0.03em.
6. componentesLanding/paraGarages/ParaGaragesPains.jsx (~44-55): grilla de cards idénticas
   icon+heading+texto → lista con divisores.
7. componentesLanding/paraGarages/ParaGaragesSocial.jsx (~5-28): testimonios presentados como hechos →
   rotular como ejemplos (no inventes claims nuevos).
8. componentesLanding/auth/LoginForm.jsx: (a) ~43-51 beam del submit sin prefers-reduced-motion →
   envolver; (b) ~218-219 botón px-8 py-4 (~60px) hover navy → 48px, radio 10px, hover #156FE5;
   (c) ~220 "Espere ${cooldown}s" → "Esperá ${cooldown}s"; (d) botón Google con nombre accesible
   "Continuar con Google"; (e) ~225 text-red-600 → token error; (f) ~142 "¿Olvidaste…?" <a href> con
   full reload → navigate de react-router.
9. vistasLanding/AuthCallback.jsx: ~19-21 si falta access_token redirige a /login en silencio → pasar
   estado de error y mostrarlo en /login (LoginForm vive en componentesLanding/auth — coordiná el
   mensaje vía location state). ~46 unificar verbo a "Ingresando…".
10. componentesLanding/auth/RegisterRoleToggle.jsx (~22-46): role="tablist"/tab sin tabpanel →
    radiogroup accesible (role="radio" + aria-checked + flechas) o radios nativos estilizados.
11. RegisterGarageForm.jsx (~151) y RegisterEmpresaForm.jsx (~177,242): salto h1→h3 → h2. Submit
    px-8 py-4 → 48px/10px/hover #156FE5.
12. componentesLanding/auth/RegisterField.jsx (~43,77): validación live <ul> sin aria-describedby/
    aria-invalid → vincular (id del mensaje + aria-describedby + aria-invalid en el input).
13. pages/Logout.jsx (~21): return null → "Cerrando sesión…".
14. pages/Unauthorized.jsx (~4-19): "Volver al inicio" navega a /login → etiqueta honesta "Ir al
    inicio de sesión"; hexes inline → tokens; :focus-visible. ~9-10 h1="403" → h1="Acceso Denegado".
15. pages/ForgotPassword.jsx + pages/Login.css: re-implementa inputs/botones con gradiente + glass
    → reutilizar estilos de login compartidos; ~197-225 dos CTAs primarios pares → uno primario + uno
    secundario; ~89 reglas de contraseña unificadas con Register.
16. pages/PaymentStatus.jsx: (a) ~513,536 inputs outline:"none" → :focus-visible; (b) ~331,550,573
    #94A3B8 → #475569; (c) ~397-401 "Liberar el lugar retenido" sin confirmación → Swal;
    (d) ~403,557-569 acciones de panel visibles a cualquiera en página pública → renderizar solo con
    sesión del rol correspondiente (useAuth + helpers/roles.js); (e) resto de outline:none/hexes.
17. Resto del scope: cualquier outline:none sin focus-visible, hex fuera de token en texto, emoji,
    copy sin tildes/voseo o kicker → corregir.
VERIFICACIÓN: `npm test` + `npx eslint` de tus archivos al terminar.
REPORTÁ (obligatorio, no vacío): archivos tocados + qué cambiaste, dejado fuera y por qué.
```

**Aceptación:** los 17 puntos aplicados; `npm test` 117/117; ESLint sin errores nuevos; reporte del
agente recibido y verificado contra `git status` (que los archivos aparezcan modificados).
**Verificación:** `git status --short | Select-String "Landing|pages|Login|Register|Payment|Logout|Unauthorized|AuthCallback|Forgot"` debe listar archivos tocados; luego `npm test`.
**Riesgo:** el agente puede volver a devolver vacío → verificar y re-lanzar (o hacerlo en sesión).

### P1.2 — Verificación posterior del scope público  (parcial: lint + test ✅)
- ✅ `npm test` 117/117 y `npx eslint` de los archivos tocados (limpio; deuda preexistente de
  `PaymentStatus.jsx` documentada).
- ⏳ **Revisión visual** (humano): `/`, `/para-garages`, `/login`, `/register`, `/recuperada-clave`,
  `/payment/success|failure|pending` en desktop y 360px (los cambios de Navbar/BentoGrid/PaymentStatus
  lo ameritan).

---

## P2 — Trabajo central (coordinador)  ✅ COMPLETO (en sesión, 2026-10-10)

Todo lo que cruza scopes o es componente compartido central. **Ejecutado en sesión el 2026-10-10**
(detalle archivo por archivo en `cambios-realizados.md` §7).

Resumen: P2.1 ModalPortal (focus trap + foco inicial + retorno + `Z_INDEX.MODAL`) ✅ ·
P2.2 formularios compartidos (ids/`htmlFor` + combobox de sede accesible + copy) ✅ ·
P2.3 headers (logo operable con teclado + campanas SVG → lucide) ✅ · P2.4 `boton_generico` ✅ ·
P2.5 `index.css` (`--mono`, asterisco con `:has()`, RouteFallback) ✅ ·
P2.6 JetBrains Mono en `index.html` ✅ · P2.7 DESIGN.md (Regla del Mono Dato) ✅ ·
P2.8 footer superadmin sin blur ✅.

Verificación: `npx eslint` de los 9 JSX — **limpio**; `npm test` — **117/117**; `npm run build` —
**✅ 1.55s**. **Queda la revisión visual** (logo con teclado, asterisco en `agregar_sede`, focus trap
en modales, fuente mono, combobox de sede) — ver P6.

### P2.1 — `ModalPortal` focus trap
- **Qué:** agregar focus trap + foco inicial + retorno de foco al cerrar (hoy solo Escape).
  Revisar el `zIndex: 2000` inline: DESIGN.md declara la jerarquía centralizada en
  `src/helpers/zIndex.js` (toasts 10200, diálogos 10600) — alinear ModalPortal con ese helper.
  Opcional: permitir alineación bottom-sheet (hoy el inline centering aplana los modales bottom-sheet).
- **Aceptación:** Tab/Shift+Tab ciclan dentro del modal; al abrir, el foco entra al primer control; al
  cerrar, vuelve al disparador; Escape sigue cerrando; sin regresiones en los modales que lo usan.
- **Verificación:** `npm test` + revisión manual en `gestion_garages` (trato), `empleados_dashboard`
  (reporte), `cuentas_por_cobrar` (exportar), `admin_panel_de_control` (soporte).
- **Archivos:** `src/componentesCompartidos/ModalPortal.jsx`, `src/helpers/zIndex.js` (solo leer).

### P2.2 — Formularios compartidos: labels + dropdown de sede
- **Qué:** `htmlFor`/`id` en los campos floating de `formulario_infoPersonal.jsx:44-110` y
  `formulario_zona.jsx:53-77,148-205`; dropdown de sede custom (`div`/`li onClick`,
  `formulario_infoPersonal.jsx:115-146` y `formulario_zona.jsx:85-115`) → roles de listbox/combobox +
  teclado (↑↓/Enter/Escape) + `aria-activedescendant`; corregir el copy de `formulario_zona.jsx:43-48,157`
  (dice "del nuevo garage" también al editar) y tildes.
- **Aceptación:** todos los campos de ambos formularios tienen nombre accesible; el dropdown es
  operable 100% con teclado; el copy de edición no miente.
- **Verificación:** afecta agregar_empleado, agregar_admin_sede, agregar_garage_propio, agregar_zona,
  crear/editar garage del dueño → `npm test` + revisión manual de al menos 2 vistas.
- **Archivos:** `src/componentesAdmin/formulario_infoPersonal.jsx`, `src/componentesAdmin/formulario_zona.jsx`.

### P2.3 — Headers: logo navegable + campana muerta
- **Qué:** los 4 headers con logo `<img onClick>` (no operable con teclado) →
  `<button>`/`<Link>` con área táctil y `:focus-visible`:
  `header_admin.jsx:16-22`, `header_superadmin.jsx:12-18`, `header_empleado.jsx:29`,
  `header_dueño_garage.jsx:14-19`. Además: la campana SVG dibujada a mano (affordance muerta)
  en `header_superadmin.jsx:22-25` y `header_empleado.jsx:34-36` → icono lucide `Bell` (o eliminarla
  si es decorativa sin función) y `aria-hidden` si es decorativa. `header_dueño_garage.jsx` es
  además el único header cuyo JSX no se tocó.
- **Aceptación:** Enter/Space sobre el logo navega al home en los 4 roles; sin SVG a mano.
- **Verificación:** `npx eslint` de los 4 archivos; navegación manual con teclado.
- **Archivos:** los 4 `header_*.jsx` + `header_dueño_garage.css` si hace falta.

### P2.4 — `boton_generico.css` (`.btn-primario`)
- **Qué:** hoy `background #1A73E8 !important`, `radius 12px`, `height 42px`, hover `#1557b0`.
  Alinear a DESIGN.md: base `#2563EB`, hover `#156FE5`, height **40px** (md) / 48px (lg si se usa),
  radio **10px**, `:focus-visible`, sin `!important` innecesarios. Revisar también
  `boton_generico.jsx:11` (clase `boton-base-smartlot` sin CSS propio — darle estilo o eliminar la clase).
- **Aceptación:** botón consistente con DESIGN.md; hover correcto; foco visible.
- **Verificación:** `npx eslint` + revisión en `admin_panel_de_control` (usa el botón).
- **Archivos:** `src/componentesAdmin/boton_generico.css`, `src/componentesAdmin/boton_generico.jsx`.

### P2.5 — `index.css`: `--mono` + regla de asterisco
- **Qué:**
  1. `--mono: ui-monospace, Consolas, monospace` → `'JetBrains Mono', Consolas, monospace`
     (con P2.6 se carga la fuente).
  2. La regla `label::after { content: " *" }` (≈líneas 236-246) marca como requeridos campos
     opcionales (caso real: "Descripción" en agregar_sede, ya parcheado localmente con
     `label-optional`). Corregir la regla global para aplicar el asterisco solo a lo realmente
     requerido (p. ej. `label:has(+ input[required])::after` o clase explícita) y eliminar los
     parches locales si aplica.
  3. Revisar los `outline:none` que queden en utilidades globales (si los hay) y `RouteFallback`
     en `src/App.jsx:76-77` → `role="status"` + token de fondo.
- **Aceptación:** asterisco solo en requeridos; `--mono` correcto; RouteFallback accesible.
- **Verificación:** `npm test` + revisión de `agregar_sede` (superadmin y admin).
- **Archivos:** `src/index.css`, `src/App.jsx`.

### P2.6 — `index.html`: cargar JetBrains Mono
- **Qué:** agregar `JetBrains+Mono:wght@400;500` al `<link>` de Google Fonts (línea ~17), sin
  dependencias npm.
- **Aceptación:** la fuente carga en build/dev (verificar con DevTools → Network/Fonts).
- **Verificación:** `npm run build` (al cierre) + Inspeccionar un dato con `var(--mono)`.
- **Archivos:** `index.html`.

### P2.7 — DESIGN.md: mono (pendiente) + excepción superadmin ✅ hecha
- **Estado:**
  1. ✅ **Hecho (2026-10-10)**: la excepción del panel superadmin quedó documentada en la Regla del
     Token (Named Rules de Colors de `DESIGN.md`), citando `docs/decisions/ADR-007-paleta-propia-superadmin.md`.
  2. ✅ **Hecho (2026-10-10)**: la Regla del Mono Dato ya refleja que JetBrains Mono se carga desde
     Google Fonts (P2.6 aplicado); fallback Consolas.
- **Aceptación:** DESIGN.md consistente con la decisión y con la realidad de la carga de fuentes.
- **Verificación:** relectura; `docs/index.md` ya linkea ADRs.
- **Archivos:** `DESIGN.md`.

### P2.8 — `footer_superadmin.css`: quitar blur (sin tocar colores)
- **Qué:** el footer del panel superadmin conserva `backdrop-filter: blur(...)` (glass en producto,
  prohibido por DESIGN.md: "La Regla del Vidrio Solo Landing"). Quitar el blur manteniendo los
  colores existentes (no viola la decisión D3: no es cambio de color).
- **Aceptación:** footer sólido, paleta intacta.
- **Verificación:** revisión visual de una vista superadmin.
- **Archivos:** `src/componentesSuperadmin/footer_superadmin.css`.

### P2.9 — Sincronizaciones de documentación funcional  ✅ HECHA (2026-10-10)
- **Hecho:**
  1. `PRODUCT.md`: referencia corregida (ahora a `docs/audit-ui/plan-de-ejecucion.md`) + nota de la
     decisión D1 (métricas/testimonios como datos de ejemplo, implementación en curso).
  2. `docs/index.md`: link al folder `audit-ui/`; fila del histórico eliminada (archivo borrado con
     aprobación explícita) y lista de documentos protegidos actualizada.
  3. `AGENTS.md`: ruta del documento protegido corregida + bullet de `docs/audit-ui/` en Contexto del proyecto.
  4. `docs/domain-flows.md` y `docs/decisions/ADR-005`: referencias actualizadas a `docs/audit-ui/`.
  5. `docs/decisions/README.md`: ADR-007 agregado al índice + nota de ADRs retrospectivos ajustada.
- **Verificación:** búsqueda global de referencias viejas → sin resultados reales (solo menciones históricas de la eliminación).

---

## P3 — Barridos finales (coordinar con P1/P2)

### P3.1 — Purge de eyebrows/kickers restantes
- **Qué:** las vistas de empleado tienen ~9 instancias + skeletons ("Agenda", "Resumen",
  "Operación diaria"…) que el agente de scope dejó al coordinador por precaución.
  **Landing/paraGarages ya quedó purgado en P1** (8 eyebrows borrados; `tracking-[0.2em]` = 0).
- **Detección:** `Get-ChildItem src -Recurse -Include *.css,*.jsx | Select-String 'eyebrow|kicker'`
  (2026-10-10 post-P2: **18 ocurrencias** — todas fuera de landing).
- **Aceptación:** 0 kickers decorativos sobre headings (craft floor: "ban, no default").
- **Verificación:** grep + revisión visual de las vistas tocadas.

### P3.2 — Copy "cocheras" → "plazas" (unificación terminológica)
- **Qué:** PRODUCT.md define **Plaza** como término canónico del glosario; quedan usos de "cocheras"
  en UI: `tratos_empresa_garage.jsx:15` ("Empresas → solicitan cocheras → tus garages"),
  `GestionTratosGarage.jsx:152` ("Solicitudes de cambio de cocheras"), y revisar `estados-vacios.md`
  / `PRODUCT.md` (que usa "cocheras" en su propia prosa canónica). Decidir con el dueño si la
  unificación es total o solo en UI de producto (PRODUCT.md conserva "cocheras" en el resumen).
- **Aceptación:** término consistente en la UI del producto, o decisión registrada de dejarlo.
- **Verificación:** grep `cochera` en `src/`; revisión en `/duenio-garage/tratos`.
- **Archivos:** `src/vistasDueñoGarage/tratos_empresa_garage.jsx`,
  `src/componentesCompartidos/GestionTratosGarage.jsx`, otros resultados del grep.

### P3.3 — Barrido final de métricas
- **Qué:** al terminar P1–P3, repetir los greps de progreso del README §1 y registrar el resultado:
  ```
  $css = Get-ChildItem src -Recurse -Include *.css,*.jsx
  ($css | Select-String 'outline:\s*none|outline:"none"').Count          # meta: 0 sin :focus-visible de reemplazo
  ($css | Select-String '#94a3b8|#94A3B8').Count                          # meta: solo :disabled/placeholder decorativo
  ($css | Select-String 'border-left:\s*[3-9]px').Count                   # meta: 0
  ($css | Select-String 'eyebrow|kicker').Count                           # meta: 0
  ```
- **Aceptación:** números registrados en `README.md` §1 (actualizar la tabla).
- **Verificación:** el propio grep.
- **Estado:** métricas ya re-corridas y registradas el 2026-10-10 al cerrar P2 (outline 45,
  `#94a3b8` 49, side-stripes 2, eyebrow/kicker 18, `Espere` 0). Re-correr al cerrar P3 y comparar.

---

## P4 — Diferidos por decisión (paleta superadmin) — solo si se revisa la decisión

> Registrados por `docs/decisions/ADR-007-paleta-propia-superadmin.md`. **No tocar sin decisión
> explícita del dueño.**

1. `gestion_usuarios.css:640-651` — dark-modal: headings `#0F1A2E !important` sobre
   `rgba(15,23,42,.95)` ≈1:1 (**texto ilegible** — el más riesgoso de todos).
2. `superadmin_reservas.css:486-499` — `.resv-estado--vencida` ≈2.9:1, `--curso` ≈3.4:1.
3. `ConfirmarSolicitud.css:46-63` — "Aceptar solicitud" blanco sobre `#16a34a` ≈3.3:1.
4. Focus ámbar `#F59E0B` (agregar_usuario.css:127-132, gestion_empresas.css:244-247,
   agregar_empresa.css:112-114) — se mantiene por identidad del panel.
5. Paleta hardcodeada `#0F1A2E`/`#1A2744` (superadmin_dashboard, superadmin_reservas stat cards) —
   se mantiene.

**Si el dueño pide corregir solo los contrastes rotos de arriba:** mantener los colores de fondo y
oscurecer/aclarar únicamente el TEXTO para llegar a 4.5:1 (paso mínimo, sin rediseño). Anotar la
decisión en una ADR nueva que superseda parcialmente la 007.

---

## P5 — Runtime checks (verificar con la app corriendo)

| # | Check | Cómo |
|---|---|---|
| 1 | Sin scroll horizontal a 360-390px en `/nueva_reserva` (márgenes negativos ya corregidos) | `npm run dev` + DevTools responsive 360px |
| 2 | Contraste de texto sobre vidrio (landing/auth) y sobre `.panel-stats-card` con gradiente (píxeles compuestos) | Inspección visual + DevTools |
| 3 | Tabla de conflictos entre 769-956px (ya tiene `overflow-x:auto` — verificar) | `/superadmin/conflictos` + responsive |
| 4 | Nombres accesibles del autocomplete de Google Maps (agregar/editar zonas y sedes) | Teclado + lector de pantalla (NVDA/VoiceOver) o Accessibility Inspector |
| 5 | Carreras de cámara de `html5-qrcode` (doble ingreso/egreso rápido) | `/garagista_dashboard` con cámara real |
| 6 | Polling de Mercado Pago + flujo `window.open` de checkout | `/payment/*` completo |
| 7 | GSAP/CSS con reduce-motion del SO activo (Windows: Configuración → Accesibilidad → Efectos) | Recorrer landing + paneles |
| 8 | Costura del marquee de `StatsTicker` y flipbook `LogoWatermark` (~10MB en 4G) | Throttling de red en DevTools |

---

## P6 — Verificación y cierre

1. **Comandos finales (en orden):**
   ```
   npm test                                   # baseline: 117/117 ✅ (2026-10-10)
   npm run lint                               # deuda preexistente documentada; validar solo lo tocado
   npm run build                              # ✅ corrido 2026-10-10 (1.55s); re-correr si hay cambios nuevos
   ```
2. **Detector de impeccable** (lo pidió el skill al cargar contexto; correr una sola vez al final):
   ```
   .agents\skills\impeccable\scripts\impeccable.cmd detect --json <archivos tocados>
   ```
3. **Revisión visual acotada (máx. 2 rondas):** desktop + mobile 360px de las vistas tocadas; anotar
   defectos; corregir todo en un batch; una ronda de confirmación; parar.
4. **Documentación:** actualizar `README.md` (tabla de estado/métricas), `cambios-realizados.md` y
   este `pendientes.md` (tildar lo hecho).
5. **Commit:** **solo si el usuario lo pide.** Si lo pide: revisar `git status`/`git diff` archivo por
   archivo (hay cambios previos mezclados de otras sesiones), separar lo del audit, y usar el estilo
   de mensajes del repo (español, descriptivo, ej. commits recientes `e8fc400`, `70a3683`).
6. **Avisos del skill impeccable registrados:** (a) `CONTEXT_STALE` de PRODUCT.md (sin schema stamp)
   → ofrecer `init` al usuario, correr solo si lo pide; (b) hay Impeccable v4.5.2 disponible →
   mencionar una vez ("Update now? It runs `npx impeccable update`"); no correrlo en la misma sesión.
