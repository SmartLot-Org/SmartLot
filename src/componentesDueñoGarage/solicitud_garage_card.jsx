import { Building2, Check, Clock4, X } from "lucide-react";
import "./solicitud_garage_card.css";

function SolicitudGarageCard({ solicitud, onAceptar, onRechazar }) {
  const estado = String(solicitud.estado || "pendiente").toLowerCase();
  const esPendiente = estado === "pendiente" || estado === "pending";

  return (
    <article className="duenio-request-card">
      <div className="duenio-request-main">
        <span className={`duenio-request-status status-${estado}`}>
          <Clock4 size={14} />
          {solicitud.estadoLabel || solicitud.estado || "Pendiente"}
        </span>
        <h3>{solicitud.empresa || "Empresa sin nombre"}</h3>
        <p>{solicitud.mensaje || "Quiere utilizar uno de tus garages dentro de SmartLot."}</p>
      </div>

      <div className="duenio-request-side">
        <div>
          <Building2 size={17} />
          <span>{solicitud.garage || "Garage no especificado"}</span>
        </div>
        <strong>{solicitud.fecha || "Sin fecha"}</strong>
      </div>

      <div className="duenio-request-actions">
        <button className="reject" onClick={onRechazar} disabled={!esPendiente}>
          <X size={17} />
          Rechazar
        </button>
        <button className="accept" onClick={onAceptar} disabled={!esPendiente}>
          <Check size={17} />
          Aceptar
        </button>
      </div>
    </article>
  );
}

export default SolicitudGarageCard;
