import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Building2, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, Download, FileSpreadsheet, FileText, ReceiptText, Search, WalletCards, X } from "lucide-react";
import HeaderDueñoGarage from "../componentesDueñoGarage/header_dueño_garage";
import FooterDueñoGarage from "../componentesDueñoGarage/footer_dueño_garage";
import { cuentasPorCobrarGarageMock, ESTADOS_DEUDA, GARAGE_ACTUAL, PERIODOS_CUENTAS_POR_COBRAR } from "../mocks/cuentasPorCobrarGarage";
import { exportarDeudasGarageExcel, exportarDeudasGaragePDF } from "../util/exportar_deudas_garage";
import "./cuentas_por_cobrar.css";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const formatearMoneda = (valor) => moneda.format(valor);
const formatearFecha = (valor) => fecha.format(new Date(`${valor}T00:00:00Z`));
const claseEstado = (estado) => estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-");

function BadgeEstado({ estado }) {
  return <span className={`cxc-badge cxc-badge--${claseEstado(estado)}`}>{estado}</span>;
}

function DetalleDeuda({ empresa, onClose }) {
  const cerrarRef = useRef(null);
  useEffect(() => {
    if (!empresa) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("cxc-drawer-open");
    cerrarRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.classList.remove("cxc-drawer-open"); };
  }, [empresa, onClose]);
  if (!empresa) return null;

  return <div className="cxc-overlay" role="presentation" onMouseDown={onClose}>
    <aside className="cxc-drawer" role="dialog" aria-modal="true" aria-labelledby="cxc-detail-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className="cxc-drawer__header">
        <div><span className="cxc-eyebrow">Deuda con {GARAGE_ACTUAL}</span><h2 id="cxc-detail-title">{empresa.nombreEmpresa}</h2><p>{empresa.cuit}</p></div>
        <button ref={cerrarRef} type="button" className="cxc-icon-button" onClick={onClose} aria-label="Cerrar detalle de deuda"><X size={20} /></button>
      </header>
      <section className="cxc-debt-highlight" aria-label="Importe pendiente">
        <span>La empresa todavía le debe al garage:</span><strong>{formatearMoneda(empresa.deudaActual)}</strong>
      </section>
      <dl className="cxc-detail-grid">
        <div><dt>Garage al que le debe</dt><dd>{GARAGE_ACTUAL}</dd></div>
        <div><dt>Estado</dt><dd><BadgeEstado estado={empresa.estado} /></dd></div>
        <div><dt>Total generado por reservas</dt><dd>{formatearMoneda(empresa.totalGenerado)}</dd></div>
        <div><dt>Pagos recibidos por el garage</dt><dd>{formatearMoneda(empresa.totalPagado)}</dd></div>
        <div><dt>Reservas utilizadas</dt><dd>{empresa.reservasUtilizadas}</dd></div>
        <div><dt>Fecha de vencimiento</dt><dd>{formatearFecha(empresa.fechaVencimiento)}</dd></div>
      </dl>
      <section className="cxc-movements" aria-labelledby="cxc-movements-title">
        <h3 id="cxc-movements-title"><ReceiptText size={18} /> Historial de movimientos</h3>
        {empresa.movimientos.map((movimiento) => <article key={movimiento.id}>
          <div><strong>{movimiento.concepto}</strong><time dateTime={movimiento.fecha}>{formatearFecha(movimiento.fecha)}</time></div>
          <span className={movimiento.importe < 0 ? "is-credit" : ""}>{formatearMoneda(movimiento.importe)}</span>
        </article>)}
      </section>
      <p className="cxc-payment-note"><CircleDollarSign size={19} /> La forma de recibir y confirmar el pago todavía no fue definida.</p>
    </aside>
  </div>;
}

function ExportarDeudasModal({ abierto, cantidad, exportando, onClose, onExportar }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && !exportando && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [abierto, exportando, onClose]);
  if (!abierto) return null;
  return <div className="cxc-export-overlay" role="presentation" onMouseDown={() => !exportando && onClose()}>
    <section className="cxc-export-modal" role="dialog" aria-modal="true" aria-labelledby="cxc-export-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="cxc-eyebrow">Exportar cuentas por cobrar</span><h2 id="cxc-export-title">Elegí el formato</h2></div><button type="button" className="cxc-icon-button" onClick={onClose} disabled={exportando} aria-label="Cerrar exportación"><X size={20} /></button></header>
      <p>Se exportarán las {cantidad} empresas que coinciden con los filtros actuales.</p>
      <div className="cxc-export-options">
        <button type="button" className="cxc-export-option is-pdf" onClick={() => onExportar("pdf")} disabled={exportando}><span className="cxc-export-option__icon"><FileText size={26} /></span><span><strong>Documento PDF</strong><small>Reporte listo para compartir o imprimir</small></span><span className="cxc-export-option__type">.PDF</span></button>
        <button type="button" className="cxc-export-option is-excel" onClick={() => onExportar("excel")} disabled={exportando}><span className="cxc-export-option__icon"><FileSpreadsheet size={26} /></span><span><strong>Planilla Excel</strong><small>Datos editables, ordenables y filtrables</small></span><span className="cxc-export-option__type">.XLSX</span></button>
      </div>
      {exportando ? <p className="cxc-export-loading" role="status"><span /> Preparando el archivo…</p> : null}
    </section>
  </div>;
}

export default function CuentasPorCobrarGarage() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [periodo, setPeriodo] = useState("2026-08");
  const [seleccionada, setSeleccionada] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [exportarAbierto, setExportarAbierto] = useState(false);
  const empresas = useMemo(() => cuentasPorCobrarGarageMock.filter((empresa) => empresa.periodoId === periodo), [periodo]);
  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-AR");
    return empresas.filter((empresa) => (!termino || `${empresa.nombreEmpresa} ${empresa.cuit}`.toLocaleLowerCase("es-AR").includes(termino)) && (!estado || empresa.estado === estado));
  }, [busqueda, empresas, estado]);
  const resumen = useMemo(() => empresas.reduce((acc, empresa) => ({
    pendiente: acc.pendiente + empresa.deudaActual,
    vencida: acc.vencida + (empresa.estado === "Vencida" ? empresa.deudaActual : 0),
    recibido: acc.recibido + empresa.totalPagado,
    deudoras: acc.deudoras + (empresa.deudaActual > 0 ? 1 : 0),
  }), { pendiente: 0, vencida: 0, recibido: 0, deudoras: 0 }), [empresas]);
  const vencida = empresas.find((empresa) => empresa.estado === "Vencida");
  const limpiar = () => { setBusqueda(""); setEstado(""); setPeriodo("2026-08"); };
  const exportar = async (formato) => {
    if (!filtradas.length || exportando) return;
    setExportando(true);
    try {
      const periodoNombre = PERIODOS_CUENTAS_POR_COBRAR.find((item) => item.id === periodo)?.nombre ?? periodo;
      const opciones = { garage: GARAGE_ACTUAL, periodo: periodoNombre };
      if (formato === "pdf") await exportarDeudasGaragePDF(filtradas, opciones);
      else await exportarDeudasGarageExcel(filtradas, opciones);
      setExportarAbierto(false);
    } finally {
      setExportando(false);
    }
  };

  const metricas = [
    { label: "Las empresas te deben", valor: formatearMoneda(resumen.pendiente), icono: WalletCards, tono: "blue" },
    { label: "Deuda vencida", valor: formatearMoneda(resumen.vencida), icono: AlertTriangle, tono: "red" },
    { label: "Ya recibiste este mes", valor: formatearMoneda(resumen.recibido), icono: CheckCircle2, tono: "green" },
    { label: "Empresas que todavía deben", valor: `${resumen.deudoras} de ${empresas.length}`, detalle: "empresas asociadas", icono: Building2, tono: "slate" },
  ];

  return <div className="duenio-garage-page cxc-page">
    <HeaderDueñoGarage />
    <main className="duenio-garage-main cxc-main">
      <header className="cxc-page-header">
        <div className="cxc-heading-copy"><span className="cxc-eyebrow">Administrador del garage</span><div className="cxc-garage-chip"><Building2 size={16} /> Garage actual: <strong>{GARAGE_ACTUAL}</strong></div><h1>Empresas que le deben a tu garage</h1><p>Revisá cuánto dinero debe pagarle cada empresa a {GARAGE_ACTUAL} por las reservas utilizadas.</p></div>
        <label className="cxc-period"><span>Período</span><select value={periodo} onChange={(event) => setPeriodo(event.target.value)}>{PERIODOS_CUENTAS_POR_COBRAR.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      </header>
      <section className="cxc-kpis" aria-label="Resumen general de cuentas por cobrar">{metricas.map(({ label, valor, detalle, icono: Icono, tono }) => <article key={label}><div className={`cxc-kpi-icon cxc-kpi-icon--${tono}`}><Icono size={21} /></div><div><span>{label}</span><strong>{valor}</strong>{detalle ? <small>{detalle}</small> : null}</div></article>)}</section>
      {vencida ? <section className="cxc-alert" aria-label="Alerta de deuda vencida"><AlertTriangle size={21} /><div><strong>{vencida.nombreEmpresa} todavía le debe {formatearMoneda(vencida.deudaActual)} a {GARAGE_ACTUAL} y su cuenta está vencida.</strong><span>La fecha de pago acordada ya pasó.</span></div><button type="button" onClick={() => { setBusqueda(vencida.nombreEmpresa); setEstado("Vencida"); }}>Mostrar empresa</button></section> : null}
      <section className="cxc-accounts" aria-labelledby="cxc-table-title">
        <div className="cxc-section-title"><div><span className="cxc-eyebrow">Empresas asociadas → le deben dinero → garage</span><h2 id="cxc-table-title">Deudas de empresas con {GARAGE_ACTUAL}</h2><p>{filtradas.length} de {empresas.length} empresas en el período</p></div><button type="button" className="cxc-export" onClick={() => setExportarAbierto(true)} disabled={!filtradas.length}><Download size={18} /> Exportar deudas</button></div>
        <div className="cxc-filters">
          <label className="cxc-search"><span className="sr-only">Buscar por empresa o CUIT</span><Search size={18} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar empresa o CUIT" /></label>
          <label><span>Estado</span><select value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos los estados</option>{ESTADOS_DEUDA.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Período</span><select value={periodo} onChange={(event) => setPeriodo(event.target.value)}>{PERIODOS_CUENTAS_POR_COBRAR.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
          <button type="button" className="cxc-clear" onClick={limpiar} disabled={!busqueda && !estado && periodo === "2026-08"}><X size={16} /> Limpiar filtros</button>
        </div>
        {filtradas.length ? <><div className="cxc-table-wrap"><table><thead><tr><th>Empresa que debe</th><th>CUIT</th><th>Reservas utilizadas</th><th>Total generado</th><th>Ya pagó</th><th className="cxc-debt-column">Le debe al garage</th><th>Vencimiento</th><th>Estado</th><th><span className="sr-only">Acción</span></th></tr></thead><tbody>{filtradas.map((empresa) => <tr key={empresa.id}><td><strong>{empresa.nombreEmpresa}</strong><small>Le debe a {GARAGE_ACTUAL}</small></td><td>{empresa.cuit}</td><td>{empresa.reservasUtilizadas}</td><td>{formatearMoneda(empresa.totalGenerado)}</td><td>{formatearMoneda(empresa.totalPagado)}</td><td className="cxc-debt-column"><strong>{formatearMoneda(empresa.deudaActual)}</strong></td><td>{formatearFecha(empresa.fechaVencimiento)}</td><td><BadgeEstado estado={empresa.estado} /></td><td><button type="button" className="cxc-view" onClick={() => setSeleccionada(empresa)}>Ver deuda <ChevronRight size={16} /></button></td></tr>)}</tbody></table></div>
        <div className="cxc-mobile-list">{filtradas.map((empresa) => <article key={empresa.id}><header><div><strong>{empresa.nombreEmpresa}</strong><span>{empresa.cuit}</span></div><BadgeEstado estado={empresa.estado} /></header><div className="cxc-mobile-debt"><span>Le debe al garage</span><strong>{formatearMoneda(empresa.deudaActual)}</strong></div><dl><div><dt>Vencimiento</dt><dd><CalendarDays size={15} /> {formatearFecha(empresa.fechaVencimiento)}</dd></div><div><dt>Reservas</dt><dd>{empresa.reservasUtilizadas}</dd></div></dl><button type="button" className="cxc-view" onClick={() => setSeleccionada(empresa)}>Ver deuda <ChevronRight size={16} /></button></article>)}</div></> : <div className="cxc-empty"><Search size={28} /><strong>No hay empresas que coincidan</strong><span>Probá cambiar o limpiar los filtros.</span></div>}
      </section>
    </main>
    <FooterDueñoGarage />
    <DetalleDeuda empresa={seleccionada} onClose={() => setSeleccionada(null)} />
    <ExportarDeudasModal abierto={exportarAbierto} cantidad={filtradas.length} exportando={exportando} onClose={() => setExportarAbierto(false)} onExportar={exportar} />
  </div>;
}
