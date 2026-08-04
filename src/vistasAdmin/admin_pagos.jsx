import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  ReceiptText,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import Header from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import { cuentasCorrientesMock, estadosCuenta } from "../mocks/cuentasCorrientes";
import { exportarCuentasExcel, exportarCuentasPDF } from "../util/exportar_cuentas_corrientes";
import "./admin_pagos.css";

const formatearImporte = (importe) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(importe);

const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));

const estadoClase = (estado) =>
  estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-");

function EstadoBadge({ estado }) {
  return <span className={`pagos-badge pagos-badge--${estadoClase(estado)}`}>{estado}</span>;
}

function DetalleCuenta({ cuenta, onClose }) {
  useEffect(() => {
    if (!cuenta) return undefined;
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("pagos-modal-open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("pagos-modal-open");
    };
  }, [cuenta, onClose]);

  if (!cuenta) return null;

  return (
    <div className="pagos-drawer-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        className="pagos-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-cuenta-titulo"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pagos-drawer__header">
          <div>
            <span className="pagos-eyebrow">Detalle de cuenta</span>
            <h2 id="detalle-cuenta-titulo">{cuenta.garage}</h2>
          </div>
          <button className="pagos-icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle">
            <X size={20} />
          </button>
        </div>

        <dl className="pagos-detail-summary">
          <div><dt>Período</dt><dd>{cuenta.periodo}</dd></div>
          <div><dt>Saldo</dt><dd className="pagos-amount">{formatearImporte(cuenta.importe)}</dd></div>
          <div><dt>Vencimiento</dt><dd>{formatearFecha(cuenta.vencimiento)}</dd></div>
          <div><dt>Estado</dt><dd><EstadoBadge estado={cuenta.estado} /></dd></div>
        </dl>

        <section className="pagos-movements" aria-labelledby="movimientos-titulo">
          <div className="pagos-movements__title">
            <ReceiptText size={18} />
            <h3 id="movimientos-titulo">Historial de movimientos</h3>
          </div>
          <div className="pagos-movements__list">
            {cuenta.movimientos.map((movimiento) => (
              <article className="pagos-movement" key={movimiento.id}>
                <div>
                  <strong>{movimiento.concepto}</strong>
                  <time dateTime={movimiento.fecha}>{formatearFecha(movimiento.fecha)}</time>
                </div>
                <span className={movimiento.importe < 0 ? "pagos-amount--credit" : ""}>
                  {formatearImporte(movimiento.importe)}
                </span>
              </article>
            ))}
          </div>
        </section>

        <p className="pagos-coming-soon">
          <CircleDollarSign size={18} />
          El método para realizar el pago se definirá próximamente.
        </p>
      </aside>
    </div>
  );
}

function ExportarModal({ abierto, cantidad, cargando, onClose, onExport }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const handleKeyDown = (event) => event.key === "Escape" && !cargando && onClose();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [abierto, cargando, onClose]);

  if (!abierto) return null;
  return (
    <div className="pagos-export-overlay" role="presentation" onMouseDown={() => !cargando && onClose()}>
      <section className="pagos-export-modal" role="dialog" aria-modal="true" aria-labelledby="exportar-titulo" onMouseDown={(event) => event.stopPropagation()}>
        <div className="pagos-export-modal__header">
          <div><span className="pagos-eyebrow">Exportar información</span><h2 id="exportar-titulo">Elegí un formato</h2></div>
          <button className="pagos-icon-button" type="button" onClick={onClose} disabled={cargando} aria-label="Cerrar exportación"><X size={20} /></button>
        </div>
        <p className="pagos-export-modal__description">Se exportarán las {cantidad} cuentas que coinciden con los filtros actuales.</p>
        <div className="pagos-export-options">
          <button className="pagos-export-option pagos-export-option--pdf" type="button" onClick={() => onExport("pdf")} disabled={cargando}>
            <span className="pagos-export-option__icon"><FileText size={27} /></span>
            <span><strong>Documento PDF</strong><small>Reporte listo para compartir o imprimir</small></span>
            <span className="pagos-export-option__type">.PDF</span>
          </button>
          <button className="pagos-export-option pagos-export-option--excel" type="button" onClick={() => onExport("excel")} disabled={cargando}>
            <span className="pagos-export-option__icon"><FileSpreadsheet size={27} /></span>
            <span><strong>Planilla Excel</strong><small>Datos editables, ordenables y filtrables</small></span>
            <span className="pagos-export-option__type">.XLSX</span>
          </button>
        </div>
        {cargando ? <p className="pagos-export-loading" role="status"><span /> Preparando el archivo…</p> : null}
      </section>
    </div>
  );
}

function AdminPagos() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [exportarAbierto, setExportarAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);

  const periodos = useMemo(
    () => [...new Map(cuentasCorrientesMock.map((cuenta) => [cuenta.periodoId, cuenta.periodo])).entries()],
    []
  );

  const cuentasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    return cuentasCorrientesMock.filter((cuenta) =>
      (!termino || cuenta.garage.toLocaleLowerCase("es").includes(termino)) &&
      (!estado || cuenta.estado === estado) &&
      (!periodo || cuenta.periodoId === periodo)
    );
  }, [busqueda, estado, periodo]);

  const resumen = useMemo(() => {
    const pendientes = cuentasCorrientesMock.filter((cuenta) => cuenta.estado !== "Al día");
    const vencidas = cuentasCorrientesMock.filter((cuenta) => cuenta.estado === "Vencido");
    const proxima = pendientes.reduce((actual, cuenta) =>
      !actual || cuenta.vencimiento < actual.vencimiento ? cuenta : actual, null);
    return {
      saldo: pendientes.reduce((total, cuenta) => total + cuenta.importe, 0),
      vencido: vencidas.reduce((total, cuenta) => total + cuenta.importe, 0),
      vencidas: vencidas.length,
      garages: pendientes.length,
      proxima,
    };
  }, []);

  const hayFiltros = Boolean(busqueda || estado || periodo);
  const limpiarFiltros = () => { setBusqueda(""); setEstado(""); setPeriodo(""); };

  const exportar = async (formato) => {
    setExportando(true);
    const cuentas = cuentasFiltradas.map((cuenta) => ({ ...cuenta, importeFormateado: formatearImporte(cuenta.importe), vencimientoFormateado: formatearFecha(cuenta.vencimiento) }));
    const datosResumen = { ...resumen, saldoFormateado: formatearImporte(resumen.saldo), vencidoFormateado: formatearImporte(resumen.vencido) };
    try {
      if (formato === "pdf") await exportarCuentasPDF(cuentas, datosResumen);
      else await exportarCuentasExcel(cuentas, datosResumen);
      setExportarAbierto(false);
    } finally {
      setExportando(false);
    }
  };

  const metricas = [
    { label: "Saldo total pendiente", value: formatearImporte(resumen.saldo), icon: WalletCards, tone: "blue" },
    { label: "Importe vencido", value: formatearImporte(resumen.vencido), icon: AlertTriangle, tone: "red" },
    { label: "Próximo vencimiento", value: formatearFecha(resumen.proxima.vencimiento), detail: resumen.proxima.garage, icon: CalendarClock, tone: "amber" },
    { label: "Garages con saldo", value: String(resumen.garages), detail: "cuentas pendientes", icon: Building2, tone: "slate" },
  ];

  return (
    <div className="pagos-page">
      <Header />
      <main className="pagos-main">
        <header className="pagos-page-header">
          <div>
            <span className="pagos-eyebrow">Administración financiera</span>
            <h1>Pagos</h1>
            <p>Administrá las cuentas corrientes de tu empresa con los garages</p>
          </div>
          <button className="pagos-export-button" type="button" onClick={() => setExportarAbierto(true)}>
            <Download size={18} /> Exportar
          </button>
        </header>

        <section className="pagos-kpis" aria-label="Resumen general">
          {metricas.map(({ label, value, detail, icon: Icon, tone }) => (
            <article className="pagos-kpi" key={label}>
              <div className={`pagos-kpi__icon pagos-kpi__icon--${tone}`}><Icon size={21} /></div>
              <div><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>
            </article>
          ))}
        </section>

        <div className="pagos-alert" role="status">
          <div className="pagos-alert__icon"><AlertTriangle size={20} /></div>
          <div><strong>Tenés {resumen.vencidas} cuentas vencidas que requieren atención</strong><span>Revisá el detalle de cada liquidación y sus movimientos.</span></div>
        </div>

        <section className="pagos-accounts" aria-labelledby="cuentas-titulo">
          <div className="pagos-section-heading">
            <div><h2 id="cuentas-titulo">Cuentas corrientes</h2><p>{cuentasFiltradas.length} de {cuentasCorrientesMock.length} garages</p></div>
          </div>

          <div className="pagos-filters">
            <label className="pagos-search">
              <span className="sr-only">Buscar por garage</span><Search size={18} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por garage" />
            </label>
            <label><span>Estado</span><select value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos</option>{estadosCuenta.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Período</span><select value={periodo} onChange={(e) => setPeriodo(e.target.value)}><option value="">Todos</option>{periodos.map(([id, nombre]) => <option value={id} key={id}>{nombre}</option>)}</select></label>
            <button className="pagos-clear-button" type="button" onClick={limpiarFiltros} disabled={!hayFiltros}><X size={16} /> Limpiar filtros</button>
          </div>

          {cuentasFiltradas.length ? (
            <>
              <div className="pagos-table-wrap">
                <table className="pagos-table">
                  <thead><tr><th>Garage</th><th>Período</th><th>Consumos</th><th>Importe total</th><th>Vencimiento</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                  <tbody>{cuentasFiltradas.map((cuenta) => <tr key={cuenta.id}>
                    <td><strong>{cuenta.garage}</strong></td><td>{cuenta.periodo}</td><td>{cuenta.consumos} reservas</td><td className="pagos-table__amount">{formatearImporte(cuenta.importe)}</td><td>{formatearFecha(cuenta.vencimiento)}</td><td><EstadoBadge estado={cuenta.estado} /></td>
                    <td><button className="pagos-detail-button" type="button" onClick={() => setCuentaSeleccionada(cuenta)}>Ver detalle <ChevronRight size={16} /></button></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="pagos-mobile-list">{cuentasFiltradas.map((cuenta) => <article className="pagos-account-card" key={cuenta.id}>
                <div className="pagos-account-card__header"><div><strong>{cuenta.garage}</strong><span>{cuenta.periodo} · {cuenta.consumos} reservas</span></div><EstadoBadge estado={cuenta.estado} /></div>
                <dl><div><dt>Importe total</dt><dd>{formatearImporte(cuenta.importe)}</dd></div><div><dt>Vencimiento</dt><dd>{formatearFecha(cuenta.vencimiento)}</dd></div></dl>
                <button className="pagos-detail-button" type="button" onClick={() => setCuentaSeleccionada(cuenta)}>Ver detalle <ChevronRight size={16} /></button>
              </article>)}</div>
            </>
          ) : <div className="pagos-empty"><Search size={28} /><strong>No encontramos cuentas</strong><span>Probá cambiando o limpiando los filtros.</span><button type="button" onClick={limpiarFiltros}>Limpiar filtros</button></div>}
        </section>
      </main>
      <FooterAdmin />
      <DetalleCuenta cuenta={cuentaSeleccionada} onClose={() => setCuentaSeleccionada(null)} />
      <ExportarModal abierto={exportarAbierto} cantidad={cuentasFiltradas.length} cargando={exportando} onClose={() => setExportarAbierto(false)} onExport={exportar} />
    </div>
  );
}

export default AdminPagos;
