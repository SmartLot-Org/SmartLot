import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { ReservasGetById, ReservasGetQr } from "../servicies/API_Reserva";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import { obtenerTipoQrReserva, reservaTieneSalida } from "../helpers/qrReserva";
import "./modal_qr_reserva.css";

export default function ModalQrReserva({ idReserva, tipo = "ingreso", onClose }) {
  const [qr, setQr] = useState({ tipo: null, valor: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [tipoServidor, setTipoServidor] = useState(null);
  const qrIngresoRef = useRef("");
  const solicitudRef = useRef(0);
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
    if (tipoActual === "salida") return undefined;
    let activo = true;
    const solicitud = ++solicitudRef.current;
    const cargarQrIngreso = async () => {
      setCargando(true);
      setError("");
      const resultado = await ReservasGetQr(idReserva);
      if (!activo || solicitud !== solicitudRef.current) return;
      const contenidoQr = resultado.datos?.qr;
      if (resultado.respuesta && typeof contenidoQr === "string" && contenidoQr) {
        qrIngresoRef.current = contenidoQr;
        setQr({ tipo: "ingreso", valor: contenidoQr });
      } else {
        setError(resultado.datos?.message || "No se pudo obtener el QR de la reserva.");
      }
      setCargando(false);
    };
    void cargarQrIngreso();
    return () => { activo = false; solicitudRef.current += 1; };
  }, [idReserva, tipoActual]);

  const esSalida = tipoActual === "salida";
  const qrVisible = qr.tipo === tipoActual ? qr.valor : "";

  const generarQrSalida = async () => {
    const solicitud = ++solicitudRef.current;
    setCargando(true);
    setError("");
    setQr({ tipo: null, valor: "" });
    const resultado = await ReservasGetQr(idReserva);
    if (solicitud !== solicitudRef.current) return;
    const contenidoQr = resultado.datos?.qr;
    if (!resultado.respuesta || typeof contenidoQr !== "string" || !contenidoQr) {
      setError(resultado.datos?.message || "No se pudo generar el QR de salida.");
    } else if (contenidoQr === qrIngresoRef.current) {
      setError("El servidor devolvió el QR de ingreso ya usado. Se necesita un código nuevo para la salida.");
    } else {
      setQr({ tipo: "salida", valor: contenidoQr });
    }
    setCargando(false);
  };

  return (
    <ModalPortal onClose={onClose} overlayClassName="reserva-qr-overlay">
      <section className="reserva-qr-modal" role="dialog" aria-modal="true" aria-labelledby="reserva-qr-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="reserva-qr-close" onClick={onClose} aria-label="Cerrar código QR"><X size={20} /></button>
        <h2 id="reserva-qr-title">Código de {tipoActual}</h2>
        <p>Mostrale este código al garagista para registrar tu {tipoActual}.</p>
        {cargando ? (
          <div className="reserva-qr-loading" role="status">Generando código...</div>
        ) : qrVisible ? (
          <div className="reserva-qr-code"><QRCodeSVG value={qrVisible} size={240} level="H" includeMargin title={`QR de ${tipoActual} de la reserva`} /></div>
        ) : null}
        {error ? <p className="reserva-qr-error" role="alert">{error}</p> : null}
        {esSalida ? (
          <button type="button" className="reserva-qr-generate" onClick={generarQrSalida} disabled={cargando}>
            {qrVisible ? "Generar otro QR para salida" : "Generar QR para salida"}
          </button>
        ) : null}
        <small>{esSalida ? (qrVisible ? "Usá este código para registrar tu salida." : "Solicitá un código nuevo para registrar tu salida.") : "Después del ingreso podrás generar el QR de salida."}</small>
        <button type="button" className="reserva-qr-dismiss" onClick={onClose}>Cerrar</button>
      </section>
    </ModalPortal>
  );
}
