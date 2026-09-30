# Estados vacíos con botón de acción

Documentación de todas las pantallas modificadas para que todo contenedor vacío muestre un
estado vacío claro con un botón que permita llenar/completar esa sección.

Componente compartido: `src/componentesCompartidos/EmptyState.jsx` (+ `EmptyState.css`).

---

## Cómo probar los estados vacíos

1. Levantar la API y el frontend (`npm run dev`).
2. Iniciar sesión con el rol correspondiente a cada pantalla.
3. Para estados **sin datos**: usar un entorno/empresa/sede sin registros (por ejemplo, una
   empresa recién creada, una sede sin garages, un empleado sin reservas).
4. Para estados **filtrados**: escribir una búsqueda inexistente o combinar filtros que no
   devuelvan resultados.
5. El botón del estado vacío ejecuta la acción indicada (navegar o abrir un flujo).

---

## Empleado

| Pantalla (ruta) | Dónde aparece | Cómo verlo | Botón | Redirección / acción |
|---|---|---|---|---|
| `/empleados_dashboard` | "Mis Reservas Actuales" | Empleado sin reservas activas | **Reservar ahora** | `/nueva_reserva` |
| `/empleados_dashboard` | Sección "Mis Vehículos" | Empleado sin vehículos registrados | **Agregar vehículo** | `/agregar_vehiculo` |
| `/historial_reserva` | "Última reserva" | Empleado sin reservas en el historial | **Hacer una reserva** | `/nueva_reserva` |
| `/nueva_reserva` | Select de vehículo del formulario | Empleado sin vehículos cargados | **Agregar vehículo** | `/agregar_vehiculo` |

> Nota: en `/empleados_dashboard`, cuando no hay reservas activas el botón fijo "Nueva reserva"
> ya no se muestra aparte: la acción queda dentro del estado vacío.

### Excepción acordada

| Pantalla (ruta) | Dónde aparece | Comportamiento |
|---|---|---|
| `/nueva_reserva` | "No hay garages disponibles para tu sede" | Se mantiene como aviso informativo, **sin botón** (a pedido). |

---

## Admin de empresa / sede

| Pantalla (ruta) | Dónde aparece | Cómo verlo | Botón | Redirección / acción |
|---|---|---|---|---|
| `/gestion_garages` | Tab "Contratados" | Sin tratos contratados para la sede seleccionada | **Buscar garages** | Cambia al tab "Buscar" |
| `/gestion_garages` | Tab "Pendientes" | Sin solicitudes pendientes | **Buscar garages** | Cambia al tab "Buscar" |
| `/gestion_garages` | Resultados de búsqueda | Búsqueda sin resultados | **Limpiar filtros** | Resetea búsqueda, radio y checkboxes |
| `/gestion_garages` | Tab "Buscar" sin sede | No hay sede elegida | — | Aviso (la sede se elige en la barra superior) |
| `/gestion_de_empleados` | Grilla de personal | Sin empleados cargados (sin filtros) | **Agregar empleado** | `/agregar_empleado` |
| `/gestion_de_empleados` | Grilla de personal | Búsqueda o filtro de sede sin resultados | **Restablecer filtros** | Limpia búsqueda y sede |
| `/gestion_de_empleados` | Modal "Empleados Archivados" | Sin archivados | — | Informativo |
| `/gestion_de_empleados` | Modal "Empleados Archivados" | Búsqueda sin resultados | **Limpiar búsqueda** | Limpia el término |
| `/gestion_sedes` | Grilla de sedes | Empresa sin sedes | **Crear primera sede** | `/agregar_sede` |
| `/agregar_garage_propio` | Bloque "No hay sedes" | Empresa sin sedes | **Crear sede** | `/agregar_sede` |
| `/agregar_garage_propio` | Bloque "No pudimos cargar tu sede" | **Admin de una sede específica** | — | Solo mensaje informativo: no hay placeholder ni botón de agregar sede |
| `/editar_zona` | "Garajistas Asignados" | Garage sin garajistas | **Gestionar personal** | `/gestion_de_empleados` |
| `/admin_pagos` | Consumos por garage/sede | Filtros sin resultados | **Limpiar filtros** | Resetea búsqueda, sede y período |
| `/admin_panel_de_control` | Tabla de reservas | Sin reservas en el sistema | — | Informativo |
| `/admin_panel_de_control` | Tabla de reservas | Búsqueda sin resultados | **Limpiar búsqueda** | Limpia búsqueda y chip |
| `/admin_panel_de_control` | Conflictos → Papelera | Papelera vacía | **Volver a conflictos** | Cambia al tab de conflictos |
| `/admin_panel_de_control` | Conflictos | Sin conflictos reportados | — | Informativo (estado sano) |
| `/admin_panel_de_control` | Conflictos | Búsqueda sin resultados | **Limpiar búsqueda** | Limpia el término |

---

## Dueño de garage

| Pantalla (ruta) | Dónde aparece | Cómo verlo | Botón | Redirección / acción |
|---|---|---|---|---|
| `/duenio-garage/dashboard` | Tab "Activos" | Dueño sin garages activos | **Crear primer garage** | `/duenio-garage/crear-garage` |
| `/duenio-garage/dashboard` | Tab "Borrador" | Sin garages en borrador | **Ver garages activos** | Cambia al tab "Activos" |
| `/duenio-garage/tratos` | Solicitudes pendientes | Sin solicitudes de empresas | — | Informativo |
| `/duenio-garage/tratos` | Solicitudes de cambio | Sin solicitudes de modificación | — | Informativo |
| `/duenio-garage/tratos` | Tratos vigentes | Sin acuerdos activos | **Ver mis garages** | `/duenio-garage/dashboard` |
| `/duenio-garage/cuentas-por-cobrar` | Consumos | Filtros sin resultados | **Limpiar filtros** | Resetea búsqueda y garage |

---

## Garagista

| Pantalla (ruta) | Dónde aparece | Cómo verlo | Botón | Redirección / acción |
|---|---|---|---|---|
| `/garagista_dashboard` | "Reservas próximas" | Sin ingresos pendientes | **Escanear QR** | Abre el lector QR para registrar ingreso |
| `/garagista_dashboard` | "Autos dentro" | Búsqueda sin resultados | **Limpiar filtro** | Limpia el término de búsqueda |
| `/garagista_dashboard` | "Autos dentro" | Sin vehículos dentro (sin filtro) | — | Informativo |
| `/garagista_dashboard` | "Últimos movimientos" | Sin movimientos finalizados | — | Informativo (historial) |
| `/garagista_dashboard` | Sin garages para consultar | Admin sin garages | **Gestionar garages** | `/gestion_garages` |
| `/garagista_dashboard` | Sin garage asignado | Garagista sin asignación | — | Informativo: contactar al superadmin |

---

## Superadmin

| Pantalla (ruta) | Dónde aparece | Cómo verlo | Botón | Redirección / acción |
|---|---|---|---|---|
| `/superadmin/gestion_usuarios` | Grilla de usuarios | Sin usuarios en la categoría | **Agregar usuario** | `/superadmin/agregar_usuario` |
| `/superadmin/gestion_usuarios` | Grilla de usuarios | Filtros/búsqueda sin resultados | **Restablecer filtros** | Limpia búsqueda, empresa, sede y garage |
| `/superadmin/gestion_usuarios` | Modal "Usuarios Archivados" | Sin archivados | — | Informativo |
| `/superadmin/gestion_usuarios` | Modal "Usuarios Archivados" | Búsqueda sin resultados | **Limpiar búsqueda** | Limpia el término |
| `/superadmin/gestion_usuarios` | Modal "Solicitudes de registro" | Sin solicitudes pendientes | — | Informativo |
| `/superadmin/gestion_usuarios` | Modal "Solicitudes de registro" | Búsqueda sin resultados | **Limpiar búsqueda** | Limpia el término |
| `/superadmin/gestion_empresas` | Listado de empresas | Sin empresas registradas | **Agregar empresa** | `/superadmin/agregar_empresa` |
| `/superadmin/gestion_empresas` | Sedes dentro de una empresa | Empresa sin sedes | **Agregar sede** | `/superadmin/agregar_sede` (precarga la empresa) |
| `/superadmin/gestion_garages` | Grilla de garages | Filtro por empresa sin resultados | **Ver todos** | Limpia el filtro de empresa |
| `/superadmin/gestion_garages` | Grilla de garages | Sin garages registrados | **Crear garage** | `/agregar_zona` |
| `/superadmin/cache` | Entradas de caché | Caché vacía | **Actualizar caché** | Descarga datos y repuebla la caché |
| `/superadmin/email-templates` | Listado de plantillas | Sin plantillas | — | Informativo |
| `/superadmin/email-templates` | Variables de ejemplo | Sin variables declaradas | **Agregar variable** | Agrega una fila de variable |
| `/superadmin/pagos-test` | Resultados de búsqueda | Búsqueda sin resultados | **Limpiar filtros** | Limpia filtros de búsqueda |
| `/superadmin/pagos-test` | Eventos | Sin eventos de webhook | — | Informativo |
| `/superadmin/reservas` | Tabla de reservas | Filtros sin resultados | **Limpiar filtros** | Limpia los filtros aplicados |
| `/superadmin/reservas` | Tabla de reservas | Sin reservas en el sistema | — | Informativo |
| `/superadmin/conflictos` | Papelera | Papelera vacía | **Volver a conflictos** | Cambia al tab de conflictos |
| `/superadmin/conflictos` | Conflictos enviados | Sin conflictos | — | Informativo |
| `/superadmin/conflictos` | Conflictos enviados | Búsqueda sin resultados | **Limpiar búsqueda** | Limpia el término |

---

## Componentes compartidos y páginas globales

| Pantalla / componente | Dónde aparece | Cómo verlo | Botón | Redirección / acción |
|---|---|---|---|---|
| Campana de notificaciones | Dropdown de notificaciones | Usuario sin notificaciones | — | Informativo |
| Panel de auditoría | Sección de auditoría | Sin movimientos registrados | — | Informativo |
| `/payment/success`, `/payment/failure`, `/payment/pending` | "Aún no hay pago para verificar" | Entrar sin `payment_id` ni `external_reference` | **Volver al inicio** | `/` |

---

## Estados que quedaron sin botón (a propósito)

- Notificaciones y auditoría: son pasivos, no hay acción del usuario que los genere.
- Papelera y buzones vacíos de solicitudes (tratos, usuarios, empresas): la información llega
  desde terceros; no existe una acción directa para "llenarlos".
- "No hay conflictos reportados" en el panel de control: es un estado sano, no requiere acción.
- Movimientos finalizados del garagista: es historial.
- `/nueva_reserva` sin garages en la sede: aviso informativo, sin botón.
