import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import { ReservasCheckInQr, ReservasCheckOutQr } from "../servicies/API_Reserva";
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

export default function LectorQrReserva({ tipo = "ingreso", onClose, onIngresoExitoso, onSalidaExitosa }) {
  const [estado, setEstado] = useState("iniciando");
  const [error, setError] = useState("");
  const lectorRef = useRef(null);
  const inicioRef = useRef(null);
  const limpiezasRef = useRef(new WeakMap());
  const montadoRef = useRef(false);
  const iniciandoRef = useRef(false);
  const operacionEnCursoRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onIngresoExitosoRef = useRef(onIngresoExitoso);
  const onSalidaExitosaRef = useRef(onSalidaExitosa);
  const controlRef = useRef(crearControlLecturasQr());

  useEffect(() => {
    onCloseRef.current = onClose;
    onIngresoExitosoRef.current = onIngresoExitoso;
    onSalidaExitosaRef.current = onSalidaExitosa;
  }, [onClose, onIngresoExitoso, onSalidaExitosa]);

  const cerrar = useCallback(() => {
    if (operacionEnCursoRef.current) return;
    onCloseRef.current?.();
  }, []);

  const detenerCamara = useCallback(async (lectorSolicitado) => {
    const lector = lectorSolicitado ?? lectorRef.current;
    if (!lector) return;

    if (lectorRef.current === lector) lectorRef.current = null;

    const inicio = inicioRef.current;
    if (inicio?.lector === lector && inicio.startPendiente) {
      inicio.detenerAlResolver = true;
      return;
    }

    const limpiezaExistente = limpiezasRef.current.get(lector);
    if (limpiezaExistente) {
      await limpiezaExistente;
      return;
    }

    const limpieza = Promise.resolve().then(async () => {
      try { await lector.stop(); } catch { /* El lector puede estar detenido o haber rechazado el inicio. */ }
      try { lector.clear(); } catch { /* El contenedor puede haberse desmontado. */ }
    });
    limpiezasRef.current.set(lector, limpieza);
    await limpieza;
  }, []);

  const procesarContenido = useCallback(async (contenido) => {
    const qr = String(contenido || "").trim();
    if (!controlRef.current.intentar(qr)) return;

    operacionEnCursoRef.current = true;
    setEstado("verificando");
    setError("");

    try {
      await detenerCamara();
      if (!montadoRef.current) return;

      const esSalida = tipo === "salida";
      const resultado = await (esSalida ? ReservasCheckOutQr(qr) : ReservasCheckInQr(qr));
      if (!montadoRef.current) return;

      if (resultado.respuesta) {
        showToast(resultado.datos?.message || `${esSalida ? "Salida" : "Ingreso"} verificado correctamente.`, "success");
        if (esSalida) onSalidaExitosaRef.current?.(resultado.datos);
        else onIngresoExitosoRef.current?.(resultado.datos);
        onCloseRef.current?.();
        return;
      }

      setError(resultado.datos?.message || `No se pudo registrar ${esSalida ? "la salida" : "el ingreso"} con este código.`);
      setEstado("error");
    } finally {
      operacionEnCursoRef.current = false;
      controlRef.current.habilitarReintento();
    }
  }, [detenerCamara, tipo]);

  const iniciarCamara = useCallback(async () => {
    if (!montadoRef.current || iniciandoRef.current || lectorRef.current) return;
    iniciandoRef.current = true;
    const inicio = { cancelado: false, lector: null, startPendiente: false, detenerAlResolver: false };
    inicioRef.current = inicio;
    setEstado("iniciando");
    setError("");

    let lector = null;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (inicio.cancelado || !montadoRef.current) return;

      lector = new Html5Qrcode(READER_ID, false);
      inicio.lector = lector;
      lectorRef.current = lector;
      inicio.startPendiente = true;
      await lector.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (contenido) => { void procesarContenido(contenido); },
        () => {}
      );
      inicio.startPendiente = false;

      if (inicio.cancelado || inicio.detenerAlResolver || !montadoRef.current) await detenerCamara(lector);
      else setEstado("escaneando");
    } catch (cameraError) {
      inicio.startPendiente = false;
      await detenerCamara(lector);
      if (montadoRef.current && !inicio.cancelado) {
        setError(mensajeCamara(cameraError));
        setEstado("error");
        controlRef.current.habilitarReintento();
      }
    } finally {
      if (inicioRef.current === inicio) {
        inicioRef.current = null;
        iniciandoRef.current = false;
      }
    }
  }, [detenerCamara, procesarContenido]);

  useEffect(() => {
    montadoRef.current = true;
    queueMicrotask(() => { if (montadoRef.current) void iniciarCamara(); });
    return () => {
      montadoRef.current = false;
      const inicio = inicioRef.current;
      if (inicio) {
        inicio.cancelado = true;
        if (!inicio.lector && inicioRef.current === inicio) {
          inicioRef.current = null;
          iniciandoRef.current = false;
        }
      }
      void detenerCamara();
    };
  }, [detenerCamara, iniciarCamara]);

  const reintentar = () => {
    controlRef.current.habilitarReintento();
    void iniciarCamara();
  };

  return (
    <ModalPortal onClose={cerrar} overlayClassName="lector-qr-overlay">
      <section className="lector-qr-modal" role="dialog" aria-modal="true" aria-labelledby="lector-qr-title" onClick={(event) => event.stopPropagation()}>
        <div className="lector-qr-header">
          <div><h2 id="lector-qr-title">Escanear QR de {tipo}</h2></div>
          <button type="button" className="lector-qr-close disabled:opacity-50 disabled:cursor-not-allowed" onClick={cerrar} disabled={estado === "verificando"} aria-label="Cerrar lector QR"><X size={20} /></button>
        </div>
        <p className="lector-qr-help">Apuntá la cámara al código que muestra el empleado para registrar {tipo === "salida" ? "su salida" : "su ingreso"}.</p>

        <div className="lector-qr-viewport">
          <div id={READER_ID} className="lector-qr-reader" />
          {estado === "iniciando" ? <div className="lector-qr-status" role="status"><Camera size={28} />Iniciando cámara...</div> : null}
          {estado === "verificando" ? <div className="lector-qr-status lector-qr-status--processing" role="status">Verificando {tipo}...</div> : null}
        </div>

        {error ? <p className="lector-qr-error" role="alert">{error}</p> : null}
        {estado === "error" ? (
          <button type="button" className="lector-qr-retry" onClick={reintentar}><RefreshCw size={18} />Reintentar</button>
        ) : null}
      </section>
    </ModalPortal>
  );
}
