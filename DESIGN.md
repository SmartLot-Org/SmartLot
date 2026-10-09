---
name: SmartLot
description: Plataforma web de gestión de estacionamientos — sistema visual "Azul Señal".
colors:
  brand-deep: "#0C1E3F"
  brand-blue: "#2563EB"
  brand-accent-hover: "#156FE5"
  brand-blue-pressed: "#1A73E8"
  brand-sky: "#93C5FD"
  brand-bg: "#F5F7FB"
  brand-surface: "#FFFFFF"
  brand-warm: "#1E293B"
  brand-muted: "#475569"
  text-muted: "#94A3B8"
  bg-elevated: "#F1F5F9"
  border: "#E2E8F0"
  border-strong: "#CBD5E1"
  accent-bg: "#DBEAFE"
  success: "#22C55E"
  success-bg: "#F0FDF4"
  warning: "#EAB308"
  warning-bg: "#FEFCE8"
  error: "#EF4444"
  error-bg: "#FEF2F2"
  error-strong: "#B91C1C"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontWeight: 700
  product:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.brand-surface}"
    rounded: "{rounded.md}"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-accent-hover}"
  button-primary-large:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.brand-surface}"
    rounded: "{rounded.md}"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.brand-warm}"
    rounded: "{rounded.md}"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.brand-surface}"
    rounded: "{rounded.md}"
    height: "40px"
  input:
    backgroundColor: "{colors.brand-surface}"
    textColor: "{colors.brand-warm}"
    rounded: "{rounded.sm}"
    height: "48px"
  badge-neutral:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.brand-muted}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-info:
    backgroundColor: "{colors.accent-bg}"
    textColor: "{colors.brand-blue}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.brand-surface}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Sistema de diseño: SmartLot

> Los títulos de sección siguen el orden canónico del formato DESIGN.md (portabilidad para herramientas); el contenido está en español. Los tokens del frontmatter y los de `src/index.css` son la fuente normativa y se actualizan juntos.

## Overview

**Creative North Star: "Azul Señal"**

Una estética industrial-precisa construida sobre el azul que ya domina el producto. No se inventa una paleta nueva: se sistematiza y refina lo que existe. El azul señal (#2563EB) evoca paneles de control marítimos, señalética de hospitales e infraestructura urbana: es un azul funcional, de alta visibilidad, que comunica confianza y precisión operativa. Inspiración: paneles de instrumentación técnica, señalética de transporte, dashboards de control industrial, la claridad de un plano de ingeniería bien ejecutado.

El sistema es **preciso, funcional y consistente**. Prioriza la legibilidad operativa sobre la decoración. El color comunica; la tipografía jerarquiza; el movimiento acompaña.

SmartLot tiene dos registros deliberados: **persuadir** (landing y autenticación, con animación expresiva y superficies de vidrio) y **operar** (paneles por rol, con densidad controlada, scanabilidad y estados claros). Ambos comparten los mismos tokens.

**Key Characteristics:**

- Un solo acento cromático —el azul señal— usado con disciplina.
- Base neutra fría con superficies blancas y sombras suaves.
- Tipografía en dos voces: Archivo (display/marketing) y DM Sans (producto).
- Dos registros: Persuade (público) y Operate (paneles).
- Movimiento con propósito, siempre desactivable con `prefers-reduced-motion`.
- Accesibilidad AA como piso, no como extra.

## Colors

Un solo acento cromático sobre una base neutra fría; los estados usan semánticos estándar, nunca tonos de marca reinterpretados.

### Primary

- **Azul señal** (#2563EB): CTAs, enlaces, foco, elementos activos y datos destacados. Es el color de acción del sistema.
- **Azul profundo** (#0C1E3F): superficies oscuras (navbar/footer de landing, ticker de métricas) y texto de títulos sobre fondos claros.
- **Azul hover** (#156FE5): estado hover del acento, más brillante que el reposo.
- **Azul presionado** (#1A73E8): estado active/pressed del acento.
- **Azul cielo** (#93C5FD): bordes y hovers secundarios, avatares.

### Neutral

- **Fondo** (#F5F7FB), **superficie** (#FFFFFF) y **elevada** (#F1F5F9): página, tarjetas/paneles y secciones secundarias o hover.
- **Texto principal** (#1E293B), **secundario** (#475569; 7.07:1 sobre el fondo) y **muted** (#94A3B8; solo placeholder o deshabilitado).
- **Bordes** (#E2E8F0); **borde fuerte** (#CBD5E1) para foco.
- Chrome oscuro: #191C1E para header/footer de producto.

### Semantic

- **Éxito** #22C55E sobre fondo #F0FDF4.
- **Alerta** #EAB308 sobre fondo #FEFCE8.
- **Error** #EF4444 sobre fondo #FEF2F2; **error fuerte** #B91C1C para hover/active.
- **Info**: azul señal sobre fondo #DBEAFE, con borde #BFDBFE.

### Named Rules

**La Regla del Token.** Ningún componente define sus propios colores: todo sale del frontmatter y de `src/index.css`. Las únicas excepciones son datos internos de exportables (Excel/PDF), previews de email y pantallas de depuración; si aparecen, se documentan aquí.

**La Regla AA.** Texto de cuerpo ≥ 4.5:1; texto grande y componentes de UI ≥ 3:1. El texto secundario ya está calibrado a 7.07:1 sobre el fondo.

**La Regla del Color con Significado.** Un estado nunca se comunica solo con color: siempre se acompaña de texto o ícono.

## Typography

**Display Font:** Archivo (con fallback system-ui) — voz de marketing.
**Body Font:** DM Sans (con fallback system-ui) — voz de producto.
**Label/Mono Font:** JetBrains Mono (con fallback Consolas) — datos y depuración.

**Character:** Archivo aporta peso y presencia editorial para la landing; DM Sans es la voz neutra y legible del producto. La solidez viene de la jerarquía, no de sumar familias.

### Hierarchy

- **Display** (Archivo 600–900, escala fluida): H1/H2 de landing y páginas públicas.
- **H1** (DM Sans 500; 56px, tracking −1.68px; ≤1024px: 36px): encabezado principal de producto.
- **H2** (DM Sans 500; 24px, line-height 118%; ≤1024px: 20px).
- **Body** (DM Sans 400; 18px/145% base; ≤1024px: 16px).
- **Label** (DM Sans 500; 12–14px; mayúsculas con tracking en eyebrows y badges).

### Named Rules

**La Regla de la Jerarquía.** La fuerza tipográfica sale de la jerarquía y el peso, no de la variedad de fuentes. Máximo dos familias visibles por pantalla.

**La Regla del Mono Dato.** La monoespaciada se reserva para datos, códigos y depuración; nunca para UI general. Hoy JetBrains Mono no se carga desde Google Fonts: aplica el fallback Consolas hasta que se incorpore.

## Layout

Modelo **mobile-first** con retícula base de 4px.

- **Landing**: contenedor centrado `max-w-6xl` (1152px) con padding lateral de 24px (`px-6`); grids que colapsan a una columna.
- **Paneles de producto**: ancho completo con padding `40px 4%` (`.envoltorio-contenido`, `.admin-dashboard`, `.gestion-garages-container`).
- **Ritmo espacial**: 4 / 8 / 16 / 24 / 32px para gaps y separaciones; las secciones de landing respiran con 80px verticales (`py-20`).
- **Breakpoints**: los de Tailwind (sm 640, md 768, lg 1024, xl 1280); el corte tipográfico documentado es 1024px.
- **Tablas y contenido ancho**: overflow horizontal explícito en móvil; nunca romper el layout de la página.
- **Lectura**: textos de cuerpo con ancho máximo (`max-w-2xl`/`max-w-lg`, ~65–75 caracteres por línea).

**La Regla del Pulgar.** En móvil, todo objetivo táctil mide al menos 44px; los CTAs de la landing usan mínimo 44px de alto.

## Elevation & Depth

Sistema híbrido: los **paneles de producto son planos** —superficies blancas, borde hairline y sombra solo como respuesta al estado—; la **landing usa profundidad ambiental** con vidrio (blur) sobre el fondo y sombras amplias.

### Shadow Vocabulary

- **sm** (`0 1px 3px rgba(15, 23, 42, 0.06)`): separación sutil de tarjetas en reposo.
- **md** (`0 4px 12px rgba(15, 23, 42, 0.08)`): tarjetas interactivas, menús.
- **lg** (`0 8px 30px rgba(15, 23, 42, 0.1)`): modales, drawers, overlays.
- **accent** (`0 4px 14px rgba(37, 99, 235, 0.25)`): foco o elevación de un elemento de acción.

### Named Rules

**La Regla Plano por Defecto.** Las superficies de producto son planas en reposo. La sombra aparece como respuesta a hover, elevación o foco; nunca decorativa.

**La Regla del Vidrio Solo Landing.** El glassmorphism (`.glass-nav`, `.glass-card`, `bg-noise`) pertenece a las superficies públicas. Los paneles de producto no usan vidrio.

## Shapes

Lenguaje de esquinas suaves y consistentes: radios **6px** (badges, inputs), **10px** (botones, tarjetas), **14px** (paneles grandes) y **full** (pills, avatares). La landing usa radios más expresivos (hasta 24px) en sus tarjetas de vidrio.

- Bordes de 1px, color tokenizado; el borde fuerte se reserva para foco.
- Sin side-stripes de color, sin esquinas mezcladas dentro de un mismo grupo de controles.
- Las pills (badges, CTAs de landing) usan radio full; los controles de formulario nunca son pills.

## Components

### Buttons

- **Shape:** esquinas de 10px; alturas unificadas de **40px** (md) y **48px** (lg).
- **Primary:** fondo azul señal, texto blanco; hover azul hover; active azul presionado.
- **Secondary:** fondo transparente, texto principal, borde `border`; hover con borde fuerte.
- **Ghost:** transparente, texto secundario; para acciones terciarias.
- **Danger:** fondo error, texto blanco; solo para acciones destructivas y siempre con confirmación.
- **Focus:** anillo visible de azul señal; nunca eliminar el foco sin reemplazo.
- **Estados:** disabled con opacidad reducida y cursor no interactivo; loading bloquea doble envío.

### Inputs / Fields

- **Style:** etiqueta flotante (patrón existente), caja de 48px, fondo superficie, radio 6px, borde `border`.
- **Focus:** borde azul señal + anillo `rgba(37, 99, 235, 0.15)`.
- **Error:** borde error con mensaje accionable en español; el campo requerido marca asterisco rojo (CSS global).
- **Autocomplete** declarado en formularios de credenciales.

### Badges

Cinco variantes —neutral, success, warning, error, info— con radio 6px, padding `2px 8px`, DM Sans 500 de 12px. Fondo y texto según la tabla semántica; nunca solo color para comunicar el estado.

### Cards / Containers

- **Producto:** superficie blanca, radio 10–14px, borde hairline, sombra sm de reposo.
- **Landing:** `glass-card` (fondo `rgba(253, 252, 249, 0.65)`, blur 16px, borde `rgba(12, 30, 63, 0.08)`).
- Sin tarjetas anidadas.

### Navigation

- **Landing:** navbar de vidrio (`.glass-nav`: fondo `rgba(245, 247, 251, 0.75)`, blur 20px, borde inferior hairline).
- **Producto:** sidebars y footers por rol; el estado activo se marca con azul señal, no solo con color de fondo.

### Overlays & Feedback

- Modales propios a través de `ModalPortal`; diálogos y toasts con SweetAlert2.
- Jerarquía de capas centralizada en `src/helpers/zIndex.js`: toasts 10200, diálogos 10600.
- Nunca `alert()` ni `confirm()` nativos.
- Toda mutación asíncrona da feedback: loading, éxito o error accionable.

### Empty States

Componente compartido `EmptyState` obligatorio para todo contenedor vacío, con acción cuando exista (ver `docs/estados-vacios.md`).

### Icons

`lucide-react` es la única librería de íconos en uso: líneas de 2px, tamaño 16–24px. No mezclar librerías ni usar emojis como íconos. Los íconos decorativos llevan `aria-hidden`.

## Do's and Don'ts

### Do:

- **Do** usar los tokens del frontmatter y las utilidades `brand-*` de `src/index.css`; la UI se construye con el sistema.
- **Do** respetar las alturas 40/48px, los radios 6/10/14/full y la tabla de sombras.
- **Do** reutilizar componentes compartidos (`EmptyState`, `ModalPortal`, botones y campos existentes) antes de crear nuevos.
- **Do** acompañar todo estado con texto o ícono además del color.
- **Do** envolver animaciones en `prefers-reduced-motion` y ofrecer siempre la versión sin movimiento.
- **Do** validar contraste AA (4.5:1 cuerpo, 3:1 grande/UI) antes de cerrar una pantalla.
- **Do** mantener la copia en español rioplatense con voseo (ver `PRODUCT.md`).

### Don't:

- **Don't** hardcodear hex/rgb ni usar valores arbitrarios de Tailwind (`text-[#...]`, `bg-[#...]`, `w-[NNNpx]`) para saltear el sistema.
- **Don't** inventar variantes de componentes cuando ya existe una compartida.
- **Don't** usar glassmorphism, ruido o vidrio en los paneles de producto.
- **Don't** usar side-stripes de color, texto con gradiente, nesting de tarjetas ni métricas-héroe.
- **Don't** usar emojis como íconos ni mezclar `lucide-react` con otras librerías.
- **Don't** animar propiedades de layout (width/height/top/left) ni usar easing elástico o rebote.
- **Don't** mostrar estados solo por color, ni mensajes de error crudos o en inglés.
- **Don't** usar modales donde una edición inline alcanza.
