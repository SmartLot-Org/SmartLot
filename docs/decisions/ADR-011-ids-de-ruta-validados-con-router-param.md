# ADR-011: Los `:id` de ruta se validan una vez con `router.param`

## Estado

Aceptado.

## Fecha

2026-10-25.

## Contexto

Informe docente 2.3 (MEDIO): validación de `:id` inconsistente. El backend tenía ~60 variantes: `parseInt(req.params.id)` (42 usos), `Number()` (4), `isValidId` (13) y `parseId` locales (3). `parseInt` trunca: `GET /api/marca/7abc` pedía la marca 7, y `/api/marca/1.5` la 1. Tampoco acotaba el rango: un entero seguro pero fuera de `integer` llegaba a Postgres y fallaba con un error de driver.

## Decisión

Agregar a `helpers/validatorHelper.js`:

- `parseIdParam(valor, nombre = 'ID')`: devuelve un `Number` o lanza **400** (`El ID proporcionado no es válido.`). Rechaza `7abc`, `0`, `-1`, `1.5`, `1e3` y enteros no seguros.
- `idParam(nombre)`: callback para `router.param` que deja `req.params[nombre]` ya validado y numérico.

Cada router registra una línea (`router.param('id', idParam())`; `:id_garage`, `:id_usuario` y `:id_empresa` con su nombre en el mensaje). Los handlers leen `req.params.id` como número. No aplica a `:paymentId` (id de Mercado Pago, validación propia) ni a parámetros de texto (`:codigo`, `:dia`).

Un entero válido pero fuera del rango de la columna se resuelve en `errorHandler` (`22003` → 400, ADR-008).

## Alternativas consideradas

### Un middleware `validateId` en cada ruta
- Pros: explícito en cada línea.
- Contras: ~70 repeticiones y fácil de olvidar en una ruta nueva.
- Rechazada: `router.param` corre por nombre de parámetro y cubre rutas futuras.

### Validar con una librería de esquemas (Zod, Joi)
- Pros: validación declarativa también para el cuerpo.
- Contras: dependencia nueva (AGENTS.md exige consultar) para un problema que resuelve una función de tres líneas.
- Rechazada para este plan.

### Seguir con `parseInt` más una comprobación de `NaN`
- Pros: cambio mínimo.
- Contras: `parseInt('7abc')` es 7, que es el defecto que se quiere corregir.
- Rechazada.

## Consecuencias

- `router.param` corre **antes** del middleware de rol de la ruta: un id inválido responde 400 incluso a un rol sin permiso. No filtra información.
- En routers con autenticación por ruta (usuario, solicitud-registro) un id inválido sin sesión responde 400 antes que 401; no revela datos.
- Un parámetro de ruta con id numérico nuevo se registra en una línea; olvidarlo vuelve a dejar `req.params.id` como string.
- Los ids del cuerpo y del query siguen validándose en el controller con `isValidId`.
