import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { ReservasGetQr } from "../servicies/API_Reserva";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import "./modal_qr_reserva.css";

export default function ModalQrReserva({ idReserva, onClose }) {
  const [qr, setQr] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarQr = async () => {
      const resultado = await ReservasGetQr(idReserva);
      if (!activo) return;
      const contenidoQr = resultado.datos?.qr;
      if (resultado.respuesta && typeof contenidoQr === "string" && contenidoQr) setQr(contenidoQr);
      else setError(resultado.datos?.message || "No se pudo obtener el QR de la reserva.");
      setCargando(false);
    };

    cargarQr();
    return () => { activo = false; };
  }, [idReserva]);

  return (
    <ModalPortal onClose={onClose} overlayClassName="reserva-qr-overlay">
      <section className="reserva-qr-modal" role="dialog" aria-modal="true" aria-labelledby="reserva-qr-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="reserva-qr-close" onClick={onClose} aria-label="Cerrar código QR"><X size={20} /></button>
        <h2 id="reserva-qr-title">Código de acceso</h2>
        <p>Mostrale este código al garagista al ingresar y nuevamente al salir.</p>
        {cargando ? (
          <div className="reserva-qr-loading" role="status">Generando código...</div>
        ) : error ? (
          <p className="reserva-qr-error" role="alert">{error}</p>
        ) : (
          <div className="reserva-qr-code"><QRCodeSVG value={qr} size={240} level="H" includeMargin title="QR de acceso de la reserva" /></div>
        )}
        <small>El código seguirá disponible hasta que se registre tu salida.</small>
        <button type="button" className="reserva-qr-dismiss" onClick={onClose}>Cerrar</button>
      </section>
    </ModalPortal>
  );
}
