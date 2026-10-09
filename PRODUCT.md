# PRODUCT.md — SmartLot

Contexto de producto para personas y agentes: qué es SmartLot, para quién, qué reglas de negocio respeta y con qué voz se comunica. Es el documento que hay que leer **antes** de escribir UI, copy o features nuevas.

Última revisión: 2026-10-09. Fuentes: landing pública (`src/componentesLanding/`), paneles por rol (`src/vistas*/`), documentación funcional (`docs/`) y el código en `src/`. Si algo no está acá ni en el código, **preguntar, no inventar**.

## Resumen

SmartLot es una plataforma web de gestión de estacionamientos que conecta **empresas que necesitan cocheras para su personal** con **garages que tienen plazas disponibles**. Las empresas solicitan lugar para sus equipos, los dueños de garages aceptan o rechazan tratos, y todo el ciclo —reservas, pagos, control de acceso por QR y consumos— queda registrado en un panel.

Frase canónica (landing): *"Publicás tu garage, las empresas piden lugar para su gente y vos manejás tratos, ocupación y consumos. Sin hardware, sin planillas."*

Tagline del hero: **Gestioná. Optimizá. Escalá.**

## Problema que resuelve

Del lado del garage (fuente: `ParaGaragesPains.jsx`):

- Cocheras vacías que no generan ingresos mientras las empresas de la zona no encuentran dónde estacionar.
- Acuerdos de palabra por WhatsApp o papel: cantidades, precios y cambios que no quedan registrados.
- Falta de visibilidad: no se sabe cuánto se usó cada garage ni cuánto generó cada empresa.
- Cobros y reportes manuales en planillas, sin detalle por reserva.

Del lado de la empresa:

- Empleados sin lugar asegurado y reservas gestionadas de forma informal.
- Consumos difíciles de auditar y liquidar por sede o período.

## Propuesta de valor

- **Sin hardware, 100% online**: el control de acceso es con QR desde el celular; no se instalan molinetes ni lectores.
- **Tratos trazables**: cada acuerdo empresa↔garage queda registrado con aprobación explícita.
- **Operación en un solo panel**: reservas, ocupación, accesos y consumos por sede y garage.
- **Transparencia de cobro**: detalle reserva por reserva y exportación en PDF y Excel (ARS).
- **Control del dueño**: nada se activa sin su confirmación; un garage en borrador no es visible para las empresas.

## Audiencias

| Actor | Rol técnico | Qué necesita | Superficie |
|---|---|---|---|
| Empresa (admin de empresa/sede) | `admin` (1) | Gestionar personal y reservas, contratar garages, auditar consumos y pagos | `/admin_dashboard`, `/gestion_*`, `/admin_pagos` |
| Empleado | `empleado` (2) | Reservar lugar, cargar vehículos, ver historial | `/empleados_dashboard`, `/nueva_reserva` |
| Garagista | `garagista` (3) | Operar el ingreso/egreso con QR y ver movimientos | `/garagista_dashboard`, `/control-acceso` |
| Dueño de garage | `dueño_garage` (5) | Publicar garages, aceptar tratos, cobrar consumos | `/duenio-garage/*` |
| Superadmin | `superadmin` (4) | Administrar empresas, usuarios, conflictos y herramientas internas | `/superadmin/*` |
| Visitante | — | Entender la propuesta y registrarse | `/`, `/para-garages`, `/register` |

Detalle de rutas y autorización: `docs/architecture.md`. Flujos por rol: `docs/domain-flows.md`.

## Capacidades por dominio

- **Cuentas y acceso**: registro público con aprobación, login, recupero de contraseña, sesión con refresh, impersonación de superadmin.
- **Reservas**: cotización de disponibilidad, creación, retención de pago, confirmación, historial; límite configurable de reservas activas por empleado.
- **Pagos**: Mercado Pago como procesador; retenciones con vencimiento y retorno verificado por `payment_id` / `external_reference`.
- **Control de acceso**: lectura de QR (ingreso y egreso), búsqueda manual por patente, registro de movimientos.
- **Empresas y sedes**: alta y administración; un admin de sede solo opera su sede.
- **Garages y zonas**: alta de garage propio, publicación de garages de terceros, zonas y asignación de personal.
- **Tratos y solicitudes**: empresas solicitan plazas, dueños aceptan/rechazan; cambios de cocheras con aprobación en dos pasos.
- **Consumos y cuentas corrientes**: detalle por reserva, filtros por empresa/sede/garage/período (hasta 24 meses según landing), exportación PDF/Excel.
- **Operación**: panel de control, conflictos con papelera y restauración, reportes y análisis.
- **Comunicación**: notificaciones in-app, plantillas de email, auditoría.
- **Herramientas internas**: caché inspeccionable, pagos de prueba, gestión global de reservas.

## Reglas de negocio (invariantes)

1. **Límite de reservas activas por empleado**: `NULL` = sin máximo; `0` = bloquea nuevas reservas; entero = máximo global por empleado, independiente de garage, trato o responsable de pago. Bajar el límite no cancela reservas existentes. Regla completa en `docs/reservation-limit.md`.
2. **Una reserva cuenta como activa** si no está borrada y: está pendiente de pago con retención vigente, o está confirmada sin salida y su fecha de salida es futura o el vehículo ya ingresó.
3. **Cupo, solapamiento y capacidad** los valida el backend; el frontend traduce el error a un mensaje accionable (p. ej. superposición, garage lleno, fuera de horario) — ver `src/helpers/erroresMensajes.js`.
4. **La ocupación la mueve la operación real** (reservas y accesos), no se edita a mano.
5. **Nada se activa sin confirmación del dueño**: ni un trato nuevo ni un cambio de cocheras.
6. **Garage en borrador no es visible** para las empresas; restaurarlo es reversible.
7. **Aislamiento por dueño**: cada dueño ve solo sus garages. Los admins ven según empresa/sede (`src/helpers/roles.js`).
8. **Fechas y horas de reserva en hora argentina** (`America/Argentina/Buenos_Aires`); no interpretar timestamps locales como UTC.

## Glosario

| Término | Significado |
|---|---|
| **Empresa** | Cliente que contrata plazas para su personal. |
| **Sede** | Unidad operativa de una empresa (dirección/punto). Un admin con sede solo gestiona la suya. |
| **Garage** | Estacionamiento que ofrece plazas. Publicado por su dueño. |
| **Zona** | Agrupación operativa dentro de un garage (niveles/sectores) con personal asignado. |
| **Plaza** | Lugar de estacionamiento individual. |
| **Trato** | Acuerdo empresa↔garage: plazas, modalidad y vigencia. Requiere aprobación del dueño. |
| **Solicitud** | Pedido de trato o de cambio enviado por una empresa (o por la plataforma) al garage. |
| **Reserva** | Uso de una plaza por un empleado en una fecha/horario, asociada a un vehículo. |
| **Retención de pago** | Apartado temporal de una plaza mientras el pago se completa; vence y libera la plaza. |
| **Consumo** | Uso facturable registrado por reserva (tiempo, tarifa, importe) que se liquida a la empresa. |
| **Cuenta corriente / por cobrar** | Saldo de consumos pendientes de liquidación por empresa o garage. |
| **Conflicto** | Incidencia operativa reportada; se resuelve o se envía a papelera (restaurable). |
| **Garagista** | Operador del garage que registra ingresos y egresos. |
| **Impersonación** | Uso temporal de SmartLot "como" otro usuario, exclusivo del superadmin. |

## Tono y voz

- **Idioma**: español rioplatense con **voseo** en toda la UI y la landing ("Publicás", "Gestioná", "Elegí", "Revisá"). Nunca "tú".
- **Registro**: directo, operativo, sin grandilocuencia. La landing persuade; los paneles trabajan (claridad y escaneo rápido primero).
- **Sin promesas de IA** ni claims tecnológicos no verificables (decisión ya aplicada en la landing).
- **Errores accionables**: decir qué pasó y cómo resolverlo, en español, sin jerga técnica ni mensajes crudos del backend.
- **Privacidad en el copy**: no mostrar datos sensibles (por ejemplo, patentes completas en pantallas de acceso ajeno).

## Claims de marketing vigentes

Usados en la landing; **no inventar nuevos ni alterarlos sin pedido** (regla de `docs/pendientes-audit-ui.md`):

- Landing general: satisfacción 4.9/5, tiempo de respuesta 2 min, calificación 4.8★, soporte 24/7 (`StatsTicker.jsx`).
- Para garages: 24 meses de historial, 3 tarifas por vehículo, 100% online sin hardware, exportación PDF+XLS (`ParaGarages.jsx`).
- Testimonios y casos: sección "Dueños que ya aparecen en el mapa" (`ParaGaragesSocial.jsx`).

## Alcance actual (lo que el producto NO es)

- **No requiere hardware** ni instalaciones físicas: todo el acceso se opera con QR.
- **No es una app nativa**: es una SPA web, usable desde el navegador del celular.
- **No procesa pagos propios**: delega en Mercado Pago.
- **No es un marketplace abierto de hora suelta**: el eje es empresa↔garage y empleado↔plaza; no hay evidencia de venta minorista al público general.
- **No gestiona la operación del estacionamiento general del garage** (clientes ocasionales, caja): el foco es la operación de plazas reservadas y sus accesos.
- Este repositorio es **solo frontend**; las reglas de negocio viven en el backend `SmartLot_API`.

## Superficies

- **Público / persuadir**: `/`, `/para-garages`, `/login`, `/register`, `/recuperar-clave` (ver `docs/architecture.md`).
- **Operar por rol**: paneles de empleado, garagista, admin, dueño de garage y superadmin.
- **Estados vacíos**: especificación en `docs/estados-vacios.md`.
- **Sistema visual**: `DESIGN.md` (la voz visual del producto; este documento no la reemplaza).

## Cómo mantener este documento

- Actualizar cuando cambie el alcance del producto, una regla de negocio o el tono.
- Si una decisión es arquitectónica o costosa de revertir, además crear un ADR en `docs/decisions/`.
- Si es una feature nueva, especificarla en `docs/specs/` antes de planificar (ver `AGENTS.md`).
- Mantener el glosario alineado con el copy real de la UI: si la UI cambia un término, cambiar acá también.
