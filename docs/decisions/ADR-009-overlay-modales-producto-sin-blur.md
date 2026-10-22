# ADR-009: Overlay de los modales de producto sin blur (propuesta)

## Estado

Propuesto. **Espera decisión del dueño del producto.** No se implementa hasta que pase a Aceptado.

## Fecha

2026-10-22.

## Contexto

`DESIGN.md` fija la **Regla del Vidrio Solo Landing**: el glassmorphism pertenece a las superficies
públicas y los paneles de producto no usan vidrio. Sin embargo, `src/componentesCompartidos/ModalPortal.jsx`
(líneas 70-71) aplica por estilos inline `backdropFilter: blur(6px)` al overlay de **todos** los modales del
producto (soporte, exportar, reportes, tratos, etc.). El barrido de la auditoría UI del 2026-10-14 lo registró
como hallazgo nuevo #2 (`docs/audit-ui/pendientes.md`).

Es un cambio de apariencia transversal sobre un componente compartido central: `AGENTS.md` pide preguntar
antes de tocar componentes compartidos de ese alcance, y la regla de `DESIGN.md` y el código se contradicen.

## Decisión

Pendiente. Opción recomendada: **A (quitar el blur y dejar solo el velo `rgba(15, 23, 42, 0.5)`)**.

## Alternativas consideradas

### A — Quitar el blur (recomendada)
- Pros: el código vuelve a cumplir `DESIGN.md`; menos costo de render en el fondo de cada modal (el blur
  fuerza recomposición del contenido detrás); un solo cambio en un archivo.
- Contras: cambia el aspecto de todos los modales; el contenido de fondo queda más legible detrás del velo,
  por lo que conviene revisar que el velo siga separando el foco (contraste del modal sobre el fondo).

### B — Mantener el blur y declararlo excepción en `DESIGN.md`
- Pros: cero cambios visuales.
- Contras: debilita la Regla del Vidrio Solo Landing con una excepción global; hay que anotar la excepción
  en `DESIGN.md` (y en `ADR-005`) para que deje de ser una contradicción.

### C — Reducir el blur (p. ej. 2px)
- Pros: cambio visual mínimo.
- Contras: sigue siendo vidrio en un panel de producto; no resuelve la contradicción, solo la atenúa.

## Consecuencias (si se acepta la opción A)

- Editar solo `ModalPortal.jsx` (quitar `backdropFilter` y `WebkitBackdropFilter`).
- Revisión visual de al menos 3 modales (soporte en `admin_panel_de_control`, exportar en
  `cuentas_por_cobrar`, trato en `gestion_garages`) a 1440 y 360 px.
- Actualizar `docs/audit-ui/pendientes.md` (hallazgo #2 → resuelto) y este ADR a Aceptado.
- Si se elige B o C, registrar aquí la decisión y su justificación; no se borra el ADR.
