const positiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const getUsuarioGarageIds = (usuario = {}) => {
  const values = [
    ...(Array.isArray(usuario.id_garages) ? usuario.id_garages : []),
    ...(Array.isArray(usuario.garages) ? usuario.garages : []),
    usuario.id_garage,
  ];

  return Array.from(new Set(values
    .map((value) => positiveId(value?.id_garage ?? value?.id ?? value))
    .filter(Boolean)))
    .sort((a, b) => a - b);
};

export const mergeUsuariosById = (usuarios = []) => {
  const byId = new Map();

  for (const usuario of usuarios) {
    const id = positiveId(usuario?.id ?? usuario?.id_usuario ?? usuario?._id);
    if (!id) continue;
    const previous = byId.get(id);
    const idGarages = getUsuarioGarageIds(previous ? {
      id_garages: [...getUsuarioGarageIds(previous), ...getUsuarioGarageIds(usuario)],
    } : usuario);
    byId.set(id, {
      ...(previous || {}),
      ...usuario,
      id,
      id_garages: idGarages,
      id_garage: idGarages[0] ?? null,
    });
  }

  return Array.from(byId.values());
};
