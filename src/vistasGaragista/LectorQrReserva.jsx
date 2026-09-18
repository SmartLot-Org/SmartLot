import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import { ReservasCheckInQr } from "../servicies/API_Reserva";
import { showToast } from "../helpers/toast";
import { crearControlLecturasQr } from "../helpers/qrReserva";
import "./lector_qr_reserva.css";

const READER_ID = "smartlot-qr-reader";

const mensajeCamara = (error) => {
  const detalle = String(error?.message || error || "");
  if (/notallowed|permission|denied|permiso/i.test(detalle)) {
    return "No se pudo acceder a la cámara. Habilitá el permiso en el navegador y volvé a intentar.";
  }
  if (/notfound|devicesnotfound|cámara disponible/i.test(detalle)) {
    return "No se encontró una cámara disponible en este dispositivo.";
  }
  return "No se pudo iniciar la cámara. Revisá los permisos e intentá nuevamente.";
};

export default function LectorQrReserva({ onClose, onIngresoExitoso }) {
  const [estado, setEstado] = useState("iniciando");
  const [error, setError] = useState("");
  const lectorRef = useRef(null);
  const montadoRef = useRef(false);
  const iniciandoRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onIngresoExitosoRef = useRef(onIngresoExitoso);
  const controlRef = useRef(crearControlLecturasQr());

  useEffect(() => {
    onCloseRef.current = onClose;
    onIngresoExitosoRef.current = onIngresoExitoso;
  }, [onClose, onIngresoExitoso]);

  const detenerCamara = useCallback(async () => {
    const lector = lectorRef.current;
    lectorRef.current = null;
    if (!lector) return;
    try { await lector.stop(); } catch { /* El lector puede seguir iniciándose o ya estar detenido. */ }
    try { lector.clear(); } catch { /* El contenedor puede haberse desmontado. */ }
  }, []);

  const procesarContenido = useCallback(async (contenido) => {
    const qr = String(contenido || "").trim();
    if (!controlRef.current.intentar(qr)) return;

    setEstado("verificando");
    setError("");
    await detenerCamara();
    if (!montadoRef.current) return;

    const resultado = await ReservasCheckInQr(qr);
    if (!montadoRef.current) return;

    if (resultado.respuesta) {
      showToast(resultado.datos?.message || "Ingreso verificado correctamente.", "success");
      onIngresoExitosoRef.current?.(resultado.datos);
      onCloseRef.current();
      return;
    }

    setError(resultado.datos?.message || "No se pudo registrar el ingreso con este código.");
    setEstado("error");
    controlRef.current.habilitarReintento();
  }, [detenerCamara]);

  const iniciarCamara = useCallback(async () => {
    if (!montadoRef.current || iniciandoRef.current || lectorRef.current) return;
    iniciandoRef.current = true;
    setEstado("iniciando");
    setError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!montadoRef.current) return;

      const lector = new Html5Qrcode(READER_ID, false);
      lectorRef.current = lector;
      await lector.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (contenido) => { void procesarContenido(contenido); },
        () => {}
      );

      if (!montadoRef.current) await detenerCamara();
      else setEstado("escaneando");
    } catch (cameraError) {
      await detenerCamara();
      if (montadoRef.current) {
        setError(mensajeCamara(cameraError));
        setEstado("error");
        controlRef.current.habilitarReintento();
      }
    } finally {
      iniciandoRef.current = false;
    }
  }, [detenerCamara, procesarContenido]);

  useEffect(() => {
    montadoRef.current = true;
    queueMicrotask(() => { if (montadoRef.current) void iniciarCamara(); });
    return () => {
      montadoRef.current = false;
      void detenerCamara();
    };
  }, [detenerCamara, iniciarCamara]);

  const reintentar = () => {
    controlRef.current.habilitarReintento();
    void iniciarCamara();
  };

  return (
    <ModalPortal onClose={onClose} overlayClassName="lector-qr-overlay">
      <section className="lector-qr-modal" role="dialog" aria-modal="true" aria-labelledby="lector-qr-title" onClick={(event) => event.stopPropagation()}>
        <div className="lector-qr-header">
          <div><span>Control de acceso</span><h2 id="lector-qr-title">Escanear QR</h2></div>
          <button type="button" className="lector-qr-close" onClick={onClose} aria-label="Cerrar lector QR"><X size={20} /></button>
        </div>
        <p className="lector-qr-help">Apuntá la cámara al código que muestra el empleado.</p>

        <div className="lector-qr-viewport">
          <div id={READER_ID} className="lector-qr-reader" />
          {estado === "iniciando" ? <div className="lector-qr-status" role="status"><Camera size={28} />Iniciando cámara...</div> : null}
          {estado === "verificando" ? <div className="lector-qr-status lector-qr-status--processing" role="status">Verificando reserva...</div> : null}
        </div>

        {error ? <p className="lector-qr-error" role="alert">{error}</p> : null}
        {estado === "error" ? (
          <button type="button" className="lector-qr-retry" onClick={reintentar}><RefreshCw size={18} />Reintentar</button>
        ) : null}
      </section>
    </ModalPortal>
  );
}
