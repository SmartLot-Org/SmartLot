# ADR-009: `PUT` reemplaza el recurso completo y `PATCH` actualiza parcialmente

## Estado

Aceptado.

## Fecha

2026-10-25.

## Contexto

Informe docente 2.3 (ALTO): "PUT validado como parcial que pisa columnas". Los controllers de marca, modelo, rol y empresa validaban los campos solo `if (x !== undefined)`, pero las queries hacían `UPDATE ... SET nombre = $1, descripcion = $2`. Un `PUT /api/empresa/3 {"nombre":"X"}` dejaba `descripcion` en `NULL` sin que el cliente lo pidiera; un `PUT /api/marca/5 {}` violaba `NOT NULL` y, con el repo que tragaba errores, respondía 404. `sedeRepository.updateAsync` ya había pasado a actualizar solo los campos presentes (SEG-04), pero seguía publicado como `PUT`.

El frontend ya manda cuerpos completos en estos recursos (`API_Marca/Modelo/Rol/Empresa.js`; `gestion_empresas.jsx` manda `{ nombre, descripcion }`; la edición de sede envía el objeto completo).

## Decisión

- **`PUT` = reemplazo completo.** Se exigen los campos obligatorios del recurso; faltar uno es **400**. Nunca un `UPDATE` que convierta omisiones en `NULL`.
- **`PATCH` = parcial.** Solo cambia lo presente; al menos un campo es obligatorio (si no, 400).
- Aplicado a: `marca` (`nombre`), `modelo` (`nombre`, `id_marca`), `rol` (`tipo_rol`), `empresa` (`nombre` + `descripcion` explícita: texto o `null`), `sede` (`nombre` + `ubicacion` explícita: texto o `null`) y se agrega `PATCH /api/sede/:id`.
- Para `sede` el `PUT` **conserva** `id_empresa`, `descripcion` y coordenadas si no se envían: tienen efecto de tenant (SEG-04) y de mapa, y omitirlos no debe borrarlos.
- Los demás `PUT` que hoy aceptan campos parciales (`garage`, `vehiculo`, `usuario`, `reserva`, `conflicto`, `trato-empresa-garage`) quedan como **deuda documentada**, sin migrar.

## Alternativas consideradas

### Dejar `PUT` parcial y documentarlo
- Pros: cero cambios.
- Contras: contradice la semántica HTTP y el concepto que el docente pidió repasar (PUT vs PATCH).
- Rechazada.

### Reemplazar `PUT` por `PATCH` en todos los recursos
- Pros: semántica limpia.
- Contras: rompe al frontend y a cualquier cliente; obliga a tocar decenas de servicios.
- Rechazada para este plan: se agrega `PATCH` solo donde ya había una actualización parcial real (sede).

### Hacer que `PUT` ponga `NULL` en todo lo omitido, también en `sede`
- Pros: reemplazo "puro".
- Contras: borraría `id_empresa` (efecto de tenant) y coordenadas ante un cliente descuidado.
- Rechazada para `sede`.

## Consecuencias

- Un cliente que enviaba `PUT` parcial a marca, modelo, rol, empresa o sede ahora recibe 400; el frontend actual no lo hace.
- Las queries de esos cuatro recursos quedan sin cambios porque siempre reciben el cuerpo completo.
- Hay una excepción visible y documentada (`PUT /api/sede` conserva lo no enviado); si se quiere pureza total, requiere un ADR nuevo que reemplace a este.
- Migrar los `PUT` parciales restantes a `PATCH` es trabajo futuro que debe coordinarse con el frontend.
