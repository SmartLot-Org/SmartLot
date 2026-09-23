import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const register = await readFile(new URL('./Register.jsx', import.meta.url), 'utf8');
const empresa = await readFile(new URL('../componentesLanding/auth/RegisterEmpresaForm.jsx', import.meta.url), 'utf8');
const garage = await readFile(new URL('../componentesLanding/auth/RegisterGarageForm.jsx', import.meta.url), 'utf8');
const field = await readFile(new URL('../componentesLanding/auth/RegisterField.jsx', import.meta.url), 'utf8');
const toggle = await readFile(new URL('../componentesLanding/auth/RegisterRoleToggle.jsx', import.meta.url), 'utf8');
const panel = await readFile(new URL('../componentesLanding/auth/RegisterBrandPanel.jsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
const gestion = await readFile(new URL('../vistasSuperadmin/gestion_usuarios.jsx', import.meta.url), 'utf8');

test('la ruta /register usa la página nueva y redirige con sesión activa', () => {
  assert.match(app, /path="\/register"[\s\S]*<Register/);
  assert.match(register, /if \(usuario\) return <Navigate to=\{getUserHomeRoute\(usuario\)\} replace/);
});

test('el toggle mitad/mitad alterna empresa y garage con roles ARIA', () => {
  assert.match(toggle, /role="tablist"/);
  assert.match(toggle, /role="tab"[\s\S]*aria-selected/);
  assert.match(toggle, /MODO_EMPRESA[\s\S]*MODO_GARAGE/);
  assert.match(toggle, /ArrowRight/);
  assert.match(register, /<RegisterRoleToggle modo=\{modo\} onChange=\{cambiarModo\}/);
});

test('el panel visual alterna Building2 y Car según el modo', () => {
  assert.match(panel, /Building2/);
  assert.match(panel, /<Car /);
  assert.match(panel, /esEmpresa \?/);
  assert.match(register, /<RegisterBrandPanel modo=\{modo\} \/>/);
});

test('empresa crea solicitud con empresa_nombre y no auto-loguea', () => {
  assert.match(empresa, /apiClient\.post\(\s*"\/api\/solicitud-registro"/);
  assert.match(empresa, /empresa_nombre/);
  assert.match(empresa, /empresa_descripcion/);
  assert.match(empresa, /setEnviado\(true\)/);
  assert.doesNotMatch(empresa, /setUsuario\(/);
});

test('garage usa register-dueno-garage con auto-login y redirect por rol', () => {
  assert.match(garage, /apiClient\.post\(\s*"\/api\/usuario\/register-dueno-garage"/);
  assert.match(garage, /setUsuario\(usuario\)/);
  assert.match(garage, /navigate\(getUserHomeRoute\(usuario\), \{ replace: true \}\)/);
  assert.doesNotMatch(garage, /empresa_nombre/);
});

test('ambos formularios delegan valores, validación y envío a React Hook Form', () => {
  for (const source of [empresa, garage]) {
    assert.match(source, /import \{ useForm \} from "react-hook-form"/);
    assert.match(source, /register,/);
    assert.match(source, /handleSubmit,/);
    assert.match(source, /formState: \{ errors, touchedFields, isSubmitting, isSubmitted \}/);
    assert.match(source, /onSubmit=\{handleSubmit\(onSubmit, onInvalid\)\}/);
    assert.match(source, /\.\.\.register\("nombre", NOMBRE_RULES\)/);
    assert.match(source, /reset\(\)/);
    assert.doesNotMatch(source, /\[formData, setFormData\]/);
    assert.doesNotMatch(source, /useLiveValidation/);
  }
});

test('las reglas frontend cubren identidad, email, teléfono y contraseña fuerte', () => {
  for (const source of [empresa, garage]) {
    assert.match(source, /required: "El nombre es obligatorio/);
    assert.match(source, /value\.trim\(\)\.length >= 2/);
    assert.match(source, /SOLO_LETRAS\.test/);
    assert.match(source, /required: "El apellido es obligatorio/);
    assert.match(source, /required: "El email es obligatorio/);
    assert.match(source, /EMAIL_REGEX\.test/);
    assert.match(source, /SOLO_DIGITOS\.test/);
    assert.match(source, /minLength: \{ value: 8/);
    assert.match(source, /al menos 2 caracteres especiales/);
    assert.match(source, /al menos 2 números/);
    assert.match(source, /al menos 2 mayúsculas/);
    assert.match(source, /Las contraseñas no coinciden/);
    assert.match(source, /deps: \["contraseña"\]/);
    assert.match(source, /getValues\("contraseña"\)/);
    assert.match(source, /retry-after/);
    assert.match(source, /_skipAuthRedirect: true/);
  }
});

test('empresa valida sus campos específicos y ambos normalizan el payload', () => {
  assert.match(empresa, /required: "El nombre de la empresa es obligatorio/);
  assert.match(empresa, /maxLength: \{ value: 1000/);
  for (const source of [empresa, garage]) {
    assert.match(source, /\.trim\(\)\.toLowerCase\(\)/);
    assert.match(source, /values\.telefono\.trim\(\) === "" \? null/);
    assert.match(source, /nombre: values\.nombre\.trim\(\)/);
    assert.doesNotMatch(source, /confirmar: values\.confirmar/);
  }
});

test('RegisterField expone errores accesibles sin copiar el valor del input', () => {
  assert.match(field, /aria-invalid=\{Boolean\(visibleError\)\}/);
  assert.match(field, /aria-describedby=\{describedBy\}/);
  assert.match(field, /role="alert"/);
  assert.match(field, /visibleError\.message/);
  assert.doesNotMatch(field, /useState\([^)]*value/);
});

test('cada modo monta una instancia independiente para limpiar datos y errores', () => {
  assert.match(register, /<RegisterEmpresaForm key="empresa" \/>/);
  assert.match(register, /<RegisterGarageForm key="garage" \/>/);
});

test('la bandeja vive en gestión de usuarios con aprobar y rechazar', () => {
  assert.match(gestion, /SolicitudesRegistroGetAll/);
  assert.match(gestion, /SolicitudesRegistroAprobar/);
  assert.match(gestion, /SolicitudesRegistroRechazar/);
  assert.match(gestion, /setShowSolicitudes\(true\)/);
  assert.match(gestion, /modal-solicitudes-panel/);
  assert.match(gestion, /solicitudes-count-badge/);
});

test('?modo=garage abre el registro en modo garage', () => {
  assert.match(register, /useSearchParams/);
  assert.match(register, /MODO_GARAGE/);
  assert.match(register, /get\("modo"\) === "garage"/);
});

test('el cambio de modo anima altura y respeta reduced motion', () => {
  assert.match(register, /offsetHeight/);
  assert.match(register, /prefers-reduced-motion: reduce/);
  assert.match(register, /prefers-reduced-motion: no-preference/);
});
