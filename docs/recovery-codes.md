# Recuperacion de cuenta (SEG-06)

La pantalla conserva ingreso con codigo y cambio de contraseña. Los errores
genericos del backend aparecen en el mismo formulario, sin redireccion de auth.
Permite solicitar un nuevo codigo desde el paso de codigo y muestra la respuesta
generica de emision. No se envian IDs ni identidades alternativas.

El backend aplica cinco errores por codigo compartidos por ambos endpoints,
vigencia de diez minutos, consumo unico, cooldown de 60 segundos y tres emisiones
por cuenta en quince minutos. Todos los limites de seguridad residen en SQL.

La espera de reenvio se obtiene de Retry-After o retry_after; es independiente de
la validacion del codigo recibido. Un 429 del limite por IP bloquea temporalmente
los envios y validaciones segun Retry-After (segundos o fecha HTTP). La recarga no
elude los limites persistidos del servidor. La respuesta de emision es identica
para cuentas inexistentes o limitadas: no informa contadores ni existencia.

No cambian cliente HTTP, cookies, navegacion, roles ni estilos. El despliegue debe
coordinarse con la migracion y backend de SEG-06; los codigos anteriores quedan
invalidados al migrar y se debe solicitar uno nuevo.

Verificacion: npm test, lint de los archivos modificados, npm run lint y npm run
build. El lint global tiene deuda previa documentada; se informa por separado.

Resultados de esta tarea: 121 pruebas aprobadas, 0 fallos, 0 omitidas. Lint de
los tres archivos JS/JSX modificados aprobado y build aprobada (advertencia de
chunks grandes). El lint global se ejecuto: 108 errores y 4 advertencias en
archivos ajenos; no se cuenta como aprobado. No se realizo prueba visual de
navegador ni se enviaron correos reales. El backend documenta su migracion,
regresiones HTTP/SQL y limite de verificacion con PGlite en seg06-recovery-codes.md.
