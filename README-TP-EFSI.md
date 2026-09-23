## Trabajo Práctico: React Hook Form

Se eligió el flujo completo de registro de `/register`: tanto el formulario de empresa como el de dueño de garage. Se modificaron `RegisterEmpresaForm`, `RegisterGarageForm`, el campo reutilizable `RegisterField` y las pruebas fuente de la pantalla.

React Hook Form administra los valores, campos tocados, errores y estado de envío dentro de cada formulario mediante `useForm`. `RegisterEmpresaForm` y `RegisterGarageForm` generan el payload final y se lo entregan a `apiClient`, que lo envía al endpoint correspondiente. `RegisterField` recibe por props el registro del campo (`name`, `ref`, `onChange` y `onBlur`), su error y su estado visual; no crea una copia innecesaria del valor mediante `useState`. El único estado local que conserva es la visibilidad de las contraseñas.

Las validaciones frontend comprueban:

- nombre y apellido obligatorios, con un mínimo de 2 caracteres y compuestos sólo por letras;
- email obligatorio y con formato válido;
- teléfono opcional y, si se completa, de 7 a 15 dígitos;
- contraseña obligatoria, de al menos 8 caracteres, con al menos 2 caracteres especiales, 2 números y 2 mayúsculas;
- confirmación obligatoria y coincidente con la contraseña;
- para empresa, nombre obligatorio de al menos 2 caracteres y descripción opcional de hasta 1000 caracteres.

Antes del envío se recortan los textos, el email se normaliza a minúsculas, el teléfono vacío se convierte en `null` y la confirmación no se incluye en el payload. Los conflictos de email o usuario existente, el rate limit y las restricciones de la base de datos siguen dependiendo del backend y se muestran como errores generales.

Después de una respuesta exitosa se ejecuta `reset()`. En empresa, el formulario queda limpio antes de mostrar la confirmación; en garage, queda limpio antes de iniciar la sesión o redirigir. Al alternar entre empresa y garage, React desmonta el formulario anterior y monta una instancia nueva con valores, campos tocados y errores vacíos.
