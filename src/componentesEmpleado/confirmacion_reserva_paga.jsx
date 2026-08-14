import { AlertCircle, Car, CalendarDays, Clock, MapPin, X } from "lucide-react";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import "./confirmacion_reserva_paga.css";

export default function ConfirmacionReservaPaga({ abierto, reserva, precioFormateado, onClose, onContinuar }) {
  if (!abierto || !reserva) return null;

  return (
    <ModalPortal onClose={onClose} overlayClassName="reserva-paga-overlay">
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
          <button type="button" className="reserva-paga-modal__close" onClick={onClose} aria-label="Cerrar modal">
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
          <span>Al continuar, tendrás un tiempo limitado para completar el pago.</span>
        </p>

        <div className="reserva-paga-modal__actions">
          <button type="button" className="reserva-paga-button reserva-paga-button--secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="reserva-paga-button reserva-paga-button--primary" onClick={onContinuar}>Continuar al pago</button>
        </div>
      </section>
    </ModalPortal>
  );
}
