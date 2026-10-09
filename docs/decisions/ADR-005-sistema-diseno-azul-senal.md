# ADR-005: Sistema de diseño "Azul Señal" con tokens de Tailwind v4

## Estado

Aceptado.

## Fecha

2026-10-09.

## Contexto

Cinco paneles por rol más la landing comparten componentes y estados (reservas, pagos, tabla de personal). Sin un sistema, cada vista definía colores y medidas propias, con hex dispersos y jerarquías inconsistentes. Tailwind CSS v4 permite declarar tokens de tema directamente en CSS (`@theme`), lo que habilita utilidades `brand-*` generadas desde una única fuente. Evidencia: `DESIGN.md`, `src/index.css`, `README.md`.

## Decisión

Adoptar "Azul Señal" como sistema de diseño documentado en `DESIGN.md` (raíz) y materializado en tokens `@theme` de `src/index.css`:

- Colores `--color-brand-*` (azul señal, fondos, textos) y semánticos (`--success`, `--warning`, `--error`).
- Tipografías: Archivo (display de landing), DM Sans (producto), cargadas en `index.html`.
- Radios, sombras y alturas de componentes especificados en `DESIGN.md`.

Regla: la UI usa las utilidades y tokens del sistema; evitar valores hex/rgb hardcodeados o clases arbitrarias.

## Alternativas consideradas

### CSS Modules / styled-components
- Pros: aislamiento por componente.
- Contras: se aparta de la utilidad-focus que el equipo ya usaba con Tailwind.
- Rechazada.

### Definir una paleta nueva al margen del código existente
- Pros: libertad total.
- Contras: inconsistencia con la UI ya construida y retrabajo masivo.
- Rechazada: el sistema parte del azul que ya dominaba el producto y lo sistematiza.

### Colores solo por clases utilitarias sueltas (sin tokens)
- Pros: cero configuración.
- Contras: cambiar la paleta implicaba tocar cientos de clases.
- Rechazada.

## Consecuencias

- `DESIGN.md` y `src/index.css` son la fuente del sistema; se actualizan juntos.
- Nuevos componentes deben reutilizar los patrones existentes (botones 40/48 px, inputs con floating label, badges).
- La auditoría UI pendiente (`docs/pendientes-audit-ui.md`) tiene como criterio estos tokens.
- Cambiar un token impacta todas las vistas: la validación visual es obligatoria en cambios de paleta.
