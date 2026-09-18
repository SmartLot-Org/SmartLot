// src/componentesEmpleado/tarjeta_reserva.jsx
import { Car, Check, Copy, QrCode, X } from "lucide-react";
import "./tarjeta_reserva.css";

const esValorVerdadero = (valor) => {
  if (valor === true || valor === 1) return true;
  if (valor === false || valor === 0 || valor === null || valor === undefined) return false;
  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    if (!texto || ["false", "0", "no", "null", "undefined"].includes(texto)) return false;
    if (["true", "1", "si", "s\u00ed", "completo", "completado"].includes(texto)) return true;
    return !Number.isNaN(new Date(valor).getTime());
  }
  return false;
};

const obtenerEstadoHistorial = (reserva) => {
  const estado = String(reserva.estado || reserva.status || "").trim().toLowerCase();
  const estaBorrada = [
    reserva.borrado,
    reserva.borrada,
    reserva.cancelado,
    reserva.eliminada,
    reserva.cancelada,
    reserva.deleted,
    reserva.deleted_at,
    reserva.deletedAt,
    reserva.DeleteAt,
  ].some(Boolean) || ["borrada", "borrado", "eliminada", "eliminado", "cancelada", "cancelado"].includes(estado);

  if (estaBorrada) {
    return {
      tipo: "deleted",
      texto: "Borrada",
      aria: "Reserva borrada",
      icono: <X size={24} strokeWidth={3.2} />,
    };
  }

  const entradaCompleta = [
    reserva.entrada,
    reserva.ingreso,
    reserva.check_in,
    reserva.checkIn,
    reserva.entro,
    reserva.entrada_registrada,
    reserva.entradaRegistrada,
    reserva.fecha_entrada_real,
    reserva.fechaEntradaReal,
  ].some(esValorVerdadero);
  const salidaCompleta = [
    reserva.salida,
    reserva.egreso,
    reserva.check_out,
    reserva.checkOut,
    reserva.salio,
    reserva.salida_registrada,
    reserva.salidaRegistrada,
    reserva.fecha_salida_real,
    reserva.fechaSalidaReal,
  ].some(esValorVerdadero);

  if (entradaCompleta && salidaCompleta) {
    return {
      tipo: "completed",
      texto: "Completada",
      aria: "Reserva completada con entrada y salida registradas",
      icono: <Check size={25} strokeWidth={3.2} />,
    };
  }

  return {
    tipo: "missed",
    texto: "Sin registro",
    aria: "Reserva pasada sin entrada y salida registradas",
    icono: <X size={24} strokeWidth={3.2} />,
  };
};

function TarjetaReserva({ reserva, onClick, onCopy, onShowQr, mostrarQr = false, tipoQr = "ingreso", variant = "default" }) {
  if (!reserva) return null;

  const esHistorialPasado = variant === "historyPast";
  const estadoHistorial = esHistorialPasado ? obtenerEstadoHistorial(reserva) : null;
  const fechaFormateada = reserva.fecha
    ? new Date(reserva.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })
    : "";

  const vehiculo = reserva.vehiculo;
  const tieneVehiculo = vehiculo && (vehiculo.patente || vehiculo.marca || vehiculo.modelo);
  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(reserva);
    }
  };

  return (
    <section className="empleado-reservas-section">
      <div
        className={`empleado-reserva-card${esHistorialPasado ? " empleado-reserva-card--history-past" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`Reserva en ${reserva.nombre_garage || "Garage"}`}
        onClick={() => onClick?.(reserva)}
        onKeyDown={handleCardKeyDown}
      >
        {esHistorialPasado ? (
          <div
            className={`empleado-reserva-status empleado-reserva-status--${estadoHistorial.tipo}`}
            aria-label={estadoHistorial.aria}
          >
            {estadoHistorial.icono}
            <span>{estadoHistorial.texto}</span>
          </div>
        ) : (
          <div className="empleado-reserva-plaza">
            <strong>{reserva.nro_plaza || "-"}</strong>
            <span>{reserva.nombre_zona || "Sector"}</span>
            <small>{reserva.entradaRegistrada ? "Dentro" : "Reservado"}</small>
          </div>
        )}

        <div className="empleado-reserva-info">
          <h3>{reserva.nombre_garage || "Ubicacion no especificada"}</h3>
          {esHistorialPasado && (
            <div className="empleado-reserva-location">
              <span>{reserva.nro_plaza || "-"}</span>
              <span>{reserva.nombre_zona || "Sector"}</span>
            </div>
          )}
          <p>
            {reserva.hora_entrada?.substring(0, 5) || "00:00"} a {reserva.hora_salida?.substring(0, 5) || "00:00"} | {fechaFormateada}
          </p>

          {tieneVehiculo && (
            <div className="empleado-reserva-vehiculo">
              <div className="empleado-reserva-vehiculo-icon" aria-hidden="true">
                <Car size={16} />
              </div>
              <div className="empleado-reserva-vehiculo-info">
                <span className="empleado-reserva-vehiculo-patente">{vehiculo.patente || "Sin patente"}</span>
                <span className="empleado-reserva-vehiculo-modelo">
                  {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="empleado-reserva-actions">
          <button
            type="button"
            className="empleado-reserva-copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.(reserva);
            }}
            aria-label="Copiar reserva para otro dia"
          >
            <Copy size={16} />
          </button>
          <span className="empleado-reserva-arrow" aria-hidden="true">&gt;</span>
        </div>
      </div>
      {mostrarQr ? (
        <button
          type="button"
          className="empleado-reserva-qr-btn"
          onClick={(event) => {
            event.stopPropagation();
            onShowQr?.(reserva);
          }}
        >
          <QrCode size={18} aria-hidden="true" />
          Mostrar QR de {tipoQr}
        </button>
      ) : null}
    </section>
  );
}

export default TarjetaReserva;
