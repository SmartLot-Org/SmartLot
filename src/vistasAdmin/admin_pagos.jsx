import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, Building2, ChevronRight, CircleDollarSign, CreditCard, Download, ExternalLink, FileSpreadsheet, FileText, Loader2, ReceiptText, Search, Timer, WalletCards, X } from "lucide-react";
import { initMercadoPago } from "@mercadopago/sdk-react";
import Swal from "sweetalert2";
import Header from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import { CuentasCorrientesAdminGet, CuentasCorrientesSedesGet } from "../servicies/API_CuentasCorrientes";
import { PagosBuscar, PagosCrearPreferencia, PagosGetById } from "../servicies/API_Pagos";
import { exportarCuentasExcel, exportarCuentasPDF } from "../util/exportar_cuentas_corrientes";
import "./admin_pagos.css";

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);

const moneda = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n ?? 0);
const fechaHora = (f) => new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(f));
const nombrePeriodo = (p) => new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${p}-01T00:00:00Z`));
const duracion = (m = 0) => `${Math.floor(m / 60)} h ${m % 60} min`;
const MONTO_MAX_TEST = 0.10;
const montoTest = (n) => {
  const v = Number(n) || 0;
  if (v <= 0) return MONTO_MAX_TEST;
  return Math.min(v, MONTO_MAX_TEST);
};

function DetalleCuenta({ cuenta, onClose, onPagar, pagando }) {
  useEffect(() => {
    if (!cuenta) return undefined;
    const keydown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", keydown); document.body.classList.add("pagos-modal-open");
    return () => { document.removeEventListener("keydown", keydown); document.body.classList.remove("pagos-modal-open"); };
  }, [cuenta, onClose]);
  if (!cuenta) return null;
  const pagada = cuenta.estadoPago === "PAGADA";
  const aCobrar = montoTest(cuenta.importeGenerado);
  return <div className="pagos-drawer-overlay" role="presentation" onMouseDown={onClose}><aside className="pagos-drawer" role="dialog" aria-modal="true" aria-labelledby="detalle-cuenta-titulo" onMouseDown={(e) => e.stopPropagation()}>
    <div className="pagos-drawer__header"><div><span className="pagos-eyebrow">Detalle de consumo</span><h2 id="detalle-cuenta-titulo">{cuenta.garage}</h2><span style={{ marginTop: 6, display: "inline-flex" }}>{pagada ? <span className="pagos-badge pagos-badge--pagada"><BadgeCheck size={14} /> PAGADA</span> : <span className="pagos-badge pagos-badge--pendiente">PENDIENTE DE PAGO</span>}</span></div><button className="pagos-icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle"><X size={20} /></button></div>
    <dl className="pagos-detail-summary"><div><dt>Período</dt><dd>{nombrePeriodo(cuenta.periodo)}</dd></div><div><dt>Sede</dt><dd>{cuenta.sede}</dd></div><div><dt>Tiempo utilizado</dt><dd>{duracion(cuenta.minutosTotales)}</dd></div><div><dt>Importe generado</dt><dd className="pagos-amount">{moneda(cuenta.importeGenerado)}</dd></div></dl>
    <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: pagada ? "#f0fdf4" : "#eff6ff", border: `1px solid ${pagada ? "#bbf7d0" : "#dbeafe"}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: pagada ? "#15803d" : "#1e40af" }}>{pagada ? <BadgeCheck size={16} /> : <CreditCard size={16} />} {pagada ? "Consumo pagado" : "Importe a cobrar (test)"}</strong>
        <span style={{ fontSize: 12, color: pagada ? "#166534" : "#3730a3" }}>{pagada ? "Este período ya fue abonado." : `Sandbox: se cobrará ${moneda(aCobrar)} (cap $0.10) · Original ${moneda(cuenta.importeGenerado)}`}</span>
      </div>
      {!pagada && <button type="button" className="pagos-pay-button" onClick={() => onPagar(cuenta)} disabled={pagando}>{pagando ? <Loader2 size={16} className="pagos-spin" /> : <CreditCard size={16} />} {pagando ? "Creando..." : `PAGAR ${moneda(aCobrar)}`}</button>}
      {pagada && <span className="pagos-badge pagos-badge--pagada" style={{ fontSize: 12 }}><BadgeCheck size={14} /> PAGADA</span>}
    </div>
    <section className="pagos-movements" aria-labelledby="movimientos-titulo"><div className="pagos-movements__title"><ReceiptText size={18} /><h3 id="movimientos-titulo">Reservas utilizadas</h3></div><div className="pagos-movements__list">{cuenta.movimientos.map((m) => <article className="pagos-movement" key={m.idConsumo}><div><strong>Reserva #{m.idReserva} · {m.tipoVehiculo} {m.pagado ? <span className="pagos-badge pagos-badge--pagada" style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px" }}>PAGADA</span> : null}</strong><time dateTime={m.fechaInicio}>{fechaHora(m.fechaInicio)} — {fechaHora(m.fechaFin)} · {m.minutosUtilizados} min · {moneda(m.tarifaHoraAplicada)}/h</time></div><span>{moneda(m.importeGenerado)}</span></article>)}</div></section>
    <p className="pagos-coming-soon" style={{ background: pagada ? "#f0fdf4" : "#eff6ff", border: `1px solid ${pagada ? "#bbf7d0" : "#dbeafe"}`, color: pagada ? "#15803d" : "#1e40af" }}>{pagada ? <BadgeCheck size={18} /> : <CircleDollarSign size={18} />}{pagada ? "Este consumo ya se encuentra pagado. Podés descargar el comprobante desde el historial de pagos." : `Modo test: el cobro real será de ${moneda(aCobrar)} máximo $0.10 para sandbox.`}</p>
    {!pagada && <button type="button" className="pagos-pay-button pagos-pay-button--full" onClick={() => onPagar(cuenta)} disabled={pagando} style={{ marginTop: 14 }}>{pagando ? <Loader2 size={16} className="pagos-spin" /> : <ExternalLink size={16} />} {pagando ? "Abriendo checkout..." : `Pagar con Mercado Pago (sandbox) · ${moneda(aCobrar)}`}</button>}
  </aside></div>;
}

function ExportarModal({ abierto, cantidad, cargando, onClose, onExport }) {
  if (!abierto) return null;
  return <div className="pagos-export-overlay" role="presentation" onMouseDown={() => !cargando && onClose()}><section className="pagos-export-modal" role="dialog" aria-modal="true" aria-labelledby="exportar-titulo" onMouseDown={(e) => e.stopPropagation()}><div className="pagos-export-modal__header"><div><span className="pagos-eyebrow">Exportar información</span><h2 id="exportar-titulo">Elegí un formato</h2></div><button className="pagos-icon-button" type="button" onClick={onClose} disabled={cargando} aria-label="Cerrar exportación"><X size={20} /></button></div><p className="pagos-export-modal__description">Se exportarán los {cantidad} resultados de la consulta actual.</p><div className="pagos-export-options">
    <button className="pagos-export-option pagos-export-option--pdf" type="button" onClick={() => onExport("pdf")} disabled={cargando}><span className="pagos-export-option__icon"><FileText size={27} /></span><span><strong>Documento PDF</strong><small>Reporte listo para compartir</small></span><span className="pagos-export-option__type">.PDF</span></button>
    <button className="pagos-export-option pagos-export-option--excel" type="button" onClick={() => onExport("excel")} disabled={cargando}><span className="pagos-export-option__icon"><FileSpreadsheet size={27} /></span><span><strong>Planilla Excel</strong><small>Datos reales filtrados</small></span><span className="pagos-export-option__type">.XLSX</span></button>
  </div>{cargando && <p className="pagos-export-loading" role="status"><span /> Preparando el archivo…</p>}</section></div>;
}

function AdminPagos() {
  const actual = new Date().toISOString().slice(0, 7);
  const [busqueda, setBusqueda] = useState(""); const [search, setSearch] = useState(""); const [periodo, setPeriodo] = useState(actual); const [idSede, setIdSede] = useState("");
  const [data, setData] = useState({ items: [], summary: { reservasUtilizadas: 0, minutosTotales: 0, importeGenerado: 0 } });
  const [sedes, setSedes] = useState([]); const [cargando, setCargando] = useState(true); const [error, setError] = useState(""); const [reintento, setReintento] = useState(0);
  const [seleccionada, setSeleccionada] = useState(null); const [exportarAbierto, setExportarAbierto] = useState(false); const [exportando, setExportando] = useState(false);
  const [pagandoKey, setPagandoKey] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const pollingBusyRef = useRef(false);
  const pollingAttemptsRef = useRef(0);
  useEffect(() => {
    if (busqueda === search) return undefined;
    const timer = setTimeout(() => {
      setCargando(true);
      setError("");
      setSearch(busqueda);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda, search]);
  useEffect(() => { const c = new AbortController(); CuentasCorrientesSedesGet({ signal: c.signal }).then(setSedes).catch((e) => { if (e.code !== "ERR_CANCELED") setError("No se pudieron cargar las sedes autorizadas."); }); return () => c.abort(); }, []);
  useEffect(() => { const c = new AbortController(); CuentasCorrientesAdminGet({ periodo, idSede, search, signal: c.signal }).then(setData).catch((e) => { if (e.code !== "ERR_CANCELED") setError(e.response?.data?.message || "No se pudieron cargar los consumos."); }).finally(() => { if (!c.signal.aborted) setCargando(false); }); return () => c.abort(); }, [periodo, idSede, search, reintento]);

  const detenerPolling = () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = null;
    pollingBusyRef.current = false;
  };

  const sincronizarPorOrderId = async (orderId) => {
    const resultado = await PagosBuscar({ external_reference: orderId });
    const encontrados = resultado.datos?.results || resultado.datos?.data || [];
    const pagoEncontrado = Array.isArray(encontrados) ? encontrados[0] : null;
    const paymentId = String(pagoEncontrado?.id || pagoEncontrado?.mp_payment_id || "").trim();

    if (!resultado.respuesta || !paymentId) return { sincronizado: false, pago: null };

    const verificacion = await PagosGetById(paymentId);
    return {
      sincronizado: verificacion.respuesta,
      pago: verificacion.respuesta ? verificacion.datos?.payment || pagoEncontrado : null,
    };
  };

  const marcarPagoSincronizado = (pago) => {
    try {
      sessionStorage.removeItem("mp_pending_orderId");
      localStorage.removeItem("mp_last_orderId");
      localStorage.removeItem("mp_last_preferenceId");
    } catch {}
    setCargando(true);
    setReintento((n) => n + 1);
    Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Pago aprobado${pago?.id ? ` (${pago.id})` : ""}. Actualizando consumos…`, showConfirmButton: false, timer: 4000 });
    navigate("/admin_dashboard", { replace: true });
  };

  const iniciarPolling = (orderId) => {
    const oid = String(orderId || "").trim();
    if (!oid) return;
    detenerPolling();
    pollingAttemptsRef.current = 0;

    const revisar = async () => {
      if (pollingBusyRef.current) return;
      pollingBusyRef.current = true;
      pollingAttemptsRef.current += 1;
      try {
        const resultado = await sincronizarPorOrderId(oid);
        if (resultado.pago?.status === "approved") {
          detenerPolling();
          marcarPagoSincronizado(resultado.pago);
        } else if (pollingAttemptsRef.current >= 36) {
          detenerPolling();
        }
      } catch {
        if (pollingAttemptsRef.current >= 36) detenerPolling();
      } finally {
        pollingBusyRef.current = false;
      }
    };

    void revisar();
    pollingRef.current = window.setInterval(revisar, 5000);
  };

  useEffect(() => () => detenerPolling(), []);

  // Confirmar el pago con MP antes de refrescar la cuenta corriente. El webhook
  // puede no llegar durante el desarrollo local, por eso también se busca por orderId.
  useEffect(() => {
    const pid = searchParams.get("payment_id") || searchParams.get("paymentId") || searchParams.get("collection_id");
    const externalReference = searchParams.get("external_reference") || searchParams.get("externalReference") || sessionStorage.getItem("mp_pending_orderId") || localStorage.getItem("mp_last_orderId");
    if (!pid && !externalReference) return undefined;

    let activo = true;
    const sincronizarPago = async () => {
      let pago = null;
      let sincronizado = false;

      if (pid) {
        const resultado = await PagosGetById(pid);
        sincronizado = resultado.respuesta;
        pago = resultado.datos?.payment || null;
      }

      // Algunas respuestas de MP no incluyen payment_id; la búsqueda por
      // external_reference también actualiza el registro local del pago.
      if (!sincronizado && externalReference) {
        const resultado = await sincronizarPorOrderId(externalReference);
        sincronizado = resultado.sincronizado;
        pago = resultado.pago;
      }

      if (!activo) return;
      const estado = pago?.status;
      if (sincronizado && estado === "approved") {
        detenerPolling();
        marcarPagoSincronizado(pago);
      } else {
        iniciarPolling(externalReference);
        if (pid || searchParams.get("external_reference") || searchParams.get("externalReference")) setSearchParams({}, { replace: true });
      }
    };

    sincronizarPago().catch(() => {
      if (!activo) return;
      iniciarPolling(externalReference);
    });

    return () => { activo = false; };
  }, [searchParams, setSearchParams, navigate]);

  const periodos = useMemo(() => Array.from({ length: 24 }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); }), []);
  const cambiarFiltro = (setter, value) => { setCargando(true); setError(""); setter(value); };
  const limpiar = () => { setCargando(true); setError(""); setBusqueda(""); setIdSede(""); setPeriodo(actual); };
  const exportar = async (tipo) => { setExportando(true); try { if (tipo === "pdf") await exportarCuentasPDF(data.items, data.summary); else await exportarCuentasExcel(data.items, data.summary); setExportarAbierto(false); } finally { setExportando(false); } };
  const metricas = [{ label: "Importe generado", value: moneda(data.summary.importeGenerado), icon: WalletCards, tone: "blue" }, { label: "Reservas utilizadas", value: String(data.summary.reservasUtilizadas), icon: ReceiptText, tone: "slate" }, { label: "Tiempo utilizado", value: duracion(data.summary.minutosTotales), icon: Timer, tone: "amber" }, { label: "Garages con consumo", value: String(data.items.length), icon: Building2, tone: "slate" }];

  const handlePagar = async (cuenta) => {
    const key = `${cuenta.idGarage}-${cuenta.idSede}-${cuenta.periodo}`;
    if (cuenta.estadoPago === "PAGADA") {
      Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Este consumo ya está pagado (PAGADA)", showConfirmButton: false, timer: 2500 });
      return;
    }
    setPagandoKey(key);
    try {
      const aCobrar = montoTest(cuenta.importeGenerado);
      const orderId = `ADMIN-PAGO-${cuenta.periodo}-G${cuenta.idGarage}-S${cuenta.idSede}-${Date.now()}`;
      const consumosIds = cuenta.movimientos.map((m) => m.idConsumo);
      const titulo = `Consumo ${cuenta.garage} - ${nombrePeriodo(cuenta.periodo)} (${cuenta.reservasUtilizadas} reservas)`;
      const items = [{ id: `consumo-${cuenta.idGarage}-${cuenta.idSede}-${cuenta.periodo}`, title: titulo, unit_price: aCobrar, quantity: 1 }];
      const backUrls = {
        success: `${window.location.origin}/admin/pagos`,
        failure: `${window.location.origin}/admin/pagos`,
        pending: `${window.location.origin}/admin/pagos`,
      };
      const res = await PagosCrearPreferencia(items, orderId, backUrls, {
        consumosIds,
        periodo: cuenta.periodo,
        idGarage: cuenta.idGarage,
        idSede: cuenta.idSede,
        metadata: {
          consumos_ids: consumosIds,
          periodo: cuenta.periodo,
          id_garage: cuenta.idGarage,
          id_sede: cuenta.idSede,
          importe_original: cuenta.importeGenerado,
          importe_cobrado: aCobrar,
          test: true,
          origen: "admin_pagos",
        },
      });
      if (!res.respuesta) {
        Swal.fire({ toast: true, position: "top-end", icon: "error", title: res.datos?.message || "No se pudo crear la preferencia de pago", showConfirmButton: false, timer: 4000 });
        return;
      }
      const pref = res.datos;
      const sandboxUrl = pref.sandboxInitPoint || pref.sandbox_init_point;
      const initUrl = pref.initPoint || pref.init_point;
      const url = sandboxUrl || initUrl;
      if (!url) {
        Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Preferencia creada pero sin URL de checkout", showConfirmButton: false, timer: 3500 });
        return;
      }
      try {
        localStorage.setItem("mp_last_orderId", orderId);
        localStorage.setItem("mp_last_preferenceId", String(pref.preferenceId || pref.preference_id || ""));
        sessionStorage.setItem("mp_pending_orderId", orderId);
      } catch {}
      iniciarPolling(orderId);
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Checkout abierto · ${moneda(aCobrar)} (cap $0.10)`, showConfirmButton: false, timer: 3000 });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: e?.message || "Error al iniciar el pago", showConfirmButton: false, timer: 3500 });
    } finally {
      setPagandoKey(null);
    }
  };

  return <div className="pagos-page"><Header /><main className="pagos-main"><header className="pagos-page-header"><div><span className="pagos-eyebrow">Administración financiera</span><h1>Consumos generados</h1><p>Consultá el importe generado por las reservas utilizadas de tu empresa — modo test: cap $0.10 por pago</p></div><button className="pagos-export-button" type="button" onClick={() => setExportarAbierto(true)} disabled={!data.items.length || cargando}><Download size={18} /> Exportar</button></header>
    <section className="pagos-kpis" aria-label="Resumen general">{metricas.map(({ label, value, icon: Icon, tone }) => <article className="pagos-kpi" key={label}><div className={`pagos-kpi__icon pagos-kpi__icon--${tone}`}><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
    <div className="pagos-alert" role="status" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a" }}><div className="pagos-alert__icon" style={{ background: "#dbeafe" }}><CreditCard size={20} /></div><div><strong>Pagos de prueba — hasta $0.10 por checkout</strong><span>Para testear múltiples veces con saldo chico en sandbox de Mercado Pago. El monto real cobrado es <strong>min(importe, $0.10)</strong>.</span></div></div>
    <section className="pagos-accounts" aria-labelledby="cuentas-titulo"><div className="pagos-section-heading"><div><h2 id="cuentas-titulo">Consumos por garage y sede</h2><p>{data.items.length} resultados</p></div></div><div className="pagos-filters"><label className="pagos-search"><span className="sr-only">Buscar por garage o sede</span><Search size={18} /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por garage o sede" /></label><label><span>Sede</span><select value={idSede} onChange={(e) => cambiarFiltro(setIdSede, e.target.value)}><option value="">Todas las autorizadas</option>{sedes.map((s) => <option value={s.id} key={s.id}>{s.nombre}</option>)}</select></label><label><span>Período</span><select value={periodo} onChange={(e) => cambiarFiltro(setPeriodo, e.target.value)}>{periodos.map((p) => <option value={p} key={p}>{nombrePeriodo(p)}</option>)}</select></label><button className="pagos-clear-button" type="button" onClick={limpiar}><X size={16} /> Limpiar filtros</button></div>
      {cargando ? <div className="pagos-empty" role="status"><strong>Cargando consumos…</strong><span>Consultando información real.</span></div> : error ? <div className="pagos-empty" role="alert"><strong>No pudimos cargar los consumos</strong><span>{error}</span><button type="button" onClick={() => { setCargando(true); setError(""); setReintento((n) => n + 1); }}>Reintentar</button></div> : data.items.length ? <><div className="pagos-table-wrap"><table className="pagos-table"><thead><tr><th>Garage / sede</th><th>Período</th><th>Reservas</th><th>Tiempo</th><th>Importe generado</th><th>Pago</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{data.items.map((c) => {
        const key = `${c.idGarage}-${c.idSede}-${c.periodo}`;
        const pagada = c.estadoPago === "PAGADA";
        const pagando = pagandoKey === key;
        const aCobrar = montoTest(c.importeGenerado);
        return <tr key={key}><td><strong>{c.garage}</strong><br /><small>{c.sede}</small></td><td>{nombrePeriodo(c.periodo)}</td><td>{c.reservasUtilizadas}</td><td>{duracion(c.minutosTotales)}</td><td className="pagos-table__amount">{moneda(c.importeGenerado)}<br /><small style={{ color: "#64748b", fontWeight: 600, fontSize: 11 }}>a cobrar {moneda(aCobrar)}</small></td><td>{pagada ? <span className="pagos-badge pagos-badge--pagada"><BadgeCheck size={14} /> PAGADA</span> : <button type="button" className="pagos-pay-button" onClick={() => handlePagar(c)} disabled={pagando}>{pagando ? <Loader2 size={14} className="pagos-spin" /> : <CreditCard size={14} />} {pagando ? "Creando..." : `PAGAR ${moneda(aCobrar)}`}</button>}</td><td><button className="pagos-detail-button" type="button" onClick={() => setSeleccionada(c)}>Ver detalle <ChevronRight size={16} /></button></td></tr>;
      })}</tbody></table></div><div className="pagos-mobile-list">{data.items.map((c) => {
        const key = `${c.idGarage}-${c.idSede}-${c.periodo}`;
        const pagada = c.estadoPago === "PAGADA";
        const pagando = pagandoKey === key;
        const aCobrar = montoTest(c.importeGenerado);
        return <article className="pagos-account-card" key={key}><div className="pagos-account-card__header"><div><strong>{c.garage}</strong><span>{c.sede} · {nombrePeriodo(c.periodo)}</span></div>{pagada ? <span className="pagos-badge pagos-badge--pagada"><BadgeCheck size={12} /> PAGADA</span> : <span className="pagos-badge pagos-badge--pendiente">PENDIENTE</span>}</div><dl><div><dt>Reservas</dt><dd>{c.reservasUtilizadas}</dd></div><div><dt>Importe generado</dt><dd>{moneda(c.importeGenerado)}<br /><small style={{ fontSize: 11, color: "#64748b" }}>a cobrar {moneda(aCobrar)}</small></dd></div></dl><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{pagada ? <span className="pagos-badge pagos-badge--pagada" style={{ height: 36, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6 }}><BadgeCheck size={14} /> PAGADA</span> : <button className="pagos-pay-button" type="button" onClick={() => handlePagar(c)} disabled={pagando}>{pagando ? <Loader2 size={14} className="pagos-spin" /> : <CreditCard size={14} />} {pagando ? "Creando..." : `PAGAR ${moneda(aCobrar)}`}</button>}<button className="pagos-detail-button" type="button" onClick={() => setSeleccionada(c)}>Ver detalle <ChevronRight size={16} /></button></div></article>;
      })}</div></> : <div className="pagos-empty"><Search size={28} /><strong>No hay consumos para estos filtros</strong><span>El período consultado no registra reservas utilizadas.</span><button type="button" onClick={limpiar}>Limpiar filtros</button></div>}
    </section></main><FooterAdmin /><DetalleCuenta cuenta={seleccionada} onClose={() => setSeleccionada(null)} onPagar={handlePagar} pagando={seleccionada ? pagandoKey === `${seleccionada.idGarage}-${seleccionada.idSede}-${seleccionada.periodo}` : false} /><ExportarModal abierto={exportarAbierto} cantidad={data.items.length} cargando={exportando} onClose={() => setExportarAbierto(false)} onExport={exportar} /></div>;
}

export default AdminPagos;
