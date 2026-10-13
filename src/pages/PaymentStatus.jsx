import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { PagosBuscar, PagosGetById } from "../servicies/API_Pagos";
import { ReservasGetById, ReservasLiberarRetencion } from "../servicies/API_Reserva";
import { useAuth } from "../contexts/useAuth";
import { ROLE_NAMES, userHasRole } from "../helpers/roles";

const formatearImporte = (importe) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(importe) || 0);

const formatearFecha = (iso) => {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
};

const estadoClase = (estado) =>
  String(estado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-");

function EstadoBadge({ estado }) {
  const texto = estado || "desconocido";
  return <span className={`mpt-badge mpt-badge--${estadoClase(texto)}`}>{texto}</span>;
}

function copiar(texto) {
  navigator.clipboard.writeText(texto).then(
    () => Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Copiado", showConfirmButton: false, timer: 1800 }),
    () => Swal.fire({ toast: true, position: "top-end", icon: "error", title: "No se pudo copiar", showConfirmButton: false, timer: 1800 })
  );
}

function extraerParams(searchParams) {
  // MP puede enviar payment_id, collection_id, preference_id, external_reference, status, collection_status, merchant_order_id
  const get = (keys) => {
    for (const k of keys) {
      const v = searchParams.get(k);
      if (v) return v;
    }
    return null;
  };
  return {
    paymentId: get(["payment_id", "paymentId", "collection_id", "collectionId", "data.id"]),
    preferenceId: get(["preference_id", "preferenceId", "preference-id"]),
    externalReference: get(["external_reference", "externalReference"]),
    statusHint: get(["status", "collection_status", "collectionStatus"]),
    merchantOrderId: get(["merchant_order_id", "merchantOrderId"]),
  };
}

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  // Los accesos a paneles internos solo se muestran al rol dueño de cada panel.
  const esEmpleado = userHasRole(usuario, ROLE_NAMES.EMPLEADO);
  const esSuperadmin = userHasRole(usuario, ROLE_NAMES.SUPERADMIN);

  const params = useMemo(() => extraerParams(searchParams), [searchParams]);
  const ruta = location.pathname; // /payment/success | /failure | /pending

  const [loading, setLoading] = useState(false);
  const [buscandoPorOrder, setBuscandoPorOrder] = useState(false);
  const [pago, setPago] = useState(null);
  const [estadoReserva, setEstadoReserva] = useState(null);
  const [retencionReserva, setRetencionReserva] = useState(null);
  const [liberandoReserva, setLiberandoReserva] = useState(false);
  const [verificandoReserva, setVerificandoReserva] = useState(false);
  const [error, setError] = useState(null);
  const [intentoExterno, setIntentoExterno] = useState(false);

  const [manualPaymentId, setManualPaymentId] = useState("");
  const [manualOrderId, setManualOrderId] = useState(() => {
    try {
      return params.externalReference || sessionStorage.getItem("mp_pending_orderId") || localStorage.getItem("mp_last_orderId") || "";
    } catch {
      return params.externalReference || "";
    }
  });

  // Sincronizar manualOrderId si llega external_reference en URL
  useEffect(() => {
    if (params.externalReference && !manualOrderId) setManualOrderId(params.externalReference);
  }, [params.externalReference]); // eslint-disable-line

  const variant = useMemo(() => {
    if (ruta.includes("failure")) return "failure";
    if (ruta.includes("pending")) return "pending";
    return "success";
  }, [ruta]);

  const tituloPorRuta = {
    success: "Pago recibido",
    failure: "Pago no aprobado",
    pending: "Pago pendiente",
  };

  const fetchByPaymentId = async (pid, { fallbackExternalRef } = {}) => {
    if (!pid) return;
    // Si parece merchant_order/otro, avisar
    if (pid.includes(';') || (pid.includes('T') && pid.includes('UTC'))) {
      setError({ tipo: "api", mensaje: `El valor "${pid.slice(0, 40)}" no es un payment_id válido. Usá el Order ID para buscar.`, hint: "Copia el Order ID (TEST-...) y usa 'Buscar por Order ID'. El payment_id es numérico del comprobante." });
      if (fallbackExternalRef) fetchByExternalReference(fallbackExternalRef);
      return;
    }
    setLoading(true);
    setError(null);
    setPago(null);
    const res = await PagosGetById(String(pid).trim());
    setLoading(false);
    if (!res.respuesta) {
      const msg = res.datos?.message || res.datos?.error || "No se pudo verificar el pago";
      const code = res.datos?.code;
      const status = res.status || res.datos?.statusCode;
      if (status === 401) {
        setError({ tipo: "auth", mensaje: "Necesitas iniciar sesión para verificar el pago. Iniciá sesión y volverás aquí automáticamente." });
        try {
          sessionStorage.setItem("mp_pending_query", location.search);
          sessionStorage.setItem("mp_pending_path", location.pathname);
        } catch {}
        return;
      }
      if ((status === 404 || code === 'payment_not_found' || code === 'invalid_payment_id') && fallbackExternalRef) {
        setError({ tipo: "api", mensaje: `${msg}. Intentando por Order ID ${fallbackExternalRef}...`, detalle: JSON.stringify(res.datos, null, 2) });
        // fallback automático tras 1s
        setTimeout(() => fetchByExternalReference(fallbackExternalRef), 900);
        return;
      }
      setError({ tipo: status === 404 ? "notfound" : "api", mensaje: msg, detalle: JSON.stringify(res.datos, null, 2), hint: status === 404 ? "Si acabas de pagar, esperá 5-10 s y reintentá o usá Buscar por Order ID." : undefined });
      return;
    }
    const data = res.datos?.payment || res.datos;
    setPago(data);
  };

  const fetchByExternalReference = async (extRef) => {
    if (!extRef) return;
    setBuscandoPorOrder(true);
    setError(null);
    setPago(null);
    setIntentoExterno(true);
    const res = await PagosBuscar({ external_reference: String(extRef).trim() });
    if (!res.respuesta) {
      setBuscandoPorOrder(false);
      setError({ tipo: "api", mensaje: res.datos?.message || "No se pudo buscar por Order ID" });
      return;
    }
    const lista = res.datos?.results || res.datos?.pagos || [];
    const arr = Array.isArray(lista) ? lista : [];
    if (!arr.length) {
      setBuscandoPorOrder(false);
      setError({ tipo: "notfound", mensaje: `No se encontró ningún pago para external_reference "${extRef}"`, hint: "Si acabas de pagar, esperá 5-10 segundos y reintentá. Mercado Pago puede tardar en reflejarlo." });
      return;
    }
    const candidato = arr[0];
    const pid = String(candidato.id || candidato.mp_payment_id || "").trim();
    if (!pid) {
      setBuscandoPorOrder(false);
      setError({ tipo: "api", mensaje: "El pago encontrado no tiene ID válido", detalle: JSON.stringify(candidato, null, 2) });
      return;
    }
    // Ahora verificar el detalle completo
    const verif = await PagosGetById(pid);
    setBuscandoPorOrder(false);
    if (!verif.respuesta) {
      setError({ tipo: "api", mensaje: verif.datos?.message || "Se encontró el pago pero no se pudo verificar el detalle" });
      return;
    }
    setPago(verif.datos?.payment || verif.datos);
  };

  // Auto verificación al montar si hay params (con fallback 404 -> external_reference)
  useEffect(() => {
    const pid = params.paymentId?.trim();
    const ext = params.externalReference?.trim();
    if (pid) {
      fetchByPaymentId(pid, { fallbackExternalRef: ext || undefined });
    } else if (ext) {
      fetchByExternalReference(ext);
    } else {
      // Intentar recuperar de sessionStorage/localStorage si el usuario recargó
      try {
        const pendingPid = sessionStorage.getItem("mp_pending_paymentId");
        const pendingOid = sessionStorage.getItem("mp_pending_orderId") || localStorage.getItem("mp_last_orderId");
        if (pendingPid) fetchByPaymentId(pendingPid);
        else if (pendingOid && !intentoExterno) {
          // No auto-buscar para no sorprender, solo sugerir
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.paymentId, params.externalReference]);

  const handleManualPago = () => {
    const pid = manualPaymentId.trim();
    if (!pid) {
      Swal.fire({ toast: true, position: "top-end", icon: "warning", title: "Ingresá un payment_id", showConfirmButton: false, timer: 2000 });
      return;
    }
    navigate(`${location.pathname}?payment_id=${encodeURIComponent(pid)}`, { replace: true });
    fetchByPaymentId(pid);
  };

  const handleManualOrder = () => {
    const oid = manualOrderId.trim();
    if (!oid) {
      Swal.fire({ toast: true, position: "top-end", icon: "warning", title: "Ingresá un Order ID", showConfirmButton: false, timer: 2000 });
      return;
    }
    navigate(`${location.pathname}?external_reference=${encodeURIComponent(oid)}`, { replace: true });
    fetchByExternalReference(oid);
  };

  const estado = pago?.status || pago?.mp_payment_status || null;
  const esAprobado = estado === "approved";
  const esRechazado = estado === "rejected" || estado === "cancelled" || estado === "charged_back";
  const esPendiente = estado === "pending" || estado === "in_process" || estado === "authorized";
  const referenciaReserva = pago?.externalReference || pago?.external_reference || "";
  const idReservaPago = /^reserva-(\d+)$/.exec(referenciaReserva)?.[1] || null;

  useEffect(() => {
    if (!pago || !idReservaPago) return undefined;
    let activo = true;
    const verificarReserva = async () => {
      setVerificandoReserva(true);
      const resultado = await ReservasGetById(idReservaPago, { force: true });
      if (!activo) return;
      const reserva = resultado.datos?.data ?? resultado.datos?.reserva ?? resultado.datos;
      setEstadoReserva(resultado.respuesta ? reserva?.estado_reserva ?? reserva?.estado ?? null : null);
      setRetencionReserva(resultado.respuesta ? reserva?.retencion_pago_hasta ?? null : null);
      setVerificandoReserva(false);
    };
    void verificarReserva();
    return () => { activo = false; };
  }, [pago, idReservaPago]);

  const handleLiberarReserva = async () => {
    if (!idReservaPago || liberandoReserva) return;
    const confirmacion = await Swal.fire({
      title: "¿Liberar el lugar retenido?",
      text: "Tu reserva quedará cancelada y el lugar vuelve a estar disponible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, liberar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmacion.isConfirmed) return;
    setLiberandoReserva(true);
    const resultado = await ReservasLiberarRetencion(idReservaPago);
    setLiberandoReserva(false);
    if (resultado.respuesta) {
      setEstadoReserva("cancelada");
      setRetencionReserva(null);
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "El lugar retenido fue liberado", showConfirmButton: false, timer: 2500 });
    } else {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: resultado.datos?.message || "No se pudo liberar el lugar retenido", showConfirmButton: false, timer: 3000 });
    }
  };

  return (
    <div className="mpt-page" style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: '"DM Sans", sans-serif', padding: "32px 4% 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #E2E8F0", background: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#475569", fontWeight: 600, fontSize: 13, marginBottom: 18 }}
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: variant === "failure" ? "#FEF2F2" : variant === "pending" ? "#FEFCE8" : "#F0FDF4",
                color: variant === "failure" ? "#B91C1C" : variant === "pending" ? "#B45309" : "#15803D",
                flexShrink: 0,
              }}
            >
              {variant === "failure" ? <XCircle size={22} /> : variant === "pending" ? <Clock3 size={22} /> : <BadgeCheck size={22} />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#2563EB" }}>
                Mercado Pago · Checkout Pro
              </span>
              <h1 style={{ margin: "4px 0 6px", fontSize: 24, fontWeight: 800, color: "#1E293B" }}>{tituloPorRuta[variant]}</h1>
              <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
                {variant === "success" && "Si pagaste correctamente, aquí se verifica el estado real del pago consultando al backend (no solo la URL)."}
                {variant === "failure" && "El pago fue rechazado o cancelado. Podés verificar el motivo e intentarlo nuevamente."}
                {variant === "pending" && "El pago quedó pendiente (ej. efectivo o transferencia). Se acreditará cuando Mercado Pago lo confirme."}
              </p>
            </div>
          </div>

          {/* Params recibidos */}
          <div style={{ marginTop: 18, background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <strong style={{ fontSize: 12, color: "#475569", letterSpacing: 0.4, textTransform: "uppercase" }}>Parámetros recibidos de Mercado Pago</strong>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", gap: "6px 10px", fontSize: 13, alignItems: "center" }}>
              <span style={{ color: "#475569", fontWeight: 600 }}>payment_id</span>
              <code style={{ background: "#DBEAFE", color: "#2563EB", padding: "2px 6px", borderRadius: 5, wordBreak: "break-all" }}>{params.paymentId || "—"}</code>
              {params.paymentId ? <button type="button" onClick={() => copiar(params.paymentId)} style={{ border: "none", background: "#DBEAFE", color: "#2563EB", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><Copy size={12} /> Copiar</button> : <span />}
              <span style={{ color: "#475569", fontWeight: 600 }}>preference_id</span>
              <code style={{ background: "#DBEAFE", color: "#2563EB", padding: "2px 6px", borderRadius: 5, wordBreak: "break-all" }}>{params.preferenceId || "—"}</code>
              {params.preferenceId ? <button type="button" onClick={() => copiar(params.preferenceId)} style={{ border: "none", background: "#DBEAFE", color: "#2563EB", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><Copy size={12} /> Copiar</button> : <span />}
              <span style={{ color: "#475569", fontWeight: 600 }}>external_reference</span>
              <code style={{ background: "#DBEAFE", color: "#2563EB", padding: "2px 6px", borderRadius: 5, wordBreak: "break-all" }}>{params.externalReference || "—"}</code>
              {params.externalReference ? <button type="button" onClick={() => copiar(params.externalReference)} style={{ border: "none", background: "#DBEAFE", color: "#2563EB", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><Copy size={12} /> Copiar</button> : <span />}
              <span style={{ color: "#475569", fontWeight: 600 }}>status hint</span>
              <span style={{ color: "#475569" }}>{params.statusHint || "—"}</span>
              <span />
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>URL completa: <code style={{ wordBreak: "break-all", background: "#fff", padding: "2px 6px", borderRadius: 5, border: "1px solid #E2E8F0" }}>{location.pathname + location.search || "/payment/success"}</code></div>
          </div>
        </div>

        {/* Loading */}
        {(loading || buscandoPorOrder) && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, display: "flex", alignItems: "center", gap: 12, color: "#475569", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", marginBottom: 18 }}>
            <Loader2 className="mpt-spin" size={20} style={{ animation: "mpt-rotate 1s linear infinite" }} />
            <span style={{ fontWeight: 600 }}>{buscandoPorOrder ? `Buscando pago con external_reference "${manualOrderId || params.externalReference}"…` : `Verificando pago ${params.paymentId || manualPaymentId}…`}</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && !buscandoPorOrder && (
          <div style={{ background: error.tipo === "auth" ? "#DBEAFE" : "#FEF2F2", border: `1px solid ${error.tipo === "auth" ? "#DBEAFE" : "#FECACA"}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ color: error.tipo === "auth" ? "#2563EB" : "#B91C1C", marginTop: 2 }}>{error.tipo === "auth" ? <Wallet size={20} /> : <AlertTriangle size={20} />}</div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: "#1E293B", fontSize: 14 }}>{error.tipo === "auth" ? "Autenticación requerida" : error.tipo === "notfound" ? "Pago no encontrado" : "No se pudo verificar el pago"}</strong>
                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{error.mensaje}</p>
                {error.hint && <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 12.5 }}>{error.hint}</p>}
                {error.detalle && (
                  <details style={{ marginTop: 10, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 10px" }}>
                    <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#475569" }}>Ver detalle técnico</summary>
                    <pre style={{ margin: "8px 0 0", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#475569", maxHeight: 200, overflowY: "auto" }}>{error.detalle}</pre>
                  </details>
                )}
                {error.tipo === "auth" && (
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                    style={{ marginTop: 12, background: "#1E293B", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <ExternalLink size={16} /> Ir a login
                  </button>
                )}
                {error.tipo !== "auth" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => (params.paymentId ? fetchByPaymentId(params.paymentId) : params.externalReference ? fetchByExternalReference(params.externalReference) : null)}
                      style={{ background: "#1E293B", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <RefreshCw size={15} /> Reintentar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pago verificado */}
        {idReservaPago && pago ? (
          <div style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 16, padding: 18, marginBottom: 18 }} role="status">
            <strong style={{ color: "#1E293B" }}>Reserva #{idReservaPago}</strong>
            <p style={{ margin: "8px 0 14px", color: "#475569" }}>
              {verificandoReserva ? "Verificando la confirmación de tu reserva..." : estadoReserva === "confirmada"
                ? "Tu reserva está confirmada. Ya podés verla en tu panel."
                : estadoReserva === "expirada"
                  ? "La reserva expiró porque el pago no se completó dentro del tiempo de retención. Podés crear una nueva reserva."
                  : estadoReserva === "pendiente_pago" && (esRechazado || variant === "failure")
                    ? `El pago no se concretó, pero el lugar sigue retenido${retencionReserva ? ` hasta ${formatearFecha(retencionReserva)}` : ""}. Si no pagás en ese plazo, se libera solo.`
                    : esAprobado
                      ? "El pago está aprobado, pero la reserva aún no figura confirmada. Volvé a verificar su estado."
                      : "La reserva se confirmará cuando el pago sea aprobado y siga vigente."}
            </p>
            {estadoReserva === "pendiente_pago" && (esRechazado || variant === "failure") && (
              <button type="button" onClick={handleLiberarReserva} disabled={liberandoReserva} style={{ border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", background: "#fef2f2", color: "#b91c1c", fontWeight: 700, cursor: "pointer", marginRight: 10 }}>
                {liberandoReserva ? "Liberando..." : "Liberar el lugar retenido"}
              </button>
            )}
            {esEmpleado && (
              <button type="button" onClick={() => navigate("/empleados_dashboard")} style={{ border: 0, borderRadius: 10, padding: "10px 14px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Ver mis reservas</button>
            )}
          </div>
        ) : null}
        {pago && !loading && !buscandoPorOrder && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
              border: "1px solid #E2E8F0",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ color: esAprobado ? "#15803D" : esRechazado ? "#B91C1C" : esPendiente ? "#B45309" : "#2563EB", marginTop: 2 }}>
                {esAprobado ? <CheckCircle2 size={28} /> : esRechazado ? <XCircle size={28} /> : esPendiente ? <Clock3 size={28} /> : <Wallet size={28} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <EstadoBadge estado={estado} />
                  {pago.statusDetail || pago.status_detail ? <span style={{ color: "#475569", fontSize: 13 }}>{pago.statusDetail || pago.status_detail}</span> : null}
                </div>
                <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px 16px", margin: "14px 0 0" }}>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569" }}>ID pago</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#1E293B", wordBreak: "break-all" }}>{pago.id || pago.mp_payment_id}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569" }}>Monto</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{formatearImporte(pago.transactionAmount ?? pago.transaction_amount ?? pago.monto)}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569" }}>Método</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#475569" }}>{pago.paymentType || pago.payment_type_id || pago.mp_payment_type || "—"}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569" }}>Aprobado</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#475569" }}>{formatearFecha(pago.dateApproved || pago.date_approved || pago.fecha_aprobacion)}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569" }}>Referencia</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#475569", wordBreak: "break-all" }}>{pago.externalReference || pago.external_reference || pago.id_orden_externa || "—"}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569" }}>Preferencia</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#475569", wordBreak: "break-all" }}>{pago.preferenceId || pago.preference_id || "—"}</dd>
                  </div>
                </dl>
                {esAprobado && (
                  <div style={{ marginTop: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 12px", color: "#15803D", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                    <BadgeCheck size={16} /> Pago acreditado correctamente. Ya podés continuar.
                  </div>
                )}
                {esPendiente && (
                  <div style={{ marginTop: 14, background: "#FEFCE8", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 12px", color: "#B45309", fontSize: 13 }}>
                    Pago pendiente de acreditación. Revisá más tarde en <strong>Consultar pagos</strong> con el Order ID.
                  </div>
                )}
                {esRechazado && (
                  <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px", color: "#B91C1C", fontSize: 13 }}>
                    Pago no aprobado. Motivo: <strong>{pago.statusDetail || pago.status_detail || estado}</strong>. Podés generar una nueva preferencia.
                  </div>
                )}
              </div>
            </div>
            <details style={{ marginTop: 16, border: "1px solid #E2E8F0", borderRadius: 10, background: "#F1F5F9", overflow: "hidden" }}>
              <summary style={{ cursor: "pointer", padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Ver respuesta cruda</summary>
              <pre style={{ margin: 0, padding: 14, background: "#1E293B", color: "#A5F3FC", fontSize: 12, overflowX: "auto", fontFamily: '"JetBrains Mono", Consolas, monospace' }}>{JSON.stringify(pago, null, 2)}</pre>
            </details>
          </div>
        )}

        {/* Estado vacío / sin params */}
        {!pago && !loading && !buscandoPorOrder && !error && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", marginBottom: 18, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#DBEAFE", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CreditCard size={26} />
            </div>
            <strong style={{ color: "#1E293B", fontSize: 16 }}>Aún no hay pago para verificar</strong>
            <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
              Llegaste sin <code>payment_id</code>. Si acabas de pagar, usá tu <code>Order ID</code> para buscar el pago o ingresá el <code>payment_id</code> manualmente.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{ marginTop: 14, background: "#2563EB", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <ArrowLeft size={16} /> Volver al inicio
            </button>
          </div>
        )}

        {/* Verificación manual – siempre visible */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", marginBottom: 18 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={16} /> Verificación manual
          </h3>
          <p style={{ margin: "0 0 14px", color: "#475569", fontSize: 13 }}>Funciona sin webhook y sin volver desde Mercado Pago. Ideal para sandbox en localhost.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end", marginBottom: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                <CreditCard size={14} /> Payment ID
              </span>
              <input
                type="text"
                value={manualPaymentId}
                onChange={(e) => setManualPaymentId(e.target.value)}
                placeholder="ej: 12345678901"
                className="mpt-input" style={{ border: "1px solid #E2E8F0", background: "#F1F5F9", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}
              />
            </label>
            <button
              type="button"
              onClick={handleManualPago}
              disabled={loading || !manualPaymentId.trim()}
              style={{ background: "#1E293B", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, opacity: !manualPaymentId.trim() ? 0.5 : 1 }}
            >
              <Search size={16} /> Verificar
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                <Wallet size={14} /> Order ID (external_reference)
              </span>
              <input
                type="text"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value)}
                placeholder="ej: TEST-123456789"
                className="mpt-input" style={{ border: "1px solid #E2E8F0", background: "#F1F5F9", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}
              />
            </label>
            <button
              type="button"
              onClick={handleManualOrder}
              disabled={buscandoPorOrder || !manualOrderId.trim()}
              style={{ background: "#fff", color: "#475569", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, opacity: !manualOrderId.trim() ? 0.5 : 1 }}
            >
              {buscandoPorOrder ? <Loader2 className="mpt-spin" size={16} /> : <Search size={16} />}
              Buscar
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            Tip sandbox: el <code>payment_id</code> figura en el comprobante de Mercado Pago y también en la URL si haces clic en <strong>“Volver al sitio”</strong>. El <code>Order ID</code> es el que generaste al crear la preferencia (ej: <code>TEST-...</code>).
          </div>
        </div>

        {/* Acciones finales — solo visibles para el rol dueño de cada panel */}
        {esSuperadmin && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/superadmin/pagos-test")}
              style={{ flex: "1 1 180px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#475569" }}
            >
              <Wallet size={16} /> Ir a Testing de Pagos
            </button>
            <button
              type="button"
              onClick={() => navigate("/superadmin_dashboard")}
              style={{ flex: "1 1 180px", background: "#1E293B", color: "#fff", border: "none", borderRadius: 10, padding: "11px 14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <ArrowLeft size={16} /> Volver al dashboard
            </button>
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#475569" }}>
          Modo sandbox: usá tarjetas de prueba Visa <code>4509 9535 6623 3704</code> · CVV 123 · titular APRO · vencimiento futuro. Sin webhook en localhost: la verificación es por <code>GET /api/payments/:paymentId</code> o <code>GET /api/payments?external_reference=</code>.
        </div>
      </div>

      <style>{`@keyframes mpt-rotate{to{transform:rotate(360deg)}} .mpt-spin{animation:mpt-rotate 1s linear infinite} .mpt-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;text-transform:capitalize} .mpt-badge--approved{background:#DCFCE7;color:#15803D} .mpt-badge--pending,.mpt-badge--in-process,.mpt-badge--authorized{background:#FEF3C7;color:#B45309} .mpt-badge--rejected,.mpt-badge--cancelled,.mpt-badge--charged-back{background:#FEE2E2;color:#B91C1C} .mpt-badge--refunded{background:#EDE9FE;color:#6D28D9} .mpt-page button:focus-visible{outline:3px solid rgba(37,99,235,0.35);outline-offset:2px} .mpt-page .mpt-input{outline:none} .mpt-page .mpt-input:focus-visible{outline:3px solid rgba(37,99,235,0.35);outline-offset:1px}`}</style>
    </div>
  );
}
