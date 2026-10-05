import { normalizeReservaDateTime, formatReservaDate, formatReservaHorario } from '../helpers/reservaDateTime';
import { Car, Check, Copy, X } from "lucide-react";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import "./modal_editar_reserva.css";

const esValorVerdadero = (valor) => {
  if (valor === true || valor === 1) return true;
  if (valor === false || valor === 0 || valor === null || valor === undefined) return false;
  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    if (!texto || ["false", "0", "no", "null", "undefined"].includes(texto)) return false;
    if (["true", "1", "si", "sí", "completo", "completado"].includes(texto)) return true;
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
    return { tipo: "deleted", texto: "Borrada", icono: <X size={20} strokeWidth={3.2} />, color: "#dc2626" };
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
    return { tipo: "completed", texto: "Completada", icono: <Check size={20} strokeWidth={3.2} />, color: "#16a34a" };
  }

  return { tipo: "missed", texto: "Sin registro", icono: <X size={20} strokeWidth={3.2} />, color: "#dc2626" };
};

function ModalDetalleReserva({ reserva, onClose, onCopy }) {
  if (!reserva) return null;

  const estado = obtenerEstadoHistorial(reserva);
  const time = normalizeReservaDateTime(reserva);
  const fechaFormateada = formatReservaDate(time.fecha);


  const vehiculo = reserva.vehiculo;
  const infoVehiculo = vehiculo
    ? [vehiculo.patente, vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" · ")
    : "—";

  return (
    <ModalPortal onClose={onClose}>
      <div className="modal-reserva-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-reserva-header">
          <h2>Detalle de reserva</h2>
          <button type="button" className="modal-reserva-close" onClick={onClose} aria-label="Cerrar">
            &#x2715;
          </button>
        </div>

        <div className="modal-reserva-body">
          <div className="modal-reserva-field">
            <span className="modal-reserva-field-label">Estado</span>
            <span
              className="modal-reserva-field-value"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: estado.color,
                fontWeight: 700,
              }}
            >
              {estado.icono}
              {estado.texto}
            </span>
          </div>

          <div className="modal-reserva-field">
            <span className="modal-reserva-field-label">Fecha</span>
            <span className="modal-reserva-field-value">{fechaFormateada}</span>
          </div>

          <div className="modal-reserva-field">
            <span className="modal-reserva-field-label">Horario</span>
            <span className="modal-reserva-field-value">
              {formatReservaHorario(time)}
            </span>
          </div>

          <div className="modal-reserva-field">
            <span className="modal-reserva-field-label">Garage</span>
            <span className="modal-reserva-field-value">{reserva.nombre_garage || "—"}</span>
          </div>

          <div className="modal-reserva-field">
            <span className="modal-reserva-field-label">Ubicacion</span>
            <span className="modal-reserva-field-value">
              {reserva.nro_plaza || "—"} &middot; {reserva.nombre_zona || "Sector"}
            </span>
          </div>

          <div className="modal-reserva-field">
            <span className="modal-reserva-field-label">Vehiculo</span>
            <span className="modal-reserva-field-value">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Car size={16} />
                {infoVehiculo}
              </span>
            </span>
          </div>
        </div>

        <div className="modal-reserva-footer">
          <button
            type="button"
            className="modal-reserva-btn-guardar"
            onClick={() => onCopy?.(reserva)}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Copy size={16} />
              Copiar reserva
            </span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

export default ModalDetalleReserva;
