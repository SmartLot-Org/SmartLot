# ADR-009: Estilos por componente con Tailwind y escalas en px

## Estado

Aceptado. Implementación pendiente (Fase 1 de la auditoría UI).

## Fecha

2026-11-17.

## Contexto

La auditoría de paneles (`docs/auditoria-ui-paneles.md`, causas 2.1 a 2.4) encontró que cada vista importa su propio CSS global, que queda cargado el resto de la sesión. Hay 91 nombres de clase definidos en dos o más archivos (`.boton-back` en 13) y gana el último que se cargó: una pantalla se ve distinta según por dónde se llegó. Además no hay escalas: 117 tamaños de fuente, 144 valores de espaciado, 36 radios y 194 sombras en el CSS de paneles.

La raíz tipográfica es de 18 px en escritorio y 16 px hasta 1024 px, y el dueño del producto decidió mantenerla (2026-11-16). Con esa raíz, todo lo que se mide en `rem` sale de la grilla de 4 px: la utilidad `p-4` de Tailwind mide 18 px y `px-6`, 27 px.

El repositorio ya usa Tailwind CSS v4 con tokens en `@theme` (ADR-005) y `AGENTS.md` pide estilos con utilidades y tokens.

## Decisión

1. **Componentes compartidos en `src/components/ui/`**, escritos con utilidades de Tailwind sobre los tokens de `@theme`. Lo que no entra cómodo en utilidades (estados complejos, animaciones) va en un CSS Module al lado del componente. Ninguna pieza nueva define ni usa nombres de clase globales.
2. **Escalas en px para toda la app**, en `@theme` de `src/index.css` y en el frontmatter de `DESIGN.md`:
   - Espaciado con `--spacing: 4px`, así cada utilidad de Tailwind mide lo mismo con cualquier raíz.
   - Texto de producto en `--text-*`: 12, 13, 14, 16, 20, 24 y 30 px.
   - Radios 6, 10, 14 y full (los que ya documenta `DESIGN.md`).
   - Sombras sm, md, lg y accent.
   - Controles de 32, 40 y 48 px de alto; 32 solo en tablas y filtros.
3. **Títulos de panel en DM Sans 600**, de 24 px en celular y 30 px en escritorio, con tracking en `em`. Archivo queda para las páginas públicas. Se reemplazan los estilos globales de `h1` y `h2` y el `text-align: center` de `#root`.
4. **Migración gradual.** El CSS global por vista se retira en la Fase 2, vista por vista. Mientras conviven, las vistas migradas no importan CSS global propio.
5. **Superadmin** usa las mismas piezas con una variante que toma la paleta propia del panel (ADR-007): no cambia ningún color.

## Alternativas consideradas

- **Solo CSS Modules**, sin utilidades. Más parecido al CSS actual, pero deja dos sistemas (Tailwind en las páginas públicas y módulos en los paneles) y contradice `AGENTS.md`. Descartada.
- **Escala propia en px solo para paneles**, dejando Tailwind en `rem`. Las páginas públicas quedaban idénticas, pero convivían dos escalas con los mismos nombres de utilidad. Descartada.
- **Bajar la raíz a 16 px.** Resolvía la grilla sin tocar Tailwind, pero cambia el tamaño de toda la app; el dueño del producto prefirió mantener 18 px.
- **Radios 8, 12, 16 y full**, más cerca de lo que usan hoy las vistas. Descartada para no cambiar los componentes ya documentados.

## Consecuencias

- Login, registro y `/para-garages` se achican un poco en escritorio al fijar `--spacing: 4px` (por ejemplo, de 27 a 24 px). Se verifican con capturas antes y después, en el mismo cambio.
- `DESIGN.md` se corrige junto con `src/index.css` cuando se implemente: el título de producto pasa de 56 px a 24 y 30 px, los botones suman la altura de 32 px y las tarjetas usan 16 o 24 px de padding.
- Las cuatro barras de navegación por rol y las tres barras superiores se reemplazan por `AppNav` y `AppHeader`.
- Durante la Fase 2 conviven el CSS global de las vistas sin migrar y los componentes nuevos. El riesgo de que una regla global pise a un componente baja porque los componentes no usan clases globales.
- Spec: `docs/specs/SPEC-fundaciones-ui.md`.
