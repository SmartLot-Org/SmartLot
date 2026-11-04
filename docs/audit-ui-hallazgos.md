# UI audit — findings

Deliverable of the plan in [`pendientes-audit-ui.md`](./pendientes-audit-ui.md). Format and rubric: section 4.1 of that plan (static review against `DESIGN.md`, `PRODUCT.md` and the Impeccable critique/audit/craft-floor references; severity H/M/L; at most 4 findings per view).

| Group | Scope | Status | Date |
|---|---|---|---|
| 1 | Public, auth and global shell | Done (main session, no subagents) | 2026-11-04 |
| 2–7 | Role panels | Pending | — |

Group 1 was re-run by hand in the main session, as the plan allows after the empty subagent result (Fase A, step 1). Besides the static review, a runtime pass in Chromium (390×844 and 1440×900, production build, no backend) found **no horizontal overflow on any Group 1 route**. The decorative elements that extend past the edge (ticker track, glows, map SVG) are clipped by their containers.

---

## Group 1 — public, auth and global shell

### A) Coverage

- `/` — src/vistasLanding/Landing.jsx — H:0 M:1 L:0
- `/para-garages` — src/vistasLanding/ParaGarages.jsx — H:1 M:0 L:1
- `/login` — src/vistasLanding/Auth.jsx (LoginForm.jsx, BrandPanel.jsx) — H:0 M:3 L:1
- `/auth/callback` — src/vistasLanding/AuthCallback.jsx — H:0 M:0 L:0
- `/register` — src/pages/Register.jsx (RegisterEmpresaForm.jsx, RegisterGarageForm.jsx, RegisterBrandPanel.jsx) — H:0 M:1 L:1
- `/logout` — src/pages/Logout.jsx — H:0 M:1 L:0
- `/unauthorized` — src/pages/Unauthorized.jsx — H:0 M:2 L:1
- `/recuperar-clave` — src/pages/ForgotPassword.jsx — H:0 M:1 L:1
- `/payment/success`, `/payment/failure`, `/payment/pending` — src/pages/PaymentStatus.jsx — H:2 M:2 L:3
- Global shell — src/App.jsx (RouteFallback), index.html, src/index.css — H:0 M:0 L:2

The landing (`/`) was reviewed in depth during the immersive rework (`docs/specs/SPEC-landing-inmersiva.md`, sections "Verificación", "Pulido" and "Segundo pulido"). Only what that work did not cover is listed here.

### B) Findings by view

### `/` — src/vistasLanding/Landing.jsx
- [M] Accessibility: Error: decorative flip-book canvas is exposed as `role="img"` with an English label, "SmartLot animated logo transition" — src/componentesLanding/landing/LogoWatermark.jsx:688-689 — Fix: `aria-hidden="true"` on the canvas; remove role and label.

### `/para-garages` — src/vistasLanding/ParaGarages.jsx
- [H] Content truth: Error: three testimonials with full names ("Martín Alegre", "Paula Benítez", "Diego Funes") under "Dueños que ya aparecen en el mapa" carry no example label, against the 2026-10-10 decision in PRODUCT.md — src/componentesLanding/paraGarages/ParaGaragesSocial.jsx:4-25, 39 — Fix: label them "Datos de ejemplo" like Showcase and Reports, or remove.
- [L] Visual craft: Error: uppercase `tracking-widest` badges on bento cards read as eyebrow labels — src/componentesLanding/paraGarages/ParaGaragesBento.jsx:81 — Fix: drop the badges or use sentence-case text.

### `/login` — src/vistasLanding/Auth.jsx
- [M] Accessibility: Error: infinite border "beam" tween on the submit button (`repeat: -1`) ignores prefers-reduced-motion — src/componentesLanding/auth/LoginForm.jsx:45-52 — Fix: wrap the tween in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`.
- [M] Copy: Error: cooldown copy uses usted, "Espere ${cooldown}s antes de reintentar." and "Espere ${cooldown}s"; the UI voice is voseo — src/componentesLanding/auth/LoginForm.jsx:64, 229 — Fix: "Esperá ${cooldown} s…".
- [M] Navigation: Error: "¿Olvidaste tu contraseña?" is a plain `<a href="/recuperar-clave">`, which reloads the whole SPA — src/componentesLanding/auth/LoginForm.jsx:151 — Fix: `<Link to="/recuperar-clave">`.
- [L] Copy and type: Error: brand panel says "Optimiza la infraestructura…" (tuteo) and uses `font-sans` and `bg-blue-600` instead of the display font and the brand token — src/componentesLanding/auth/BrandPanel.jsx:79-86 — Fix: "Optimizá…", `font-display`, `bg-brand-blue`.

### `/auth/callback` — src/vistasLanding/AuthCallback.jsx
- No issues found.

### `/register` — src/pages/Register.jsx
- [M] Copy: Error: cooldown copy in usted, "Espere ${cooldown}s", in both forms — src/componentesLanding/auth/RegisterEmpresaForm.jsx:112, 268; src/componentesLanding/auth/RegisterGarageForm.jsx:103, 219 — Fix: "Esperá ${cooldown} s".
- [L] Type: Error: brand panel `h2` uses `font-sans` and the accent bar uses `bg-blue-600` instead of tokens — src/componentesLanding/auth/RegisterBrandPanel.jsx:181-185 — Fix: `font-display`, `bg-brand-blue`.

### `/logout` — src/pages/Logout.jsx
- [M] States: Error: the view renders `null` while the logout request runs, so the user sees a blank screen with no feedback — src/pages/Logout.jsx:10-21 — Fix: a `role="status"` spinner with "Cerrando sesión…".

### `/unauthorized` — src/pages/Unauthorized.jsx
- [M] Navigation and copy: Error: the button says "Volver al inicio" but links to `/login` — src/pages/Unauthorized.jsx:14-18 — Fix: link to `/` (or the user's home), or rename it "Iniciar sesión".
- [M] Color: Error: inline `#d32f2f`, `#666` and `#2563EB` bypass DESIGN tokens; the error colors are `#EF4444` and `#B91C1C` — src/pages/Unauthorized.jsx:5-17 — Fix: Tailwind tokens, and reuse `CtaButton` for the action.
- [L] Copy: Error: Title Case "Acceso Denegado" — src/pages/Unauthorized.jsx:10 — Fix: "Acceso denegado".

### `/recuperar-clave` — src/pages/ForgotPassword.jsx
- [M] Copy: Error: five cooldown messages in usted ("Espere … antes de solicitar otro código.") — src/pages/ForgotPassword.jsx:52, 81, 174, 240, 304 — Fix: "Esperá …".
- [L] Copy: Error: Title Case `h1` "Recuperar Contraseña" — src/pages/ForgotPassword.jsx:350 — Fix: "Recuperar contraseña".

### `/payment/success`, `/payment/failure`, `/payment/pending` — src/pages/PaymentStatus.jsx
- [H] States: Error: the title comes from the route, not from the verified payment. "Pago recibido" shows with no payment parameters, above "Aún no hay pago para verificar" — src/pages/PaymentStatus.jsx:113-117, 308, 485 — Fix: neutral title ("Estado del pago") until verified, then derive it from the status.
- [H] Destructive action: Error: "Liberar el lugar retenido" releases the held spot right away, with no confirmation — src/pages/PaymentStatus.jsx:261-273, 402-404 — Fix: SweetAlert2 confirmation before `ReservasLiberarRetencion`.
- [M] Clarity: Error: debug panel "Parámetros recibidos de Mercado Pago" (`payment_id`, `preference_id`, `external_reference`, "status hint", full URL) and jargon ("backend", "Order ID") shown to employees — src/pages/PaymentStatus.jsx:305-335, 487 — Fix: move it behind "Ver detalle técnico" or dev-only, and use plain copy.
- [M] Copy: Error: tuteo throughout, e.g. "Puedes verificar el motivo…", "Necesitas iniciar sesión…", "Revisa más tarde…", "Si acabas de pagar, usa…" — src/pages/PaymentStatus.jsx:140, 311, 457, 462, 467, 487 — Fix: voseo ("Podés", "Necesitás", "Revisá", "usá").
- (+3 more omitted, all L: inline hex styles and a 4 px colored side stripe at :276-416; the "Volver" button uses `navigate(-1)`, which can return to the Mercado Pago checkout, at :279-285; the raw backend message in the error toast at :271.)

### Global shell
- [L] Accessibility: Error: `RouteFallback` spinner has no `role="status"` or label, and uses `bg-slate-50` instead of `bg-brand-bg`, so the background flashes between routes — src/App.jsx:74-79 — Fix: `role="status"`, sr-only "Cargando…", and `bg-brand-bg`.
- [L] Sharing: Error: `index.html` has `og:title` and `og:description` but no `og:image` or `twitter:card` (known pending item) — index.html:8-10 — Fix: add them once the production domain is known.

### C) Shared components outside the scope

- None beyond the auth components listed above. The usted cooldown copy repeats across 4 files (LoginForm, RegisterEmpresaForm, RegisterGarageForm, ForgotPassword), so it is a single fix.

### D) Top 5 fixes by impact

1. PaymentStatus: show a neutral title until the payment is verified (H, misleading state).
2. PaymentStatus: confirm before "Liberar el lugar retenido" (H, destructive action).
3. ParaGaragesSocial: label the testimonials as example data, or remove them (H, content truth).
4. Voseo pass over cooldown and payment copy, "Espere" to "Esperá" and "Puedes" to "Podés" (M, 6 files).
5. PaymentStatus: hide the debug parameters and the jargon from employees (M, clarity).

### E) Needs runtime check

- PaymentStatus with a real backend and Mercado Pago redirects (success, failure and pending with parameters), including where "Volver" lands after the external redirect.
- Screen reader pass on `/login` and `/register`. In code, the floating labels are properly associated (`htmlFor`/`id` or a wrapping `label`).
- Touch targets: the automated scan found controls under 44 px on `/login`, `/register`, `/recuperar-clave` and `/payment/*`. Most are inline text links (exempt under WCAG 2.5.8); confirm the password visibility toggles on mobile.
