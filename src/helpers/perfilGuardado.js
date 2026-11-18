// Guardado del perfil propio (teléfono y contraseña). Son dos endpoints distintos y no hay
// transacción entre ellos: el orden y el aviso de error evitan que el usuario quede con un
// cambio guardado a medias sin saberlo.
export async function guardarCambiosPerfil(cliente, { idUsuario, telefono, telefonoOriginal, contraseña, contraseñaActual = '' }) {
  const telefonoCambiado = telefono !== telefonoOriginal;
  const contraseñaCambiada = contraseña.length > 0;

  // La contraseña va primero: es la que el backend valida con más reglas, y si falla no se
  // guardó nada. Además revoca las sesiones, así que tiene que ser lo último que se confirma.
  // El backend exige la contraseña actual para cambiar la propia (una sesión robada no alcanza).
  if (contraseñaCambiada) {
    await cliente.patch(`/api/usuario/${idUsuario}/contrasenia`, { contraseña, contraseñaActual });
  }

  if (telefonoCambiado) {
    try {
      await cliente.put(`/api/usuario/${idUsuario}`, { telefono });
    } catch (error) {
      // Para que la pantalla diga que la contraseña sí cambió aunque el teléfono no.
      if (contraseñaCambiada) error.contraseñaGuardada = true;
      throw error;
    }
  }

  return { telefonoCambiado, contraseñaCambiada };
}

// El mensaje del backend (en español) antes que el de axios ("Request failed with status code 400").
export function mensajeErrorServidor(error, porDefecto = 'Ocurrió un problema con el servidor.') {
  const mensajeServidor = error?.response?.data?.message;
  if (mensajeServidor) return mensajeServidor;
  if (error?.response) return porDefecto;
  if (error?.isAxiosError) return 'No se pudo conectar con el servidor.';
  return error?.message || porDefecto;
}
