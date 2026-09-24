import { useEffect, useState } from "react";
import { AlertCircle, Car, CalendarDays, Clock, MapPin, X } from "lucide-react";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import "./confirmacion_reserva_paga.css";

const formatoRestante = (restanteMs) => {
  const minutos = Math.floor(restanteMs / 60000);
  const segundos = Math.floor((restanteMs % 60000) / 1000);
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
};

export default function ConfirmacionReservaPaga({ abierto, reserva, precioFormateado, retencionPagoHasta = null, onClose, onContinuar, procesando = false, error = "" }) {
  const [restanteMs, setRestanteMs] = useState(null);

  useEffect(() => {
    if (!abierto || !retencionPagoHasta) return undefined;
    const objetivo = new Date(retencionPagoHasta).getTime();
    if (!Number.isFinite(objetivo)) return undefined;

    const actualizar = () => setRestanteMs(Math.max(0, objetivo - Date.now()));
    actualizar();
    const timer = window.setInterval(actualizar, 1000);
    return () => {
      window.clearInterval(timer);
      setRestanteMs(null);
    };
  }, [abierto, retencionPagoHasta]);

  if (!abierto || !reserva) return null;

  const avisoPago = restanteMs === null
    ? "Al continuar, tendrás un tiempo limitado para completar el pago."
    : restanteMs > 0
      ? `Tenés ${formatoRestante(restanteMs)} para completar el pago. Si no lo hacés, el lugar se libera automáticamente.`
      : "La retención venció: el lugar se libera automáticamente. Volvé a crear la reserva.";

  return (
    <ModalPortal onClose={procesando ? undefined : onClose} overlayClassName="reserva-paga-overlay">
      <section
        className="reserva-paga-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-paga-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="reserva-paga-modal__header">
          <div>
            <span className="reserva-paga-modal__eyebrow">Reserva con cargo</span>
            <h2 id="reserva-paga-titulo">Confirmar reserva paga</h2>
          </div>
          <button type="button" className="reserva-paga-modal__close" onClick={onClose} disabled={procesando} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </header>

        <dl className="reserva-paga-resumen">
          <div><dt><MapPin size={17} /> Garage</dt><dd>{reserva.ubicacion}</dd></div>
          <div><dt><CalendarDays size={17} /> Fecha</dt><dd>{reserva.fechaFormateada}</dd></div>
          <div><dt><Clock size={17} /> Horario</dt><dd>{reserva.horaInicio} a {reserva.horaFin}</dd></div>
          <div><dt><Car size={17} /> Vehículo</dt><dd>{reserva.vehiculo}</dd></div>
          <div className="reserva-paga-resumen__total"><dt>Precio final</dt><dd>{precioFormateado}</dd></div>
        </dl>

        <p className="reserva-paga-modal__aviso">
          <AlertCircle size={18} />
          <span>
            {restanteMs !== null && restanteMs > 0 ? <strong>Tiempo restante: {formatoRestante(restanteMs)}</strong> : null}
            {avisoPago}
          </span>
        </p>

        {error ? <p className="reserva-paga-modal__error" role="alert">{error}</p> : null}

        <div className="reserva-paga-modal__actions">
          <button type="button" className="reserva-paga-button reserva-paga-button--secondary" onClick={onClose} disabled={procesando}>Cancelar</button>
          <button type="button" className="reserva-paga-button reserva-paga-button--primary" onClick={onContinuar} disabled={procesando}>{procesando ? "Preparando pago..." : "Continuar al pago"}</button>
        </div>
      </section>
    </ModalPortal>
  );
}
