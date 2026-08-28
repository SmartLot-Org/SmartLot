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

  const params = useMemo(() => extraerParams(searchParams), [searchParams]);
  const ruta = location.pathname; // /payment/success | /failure | /pending

  const [loading, setLoading] = useState(false);
  const [buscandoPorOrder, setBuscandoPorOrder] = useState(false);
  const [pago, setPago] = useState(null);
  const [error, setError] = useState(null);
  const [intentoExterno, setIntentoExterno] = useState(false);

  const [manualPaymentId, setManualPaymentId] = useState("");
  const [manualOrderId, setManualOrderId] = useState(() => {
    try {
      return localStorage.getItem("mp_last_orderId") || params.externalReference || "";
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
      setError({ tipo: "api", mensaje: `El valor "${pid.slice(0, 40)}" no es un payment_id válido. Usa el Order ID para buscar.`, hint: "Copia el Order ID (TEST-...) y usa 'Buscar por Order ID'. El payment_id es numérico del comprobante." });
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
      setError({ tipo: status === 404 ? "notfound" : "api", mensaje: msg, detalle: JSON.stringify(res.datos, null, 2), hint: status === 404 ? "Si acabas de pagar, espera 5-10s y reintenta o usa Buscar por Order ID." : undefined });
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
      setError({ tipo: "notfound", mensaje: `No se encontró ningún pago para external_reference "${extRef}"`, hint: "Si acabas de pagar, espera 5-10 segundos y reintenta. Mercado Pago puede tardar en reflejarlo." });
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

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: '"DM Sans", sans-serif', padding: "32px 4% 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #E2E8F0", background: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#334155", fontWeight: 600, fontSize: 13, marginBottom: 18 }}
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
                background: variant === "failure" ? "#FEF2F2" : variant === "pending" ? "#FFF7ED" : "#F0FDF4",
                color: variant === "failure" ? "#DC2626" : variant === "pending" ? "#D97706" : "#16A34A",
                flexShrink: 0,
              }}
            >
              {variant === "failure" ? <XCircle size={22} /> : variant === "pending" ? <Clock3 size={22} /> : <BadgeCheck size={22} />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#2563EB" }}>
                Mercado Pago · Checkout Pro
              </span>
              <h1 style={{ margin: "4px 0 6px", fontSize: 24, fontWeight: 800, color: "#0F1A2E" }}>{tituloPorRuta[variant]}</h1>
              <p style={{ margin: 0, color: "#64748B", fontSize: 14, lineHeight: 1.5 }}>
                {variant === "success" && "Si pagaste correctamente, aquí se verifica el estado real del pago consultando al backend (no solo la URL)."}
                {variant === "failure" && "El pago fue rechazado o cancelado. Puedes verificar el motivo e intentarlo nuevamente."}
                {variant === "pending" && "El pago quedó pendiente (ej. efectivo o transferencia). Se acreditará cuando Mercado Pago lo confirme."}
              </p>
            </div>
          </div>

          {/* Params recibidos */}
          <div style={{ marginTop: 18, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <strong style={{ fontSize: 12, color: "#475569", letterSpacing: 0.4, textTransform: "uppercase" }}>Parámetros recibidos de Mercado Pago</strong>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", gap: "6px 10px", fontSize: 13, alignItems: "center" }}>
              <span style={{ color: "#64748B", fontWeight: 600 }}>payment_id</span>
              <code style={{ background: "#EEF2FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: 5, wordBreak: "break-all" }}>{params.paymentId || "—"}</code>
              {params.paymentId ? <button type="button" onClick={() => copiar(params.paymentId)} style={{ border: "none", background: "#EFF6FF", color: "#2563EB", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><Copy size={12} /> Copiar</button> : <span />}
              <span style={{ color: "#64748B", fontWeight: 600 }}>preference_id</span>
              <code style={{ background: "#EEF2FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: 5, wordBreak: "break-all" }}>{params.preferenceId || "—"}</code>
              {params.preferenceId ? <button type="button" onClick={() => copiar(params.preferenceId)} style={{ border: "none", background: "#EFF6FF", color: "#2563EB", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><Copy size={12} /> Copiar</button> : <span />}
              <span style={{ color: "#64748B", fontWeight: 600 }}>external_reference</span>
              <code style={{ background: "#EEF2FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: 5, wordBreak: "break-all" }}>{params.externalReference || "—"}</code>
              {params.externalReference ? <button type="button" onClick={() => copiar(params.externalReference)} style={{ border: "none", background: "#EFF6FF", color: "#2563EB", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><Copy size={12} /> Copiar</button> : <span />}
              <span style={{ color: "#64748B", fontWeight: 600 }}>status hint</span>
              <span style={{ color: "#334155" }}>{params.statusHint || "—"}</span>
              <span />
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>URL completa: <code style={{ wordBreak: "break-all", background: "#fff", padding: "2px 6px", borderRadius: 5, border: "1px solid #E2E8F0" }}>{location.pathname + location.search || "/payment/success"}</code></div>
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
          <div style={{ background: error.tipo === "auth" ? "#EFF6FF" : "#FEF2F2", border: `1px solid ${error.tipo === "auth" ? "#DBEAFE" : "#FECACA"}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ color: error.tipo === "auth" ? "#2563EB" : "#DC2626", marginTop: 2 }}>{error.tipo === "auth" ? <Wallet size={20} /> : <AlertTriangle size={20} />}</div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: "#0F1A2E", fontSize: 14 }}>{error.tipo === "auth" ? "Autenticación requerida" : error.tipo === "notfound" ? "Pago no encontrado" : "No se pudo verificar el pago"}</strong>
                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{error.mensaje}</p>
                {error.hint && <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 12.5 }}>{error.hint}</p>}
                {error.detalle && (
                  <details style={{ marginTop: 10, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 10px" }}>
                    <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#475569" }}>Ver detalle técnico</summary>
                    <pre style={{ margin: "8px 0 0", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#334155", maxHeight: 200, overflowY: "auto" }}>{error.detalle}</pre>
                  </details>
                )}
                {error.tipo === "auth" && (
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                    style={{ marginTop: 12, background: "#0F1A2E", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <ExternalLink size={16} /> Ir a login
                  </button>
                )}
                {error.tipo !== "auth" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => (params.paymentId ? fetchByPaymentId(params.paymentId) : params.externalReference ? fetchByExternalReference(params.externalReference) : null)}
                      style={{ background: "#0F1A2E", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
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
        {pago && !loading && !buscandoPorOrder && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
              borderLeft: `4px solid ${esAprobado ? "#16A34A" : esRechazado ? "#DC2626" : esPendiente ? "#D97706" : "#2563EB"}`,
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ color: esAprobado ? "#16A34A" : esRechazado ? "#DC2626" : esPendiente ? "#D97706" : "#2563EB", marginTop: 2 }}>
                {esAprobado ? <CheckCircle2 size={28} /> : esRechazado ? <XCircle size={28} /> : esPendiente ? <Clock3 size={28} /> : <Wallet size={28} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <EstadoBadge estado={estado} />
                  {pago.statusDetail || pago.status_detail ? <span style={{ color: "#64748B", fontSize: 13 }}>{pago.statusDetail || pago.status_detail}</span> : null}
                </div>
                <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px 16px", margin: "14px 0 0" }}>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748B" }}>ID pago</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#0F1A2E", wordBreak: "break-all" }}>{pago.id || pago.mp_payment_id}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748B" }}>Monto</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#0F1A2E" }}>{formatearImporte(pago.transactionAmount ?? pago.transaction_amount ?? pago.monto)}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748B" }}>Método</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>{pago.paymentType || pago.payment_type_id || pago.mp_payment_type || "—"}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748B" }}>Aprobado</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>{formatearFecha(pago.dateApproved || pago.date_approved || pago.fecha_aprobacion)}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748B" }}>Referencia</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#334155", wordBreak: "break-all" }}>{pago.externalReference || pago.external_reference || pago.id_orden_externa || "—"}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748B" }}>Preferencia</dt>
                    <dd style={{ margin: "2px 0 0", fontSize: 13, color: "#334155", wordBreak: "break-all" }}>{pago.preferenceId || pago.preference_id || "—"}</dd>
                  </div>
                </dl>
                {esAprobado && (
                  <div style={{ marginTop: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 12px", color: "#15803D", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                    <BadgeCheck size={16} /> Pago acreditado correctamente. Ya puedes continuar.
                  </div>
                )}
                {esPendiente && (
                  <div style={{ marginTop: 14, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 12px", color: "#9A3412", fontSize: 13 }}>
                    Pago pendiente de acreditación. Revisa más tarde en <strong>Consultar pagos</strong> con el Order ID.
                  </div>
                )}
                {esRechazado && (
                  <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px", color: "#B91C1C", fontSize: 13 }}>
                    Pago no aprobado. Motivo: <strong>{pago.statusDetail || pago.status_detail || estado}</strong>. Puedes generar una nueva preferencia.
                  </div>
                )}
              </div>
            </div>
            <details style={{ marginTop: 16, border: "1px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC", overflow: "hidden" }}>
              <summary style={{ cursor: "pointer", padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#475569" }}>Ver respuesta cruda</summary>
              <pre style={{ margin: 0, padding: 14, background: "#0F1A2E", color: "#A5F3FC", fontSize: 12, overflowX: "auto", fontFamily: '"JetBrains Mono", Consolas, monospace' }}>{JSON.stringify(pago, null, 2)}</pre>
            </details>
          </div>
        )}

        {/* Estado vacío / sin params */}
        {!pago && !loading && !buscandoPorOrder && !error && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", marginBottom: 18, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CreditCard size={26} />
            </div>
            <strong style={{ color: "#0F1A2E", fontSize: 16 }}>Aún no hay pago para verificar</strong>
            <p style={{ color: "#64748B", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
              Llegaste sin <code>payment_id</code>. Si acabas de pagar, usa tu <code>Order ID</code> para buscar el pago o ingresa el <code>payment_id</code> manualmente.
            </p>
          </div>
        )}

        {/* Verificación manual – siempre visible */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(15,23,42,0.06)", marginBottom: 18 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#0F1A2E", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={16} /> Verificación manual
          </h3>
          <p style={{ margin: "0 0 14px", color: "#64748B", fontSize: 13 }}>Funciona sin webhook y sin volver desde Mercado Pago. Ideal para sandbox en localhost.</p>

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
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none" }}
              />
            </label>
            <button
              type="button"
              onClick={handleManualPago}
              disabled={loading || !manualPaymentId.trim()}
              style={{ background: "#0F1A2E", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, opacity: !manualPaymentId.trim() ? 0.5 : 1 }}
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
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none" }}
              />
            </label>
            <button
              type="button"
              onClick={handleManualOrder}
              disabled={buscandoPorOrder || !manualOrderId.trim()}
              style={{ background: "#fff", color: "#334155", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, opacity: !manualOrderId.trim() ? 0.5 : 1 }}
            >
              {buscandoPorOrder ? <Loader2 className="mpt-spin" size={16} /> : <Search size={16} />}
              Buscar
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
            Tip sandbox: el <code>payment_id</code> figura en el comprobante de Mercado Pago y también en la URL si haces clic en <strong>“Volver al sitio”</strong>. El <code>Order ID</code> es el que generaste al crear la preferencia (ej: <code>TEST-...</code>).
          </div>
        </div>

        {/* Acciones finales */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate("/superadmin/pagos-test")}
            style={{ flex: "1 1 180px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#334155" }}
          >
            <Wallet size={16} /> Ir a Testing de Pagos
          </button>
          <button
            type="button"
            onClick={() => navigate("/superadmin_dashboard")}
            style={{ flex: "1 1 180px", background: "#0F1A2E", color: "#fff", border: "none", borderRadius: 10, padding: "11px 14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <ArrowLeft size={16} /> Volver al dashboard
          </button>
        </div>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#94A3B8" }}>
          Modo sandbox: usa tarjetas de prueba Visa <code>4509 9535 6623 3704</code> · CVV 123 · titular APRO · vencimiento futuro. Sin webhook en localhost: la verificación es por <code>GET /api/payments/:paymentId</code> o <code>GET /api/payments?external_reference=</code>.
        </div>
      </div>

      <style>{`@keyframes mpt-rotate{to{transform:rotate(360deg)}} .mpt-spin{animation:mpt-rotate 1s linear infinite} .mpt-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;text-transform:capitalize} .mpt-badge--approved{background:#DCFCE7;color:#15803D} .mpt-badge--pending,.mpt-badge--in-process,.mpt-badge--authorized{background:#FEF3C7;color:#B45309} .mpt-badge--rejected,.mpt-badge--cancelled,.mpt-badge--charged-back{background:#FEE2E2;color:#B91C1C} .mpt-badge--refunded{background:#EDE9FE;color:#6D28D9}`}</style>
    </div>
  );
}
