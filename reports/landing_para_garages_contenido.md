# Landing "Para dueños de garages" — Contenido completo

**Ruta:** `/para-garages` (ya existe como placeholder en `src/vistasLanding/ParaGarages.jsx`)
**Objetivo:** captar dueños/administradores de garages y llevarlos a registrarse o iniciar sesión.
**Audiencia:** dueños de estacionamientos urbanos, con una o varias playas/niveles, que quieren rentabilizar plazas con empresas.
**Acción primaria (CTA):** "Registrar mi garage" → `/register` (modo Garage).
**Acción secundaria:** "Iniciar sesión" → `/login`.
**Tono:** español rioplatense, voseo, profesional y directo. Beneficio antes que feature.

> Todo el copy está listo para pegarse en el código. Los datos marcados `[[ ]]` son placeholders a validar con negocio antes de publicar.

---

## 0. Arquitectura de la página (para implementación)

```
ParaGarages.jsx (página, route /para-garages)
├── InteractiveBackground        (existente — reutilizar)
├── Navbar variant="garage"      (adaptar componente existente)
├── <main id="main-content">
│   ├── ParaGaragesHero          (nuevo — patrón de Hero.jsx)
│   ├── ParaGaragesStats         (nuevo — patrón de StatsTicker.jsx)
│   ├── ParaGaragesPains         (nuevo — dolor vs. solución)
│   ├── ParaGaragesSteps         (nuevo — 3 pasos)
│   ├── ParaGaragesBento         (nuevo — patrón de BentoGrid.jsx)
│   ├── ParaGaragesDashboard     (nuevo — showcase del panel)
│   ├── ParaGaragesReports       (nuevo — consumos y exportaciones)
│   ├── ParaGaragesSecurity      (nuevo — seguridad y control)
│   ├── ParaGaragesTestimonials  (nuevo — [[casos reales]])
│   ├── ParaGaragesFAQ           (nuevo — acordeón accesible)
│   └── ParaGaragesCTA           (nuevo — patrón de Contact.jsx)
└── ParaGaragesFooter            (nuevo o footer compartido)
```

**Reutilización clave:** `landing.css`, `bg-noise`, `glass-card`, `glass-nav`, tokens `brand-*` de `src/index.css`, patrón GSAP + `gsap.matchMedia()` con fallback de movimiento reducido, `InteractiveBackground`, `LogoWatermark` (opcional).

**Estado:** página 100% estática. Único estado local: índice abierto/cerrado del acordeón FAQ y (opcional) contador animado del ticker.

**Carga:** `lazy()` + `Suspense` para todo lo que está debajo del fold (igual que `Landing.jsx`), `content-visibility-auto` en secciones largas.

---

## 1. Metadata / SEO

| Campo | Contenido |
|---|---|
| `<title>` | SmartLot para dueños de garages \| Convertí tus cocheras vacías en ingresos |
| `meta description` | Publicá tus garages, recibí solicitudes de empresas y gestioná tratos, ocupación y consumos desde un solo panel. Sin hardware. Registrate gratis. |
| `canonical` | `https://[[dominio]]/para-garages` |
| `og:title` | Tu garage, lleno y bajo control — SmartLot |
| `og:description` | Conectá tu garage con empresas que necesitan cocheras y administrá precios, solicitudes y consumos en tiempo real. |
| `og:image` | `[[imagen 1200×630 con mockup del panel]]` |
| `og:type` | `website` |
| `lang` | `es-AR` |

**Keywords de apoyo (contenido, no meta stuffing):** alquiler de cocheras a empresas, gestión de estacionamiento, rentabilizar cocheras, garages para empresas, software de garages.

---

## 2. Navbar (variante garage)

- Logo SmartLot → `/`
- Link de texto: `Volver al inicio` (visible en mobile antes del CTA, opcional)
- Botón secundario (ghost): **"Iniciar sesión"** → `/login`
- Botón primario (azul): **"Registrar mi garage"** → `/register?modo=garage` (ver nota en §16)
- `aria-label` del nav: "Navegación principal"

Microcopy del toast si ya hay sesión activa (reutilizar el existente): "Ya tenés una sesión activa. Redirigiendo a tu panel…"

---

## 3. Hero

**Badge (eyebrow):**
> Para dueños y administradores de garages

**H1 (3 líneas animadas, patrón word-by-word del Hero existente):**
> Publicá.
> Gestioná.
> Cobrá por uso.

La tercera línea en `text-brand-blue` (mismo tratamiento que "Escalá.").

**Subtítulo (párrafo):**
> SmartLot conecta tu garage con empresas que necesitan estacionamiento para sus equipos. Vos definís precios, capacidad y horarios; la plataforma ordena solicitudes, tratos y consumos en un solo panel. Sin hardware, sin planillas.

**CTA primario:**
> Registrar mi garage

**CTA secundario (ghost / link):**
> Ya tengo cuenta → Iniciar sesión

**Bullets de confianza debajo de los CTAs (con iconos Lucide, `aria-hidden`):**

- `CircleCheck`: Publicás en minutos, sin instalar equipos.
- `CircleCheck`: Vos aprobás cada empresa y cada cambio.
- `CircleCheck`: Exportás consumos en PDF y Excel cuando quieras.

**Visual:** mockup del panel del dueño (tarjetas de garages con % de ocupación, métricas y un trato vigente). Reservar `aspect-ratio` para evitar CLS. `alt`: "Panel de SmartLot con el portafolio de garages, ocupación y tratos del dueño".

**Título oculto para accesibilidad si el visual es decorativo:** el mockup siempre con `alt` descriptivo o `aria-hidden="true"` si se acompaña de texto equivalente.

---

## 4. Stats ticker (franja de datos del producto)

Reemplaza las 4 métricas genéricas del landing principal. Solo datos verificables del producto (marcar `[[ ]]` los de negocio):

| Valor | Etiqueta |
|---|---|
| `24` | meses de historial de consumos |
| `3` | tipos de vehículo con tarifa propia (auto, moto, pickup) |
| `100%` | online, sin hardware |
| `PDF + Excel` | exportación de consumos |
| `[[0]]` | comisión por publicación `[[validar]]` |
| `[[X]]` | garages administrados `[[validar]]` |

`aria-label` de la franja: "Datos y capacidades de la plataforma". `aria-hidden` en la copia animada y `sr-only` con el listado completo (patrón ya usado en `StatsTicker`).

---

## 5. Sección dolor → solución

**Eyebrow:** El problema
**H2:** Lo que hoy te cuesta plata (y tiempo)

**Grid de 4 dolores (título + descripción):**

1. **Cocheras vacías** — Espacio ocioso que no genera ingresos mientras las empresas de la zona no encuentran dónde estacionar.
2. **Acuerdos en WhatsApp y papel** — Cantidades, precios y cambios que se pierden entre mensajes y no quedan registrados.
3. **Sin visibilidad real** — No sabés cuánto se usa cada garage ni cuánto generó cada empresa el mes pasado.
4. **Cobros y reportes manuales** — Armar números en una planilla cada mes, sin respaldo ni detalle por reserva.

**Cierre / transición:**
> SmartLot convierte ese caos en un panel con reglas claras: tu garage, tus precios, tus decisiones.

---

## 6. Cómo funciona (3 pasos)

**Eyebrow:** Cómo funciona
**H2:** De plaza vacía a trato activo en 3 pasos
**Subtítulo:**
> Sin hardware, sin instalaciones complejas y sin cambiar tu operación diaria.

**Paso 1 — Cargá tu garage**
> Nombre, ubicación con mapa, niveles, horarios, días y capacidad. Definí cuántas plazas destinás a reservas y cuántas a uso libre. En minutos ya está publicado para las empresas.

**Paso 2 — Recibí solicitudes de empresas**
> Las empresas piden cocheras para sus equipos. Ves quién pide, para qué sede, cuántas plazas y con qué modalidad de pago. Aceptás o rechazás vos.

**Paso 3 — Gestioná y cobrá por uso**
> Cada trato activo queda registrado. Seguí la ocupación, los consumos por reserva y exportá importes por empresa y período en PDF o Excel.

CTA intermedio: **"Ver el panel en detalle"** (ancla `#funcionalidades`).

---

## 7. Bento de funcionalidades (sección `#funcionalidades`)

**Eyebrow:** Tu panel de dueño
**H2:** Todo lo que necesitás para administrar tus garages
**Subtítulo:**
> Herramientas pensadas para el dueño, no para un equipo de IT.

**Tarjetas (título + descripción + badge), siguiendo el patrón visual de `BentoGrid`:**

1. **Portafolio con estado real** *(badge: Core)*
   Tus garages en una sola pantalla: operativos, cerrados o en borrador. Ocupación actual por garage, capacidad total y ocupación media del portafolio en tiempo real.

2. **Alta guiada con mapa**
   Cargá la ubicación con autocompletado de Google Maps, nivel/planta, horario de apertura y cierre, días operativos y capacidad por tipo de plaza (reservas y no reservas).

3. **Precios por tipo de vehículo**
   Tarifa por hora diferenciada para auto, moto y pickup. Cambiala cuando quieras, sin tocar los tratos ya acordados.

4. **Borrador y restauración** *(badge: Control)*
   ¿Un garage deja de estar disponible? Movelo a borrador: deja de ser visible para las empresas y lo restaurás con un clic cuando vuelva a estar operativo.

5. **Solicitudes con decisión tuya**
   Cada empresa envía su pedido con sede, cantidad de cocheras y modalidad de pago. Aceptás o rechazás con confirmación; al aceptar se crea el trato.

6. **Cambios de cocheras autorizados por vos**
   Si una empresa necesita más o menos plazas, la modificación queda en tu bandeja: autorizás o rechazás el cambio. Nada se modifica sin tu aprobación.

7. **Tratos vigentes claros**
   Empresa, sede, garage, fecha de inicio, cocheras comprometidas, modalidad de pago y tarifas de auto y pickup, todo en una tabla ordenada.

8. **Consumos y reportes** *(badge: Export)*
   Reservas utilizadas, tiempo total e importes generados por empresa, con filtros por garage y período. Exportación en PDF y Excel lista para compartir.

9. **Notificaciones al instante**
   Avisos de solicitudes nuevas, aceptadas, rechazadas, modificadas o canceladas. El contador de pendientes vive en el footer para que no se te pase ninguna.

10. **Seguridad de tu cuenta**
    Teléfono editable con validación, contraseña robusta y sesión protegida por rol. Cada dueño ve solo sus garages.

---

## 8. Showcase del panel (métricas)

**Eyebrow:** Visibilidad total
**H2:** Tus números, siempre a mano
**Subtítulo:**
> Entrá y sabé, sin abrir una planilla, cómo está rindiendo cada garage.

**Mock de tarjetas métricas (con datos de ejemplo rotulados como demostración visual):**

| Métrica | Ejemplo en el mock |
|---|---|
| Garages propios | 4 |
| Ocupación media | 78% |
| Tratos vigentes | 12 |
| Capacidad total | 260 plazas |
| En borrador | 1 |
| Importe generado del mes | $ [[monto]] |

**Nota legal visible en el mock o al pie:** "Consumos generados: no representan cobros ni pagos recibidos." (Coherente con la app.)

---

## 9. Reportes y exportaciones

**Eyebrow:** Transparencia
**H2:** El detalle, reserva por reserva
**Subtítulo:**
> Cada consumo queda registrado para que puedas revisar y respaldar lo generado.

**Lista con iconos:**

- **Detalle por movimiento:** reserva, tipo de vehículo, fecha y hora, minutos utilizados, tarifa por hora aplicada e importe.
- **Filtros reales:** búsqueda por empresa, sede o garage; filtro por garage propio; período de hasta 24 meses.
- **Exportación profesional:** PDF para presentar y Excel con formato de moneda ARS para analizar.
- **Resumen por empresa:** reservas utilizadas, tiempo total e importe generado.

**Mini-CTA:** "Ver el detalle en la app" → `/login` (o ancla a demo si existiera). *(Opcional: usar `Demo.jsx` existente si se quiere mostrar video/imagen.)*

---

## 10. Seguridad y control

**Eyebrow:** Tranquilidad
**H2:** Vos decidís qué pasa con tus plazas

**4 puntos:**

1. **Aprobación en dos pasos** — Nada se activa sin tu confirmación: ni un trato nuevo, ni un cambio de cocheras.
2. **Ocultamiento reversible** — Un garage en borrador no aparece para las empresas. Restaurarlo es un clic.
3. **Ocupaciones bajo control operativo** — Las ocupaciones las mueve la operación real (reservas y accesos), no se editan a mano.
4. **Cuenta protegida** — Contraseña con requisitos y datos sensibles de solo lectura. Si sos superadmin o empresa, no ves ni tocás garages ajenos.

---

## 11. Testimonios

**Eyebrow:** Casos reales
**H2:** Dueños que ya llenan sus cocheras
**Subtítulo:** `[[Completar con casos reales validados por negocio]]`

**Estructura de cada tarjeta (3 en desktop, carrusel o grid en mobile):**

> "[[Cita textual del dueño sobre tiempo o ingresos recuperados.]]"
> — **[[Nombre y apellido]]**, [[Garage + ciudad]] · [[Nº]] garages administrados

> **No inventar testimonios.** Hasta tenerlos, reemplazar esta sección por una franja de logos de empresas usuarias `[[logos validados]]` o eliminar del MVP.

---

## 12. FAQ

**H2:** Preguntas frecuentes
Acordeón accesible: `<button aria-expanded aria-controls>` + región con `role="region" aria-labelledby`. Animación de apertura con `transform`/`opacity` y fallback de movimiento reducido.

**1. ¿Cuánto cuesta publicar mi garage?**
> Publicar y gestionar tu garage en SmartLot `[[es gratis / tiene una comisión validada por negocio]]`. Las empresas pagan por las cocheras que usan según los acuerdos que vos aceptás.

**2. ¿Puedo ocultar un garage sin borrarlo?**
> Sí. Se mueve a **Borrador**: deja de ser visible para las empresas, conserva toda su información y podés restaurarlo cuando quieras.

**3. ¿Quién define los precios?**
> Vos. La plataforma te permite cargar tarifas por hora distintas para auto, moto y pickup, y editarlas cuando lo necesites.

**4. ¿Cómo me contactan las empresas?**
> No hace falta intermediar mensajes: las empresas envían solicitudes de cocheras desde la plataforma con sede, cantidad y modalidad de pago. Vos las aceptás o rechazás ahí mismo.

**5. ¿Qué pasa si una empresa quiere cambiar la cantidad de cocheras?**
> La solicitud de modificación llega a tu bandeja de cambios. El trato solo se actualiza si vos la autorizás.

**6. ¿Puedo cobrar de forma automática?**
> Hoy SmartLot te muestra con precisión los **consumos generados** por empresa y período, con detalle por reserva y exportación en PDF/Excel. La integración de cobros y conciliación está en camino `[[confirmar roadmap]]`.

**7. ¿Necesito comprar hardware o instalar equipos?**
> No. SmartLot es 100% software: tus garages se administran desde la web y las reservas y accesos se validan digitalmente.

**8. ¿Puedo administrar varios garages con la misma cuenta?**
> Sí. Un solo usuario puede tener varios garages, ver el portafolio completo y recibir solicitudes para cada uno.

**9. ¿Qué pasa si dejo de operar un garage?**
> Lo movés a borrador y deja de recibir solicitudes. Podés restaurarlo cuando vuelva a estar operativo.

---

## 13. CTA final

**H2:**
> Tus cocheras vacías pueden empezar a generar esta semana

**Párrafo:**
> Creá tu cuenta, cargá tu primer garage y publicitalo para que las empresas de tu zona lo encuentren. Sin hardware y sin costo de instalación.

**Botón primario:**
> Registrar mi garage

**Microcopy debajo (con icono `Lock`):**
> Registro en minutos. Tus datos quedan protegidos y podés dejar de usar la plataforma cuando quieras.

**Segundo enlace:**
> ¿Ya tenés cuenta? Iniciar sesión

---

## 14. Footer

- Logo + nombre SmartLot
- Links: `Volver al inicio` · `Iniciar sesión` · `Registrar mi garage`
- Legal: **"© [año] SmartLot. El estacionamiento del futuro."**
- Tagline: **"Digitalización de espacios B2B sin hardware."**
- `[[Legales: Términos y Privacidad si existen]]`

---

## 15. Microcopy y textos de soporte

**CTAs (usar consistentemente):**
| Contexto | Texto |
|---|---|
| Primario (nav) | Registrar mi garage |
| Primario (hero) | Registrar mi garage |
| Primario (final) | Crear mi cuenta gratis `[[si aplica]]` |
| Secundario | Iniciar sesión |
| Ancla interna | Ver funcionalidades / Ver el panel en detalle |

**Alt texts:**
- Mockup hero: "Panel de SmartLot con portafolio de garages, ocupación y tratos vigentes".
- Mock de reportes: "Tabla de consumos generados por empresa con reservas, tiempo e importe".
- Logo del nav: "SmartLot Logo" (ya definido en el componente actual).

**Aria-labels de iconos sueltos:**
- Botones de CTA con icono: el texto visible alcanza; no duplicar.
- Iconos decorativos dentro de tarjetas: `aria-hidden="true"`.

**Estados y errores (si se reutilizan formularios):** mantener los mensajes reales de la app ("Corrige los campos marcados antes de guardar.", "No se pudo crear el garage: …").

---

## 16. Notas de implementación (handoff)

1. **Registro por modo:** `/register` hoy arranca en modo Empresa (`MODO_EMPRESA`). Para que el CTA abra directo en modo Garage, agregar lectura del query param `?modo=garage` en `src/pages/Register.jsx` (`useSearchParams`) y usarlo como estado inicial. Si no se toca, el CTA debe apuntar a `/register` y el usuario cambia el toggle.
2. **Navbar con variante:** convertir `Navbar.jsx` a `Navbar({ variant })` o crear `ParaGaragesNavbar` para no duplicar lógica de sesión/toast/animación.
3. **BentoGrid reutilizable:** extraer el array de features a `const features` por props para compartir el componente entre landing principal y la de garages (evita duplicación y mantiene la animación).
4. **StatsTicker con datos por props:** mismo caso; pasar el array y `aria-label` como props con defaults.
5. **Contact / CTA:** parametrizar título, párrafo, label del botón y destino para reutilizar el recuadro animado con borde SVG.
6. **Sección Demo:** existe `Demo.jsx` en la landing principal; si se quiere video o GIF del panel del dueño, reutilizarlo con `lazy()`.
7. **Header/footer duplicados:** `InteractiveBackground` y `LogoWatermark` son reutilizables; mantener `bg-noise` y `glass-*`.
8. **Contadores:** si se animan métricas del showcase, usar `tabular-nums` y actualizar con `textContent` en `onUpdate` (sin re-render de React). Incluir fallback estático con movimiento reducido.
9. **Anclas:** usar `id` en secciones y `scroll-margin-top` por el navbar fijo (aprox. `5rem`), o `scroll-behavior: smooth` respetando `prefers-reduced-motion`.

---

## 17. Dirección visual

**Paleta (tokens existentes):**
- Fondo: `--color-brand-bg` #F5F7FB + `bg-noise`
- Texto: `--color-brand-warm` #1E293B / muted `--color-brand-muted` #64748B
- Acento: `--color-brand-blue` #2563EB; hover #1D4ED8 / `brand-deep` #0C1E3F
- Sky de apoyo: `--color-brand-sky` #6C93D6 (chips y detalles)
- Superficies: `glass-card` (blanco translúcido + blur + borde suave)

**Tipografía:**
- Display/headings: **Archivo** (`--font-display`), tracking negativo.
- Body: **DM Sans** (`--font-body`), 16px mínimo en mobile, line-height 1.5–1.75.
- Números de métricas: `tabular-nums`.

**Estilo:** minimalismo premium con glassmorphism sutil (el mismo lenguaje del landing principal). Sin emojis como iconos; set único **Lucide** con el mismo stroke. Sombras suaves y consistentes, radios 1.5rem en tarjetas.

**Espaciado:** escala de 4/8px; secciones `py-16` a `py-24`; contenedor `max-w-6xl`; medidas de texto ≤ 75 caracteres.

---

## 18. Movimiento (respetando el sistema existente)

| Sección | Animación | Implementación |
|---|---|---|
| Navbar | Entrada desde arriba | `gsap.from(yPercent:-100, autoAlpha:0)` + `matchMedia` |
| Hero | Timeline: badge → palabras (stagger) → párrafo → CTAs → visual | patrón de `Hero.jsx`; tercera palabra en azul |
| Stats | Loop infinito del track | patrón `StatsTicker`; sin movimiento = posición estática |
| Dolores / Pasos | Fade + `y` con `ScrollTrigger` al 75% | `fromTo` con stagger 0.1 |
| Bento | Header + cards `y:60, scale:0.95 → 1` | patrón de `BentoGrid.jsx` |
| Showcase | Contadores (opcional) + barras de ocupación animadas | `width` de barra vía `scaleX` (evitar animar `width`) |
| FAQ | Altura con `grid-template-rows`/`max-height` o medición con `auto` y `transform` | foco y `aria-expanded` siempre funcionales |
| CTA final | Caja + contenido en cascada + borde SVG animado | patrón de `Contact.jsx` |
| Todo | `prefers-reduced-motion: reduce` → `gsap.set()` final, sin splits ni loops | `gsap.matchMedia()` obligatorio |

**Reglas:** solo `transform`/`opacity`; nada de animar `width/height/top/left` de layout; sin allocation de objetos dentro del loop; animaciones interrumpibles; limpieza con `useGSAP` scope.

---

## 19. Checklist de accesibilidad y performance

- [ ] Un solo `<h1>` (hero) y jerarquía `h2 → h3` sin saltos.
- [ ] `main id="main-content"` + skip link "Saltar al contenido principal".
- [ ] Todos los botones/links con foco visible (`focus-visible:ring-2` con offset).
- [ ] Targets táctiles ≥ 44×44 px y ≥ 8 px de separación.
- [ ] Contraste ≥ 4.5:1 en texto normal y ≥ 3:1 en títulos grandes (validar muted sobre fondos glass).
- [ ] Imágenes con `width/height` o `aspect-ratio` (CLS < 0.1); mockups con `loading="lazy"` si están bajo el fold.
- [ ] Iconos decorativos `aria-hidden="true"`; icon-only con `aria-label`.
- [ ] Acordeón FAQ operable con teclado (Tab/Enter/Shift+Tab), `aria-expanded` correcto.
- [ ] `InteractiveBackground` decorativo: `aria-hidden="true"` y `pointer-events: none` (ya cumple).
- [ ] Secciones bajo el fold con `lazy()` + `Suspense` y fallback visible.
- [ ] Sin scroll horizontal a 320 px; footer/navbar responsivos.
- [ ] `prefers-reduced-motion` desactiva intro, ticker, loops y animaciones de entrada.
- [ ] Contadores con `aria-live="polite"` solo si aportan información (no para decoración).

---

## 20. Responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 640px` | Hero 1 columna, texto centrado a izquierda legible, CTAs full-width apilados; bento 1 col; stats 1 dato por pantalla (ticker más lento); FAQ 1 col; mockups verticales |
| `640–1024px` | Hero 1 col con visual debajo; bento 2 col; pasos en 2+1; CTA centrado |
| `> 1024px` | Hero 2 col (texto + mockup flotante); bento 4 col estilo grid principal; pasos en 3 columnas; stats en franja completa |

---

## 21. Qué NO decir (reglas de honestidad del producto)

- No prometer **cobro automático, facturación o conciliación**: hoy son "consumos generados" (la app lo aclara explícitamente).
- No prometer **gestión de personal/garagistas** desde esta cuenta: no existe en las vistas del rol.
- No prometer **edición manual de ocupaciones**: las maneja la operación.
- No publicar **testimonios, logos ni métricas inventadas**: usar placeholders hasta validarlos.
- No usar el término "hardware" como feature (no hay hardware; es un argumento de facilidad).
