import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronRight, CircleDollarSign, Download, FileSpreadsheet, FileText, ReceiptText, Search, Timer, WalletCards, X } from "lucide-react";
import Header from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import { CuentasCorrientesAdminGet, CuentasCorrientesSedesGet } from "../servicies/API_CuentasCorrientes";
import { exportarCuentasExcel, exportarCuentasPDF } from "../util/exportar_cuentas_corrientes";
import "./admin_pagos.css";

const moneda = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n ?? 0);
const fechaHora = (f) => new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(f));
const nombrePeriodo = (p) => new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${p}-01T00:00:00Z`));
const duracion = (m = 0) => `${Math.floor(m / 60)} h ${m % 60} min`;

function DetalleCuenta({ cuenta, onClose }) {
  useEffect(() => {
    if (!cuenta) return undefined;
    const keydown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", keydown); document.body.classList.add("pagos-modal-open");
    return () => { document.removeEventListener("keydown", keydown); document.body.classList.remove("pagos-modal-open"); };
  }, [cuenta, onClose]);
  if (!cuenta) return null;
  return <div className="pagos-drawer-overlay" role="presentation" onMouseDown={onClose}><aside className="pagos-drawer" role="dialog" aria-modal="true" aria-labelledby="detalle-cuenta-titulo" onMouseDown={(e) => e.stopPropagation()}>
    <div className="pagos-drawer__header"><div><span className="pagos-eyebrow">Detalle de consumo</span><h2 id="detalle-cuenta-titulo">{cuenta.garage}</h2></div><button className="pagos-icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle"><X size={20} /></button></div>
    <dl className="pagos-detail-summary"><div><dt>Período</dt><dd>{nombrePeriodo(cuenta.periodo)}</dd></div><div><dt>Sede</dt><dd>{cuenta.sede}</dd></div><div><dt>Tiempo utilizado</dt><dd>{duracion(cuenta.minutosTotales)}</dd></div><div><dt>Importe generado</dt><dd className="pagos-amount">{moneda(cuenta.importeGenerado)}</dd></div></dl>
    <section className="pagos-movements" aria-labelledby="movimientos-titulo"><div className="pagos-movements__title"><ReceiptText size={18} /><h3 id="movimientos-titulo">Reservas utilizadas</h3></div><div className="pagos-movements__list">{cuenta.movimientos.map((m) => <article className="pagos-movement" key={m.idConsumo}><div><strong>Reserva #{m.idReserva} · {m.tipoVehiculo}</strong><time dateTime={m.fechaInicio}>{fechaHora(m.fechaInicio)} — {fechaHora(m.fechaFin)} · {m.minutosUtilizados} min · {moneda(m.tarifaHoraAplicada)}/h</time></div><span>{moneda(m.importeGenerado)}</span></article>)}</div></section>
    <p className="pagos-coming-soon"><CircleDollarSign size={18} />Estado y medios de pago: pendiente de integración.</p>
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
  const periodos = useMemo(() => Array.from({ length: 24 }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); }), []);
  const cambiarFiltro = (setter, value) => { setCargando(true); setError(""); setter(value); };
  const limpiar = () => { setCargando(true); setError(""); setBusqueda(""); setIdSede(""); setPeriodo(actual); };
  const exportar = async (tipo) => { setExportando(true); try { if (tipo === "pdf") await exportarCuentasPDF(data.items, data.summary); else await exportarCuentasExcel(data.items, data.summary); setExportarAbierto(false); } finally { setExportando(false); } };
  const metricas = [{ label: "Importe generado", value: moneda(data.summary.importeGenerado), icon: WalletCards, tone: "blue" }, { label: "Reservas utilizadas", value: String(data.summary.reservasUtilizadas), icon: ReceiptText, tone: "slate" }, { label: "Tiempo utilizado", value: duracion(data.summary.minutosTotales), icon: Timer, tone: "amber" }, { label: "Garages con consumo", value: String(data.items.length), icon: Building2, tone: "slate" }];
  return <div className="pagos-page"><Header /><main className="pagos-main"><header className="pagos-page-header"><div><span className="pagos-eyebrow">Administración financiera</span><h1>Consumos generados</h1><p>Consultá el importe generado por las reservas utilizadas de tu empresa</p></div><button className="pagos-export-button" type="button" onClick={() => setExportarAbierto(true)} disabled={!data.items.length || cargando}><Download size={18} /> Exportar</button></header>
    <section className="pagos-kpis" aria-label="Resumen general">{metricas.map(({ label, value, icon: Icon, tone }) => <article className="pagos-kpi" key={label}><div className={`pagos-kpi__icon pagos-kpi__icon--${tone}`}><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
    <div className="pagos-alert" role="status"><div className="pagos-alert__icon"><CircleDollarSign size={20} /></div><div><strong>Estos importes representan consumo generado</strong><span>No confirman pagos, vencimientos ni conciliación.</span></div></div>
    <section className="pagos-accounts" aria-labelledby="cuentas-titulo"><div className="pagos-section-heading"><div><h2 id="cuentas-titulo">Consumos por garage y sede</h2><p>{data.items.length} resultados</p></div></div><div className="pagos-filters"><label className="pagos-search"><span className="sr-only">Buscar por garage o sede</span><Search size={18} /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por garage o sede" /></label><label><span>Sede</span><select value={idSede} onChange={(e) => cambiarFiltro(setIdSede, e.target.value)}><option value="">Todas las autorizadas</option>{sedes.map((s) => <option value={s.id} key={s.id}>{s.nombre}</option>)}</select></label><label><span>Período</span><select value={periodo} onChange={(e) => cambiarFiltro(setPeriodo, e.target.value)}>{periodos.map((p) => <option value={p} key={p}>{nombrePeriodo(p)}</option>)}</select></label><button className="pagos-clear-button" type="button" onClick={limpiar}><X size={16} /> Limpiar filtros</button></div>
      {cargando ? <div className="pagos-empty" role="status"><strong>Cargando consumos…</strong><span>Consultando información real.</span></div> : error ? <div className="pagos-empty" role="alert"><strong>No pudimos cargar los consumos</strong><span>{error}</span><button type="button" onClick={() => { setCargando(true); setError(""); setReintento((n) => n + 1); }}>Reintentar</button></div> : data.items.length ? <><div className="pagos-table-wrap"><table className="pagos-table"><thead><tr><th>Garage / sede</th><th>Período</th><th>Reservas</th><th>Tiempo</th><th>Importe generado</th><th>Pago</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{data.items.map((c) => <tr key={`${c.idGarage}-${c.idSede}-${c.periodo}`}><td><strong>{c.garage}</strong><br /><small>{c.sede}</small></td><td>{nombrePeriodo(c.periodo)}</td><td>{c.reservasUtilizadas}</td><td>{duracion(c.minutosTotales)}</td><td className="pagos-table__amount">{moneda(c.importeGenerado)}</td><td>—</td><td><button className="pagos-detail-button" type="button" onClick={() => setSeleccionada(c)}>Ver detalle <ChevronRight size={16} /></button></td></tr>)}</tbody></table></div><div className="pagos-mobile-list">{data.items.map((c) => <article className="pagos-account-card" key={`${c.idGarage}-${c.idSede}-${c.periodo}`}><div className="pagos-account-card__header"><div><strong>{c.garage}</strong><span>{c.sede} · {nombrePeriodo(c.periodo)}</span></div></div><dl><div><dt>Reservas</dt><dd>{c.reservasUtilizadas}</dd></div><div><dt>Importe generado</dt><dd>{moneda(c.importeGenerado)}</dd></div></dl><button className="pagos-detail-button" type="button" onClick={() => setSeleccionada(c)}>Ver detalle <ChevronRight size={16} /></button></article>)}</div></> : <div className="pagos-empty"><Search size={28} /><strong>No hay consumos para estos filtros</strong><span>El período consultado no registra reservas utilizadas.</span><button type="button" onClick={limpiar}>Limpiar filtros</button></div>}
    </section></main><FooterAdmin /><DetalleCuenta cuenta={seleccionada} onClose={() => setSeleccionada(null)} /><ExportarModal abierto={exportarAbierto} cantidad={data.items.length} cargando={exportando} onClose={() => setExportarAbierto(false)} onExport={exportar} /></div>;
}

export default AdminPagos;
