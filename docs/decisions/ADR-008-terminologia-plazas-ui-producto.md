# ADR-008: Terminología "plazas" en la UI de producto (excepción deliberada de copy)

## Estado

Aceptado.

## Fecha

2026-10-12.

## Contexto

`PRODUCT.md` define **Plaza** como término canónico del glosario, pero la UI del producto seguía
usando "cocheras" en la prosa visible de los flujos de tratos y garages (p. ej. "Empresas →
solicitan cocheras → tus garages" en `/duenio-garage/tratos`, "Solicitudes de cambio de cocheras"
en `GestionTratosGarage.jsx`, KPI "Cocheras contratadas" en `/gestion_garages`). El mismo
`PRODUCT.md` conserva "cocheras" en su prosa de resumen (voz coloquial rioplatense), y el copy de
marketing del landing usa "cocheras" como lenguaje natural del usuario.

La auditoría UI registró la unificación como tarea **P3.2** con decisión explícita del dueño:
unificar "cocheras" → "plazas" **solo en la UI de producto** (paneles de app), sin tocar
`PRODUCT.md` ni la prosa de marketing.

## Decisión

1. **La UI de producto usa "plaza(s)"** para nombrar las unidades de estacionamiento en todo copy
   visible: paneles admin/dueño/superadmin, componentes compartidos de flujos internos y mensajes
   de validación que se muestran al usuario (`helpers/tratos.js`).
2. **Los nombres de campo/props de la API NO cambian**: `cantidad_cocheras`, `cocheras_disponibles`
   siguen siendo el contrato con `SmartLot_API`. Solo cambia el copy visible.
3. **Queda fuera de scope (intencional):** el copy de marketing del landing (`componentesLanding/paraGarages/**`),
   los textos de registro (`Register*`) y la prosa de `PRODUCT.md`/docs. Ahí "cochera" es voz
   natural del usuario y no se unifica.
4. La variable interna `cocherasComprometidas` (identificador JS) tampoco se renombra: no es copy.

## Alternativas consideradas

### Unificación total (UI + PRODUCT.md + landing)
- Pros: un solo término en todo el producto y su documentación.
- Contras: requiere tocar documentación funcional protegida (`PRODUCT.md` es fuente de reglas de
  negocio) y cambia el tono de marketing que el dueño eligió para la captación.
- Rechazada: el dueño eligió explícitamente la opción "solo UI de producto" (2026-10-12).

### No unificar (dejar "cocheras" en la UI)
- Pros: cero cambios.
- Contras: la UI contradice el glosario canónico de `PRODUCT.md`; inconsistencia entre paneles.
- Rechazada: la UI de producto debe hablar con los términos del glosario.

## Consecuencias

- La UI de producto es consistente con el glosario de `PRODUCT.md` ("Plaza") sin reescribir su prosa.
- El landing/registro mantiene "cochera" (voz coloquial); si en el futuro se unifica, es un cambio
  de copy acotado a `componentesLanding/` y `Register*`.
- Cualquier copy nuevo de UI de producto debe usar "plaza"; los campos de API siguen con
  `cochera*` (no renombrar sin coordinación con `SmartLot_API`).
- Verificación de cierre (2026-10-12): 8 instancias restantes de "cochera" en `src/` son todas
  landing/registro o identificadores, documentadas como intencionales en
  `docs/audit-ui/cambios-realizados.md` §8.
