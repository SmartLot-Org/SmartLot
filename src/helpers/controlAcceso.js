const LIST_KEYS = ["reservas", "datos", "data", "results", "items"];

export const obtenerReservasControlAcceso = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of LIST_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
      const nested = obtenerReservasControlAcceso(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

export const aplanarReservaControlAcceso = (fila = {}) => {
  if (!fila || typeof fila !== "object" || Array.isArray(fila)) return {};

  const reserva = fila.reserva && typeof fila.reserva === "object" ? fila.reserva : {};
  const documento = fila._doc && typeof fila._doc === "object" ? fila._doc : {};
  const valores = fila.dataValues && typeof fila.dataValues === "object" ? fila.dataValues : {};

  return { ...reserva, ...documento, ...valores, ...fila };
};

const obtenerIdGarageReserva = (reserva) =>
  reserva?.id_garage ??
  reserva?.idGarage ??
  reserva?.garage_id ??
  reserva?.garageId ??
  reserva?.garage?.id_garage ??
  reserva?.garage?.id;

export const reservaPerteneceAlGarage = (reserva, idGarage) => {
  const idEnReserva = obtenerIdGarageReserva(reserva);

  // El endpoint de control de acceso ya esta acotado por garage y algunas
  // respuestas no repiten el id_garage en cada reserva.
  if (idEnReserva == null || idEnReserva === "") return true;

  return Number(idEnReserva) === Number(idGarage);
};
