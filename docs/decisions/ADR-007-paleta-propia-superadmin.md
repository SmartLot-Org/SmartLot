# ADR-007: Paleta propia del panel superadmin (excepción deliberada a la Regla del Token)

## Estado

Aceptado.

## Fecha

2026-10-10.

## Contexto

La auditoría UI relevó ~30 hallazgos en el panel
superadmin, varios de ellos de contraste o de hexes fuera del sistema "Azul Señal": por ejemplo,
`gestion_usuarios.css:640-651` con headings `#0F1A2E` sobre fondo `rgba(15,23,42,.95)` (≈1:1),
focus ámbar `#F59E0B` en lugar del azul señal, y superficies oscuras `#0F1A2E`/`#1A2744`.

Al decidir la ejecución de fixes, el dueño del producto instruyó explícitamente: *"todo lo que sea
cambiar los colores en superadmin no lo hagas, ya que es un panel distinto a propósito"*.

DESIGN.md ya contempla excepciones a **La Regla del Token** ("las únicas excepciones son datos
internos de exportables, previews de email y pantallas de depuración; **si aparecen, se documentan
aquí**"). El panel superadmin es una herramienta interna con identidad visual propia que no estaba
listada como excepción.

## Decisión

1. **El panel superadmin conserva su paleta oscura propia.** Queda prohibido, como parte de la
   auditoría UI, cambiar valores de color en `src/vistasSuperadmin/**`,
   `src/componentesSuperadmin/**` y sus CSS (incluye `ConfirmarSolicitud.css`): ni hex→token,
   ni "arreglos" de contraste, ni cambios de color de badges, bordes o anillos de foco.
2. **Los fixes que no son color sí aplican** al superadmin: accesibilidad (labels, `aria-label`,
   teclado, roles), estados (error ≠ vacío ≠ loading, retry, `touchAll`), confirmaciones
   (SweetAlert2), jerarquía de headings, copy (voseo/tildes), motion (`prefers-reduced-motion`,
   sin easing elástico) y estructura (quitar eyebrows, side-stripes y hero-metrics).
3. **Excepción mínima de accesibilidad:** donde un control no tenga *ningún* estado de foco
   (`outline:none` sin reemplazo), se PUEDE agregar `:focus-visible` usando el color de acento que
   el propio panel ya usa. No es un cambio de paleta; es agregar un estado faltante.
4. **Los componentes compartidos no son "el panel".** `EmptyState`, `campana_notificaciones`,
   `ToastUndo`, `ErrorBoundary`, `UserDropdown`, `tarjeta_garages` y `GestionTratosGarage` siguen
   el sistema general (tokens AA) aunque se rendericen también dentro del superadmin.
5. Los hallazgos de color/contraste del superadmin quedan **diferidos por decisión**.

## Alternativas consideradas

### Migrar el superadmin al sistema "Azul Señal"
- Pros: consistencia total; los contrastes rotos se corrigen solos.
- Contras: borra una identidad deliberada; el dueño lo prohibió explícitamente.
- Rechazada.

### Corregir solo los contrastes rotos (1:1) manteniendo la paleta
- Pros: resuelve el riesgo de legibilidad (`gestion_usuarios.css:640-651`) sin rediseñar.
- Contras: "corregir contraste" en un tema oscuro implica cambiar valores de color — exactamente lo
  que el dueño pidió no hacer. Queda como opción futura si el dueño la pide.
- Rechazada por ahora: la instrucción fue explícita.

## Consecuencias

- La auditoría UI del superadmin se cierra sin cambios de color; los ítems diferidos están
  registrados para una decisión futura.
- DESIGN.md debería documentar esta excepción en sus Named Rules ("si aparecen, se documentan
  aquí"). **Pendiente de aplicar.**
- Cualquier futuro trabajo de diseño sobre superadmin debe respetar esta ADR; para cambiarla, crear
  una ADR nueva que la superseda (regla: las ADRs no se borran).
