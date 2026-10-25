Devolucion-Alumno

Devolución — SmartLot-Org / SmartLot

Fecha: 2026-10-16

Alcance revisado: completo (backend, frontend y base de datos)

Actualizada: 2026-10-16, tras la re-entrega del esquema de la base (solo cambia lo referido a base

de datos)

Esta devolución es una guía de crecimiento: marca fortalezas y conceptos a repasar. Para cada
punto damos un ejemplo concreto que sir va de faro, no la lista completa de todos los casos.
La idea es que, viendo el ejemplo, salgan a buscar los demás ustedes mismos y entiendan el
patrón, en lugar de recibir la corrección hecha. En la defensa oral se les va a pedir explicar
cualquier parte del proyecto con sus palabras.

Antes que nada: SmartLot es un proyecto muy ambicioso. Tiene varias empresas que comparten la
plataforma, cinco roles, reservas con QR y retención de pago, cobro real con Mercado Pago, cuentas
corrientes entre empresas y garages, e impersonación. Pocos grupos se animan a tanto. Por eso mismo, lo
que sigue no habla de "qué falta construir". Habla de coherencia: que todas las partes de un sistema
grande sigan las mismas reglas.

Lo que está bien logrado

La seguridad de base está muy bien resuelta. Las consultas a la base están parametrizadas en
todo el backend, las contraseñas se guardan con hash, la sesión viaja en cookies que el JavaScript del
navegador no puede leer, el token de acceso dura poco y se renueva de forma controlada, y en cada
request se vuelve a leer de la base el rol del usuario. Son decisiones de nivel profesional.
Las capas del backend existen y se respetan en los módulos CRUD. Marcas, modelos, roles,
sedes y vehículos siguen el camino controller → service → repository, con un manejo de errores
centralizado que aprovecha bien Express 5. Entendieron el porqué de las capas, y eso se nota.
La base de datos tiene reglas de negocio de verdad. Las restricciones de la tabla de reservas

(qué combinaciones de modalidad, cupo y responsable de pago son válidas), los índices únicos que

conviven con el borrado lógico y la tabla de consumos pensada como "foto" inmutable del precio
muestran que pensaron el dominio, no solo las tablas.

La infraestructura del frontend es sólida. Hay un único cliente HTTP que renueva la sesión sin

que la vista se entere, una caché que evita pedir dos veces lo mismo, carga diferida por pantalla y la

dirección del backend configurada por entorno, sin estar escrita en ningún componente.

Hay piezas reutilizables bien diseñadas y lógica de dominio con tests reales. El componente

de "estado vacío" se usa en todo el proyecto. Los formularios de zona, capacidad y precios se

comparten entre varias pantallas. Las reglas como el límite de reservas activas o el formato de

precios viven en funciones puras con tests que verifican comportamiento. El límite de reservas, en

particular, está resuelto de manual: lo decide el servidor y el frontend solo traduce el mensaje.

Hubo poda consciente. Hay un commit dedicado a borrar vistas y componentes sin uso, y un bug
de orden de rutas que no solo arreglaron sino que dejaron explicado en un comentario. Ese es
exactamente el hábito que buscamos.

Conceptos a repasar y preguntas para hacerse

1. Autenticación no es autorización

Qué obser vamos: el backend sabe muy bien quién sos (la autenticación está excelente). Pero en

varios lugares no pregunta si eso que querés tocar es tuyo o si tu rol puede hacerlo. En algunos

módulos el chequeo de "pertenece a mi empresa" está hecho con mucho cuidado, y en el método de

al lado, que opera sobre el mismo recurso, falta.

Ejemplo concreto (un faro, no la lista completa): miren la ruta de reembolso de un pago en el

controller de pagos y comparen con las rutas de editar o borrar un garage del controller de

garages. Las de garage, antes de actuar, verifican que quien pide tenga control sobre ese garage. La

de reembolso solo exige haber iniciado sesión, y en SmartLot cualquiera puede registrarse.

Por qué importa: en un sistema donde varias empresas comparten la plataforma, un chequeo que
falta en una sola operación alcanza para que alguien de una empresa actúe sobre los datos (o el
dinero) de otra.
Pregunta para ustedes: hagan una tabla con todas las operaciones que modifican algo (crear,
editar, borrar, cambiar estado, cancelar, reembolsar) y, al lado, respondan: ¿qué rol puede hacerlo? y
¿dónde se verifica que el recurso pertenece a quien lo pide? ¿Cuántas filas quedan con la segunda
columna vacía? ¿Cómo harían para que ese chequeo no dependa de que alguien se acuerde de
escribirlo en cada método?
Para estudiar : autenticación vs autorización, control de acceso por recurso (ownership), aislamiento
multi-tenant,  jwt.verify  vs  jwt.decode .

2. El servidor es la fuente de verdad (cálculos y validaciones)

Qué obser vamos: algunos valores que quedan guardados en la base, o que tienen consecuencias
económicas, se calculan en el navegador y el backend los acepta tal como llegan. También hay reglas
de validación que el frontend y el backend aplican de forma distinta, y entonces el formulario se pone
"en verde" y el guardado falla, o al revés.
Ejemplo concreto (un faro, no la lista completa): la capacidad total de un garage. En la

pantalla de alta de zona ( agregar_zona ) se suma en el navegador (lugares para reservas + lugares

sin reserva) y se envía ya calculada. Sin embargo, el endpoint de "garage propio" del backend hace

esa misma suma del lado del servidor. Ya conocían la forma correcta y la aplicaron en un solo lugar.
Por qué importa: cualquiera puede llamar a la API sin pasar por su pantalla. Si el servidor confía en

un número que armó el cliente, la base puede quedar con datos que se contradicen, y si el número

es un monto, la plata no cierra.

Pregunta para ustedes: ¿qué otros valores con consecuencia (un monto a cobrar, qué consumos

quedan dados por pagados, un estado) arma hoy el navegador y el servidor guarda sin recalcular? Y

un ejercicio de medición: armen una tabla con cada regla de validación de sus formularios

(contraseña, teléfono, patente, nombres, capacidades) y, al lado, la regla que aplica el backend para el

mismo dato. ¿En cuántas filas coinciden exactamente? ¿Cuántas existen solo en el frontend?

Para estudiar : validación en cliente vs servidor, datos derivados, "never trust the client", contrato de
validación compartido.

3. Cada capa con su responsabilidad

Qué obser vamos: las capas que tan bien funcionan en los módulos simples se rompen justo en los
módulos más delicados. Hay controllers que escriben SQL y manejan transacciones, y reglas de
negocio centrales que viven dentro de un repository (que debería solo leer y escribir datos). Además,
algunas reglas están implementadas dos veces en capas distintas.
Ejemplo concreto (un faro, no la lista completa): el módulo de pagos es el único del backend
que no tiene ni service ni repository propio. El controller de pagos hace las consultas, abre y cierra
transacciones y decide reglas de negocio. Comparen su forma con el módulo de marcas, que sigue
el camino completo controller → service → repository.
Por qué importa: si la lógica de pagos vive en un controller, no se puede reutilizar desde otro lugar
(por ejemplo, desde un proceso automático) ni testear sin levantar el servidor web. Y cuando una
misma regla está en dos capas, tarde o temprano las dos versiones dejan de coincidir.
Pregunta para ustedes: ¿hay alguna regla del corazón de SmartLot (cuánto cuesta una reserva, si
entra en el cupo, quién la paga) que viva en la capa de datos? ¿La misma regla se valida igual al crear
que al editar una reserva? Y sobre transacciones: si una función recibe como parámetro "la conexión
con la que tiene que trabajar", ¿todas sus consultas usan esa conexión? Revísenlo en sus funciones
que reciben una conexión.
Para estudiar : arquitectura en capas, responsabilidad de controller / service / repository,
transacciones y unidad de trabajo.

4. Errores y status codes que digan la verdad

Qué obser vamos: en buena parte de los repositorios, cuando la base de datos falla, el error se
registra en consola y se devuelve "nada". Más arriba, el controller interpreta ese "nada" como "no
existe" o como "error interno", según el caso. El resultado es que la API a veces le dice al usuario algo
falso.
Ejemplo concreto (un faro, no la lista completa): intenten editar una marca que existe
mandando el cuerpo vacío. La base rechaza el cambio porque el nombre es obligatorio, el
repositorio de marcas devuelve "nada" y el controller de marcas responde que la marca no existe.
Por qué importa: "no encontré lo que buscabas" es un resultado; "falló la consulta" es una
excepción. Si se representan igual, se pierde el diagnóstico, el frontend muestra mensajes

engañosos y un error de datos puede terminar, incluso, cerrando la sesión del usuario.

Pregunta para ustedes: ¿cuántos repositorios usan esa misma forma de "avisar" que algo falló? ¿Y

cuáles de los más nuevos ya lanzan el error en lugar de devolver nada? Otra prueba: elijan un PUT

cualquiera y manden un solo campo. ¿Qué quedó guardado en las demás columnas? ¿Es lo que

esperaban de un PUT?

Para estudiar : propagación de errores entre capas, status codes HTTP (400 / 404 / 409 / 500), PUT

vs PATCH.

5. DRY y "una sola forma de hacer cada cosa"

Qué obser vamos: el proyecto ya tiene muy buenos helpers, pero conviven con copias locales que
hacen lo mismo. Hay varias "generaciones" del mismo código: distintas formas de lanzar un error en
el backend, distintos estilos en los servicios del frontend y funciones auxiliares de vista copiadas en
muchas pantallas. Las copias ya empezaron a comportarse distinto. A eso se suma que, como la vista
no sabe con certeza qué le devuelve el servicio, muchas funciones "prueban" varios nombres de
campo posibles por si acaso.
Ejemplo concreto (un faro, no la lista completa): comparen la función que obtiene el id del
usuario en el dashboard de empleados ( empleados_dashboard ) con la que tiene el mismo nombre
en la gestión de empleados ( gestion_de_empleados ). Hacen lo mismo con distinto orden de
prioridad, y una de ellas prueba incluso un nombre de campo que su base de datos no tiene. Boceto
de la idea (no del código): la normalización se hace una vez, en la frontera (el servicio), y la vista
recibe siempre la misma forma.
Por qué importa: cada copia es un lugar más donde arreglar el mismo bug, y ya hay casos donde el
arreglo se hizo en una copia y no en las otras. Además, "adivinar" el nombre de un campo puede
devolver un dato equivocado sin dar ningún error.
Pregunta para ustedes: ¿qué devuelve exactamente su endpoint de usuario por id? Con eso en la
mano, ¿cuántas de las alternativas que prueba esa función se ejecutan de verdad alguna vez?
Busquen cuántas funciones auxiliares de vista están repetidas en sus pantallas y cuáles ya existen en
su carpeta de helpers. En el backend, ¿de cuántas maneras distintas se "lanza un error con status
code"?
Para estudiar : principio DRY, contrato de API, normalización en la capa de servicios, homogeneidad
de convenciones.

6. Responsabilidad única y reutilización entre roles

Qué obser vamos: encontramos 3 clases del backend y 6 vistas del frontend que "hacen
demasiado". Mezclan carga de datos, reglas, varios modales y presentación en un mismo archivo,
con decenas de estados. No las nombramos a propósito: identificarlas es parte del ejercicio. Además,
muchas piezas de interfaz están copiadas por rol (admin, superadmin, empleado, dueño) en lugar de
compartirse, y las copias ya divergieron con bugs visibles para el usuario.
Ejemplo concreto (un faro, no la lista completa): comparen el footer del admin con el footer
del empleado, y sus dos hojas de estilo. Son el mismo componente: cambia la lista de ítems de
navegación y el prefijo de las clases CSS. Boceto de la idea: un único footer que recibe la lista de

ítems como dato. Lo que cambia entre roles son datos, no componentes.

Por qué importa: con veinte estados en un mismo archivo, nadie puede comparar dos pantallas de

ochocientas líneas a simple vista, y ahí nacen las divergencias: una mejora que se aplicó en una copia

y no en su gemela, o una pantalla de edición que no se comporta como la de alta.

Pregunta para ustedes: elijan su archivo más largo del frontend y su clase más larga del backend:

¿pueden describir lo que hace cada uno sin usar la palabra "y"? Después busquen las demás familias

de componentes que existen "una por rol" (headers, tarjetas, tablas, modales). ¿Cuál de ellas ya tiene

una diferencia de comportamiento que el usuario puede notar? ¿Y hay pantallas de "alta" y de

"edición" del mismo recurso que no comparten el formulario?

Para estudiar : principio de responsabilidad única (SRP), custom hooks, componentes data-driven,

layout routes de React Router.

7. Un sistema de diseño se aplica, no solo se documenta

Qué obser vamos: escribieron un sistema de diseño serio (paleta de marca, tokens, decisiones
documentadas). La landing lo respeta muy bien. Los paneles, en cambio, escriben los colores a mano,
archivo por archivo, y varias afirmaciones de la documentación de diseño no coinciden con lo que
hace el código.
Ejemplo concreto (un faro, no la lista completa): abran la hoja de estilos del dashboard del
dueño de garage. Al principio define una variable propia con el azul de la marca y, unas líneas más
abajo, vuelve a escribir ese mismo azul literal varias veces, sin usar la variable que acaba de crear. Y
esa variable tampoco es el token global de marca que ya existe.
Por qué importa: un token sirve para cambiar algo en un solo lugar. Si conviven el token y el color
escrito a mano, se tiene la sensación de tener un sistema sin sus beneficios. Y si la documentación
afirma algo que el código no cumple, quien la lea va a tomar decisiones equivocadas.
Pregunta para ustedes (ejercicio de medición): elijan el color principal de su app. ¿En cuántos
archivos está escrito literal, contando también sus variantes con transparencia? ¿Con cuántos
nombres distintos lo redefinieron como variable? Si mañana la marca cambia de azul, ¿cuántos
archivos tocan? Después hagan lo mismo con el rojo de "error": ¿cuántos rojos distintos usan?
Para estudiar : design tokens, CSS custom properties, alcance del CSS (CSS global vs módulos),
documentación de decisiones (ADR) verificable contra el código.

8. Una entrega se tiene que poder reconstruir desde cero, con una sola fuente de
verdad (y la base, ser coherente consigo misma)

Qué obser vamos: el frontend se puede instalar siguiendo su README y su plantilla de variables de
entorno. El backend no tiene README ni plantilla de variables, aunque necesita muchas para arrancar
(¿cuántas? cuéntenlas). Con la re-entrega del esquema dieron un paso importante: la base ahora se
puede levantar desde el repositorio, y el script de roles está muy bien pensado (se puede correr
dos veces sin romper nada y verifica lo que ya existe). Lo que queda pendiente cambió de forma: ya
no es "falta el esquema", es que conviven varias versiones del esquema y ninguna dice ser la
oficial, y nadie que llegue nuevo sabe qué ejecutar ni en qué orden. Dentro de la base, además, un
mismo concepto (como "estado", "fecha de alta" o "quién borró") se modela de formas distintas
según la tabla.
Ejemplo concreto (un faro, no la lista completa): los archivos del esquema dentro de  docs/
remiten, para explicar de dónde salen y cómo se usan, a una carpeta que no existe en el repositorio.
Y la carpeta de migraciones, que por su nombre parece el camino oficial, no alcanza por sí sola para

levantar la base desde cero.

Por qué importa: una entrega que solo funciona "en la máquina de alguien", o "en el proyecto de

Supabase que ya existe", no se puede corregir, ni continuar, ni desplegar de nuevo. Y cuando hay dos

o tres copias del esquema, la próxima modificación va a quedar en una sola, y desde ese día van a

describir bases distintas. El repositorio tiene que ser la fuente de verdad, y tiene que decir cuál de sus

archivos lo es.

Pregunta para ustedes: consigan una máquina (o una carpeta) limpia y una base vacía, y traten de

levantar SmartLot completo usando solo lo que está en los dos repos. Anoten cada vez que

tienen que "saber algo" que no está escrito. ¿Cuántas anotaciones juntaron? ¿Cuántos archivos

describen hoy la estructura de su base, y cuál de ellos manda si dos no coinciden? Con la base recién

levantada, ¿funciona todo lo que depende de datos de catálogo, o hay algo que solo aparece si

corren otros scripts? Sobre el diseño: ¿de cuántas formas distintas modelan un "estado" (tipo
enumerado, texto con restricción, texto libre)? ¿Cómo sabe el sistema que un consumo está pagado?
¿Esa relación está protegida por la base o depende de cómo está escrito un texto?
Para estudiar : README como contrato de onboarding, plantilla  .env.example , migraciones
reproducibles y datos de catálogo (seeds), formas normales y relaciones N:M,  timestamp  vs
timestamptz , convenciones de nombres en PostgreSQL.

Preguntas de comprensión del proyecto

Son las preguntas que deberían poder responder sin abrir el código, por haberlo construido.

1. Recorran el flujo de una reserva de un empleado, desde que elige garage, fecha y hora hasta que la
reserva queda confirmada. ¿En qué momento se calcula el importe, quién decide si entra en el cupo
de la empresa y quién la paga (la empresa o el empleado)?

2. ¿Qué es la "retención de pago" de una reserva? ¿Cuánto dura, qué la libera si el pago nunca llega y

qué proceso del backend se ocupa de eso?

3. Integración con Mercado Pago: cuando un empleado paga, ¿cómo se entera el backend de que el
pago se aprobó? ¿Qué verifica antes de creerle a ese aviso? ¿Qué pasa con la reserva si el aviso
nunca llega?

4. Las cuentas corrientes entre empresa y garage: ¿qué es un "consumo", cuándo se genera y por qué
guarda una copia de la tarifa en lugar de consultar la tarifa actual? ¿Cómo sabe el sistema que un
consumo ya está pagado?

5. SmartLot lo usan varias empresas a la vez. ¿Cómo garantiza el backend que un admin de una

empresa no vea ni modifique datos de otra? ¿En qué capa vive ese chequeo y en qué operaciones se
aplica?

6. ¿Qué roles existen, qué puede hacer cada uno y cómo los identifica el código (por número o por
nombre)? El nombre que la base le da a cada rol en su script de roles, ¿es el mismo que usa el

backend cuando pregunta por nombre? Si no coinciden, ¿qué chequeos o mensajes dejan de
funcionar sin dar ningún error?

7. La sesión: desde que alguien inicia sesión hasta que su token de acceso vence mientras está usando
una pantalla, ¿qué pasa por detrás? ¿Dónde se guarda cada credencial, quién la renueva y cómo se

invalidan todas las sesiones de un usuario?

8. La impersonación del superadmin: ¿cómo "entra como" otro usuario, cómo vuelve a ser él mismo y

qué datos del usuario impersonado guarda el frontend? ¿Quién tiene la última palabra sobre los
permisos en ese momento?

9. El flujo de solicitud entre una empresa y un garage hasta convertirse en un "trato": ¿quién lo inicia,

quién lo acepta y qué cambia en las reservas cuando se modifica la modalidad de pago del trato?
10. El QR de acceso: ¿qué contiene, cómo valida el backend que no es falso ni está reutilizado, y qué pasa

cuando el garagista registra el ingreso manualmente por patente en lugar de escanear?

11. El límite de reservas activas por empleado: ¿qué pasa si el mismo empleado manda dos pedidos de

reserva exactamente al mismo tiempo? ¿Qué mecanismo de la base evita que los dos pasen?
12. La caché del frontend: después de crear o cancelar una reserva, ¿cómo sabe la app que tiene que

volver a pedir la lista? ¿Dónde está escrita esa regla, y está escrita en un solo lugar?

13. ¿Cómo se calcula cuántos lugares libres tiene un garage en un momento dado? ¿Ese número se

guarda o se calcula? ¿Qué pasa si una cancelación o un error deja el contador desfasado?

14. ¿Por qué el backend fija una zona horaria al arrancar? ¿Qué problema aparecía en el servidor
desplegado y qué relación tiene con cómo se guardan las fechas de las reservas en la base?

15. Las notificaciones: ¿cómo se entera el frontend de que hay una nueva, cada cuánto pregunta y cómo

decide el backend qué notificaciones ve cada rol?

16. Si mañana se suma un rol nuevo (por ejemplo, "auditor" de solo lectura), ¿qué tocan de punta a

punta: base de datos, backend, rutas del frontend y menús?

17. ¿Qué decisión de diseño de SmartLot defenderían con más fuerza, y cuál cambiarían hoy si

empezaran de nuevo?

Para la defensa oral

Preparen el proyecto para poder:

Responder las preguntas de arriba con sus palabras, sin leer el código.
Explicar qué hace cualquier archivo o función que se les señale.

Justificar decisiones de diseño: por qué esa estructura de carpetas, esos tipos de datos, esa forma de
manejar errores.

Hacer en vivo un cambio chico que se les pida, sabiendo qué archivos tocar.
Contar con claridad qué hizo cada integrante: el historial del repositorio no siempre permite saberlo,

así que lo vamos a preguntar.

Sobre el uso de IA y el criterio propio

Usar IA para programar está bien: es parte de la profesión que les toca. Pero todo código que entra al

repositorio es de ustedes: lo firman, lo defienden y lo mantienen. La IA propone; el programador dispone.
Antes de aceptar cualquier código (generado o propio), pregúntense:

¿Lo leí completo y entiendo cada línea? ¿Podría explicárselo a un compañero?

¿Hace falta todo lo que trae, o vino con cosas de más que nadie va a usar?
¿Es coherente con el resto de mi proyecto (mismo estilo, mismas convenciones, sin repetir algo que

ya existe)?
¿Lo que dicen los comentarios y la documentación es verdad hoy, en este código?

¿Mis tests verifican lo que el código hace, o solo cómo está escrito?
¿Qué le cambiaría? Si la respuesta es "nada", probablemente no lo revisé en serio.

Cierre

Construyeron un sistema grande y con fundamentos que muchos proyectos profesionales no tienen. Lo
que les falta no es saber más cosas sino aplicar en todo el proyecto lo que ya demostraron saber en

una parte: el chequeo de permisos que ya escribieron, el helper que ya existe, el token de color que ya
definieron, el cálculo que ya hacen bien en un endpoint. Si trabajan esa coherencia, SmartLot da un salto

enorme. Esa revisión crítica de punta a punta es justamente el criterio profesional que esta materia busca
formar.

