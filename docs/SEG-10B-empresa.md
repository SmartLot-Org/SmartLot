# SEG-10B, primera parte: acuse público de empresas

`POST /api/solicitud-registro` responde 202 con el mismo acuse para una nueva
solicitud persistida, una ya pendiente o un usuario registrado. La respuesta
solo contiene message y no debe consumirse como prueba de creación de cuenta,
solicitud nueva o entrega de correo.

RegisterEmpresaForm sigue aceptando respuestas 2xx sin utilizar datos internos.
Conserva su diseño, navegación, validaciones y manejo de errores. La confirmación
ahora dice: “Recibimos tu solicitud. Si corresponde procesarla, te contactaremos
por correo. Si ya tenés una cuenta, podés iniciar sesión o recuperar tu
contraseña.” Se elimina el email mostrado bajo la promesa anterior de contacto
necesario. No cambia el cliente HTTP ni otros formularios.

El backend conserva validaciones 400, rate limit 429 y errores internos. El aviso
a superadmins es best-effort en el mismo proceso, sin espera de entrega en la
respuesta HTTP y sin garantía durable ante un reinicio. Los registros de empleado
y dueño de garage siguen pendientes de revisión separada.

Validación: `npm test` (121 pruebas),
`npx eslint src/componentesLanding/auth/RegisterEmpresaForm.jsx src/pages/register.source.test.js`,
`npm run build` y `git diff --check`. El lint dirigido pasa; el lint global tiene
deuda preexistente documentada en AGENTS.md y queda fuera de este cambio. El
build conserva avisos de chunks mayores a 500 kB. No se actualizan dependencias.
