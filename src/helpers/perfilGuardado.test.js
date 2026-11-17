import test from 'node:test';
import assert from 'node:assert/strict';
import { guardarCambiosPerfil, mensajeErrorServidor } from './perfilGuardado.js';

function clienteFalso({ fallaPatch = null, fallaPut = null } = {}) {
  const llamadas = [];
  return {
    llamadas,
    patch: async (url, body) => { llamadas.push(['patch', url, body]); if (fallaPatch) throw fallaPatch; },
    put: async (url, body) => { llamadas.push(['put', url, body]); if (fallaPut) throw fallaPut; },
  };
}

const base = { idUsuario: 7, telefono: '1122334455', telefonoOriginal: '1122334455', contraseña: '' };

test('solo envía lo que cambió', async () => {
  const soloTelefono = clienteFalso();
  await guardarCambiosPerfil(soloTelefono, { ...base, telefono: '1199998888' });
  assert.deepEqual(soloTelefono.llamadas, [['put', '/api/usuario/7', { telefono: '1199998888' }]]);

  const soloClave = clienteFalso();
  await guardarCambiosPerfil(soloClave, { ...base, contraseña: 'Clave##12AB' });
  assert.deepEqual(soloClave.llamadas, [['patch', '/api/usuario/7/contrasenia', { contraseña: 'Clave##12AB' }]]);

  const nada = clienteFalso();
  assert.deepEqual(await guardarCambiosPerfil(nada, base), { telefonoCambiado: false, contraseñaCambiada: false });
  assert.deepEqual(nada.llamadas, []);
});

test('si falla la contraseña no se guarda el teléfono', async () => {
  const cliente = clienteFalso({ fallaPatch: new Error('400') });
  await assert.rejects(guardarCambiosPerfil(cliente, { ...base, telefono: '1199998888', contraseña: 'Clave##12AB' }));
  assert.deepEqual(cliente.llamadas.map(([metodo]) => metodo), ['patch']);
});

test('si la contraseña se guardó y falla el teléfono, el error lo indica', async () => {
  const cliente = clienteFalso({ fallaPut: new Error('500') });
  await assert.rejects(
    guardarCambiosPerfil(cliente, { ...base, telefono: '1199998888', contraseña: 'Clave##12AB' }),
    (error) => error.contraseñaGuardada === true,
  );

  const sinClave = clienteFalso({ fallaPut: new Error('500') });
  await assert.rejects(
    guardarCambiosPerfil(sinClave, { ...base, telefono: '1199998888' }),
    (error) => error.contraseñaGuardada === undefined,
  );
});

test('el mensaje de error prioriza el del servidor', () => {
  const axios400 = { isAxiosError: true, message: 'Request failed with status code 400', response: { data: { message: 'La contraseña debe tener al menos 8 caracteres.' } } };
  assert.equal(mensajeErrorServidor(axios400), 'La contraseña debe tener al menos 8 caracteres.');

  const axios500SinMensaje = { isAxiosError: true, message: 'Request failed with status code 500', response: { data: {} } };
  assert.equal(mensajeErrorServidor(axios500SinMensaje), 'Ocurrió un problema con el servidor.');

  assert.equal(mensajeErrorServidor({ isAxiosError: true, message: 'Network Error' }), 'No se pudo conectar con el servidor.');
  assert.equal(mensajeErrorServidor(new Error('No se pudo detectar el ID del usuario activo en la sesión.')), 'No se pudo detectar el ID del usuario activo en la sesión.');
});
