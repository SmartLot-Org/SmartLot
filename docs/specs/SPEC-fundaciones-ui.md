# Spec: Fundaciones de la UI de paneles (Fase 1 de la auditoría)

> Estado: Borrador
> Módulo: `fundaciones-ui`
> Última actualización: 2026-11-17

## Objetivo

Darles a los paneles de los cinco roles una base común: escalas de espaciado, tipografía, radio y sombra; un contenedor y una cabecera de página; una sola barra superior y una sola navegación por rol; y los componentes básicos (botón, campo, tarjeta, badge, tabla). Hoy cada vista inventa sus valores y depende del orden en que se cargó el CSS (`docs/auditoria-ui-paneles.md`, causas 2.1 a 2.6).

Destinatarios: las personas que usan los paneles todos los días (empleados, garagistas, admins de empresa, dueños de garage y superadmin) y quien mantiene el código.

Éxito en una frase: cualquier pantalla de panel se arma con las mismas piezas y se ve igual entres por donde entres.

**Criterios de aceptación:**

- [ ] Las escalas viven en `@theme` de `src/index.css` y en el frontmatter de `DESIGN.md`, con los mismos valores, definidas en px.
- [ ] Una utilidad de Tailwind de espaciado o de texto mide lo mismo con la raíz de 18 px y con la de 16 px (por ejemplo, `p-4` mide 16 px en los dos casos).
- [ ] `#root` ya no centra el texto y el `h1` global ya no fuerza `letter-spacing: -1.68px`; ninguna vista queda con texto centrado por herencia.
- [ ] Existen `PageShell`, `PageHeader`, `AppHeader`, `AppNav`, `Button`, `Field`, `Card`, `Badge` y `DataTable` en `src/components/ui/`, con un solo archivo de estilos o utilidades cada uno.
- [ ] La navegación muestra todas las secciones de cada rol: barra lateral desde 1024 px y barra inferior opaca en celular, con etiquetas de 11 px o más. Reemplaza a las cuatro barras flotantes actuales.
- [ ] La barra superior tiene la misma altura en todas las pantallas de un rol y el logo no se sale de su caja.
- [ ] Las vistas piloto (dashboard del empleado y dashboard del garagista) usan las piezas nuevas y se ven igual entrando directo por URL o navegando desde otra vista.
- [ ] El CSS de paneles ya no declara familias que no se cargan (`-apple-system`/Roboto, Inter, Poppins, monoespaciada en rótulos).
- [ ] En superadmin no cambia ningún color (ADR-007): sus piezas usan la paleta propia del panel.
- [ ] `npm test` pasa, el lint de lo tocado no suma errores y `npm run build` pasa.

## Supuestos

1. La raíz tipográfica queda en 18 px en escritorio y 16 px hasta 1024 px (decisión del 2026-11-16). Por eso las escalas se definen en px y no en rem.
2. Los colores no cambian: se usan los tokens que ya existen. Esta fase ordena tamaño, espacio, forma y estructura.
3. La Fase 1 construye las piezas, cambia la barra superior y la navegación de todos los roles (son globales) y migra dos vistas piloto. Las demás vistas se migran en la Fase 2.
4. No hacen falta dependencias nuevas: Tailwind v4 ya está instalado y Vite soporta CSS Modules sin configuración.
5. Las rutas y los permisos por rol no cambian. La navegación solo agrega enlaces a rutas que ya existen para ese rol en `src/App.jsx`.

## Propuesta técnica

### Escalas (valores a confirmar en "Preguntas abiertas")

| Escala | Valores | Nota |
|---|---|---|
| Espaciado | 4, 8, 12, 16, 24, 32, 48, 64 px | Base `--spacing: 4px` en `@theme`. Hoy Tailwind usa rem: con la raíz de 18 px, `p-4` mide 18 px y `px-6`, 27 px. |
| Texto de producto | 12, 13, 14, 16, 20, 24, 30 px | Variables `--text-*` en px, con su interlineado. |
| Títulos de página | 24 px (celular) y 30 px (escritorio) | Tracking en `em`, proporcional al tamaño. |
| Radio | Según la pregunta 2 | `DESIGN.md` dice 6, 10, 14 y full; en el código dominan 12, 16, 18 y 24. |
| Sombra | sm, md, lg, accent | Las cuatro de `DESIGN.md`. Hoy hay 194 valores distintos. |
| Alturas de control | 32, 40, 48 px | 32 solo dentro de tablas y barras de filtros. |
| Capas | Las de `src/helpers/zIndex.js` | Se suman `NAV` y `DROPDOWN`; nada fuera de esa tabla. |
| Breakpoints | 640, 768, 1024, 1280 | Los de Tailwind. Hoy hay 27. |

**Consecuencia del espaciado en px:** las páginas públicas que usan utilidades de Tailwind (login, registro, `/para-garages`) se achican un poco en escritorio, porque hoy sus medidas salen de una raíz de 18 px (`px-6` pasa de 27 a 24 px). Se verifican con capturas antes y después y se corrige lo que se rompa.

### Contenedor y cabecera de página

- `PageShell` con tres anchos: formulario (640 px), lectura (960 px) y datos (1280 px). Padding lateral fijo por breakpoint: 16 px en celular, 24 en tableta y 32 en escritorio. Reemplaza a `.envoltorio-contenido` (`padding: 40px 4%`, sin ancho máximo).
- `PageHeader` con cinco ranuras: volver, rótulo opcional, título (`h1`), descripción y acciones. La acción principal va siempre a la derecha del título en escritorio y debajo en celular.

### Barra superior y navegación

- `AppHeader`: una sola implementación configurada por rol. Alto fijo de 64 px; el logo es una imagen dentro de su caja, sin márgenes negativos.
- `AppNav`: lee la configuración de `src/helpers/navegacion.js`, una lista pura por rol (etiqueta, ruta, ícono de `lucide-react`). Desde 1024 px es una barra lateral fija de 240 px con todas las secciones; en celular, una barra inferior opaca con hasta cinco destinos y un "Más" para el resto.
- Destinos que hoy faltan y entran: Sedes, Control de acceso y Reportes en admin; Garages, Reservas, Caché, Pagos de prueba y Plantillas en superadmin.
- Superadmin usa las mismas piezas con su paleta propia, pasada como variante (`tema="superadmin"`) que toma los colores que el panel ya usa.

### Estrategia de estilos

Propuesta: las piezas nuevas se escriben con utilidades de Tailwind sobre los tokens de `@theme`, como pide `AGENTS.md`. Para lo que no entra cómodo en utilidades (estados complejos, animaciones), un CSS Module junto al componente. El CSS global por vista se va retirando en la Fase 2, vista por vista; mientras tanto, ninguna pieza nueva usa nombres de clase globales.

Se registra en un ADR nuevo (ADR-009) cuando esta spec se apruebe, porque cambia la arquitectura de estilos y es costoso de revertir.

### Limpieza global

- Quitar `text-align: center` de `#root` (`src/index.css:125`). Antes, inventariar con el arnés de capturas qué vistas centran a propósito y declararlo en esas vistas.
- Reemplazar los estilos globales de `h1` y `h2` (`src/index.css:184-208`) por las clases de título de producto.
- Quitar las familias que no se cargan del CSS de paneles.
- El panel de notificaciones y la navegación pierden el vidrio: fondo opaco, como pide `DESIGN.md` para los paneles.

## Comandos

```bash
npm run dev
npm test
npx eslint src/components/ui src/helpers/navegacion.js <archivos tocados>
npm run build
npm run preview
```

## Estructura del proyecto

- `src/components/ui/` → `PageShell.jsx`, `PageHeader.jsx`, `AppHeader.jsx`, `AppNav.jsx`, `Button.jsx`, `Field.jsx`, `Card.jsx`, `Badge.jsx`, `DataTable.jsx` (y su `.module.css` si hace falta).
- `src/helpers/navegacion.js` → secciones por rol, con `navegacion.test.js` al lado.
- `src/index.css` → escalas en `@theme`, sin `text-align` en `#root` ni tracking fijo en `h1`.
- `src/helpers/zIndex.js` → capas nuevas.
- `src/vistasEmpleados/empleados_dashboard.jsx` y `src/vistasGaragista/garagista_dashboard.jsx` → vistas piloto.
- Se retiran `componentesAdmin/footer_admin.*`, `componentesEmpleado/footer_empleado.*`, `componentesSuperadmin/footer_superadmin.*` y `componentesDueñoGarage/footer_dueño_garage.*` (con sus botones auxiliares) cuando `AppNav` las reemplace.

## Estilo de código

```jsx
// Vista piloto: la página se arma con las piezas comunes y no trae CSS global propio.
export default function EmpleadosDashboard() {
  return (
    <PageShell ancho="lectura">
      <PageHeader
        titulo="Mis reservas"
        descripcion="Tus próximas reservas y las que están en curso."
        acciones={<Button variante="primario" to="/nueva_reserva">Nueva reserva</Button>}
      />
      {/* contenido */}
    </PageShell>
  );
}
```

```js
// helpers/navegacion.js — datos puros, probables sin navegador
export const NAVEGACION = {
  [ROLE_NAMES.ADMIN]: [
    { etiqueta: 'Inicio', ruta: '/admin_dashboard', icono: 'House' },
    { etiqueta: 'Sedes', ruta: '/gestion_sedes', icono: 'Building2' },
    // …
  ],
};
```

## Estrategia de pruebas

- `node:test`, junto a la fuente.
- `navegacion.test.js`: cada rol tiene destinos; cada ruta existe en `src/App.jsx` y está permitida para ese rol en su `ProtectedRoute`; no hay rutas repetidas.
- `fundaciones.source.test.js`: `#root` sin `text-align`; `h1` global sin `letter-spacing` fijo; `--spacing` y `--text-*` definidos en px; ningún CSS de paneles declara Inter, Poppins o `-apple-system`; las vistas piloto no importan CSS global propio.
- Verificación en navegador con el arnés de la auditoría (datos simulados por rol): las 40 vistas en 390 y 1440 px, antes y después. Se mide la cantidad de bordes izquierdos de contenido y de tamaños de título, que deberían bajar de 16 y 18 a 3 y 2.
- En las vistas piloto, entrada directa por URL y navegando desde otra vista: mismas medidas.

## Límites

- **Siempre:** tokens de `DESIGN.md`; actualizar `DESIGN.md` y `src/index.css` juntos; actualizar `docs/architecture.md` cuando cambie la estructura de estilos.
- **Preguntar antes de:** cualquier dependencia nueva; cambiar rutas o permisos; cualquier diferencia entre `DESIGN.md` y el código que no esté resuelta en esta spec.
- **Nunca:** cambiar colores en `src/vistasSuperadmin/**` ni `src/componentesSuperadmin/**` (ADR-007); tocar el cliente HTTP o la caché; borrar ADRs.

## Fuera de alcance

- La migración del resto de las vistas (Fase 2), la jerarquía de cada pantalla (Fase 3) y el copy (Fase 4).
- La landing (`/`), que ya tiene su propio sistema (ADR-008). Login, registro y `/para-garages` solo se tocan si el cambio de escala los rompe.
- Cambios de color.

## Preguntas abiertas

Son las diferencias entre `DESIGN.md` y el código que la auditoría dejó para decidir (sección 4). Cada una tiene una recomendación.

- [ ] **Fuente de los títulos de panel:** `DESIGN.md` dice DM Sans; el código usa Archivo por la regla global. Recomendación: DM Sans 600 en paneles y Archivo solo en las páginas públicas, para separar los dos registros.
- [ ] **Escala de radios:** mantener la de `DESIGN.md` (6, 10, 14, full) o adoptar la que domina en el código (8, 12, 16, full). Recomendación: la de `DESIGN.md`; es la que ya usan los componentes documentados.
- [ ] **Título de producto:** `DESIGN.md` dice 56 px; el código va de 24 a 54. Recomendación: corregir el documento a 24 y 30 px.
- [ ] **Padding de tarjeta:** `DESIGN.md` dice 16 px; el código va de 14 a 40. Recomendación: 16 y 24.
- [ ] **Alturas de botón:** `DESIGN.md` dice 40 y 48; el código va de 20 a 60. Recomendación: sumar 32 solo para tablas y filtros.
- [ ] **Estrategia de estilos:** utilidades de Tailwind con CSS Modules para lo complejo (recomendado, sigue a `AGENTS.md`) o solo CSS Modules.
- [ ] **Escala de Tailwind en px:** acepta que login, registro y `/para-garages` se achiquen un poco en escritorio al fijar `--spacing: 4px`.
