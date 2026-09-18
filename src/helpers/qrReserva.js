const ESTADOS_HABILITADOS_QR = new Set([
  "activa",
  "activo",
  "confirmada",
  "confirmado",
  "confirmed",
  "pendiente",
]);

const esValorVerdadero = (valor) => {
  if (valor === true || valor === 1) return true;
  if (valor === false || valor === 0 || valor == null) return false;
  if (typeof valor !== "string") return false;
  const texto = valor.trim().toLowerCase();
  if (!texto || ["false", "0", "no", "null", "undefined"].includes(texto)) return false;
  if (["true", "1", "si", "sí", "completo", "completado"].includes(texto)) return true;
  return !Number.isNaN(new Date(valor).getTime());
};

export const reservaTieneIngreso = (reserva = {}) => [
  reserva.entrada, reserva.ingreso, reserva.check_in, reserva.checkIn, reserva.entro,
  reserva.entrada_registrada, reserva.entradaRegistrada, reserva.fecha_entrada_real,
  reserva.fechaEntradaReal, reserva.hora_entrada_real, reserva.horaEntradaReal,
].some(esValorVerdadero);

export const puedeMostrarQrReserva = (reserva = {}) => {
  if (!reserva || reservaTieneIngreso(reserva)) return false;
  const estado = String(
    reserva.estado ?? reserva.status ?? reserva.estado_reserva ?? reserva.estadoReserva ?? "confirmada"
  ).trim().toLowerCase();
  return ESTADOS_HABILITADOS_QR.has(estado);
};

export const crearControlLecturasQr = () => {
  let procesando = false;
  let ultimoContenido = null;
  return {
    intentar(contenido) {
      const valor = String(contenido || "").trim();
      if (!valor || procesando || valor === ultimoContenido) return false;
      procesando = true;
      ultimoContenido = valor;
      return true;
    },
    habilitarReintento() {
      procesando = false;
      ultimoContenido = null;
    },
  };
};
