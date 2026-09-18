const ESTADOS_HABILITADOS_QR = new Set([
  "activa",
  "activo",
  "confirmada",
  "confirmado",
  "confirmed",
  "pendiente",
  "dentro",
  "ingresado",
  "ingresada",
  "adentro",
  "ocupado",
  "ocupada",
  "en_curso",
  "dentro_garage",
  "checkin",
  "check_in",
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
  reserva.fecha_ingreso, reserva.fechaIngreso, reserva.hora_ingreso, reserva.horaIngreso,
  reserva.ingreso_at, reserva.ingresoAt,
  reserva.ingreso_exitoso, reserva.ingresoExitoso, reserva.esta_dentro, reserva.estaDentro,
].some(esValorVerdadero) || ["dentro", "ingresado", "ingresada", "adentro", "ocupado", "ocupada", "ingreso", "en_curso", "dentro_garage", "checkin", "check_in"].includes(
  String(reserva.estado ?? reserva.status ?? reserva.estado_reserva ?? reserva.estadoReserva ?? "")
    .trim().toLowerCase().replace(/[\s-]+/g, "_")
);

export const reservaTieneSalida = (reserva = {}) => [
  reserva.salida, reserva.egreso, reserva.check_out, reserva.checkOut, reserva.salio,
  reserva.salida_registrada, reserva.salidaRegistrada, reserva.fecha_salida_real,
  reserva.fechaSalidaReal, reserva.hora_salida_real, reserva.horaSalidaReal,
  reserva.egreso_at, reserva.egresoAt, reserva.salida_exitosa, reserva.salidaExitosa,
].some(esValorVerdadero) || ["finalizado", "finalizada", "completado", "completada", "salida", "egresado", "egresada", "checkout", "check_out"].includes(
  String(reserva.estado ?? reserva.status ?? reserva.estado_reserva ?? reserva.estadoReserva ?? "")
    .trim().toLowerCase().replace(/[\s-]+/g, "_")
);

export const puedeMostrarQrReserva = (reserva = {}) => {
  if (!reserva || reservaTieneSalida(reserva)) return false;
  const estado = String(
    reserva.estado ?? reserva.status ?? reserva.estado_reserva ?? reserva.estadoReserva ?? "confirmada"
  ).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ESTADOS_HABILITADOS_QR.has(estado);
};

export const obtenerTipoQrReserva = (reserva = {}) =>
  reservaTieneIngreso(reserva) ? "salida" : "ingreso";

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
