import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { ReservasGetById, ReservasGetQr } from "../servicies/API_Reserva";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import { obtenerTipoQrReserva, reservaTieneSalida } from "../helpers/qrReserva";
import "./modal_qr_reserva.css";

export default function ModalQrReserva({ idReserva, tipo = "ingreso", onClose }) {
  const [qr, setQr] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [tipoServidor, setTipoServidor] = useState(null);
  const tipoActual = tipoServidor ?? tipo;

  useEffect(() => {
    let activo = true;

    const actualizarEtapa = async () => {
      const resultado = await ReservasGetById(idReserva, { force: true });
      if (!activo || !resultado.respuesta) return;

      const reserva = resultado.datos?.data
        ?? resultado.datos?.reserva
        ?? resultado.datos?.datos
        ?? resultado.datos;

      if (!reserva || typeof reserva !== "object" || Array.isArray(reserva)) return;
      if (reservaTieneSalida(reserva)) {
        onClose();
        return;
      }
      setTipoServidor(obtenerTipoQrReserva(reserva));
    };

    void actualizarEtapa();
    const intervalo = window.setInterval(() => { void actualizarEtapa(); }, 2_000);
    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, [idReserva, onClose]);

  useEffect(() => {
    let activo = true;

    const cargarQr = async () => {
      setCargando(true);
      setError("");
      setQr("");
      const resultado = await ReservasGetQr(idReserva);
      if (!activo) return;
      const contenidoQr = resultado.datos?.qr;
      if (resultado.respuesta && typeof contenidoQr === "string" && contenidoQr) setQr(contenidoQr);
      else setError(resultado.datos?.message || "No se pudo obtener el QR de la reserva.");
      setCargando(false);
    };

    cargarQr();
    return () => { activo = false; };
  }, [idReserva, tipoActual]);

  const esSalida = tipoActual === "salida";

  return (
    <ModalPortal onClose={onClose} overlayClassName="reserva-qr-overlay">
      <section className="reserva-qr-modal" role="dialog" aria-modal="true" aria-labelledby="reserva-qr-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="reserva-qr-close" onClick={onClose} aria-label="Cerrar código QR"><X size={20} /></button>
        <h2 id="reserva-qr-title">Código de {tipoActual}</h2>
        <p>Mostrale este código al garagista para registrar tu {tipoActual}.</p>
        {cargando ? (
          <div className="reserva-qr-loading" role="status">Generando código...</div>
        ) : error ? (
          <p className="reserva-qr-error" role="alert">{error}</p>
        ) : (
          <div className="reserva-qr-code"><QRCodeSVG value={qr} size={240} level="H" includeMargin title={`QR de ${tipoActual} de la reserva`} /></div>
        )}
        <small>{esSalida ? "Este código reemplaza al de ingreso y se desactivará al registrar tu salida." : "Después del ingreso, este código será reemplazado por el QR de salida."}</small>
        <button type="button" className="reserva-qr-dismiss" onClick={onClose}>Cerrar</button>
      </section>
    </ModalPortal>
  );
}
