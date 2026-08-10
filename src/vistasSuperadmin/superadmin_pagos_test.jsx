import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCopy,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { initMercadoPago } from "@mercadopago/sdk-react";
import Swal from "sweetalert2";

import "./superadmin_pagos_test.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { SedesGetAll } from "../servicies/API_Sede";
import { GaragesGetAll } from "../servicies/API_Garage";
import {
  PagosCrearPreferencia,
  PagosGetById,
  PagosBuscar,
  PagosReembolsar,
  PagosWebhookEventos,
} from "../servicies/API_Pagos";

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const TARJETAS_PRUEBA = [
  { id: "visa", marca: "Visa", numero: "4509 9535 6623 3704", cvv: "123", color: "#1A1F71", tipo: "Crédito" },
  { id: "mastercard", marca: "Mastercard", numero: "5031 7557 3453 0604", cvv: "123", color: "#EB001B", tipo: "Crédito" },
  { id: "amex", marca: "Amex", numero: "3711 803032 57522", cvv: "1234", color: "#006FCF", tipo: "Crédito" },
];

const PRECIOS_RAPIDOS = [500, 1000, 2000, 5000, 10000];

const formatearImporte = (importe) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(importe);

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

const copiar = async (texto, mensaje = "Copiado al portapapeles") => {
  try {
    await navigator.clipboard.writeText(texto);
    Swal.fire({ toast: true, position: "top-end", icon: "success", title: mensaje, showConfirmButton: false, timer: 2000 });
  } catch {
    Swal.fire({ toast: true, position: "top-end", icon: "error", title: "No se pudo copiar", showConfirmButton: false, timer: 2000 });
  }
};

function TarjetaVisual({ tarjeta, activa }) {
  return (
    <div className={`mpt-card-sample ${activa ? "mpt-card-sample--active" : ""}`} style={{ background: `linear-gradient(135deg, ${tarjeta.color}, ${tarjeta.color}cc)` }}>
      <div className="mpt-card-sample__chip" />
      <strong>{tarjeta.numero}</strong>
      <div><span>CVV {tarjeta.cvv}</span><span>{tarjeta.tipo}</span></div>
    </div>
  );
}

function EmptyTab({ icono, titulo, detalle }) {
  return (
    <div className="mpt-empty">
      {icono}
      <strong>{titulo}</strong>
      <p>{detalle}</p>
    </div>
  );
}

function CrearPagoTab({ onPagoVerificado }) {
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [garages, setGarages] = useState([]);
  const [cargandoOrigenes, setCargandoOrigenes] = useState(true);

  const [idEmpresa, setIdEmpresa] = useState("");
  const [idSede, setIdSede] = useState("");
  const [idGarage, setIdGarage] = useState("");

  const [monto, setMonto] = useState(1000);
  const [montoCustom, setMontoCustom] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orderId, setOrderId] = useState(() => "TEST-" + Date.now());
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState("visa");

  const [creandoPreferencia, setCreandoPreferencia] = useState(false);
  const [preferencia, setPreferencia] = useState(null);

  const [paymentIdVerificar, setPaymentIdVerificar] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [pagoVerificado, setPagoVerificado] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCargandoOrigenes(true);
      const [empresasRes, sedesRes, garagesRes] = await Promise.all([
        EmpresasGetAll({ force: true }),
        SedesGetAll({ force: true }),
        GaragesGetAll({ force: true }),
      ]);
      if (!mounted) return;
      setEmpresas(obtenerListado(empresasRes.datos));
      setSedes(obtenerListado(sedesRes.datos));
      setGarages(obtenerListado(garagesRes.datos));
      setCargandoOrigenes(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const sedesFiltradas = useMemo(
    () => sedes.filter((s) => !idEmpresa || String(s.id_empresa || s.empresa_id) === String(idEmpresa)),
    [sedes, idEmpresa]
  );

  const garagesFiltrados = useMemo(
    () => garages.filter((g) => {
      if (idGarage) return true;
      if (!idSede) return true;
      return String(g.id_sede || g.sede_id) === String(idSede);
    }),
    [garages, idSede, idGarage]
  );

  const nombreGarage = garages.find((g) => String(g.id) === String(idGarage))?.nombre || "";

  const montoFinal = montoCustom !== "" ? Number(montoCustom) || 0 : monto;

  const generarOrderId = () => {
    setOrderId("TEST-" + Date.now());
    setPreferencia(null);
    setPagoVerificado(null);
  };

  const crearPreferencia = async () => {
    if (!(montoFinal > 0)) {
      Swal.fire({ toast: true, position: "top-end", icon: "warning", title: "Ingresá un monto válido", showConfirmButton: false, timer: 2500 });
      return;
    }
    if (!orderId.trim()) {
      Swal.fire({ toast: true, position: "top-end", icon: "warning", title: "El orderId es obligatorio", showConfirmButton: false, timer: 2500 });
      return;
    }

    setCreandoPreferencia(true);
    setPagoVerificado(null);

    const items = [
      {
        id: idGarage || "garage-test",
        title: descripcion.trim() || (nombreGarage ? `Reserva en ${nombreGarage}` : "Reserva SmartLot"),
        unit_price: montoFinal,
        quantity: 1,
      },
    ];

    const res = await PagosCrearPreferencia(items, orderId.trim());
    setCreandoPreferencia(false);

    if (!res.respuesta) {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: res.datos?.message || "No se pudo crear la preferencia", showConfirmButton: false, timer: 4000 });
      return;
    }

    setPreferencia(res.datos);
    if (res.datos.paymentId || res.datos.payment_id) {
      setPaymentIdVerificar(String(res.datos.paymentId || res.datos.payment_id));
    }
  };

  const abrirCheckout = (esSandbox) => {
    const url = esSandbox ? preferencia.sandboxInitPoint || preferencia.sandbox_init_point : preferencia.initPoint || preferencia.init_point;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const verificarPago = async () => {
    const id = (paymentIdVerificar || "").trim();
    if (!id) return;

    setVerificando(true);
    const res = await PagosGetById(id);
    setVerificando(false);

    if (!res.respuesta) {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: res.datos?.message || "No se pudo verificar el pago", showConfirmButton: false, timer: 4000 });
      setPagoVerificado(null);
      return;
    }

    const pago = res.datos?.payment || res.datos;
    setPagoVerificado(pago);
    onPagoVerificado?.(pago);
  };

  return (
    <div className="mpt-scroll">
      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div>
            <h3>Configuración del pago</h3>
            <p>Seleccioná el contexto de la reserva (opcional) y el monto a cobrar.</p>
          </div>
        </div>

        {cargandoOrigenes ? (
          <div className="mpt-loading-row"><Loader2 className="mpt-spin" size={18} /> Cargando empresas, sedes y garages…</div>
        ) : (
          <div className="mpt-form-grid">
            <label className="mpt-field">
              <span><Building2 size={15} /> Empresa</span>
              <select value={idEmpresa} onChange={(e) => { setIdEmpresa(e.target.value); setIdSede(""); setIdGarage(""); }}>
                <option value="">— Sin empresa —</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre || empresa.razon_social || empresa.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="mpt-field">
              <span><MapPin size={15} /> Sede</span>
              <select value={idSede} onChange={(e) => { setIdSede(e.target.value); setIdGarage(""); }} disabled={!idEmpresa}>
                <option value="">— {idEmpresa ? "Todas las sedes" : "Elegí primero la empresa"} —</option>
                {sedesFiltradas.map((sede) => (
                  <option key={sede.id} value={sede.id}>{sede.nombre || sede.direccion || sede.id}</option>
                ))}
              </select>
            </label>

            <label className="mpt-field">
              <span><CreditCard size={15} /> Garage</span>
              <select value={idGarage} onChange={(e) => setIdGarage(e.target.value)} disabled={!idSede}>
                <option value="">— {idSede ? "Garages de la sede" : "Elegí primero la sede"} —</option>
                {garagesFiltrados.map((garage) => (
                  <option key={garage.id} value={garage.id}>{garage.nombre || garage.id}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mpt-form-grid">
          <label className="mpt-field mpt-field--monto">
            <span><CircleDollarSign size={15} /> Monto (ARS)</span>
            <div className="mpt-monto-input">
              <input
                type="number"
                min="1"
                value={montoCustom}
                placeholder={String(monto)}
                onChange={(e) => setMontoCustom(e.target.value)}
              />
              <strong>{formatearImporte(montoFinal)}</strong>
            </div>
            <div className="mpt-precios-rapidos">
              {PRECIOS_RAPIDOS.map((precio) => (
                <button
                  key={precio}
                  type="button"
                  className={montoCustom === "" && monto === precio ? "mpt-precio mpt-precio--active" : "mpt-precio"}
                  onClick={() => { setMonto(precio); setMontoCustom(""); }}
                >
                  ${precio.toLocaleString("es-AR")}
                </button>
              ))}
            </div>
          </label>

          <label className="mpt-field">
            <span><FileText size={15} /> Descripción del ítem</span>
            <input
              type="text"
              value={descripcion}
              placeholder={`Reserva en ${nombreGarage || "SmartLot"}`}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </label>

          <label className="mpt-field">
            <span><Wallet size={15} /> Order ID (external_reference)</span>
            <div className="mpt-orderid">
              <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
              <button type="button" onClick={generarOrderId} title="Generar nuevo ID"><RefreshCw size={15} /></button>
            </div>
          </label>
        </div>
      </section>

      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div>
            <h3>Tarjetas de prueba</h3>
            <p>Usá estas tarjetas en el checkout de Mercado Pago (sandbox). Titular <strong>APRO</strong>, vencimiento futuro.</p>
          </div>
        </div>
        <div className="mpt-tarjetas">
          {TARJETAS_PRUEBA.map((tarjeta) => (
            <button
              key={tarjeta.id}
              type="button"
              className={`mpt-tarjeta-btn ${tarjetaSeleccionada === tarjeta.id ? "mpt-tarjeta-btn--active" : ""}`}
              onClick={() => setTarjetaSeleccionada(tarjeta.id)}
            >
              <TarjetaVisual tarjeta={tarjeta} activa={tarjetaSeleccionada === tarjeta.id} />
              <span>{tarjeta.marca}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div>
            <h3>Crear preferencia</h3>
            <p>Se crea en el backend, guarda el registro en la BD y te devuelve los puntos de inicio del Checkout Pro.</p>
          </div>
          <button
            type="button"
            className="mpt-btn mpt-btn--primary"
            onClick={crearPreferencia}
            disabled={creandoPreferencia}
          >
            {creandoPreferencia ? <Loader2 className="mpt-spin" size={17} /> : <Wallet size={17} />}
            {creandoPreferencia ? "Creando preferencia…" : "Crear preferencia"}
          </button>
        </div>

        {preferencia ? (
          <div className="mpt-preferencia">
            <div className="mpt-preferencia__meta">
              <span>Preference ID: <code>{preferencia.preferenceId || preferencia.preference_id}</code></span>
              <button type="button" className="mpt-copy" onClick={() => copiar(preferencia.preferenceId || preferencia.preference_id)}>
                <ClipboardCopy size={14} /> Copiar
              </button>
            </div>

            <div className="mpt-preferencia__actions">
              <button type="button" className="mpt-btn mpt-btn--checkout" onClick={() => abrirCheckout(true)}>
                <ExternalLink size={17} /> Abrir Checkout Pro (sandbox)
              </button>
              <button type="button" className="mpt-btn mpt-btn--ghost" onClick={() => abrirCheckout(false)} disabled={!(preferencia.initPoint || preferencia.init_point)}>
                <ArrowUpRight size={17} /> init_point
              </button>
              {preferencia.sandboxInitPoint || preferencia.sandbox_init_point ? (
                <button type="button" className="mpt-copy" onClick={() => copiar(preferencia.sandboxInitPoint || preferencia.sandbox_init_point, "Link sandbox copiado")}>
                  <ClipboardCopy size={14} /> Copiar link sandbox
                </button>
              ) : null}
            </div>

            <details className="mpt-raw">
              <summary>Ver respuesta cruda de la API</summary>
              <pre>{JSON.stringify(preferencia, null, 2)}</pre>
            </details>
          </div>
        ) : null}
      </section>

      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div>
            <h3>Verificar pago</h3>
            <p>Después de pagar, pegá el <code>payment_id</code> para consultar el estado real desde el backend.</p>
          </div>
        </div>
        <div className="mpt-verificar">
          <input
            type="text"
            value={paymentIdVerificar}
            onChange={(e) => setPaymentIdVerificar(e.target.value)}
            placeholder="payment_id (ej: 123456789)"
          />
          <button type="button" className="mpt-btn mpt-btn--primary" onClick={verificarPago} disabled={verificando || !paymentIdVerificar.trim()}>
            {verificando ? <Loader2 className="mpt-spin" size={17} /> : <Search size={17} />}
            {verificando ? "Verificando…" : "Verificar estado"}
          </button>
        </div>

        {pagoVerificado ? (
          <div className={`mpt-resultado mpt-resultado--${estadoClase(pagoVerificado.status)}`}>
            <div className="mpt-resultado__icon">
              {pagoVerificado.status === "approved" ? <CheckCircle2 size={26} /> : pagoVerificado.status === "rejected" ? <XCircle size={26} /> : <Wallet size={26} />}
            </div>
            <div className="mpt-resultado__info">
              <div>
                <EstadoBadge estado={pagoVerificado.status} />
                <span className="mpt-resultado__detail">{pagoVerificado.statusDetail || ""}</span>
              </div>
              <dl>
                <div><dt>ID</dt><dd>{pagoVerificado.id}</dd></div>
                <div><dt>Monto</dt><dd>{formatearImporte(pagoVerificado.transactionAmount || pagoVerificado.transaction_amount)}</dd></div>
                <div><dt>Método</dt><dd>{pagoVerificado.paymentType || pagoVerificado.payment_type_id || "—"}</dd></div>
                <div><dt>Aprobado</dt><dd>{formatearFecha(pagoVerificado.dateApproved || pagoVerificado.date_approved)}</dd></div>
                <div><dt>Referencia</dt><dd>{pagoVerificado.externalReference || pagoVerificado.external_reference || "—"}</dd></div>
                <div><dt>Preferencia</dt><dd>{pagoVerificado.preferenceId || pagoVerificado.preference_id || "—"}</dd></div>
              </dl>
            </div>
            <button type="button" className="mpt-icon-btn" onClick={() => setPagoVerificado(null)} aria-label="Cerrar resultado"><X size={17} /></button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DetallePagoDrawer({ pago, onClose }) {
  useEffect(() => {
    if (!pago) return undefined;
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("mpt-modal-open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("mpt-modal-open");
    };
  }, [pago, onClose]);

  if (!pago) return null;

  const detalles = [
    ["ID de pago", pago.id || pago.mp_payment_id],
    ["Preferencia", pago.preference_id || pago.mp_preference_id],
    ["Referencia externa", pago.external_reference || pago.id_orden_externa],
    ["Monto", formatearImporte(pago.transaction_amount ?? pago.monto)],
    ["Moneda", pago.currency_id || pago.moneda],
    ["Tipo", pago.payment_type_id || pago.mp_payment_type],
    ["Descripción", pago.description || pago.descripcion],
    ["Aprobado", formatearFecha(pago.date_approved || pago.fecha_aprobacion)],
    ["Creado", formatearFecha(pago.date_created || pago.fecha_creacion)],
  ];

  return (
    <div className="mpt-drawer-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="mpt-drawer" role="dialog" aria-modal="true" aria-labelledby="mpt-drawer-titulo" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mpt-drawer__header">
          <div>
            <span className="mpt-eyebrow">Detalle de pago</span>
            <h2 id="mpt-drawer-titulo">Pago {pago.id || pago.mp_payment_id}</h2>
          </div>
          <button className="mpt-icon-btn" type="button" onClick={onClose} aria-label="Cerrar detalle"><X size={19} /></button>
        </div>

        <EstadoBadge estado={pago.status || pago.mp_payment_status} />
        {pago.status_detail ? <p className="mpt-drawer__detail">{pago.status_detail}</p> : null}

        <div className="mpt-drawer__divider" />
        <dl className="mpt-drawer__list">
          {detalles.map(([dt, dd]) => (
            <div key={dt}><dt>{dt}</dt><dd>{dd ?? "—"}</dd></div>
          ))}
        </dl>

        {pago.metadata && typeof pago.metadata === "object" ? (
          <details className="mpt-raw">
            <summary>Metadata completa</summary>
            <pre>{JSON.stringify(pago.metadata, null, 2)}</pre>
          </details>
        ) : null}
      </aside>
    </div>
  );
}

const ESTADOS_FILTRO = ["", "approved", "pending", "in_process", "rejected", "cancelled", "refunded", "charged_back"];

function ConsultarPagosTab() {
  const [filtros, setFiltros] = useState({ external_reference: "", status: "", from: "", to: "" });
  const [pagos, setPagos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  const buscar = async () => {
    setCargando(true);
    setBuscado(true);
    const res = await PagosBuscar(filtros);
    setCargando(false);

    if (!res.respuesta) {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: res.datos?.message || "No se pudieron buscar los pagos", showConfirmButton: false, timer: 4000 });
      return;
    }

    const lista = res.datos?.results || res.datos?.pagos || [];
    setPagos(Array.isArray(lista) ? lista : []);
    setPaginacion(res.datos?.paging || null);
  };

  const limpiar = () => {
    setFiltros({ external_reference: "", status: "", from: "", to: "" });
    setPagos([]);
    setBuscado(false);
    setPaginacion(null);
  };

  const hayFiltros = Boolean(filtros.external_reference || filtros.status || filtros.from || filtros.to);

  return (
    <div className="mpt-scroll">
      <section className="mpt-card mpt-card--full">
        <div className="mpt-filters">
          <label className="mpt-search">
            <Search size={17} />
            <input
              type="text"
              value={filtros.external_reference}
              onChange={(e) => setFiltros((f) => ({ ...f, external_reference: e.target.value }))}
              placeholder="external_reference (orderId)"
            />
          </label>
          <label><span>Estado</span>
            <select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
              {ESTADOS_FILTRO.map((estado) => <option key={estado} value={estado}>{estado || "Todos"}</option>)}
            </select>
          </label>
          <label><span>Desde</span><input type="date" value={filtros.from} onChange={(e) => setFiltros((f) => ({ ...f, from: e.target.value }))} /></label>
          <label><span>Hasta</span><input type="date" value={filtros.to} onChange={(e) => setFiltros((f) => ({ ...f, to: e.target.value }))} /></label>
          <button type="button" className="mpt-btn mpt-btn--primary" onClick={buscar} disabled={cargando}>
            {cargando ? <Loader2 className="mpt-spin" size={17} /> : <Search size={17} />}
            {cargando ? "Buscando…" : "Buscar"}
          </button>
          <button type="button" className="mpt-btn mpt-btn--ghost" onClick={limpiar} disabled={!hayFiltros && !buscado}>
            <Trash2 size={16} /> Limpiar
          </button>
        </div>
      </section>

      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div><h3>Resultados</h3><p>{paginacion ? `${paginacion.total ?? pagos.length} pagos encontrados` : buscado ? `${pagos.length} pagos encontrados` : "Usá los filtros para buscar pagos en Mercado Pago."}</p></div>
        </div>

        {pagos.length ? (
          <>
            <div className="mpt-table-wrap">
              <table className="mpt-table">
                <thead>
                  <tr><th>ID pago</th><th>Referencia</th><th>Monto</th><th>Estado</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td><code>{pago.id}</code></td>
                      <td>{pago.external_reference || pago.id_orden_externa || "—"}</td>
                      <td className="mpt-table__amount">{formatearImporte(pago.transaction_amount ?? pago.monto)}</td>
                      <td><EstadoBadge estado={pago.status || pago.mp_payment_status} /></td>
                      <td>{formatearFecha(pago.date_created || pago.fecha_creacion)}</td>
                      <td><button type="button" className="mpt-link-btn" onClick={() => setPagoSeleccionado(pago)}>Ver detalle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mpt-mobile-list">
              {pagos.map((pago) => (
                <article className="mpt-mobile-card" key={pago.id}>
                  <div className="mpt-mobile-card__top"><strong><code>{pago.id}</code></strong><EstadoBadge estado={pago.status || pago.mp_payment_status} /></div>
                  <span>{pago.external_reference || pago.id_orden_externa || "Sin referencia"}</span>
                  <div className="mpt-mobile-card__bottom">
                    <strong>{formatearImporte(pago.transaction_amount ?? pago.monto)}</strong>
                    <button type="button" className="mpt-link-btn" onClick={() => setPagoSeleccionado(pago)}>Ver detalle</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyTab icono={<Search size={28} />} titulo="Sin resultados" detalle={buscado ? "No se encontraron pagos con esos filtros." : "Busca un pago por ID, referencia o estado."} />
        )}
      </section>

      <DetallePagoDrawer pago={pagoSeleccionado} onClose={() => setPagoSeleccionado(null)} />
    </div>
  );
}

function formatearEvento(fila) {
  const payload = typeof fila.payload === "string" ? JSON.parse(fila.payload) : fila.payload;
  return {
    id: fila.mp_event_id,
    tipo: fila.tipo_evento,
    paymentId: fila.mp_payment_id,
    procesado: fila.procesado,
    error: fila.error_procesamiento,
    fecha: formatearFecha(fila.fecha_recepcion),
    fechaProcesamiento: formatearFecha(fila.fecha_procesamiento),
    payload,
  };
}

function WebhooksTab() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);

  const aplicarRespuesta = (res) => {
    setCargado(true);
    setCargando(false);

    if (!res.respuesta) {
      const mensaje = res.status === 404 ? "El endpoint de webhooks todavía no está disponible en el backend." : res.datos?.message || "No se pudieron cargar los webhooks";
      Swal.fire({ toast: true, position: "top-end", icon: "warning", title: mensaje, showConfirmButton: false, timer: 4000 });
      setEventos([]);
      return;
    }

    setEventos(Array.isArray(res.datos) ? res.datos : []);
  };

  const cargar = async () => {
    setCargando(true);
    const res = await PagosWebhookEventos();
    aplicarRespuesta(res);
  };

  useEffect(() => {
    let mounted = true;
    const inicializar = async () => {
      const res = await PagosWebhookEventos();
      if (!mounted) return;
      aplicarRespuesta(res);
    };
    inicializar();
    return () => { mounted = false; };
  }, []);

  const eventosFormateados = eventos.map(formatearEvento);

  return (
    <div className="mpt-scroll">
      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div>
            <h3>Eventos recibidos por el webhook</h3>
            <p>Registro de <code>webhook_eventos</code> persistiendo los avisos de Mercado Pago al backend.</p>
          </div>
          <button type="button" className="mpt-btn mpt-btn--ghost" onClick={cargar} disabled={cargando}>
            <RefreshCw size={16} className={cargando ? "mpt-spin" : ""} /> Actualizar
          </button>
        </div>

        {cargando ? (
          <div className="mpt-loading-row"><Loader2 className="mpt-spin" size={18} /> Cargando eventos…</div>
        ) : eventosFormateados.length ? (
          <>
            <div className="mpt-table-wrap">
              <table className="mpt-table">
                <thead>
                  <tr><th>Evento</th><th>Tipo</th><th>Payment ID</th><th>Recibido</th><th>Procesado</th><th>Error</th></tr>
                </thead>
                <tbody>
                  {eventosFormateados.map((evento) => (
                    <tr key={evento.id}>
                      <td><code>{evento.id}</code></td>
                      <td><EstadoBadge estado={evento.tipo} /></td>
                      <td><code>{evento.paymentId || "—"}</code></td>
                      <td>{evento.fecha}</td>
                      <td>
                        {evento.procesado
                          ? <span className="mpt-ok"><BadgeCheck size={15} /> {evento.fechaProcesamiento}</span>
                          : <span className="mpt-pendiente">Pendiente</span>}
                      </td>
                      <td className="mpt-table__error">{evento.error || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyTab icono={<CalendarClock size={28} />} titulo="No hay eventos todavía" detalle={cargado ? "Cuando Mercado Pago envíe avisos, aparecerán acá." : "Cargando…"} />
        )}
      </section>
    </div>
  );
}

function ReembolsosTab({ onVerificarPago }) {
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [motivo, setMotivo] = useState("");
  const [reembolsando, setReembolsando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const ejecutar = async () => {
    if (!paymentId.trim()) {
      Swal.fire({ toast: true, position: "top-end", icon: "warning", title: "Ingresá el payment_id", showConfirmButton: false, timer: 2500 });
      return;
    }

    setReembolsando(true);
    setResultado(null);

    const res = await PagosReembolsar(paymentId.trim(), amount ? Number(amount) : undefined, motivo.trim() || undefined);
    setReembolsando(false);

    if (!res.respuesta) {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: res.datos?.message || "No se pudo reembolsar", showConfirmButton: false, timer: 4000 });
      return;
    }

    setResultado(res.datos);
    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Reembolso ejecutado", showConfirmButton: false, timer: 2500 });
    onVerificarPago?.(paymentId.trim());
  };

  return (
    <div className="mpt-scroll">
      <section className="mpt-card mpt-card--full">
        <div className="mpt-section-heading">
          <div>
            <h3>Reembolso de pagos</h3>
            <p>Total si no ingresás monto, parcial si ingresás un importe menor. Requiere un pago aprobado.</p>
          </div>
        </div>

        <div className="mpt-reembolso-grid">
          <label className="mpt-field">
            <span><CreditCard size={15} /> Payment ID</span>
            <input type="text" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="payment_id aprobado" />
          </label>
          <label className="mpt-field">
            <span><CircleDollarSign size={15} /> Monto (opcional)</span>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Vacío = reembolso total" />
          </label>
          <label className="mpt-field">
            <span><FileText size={15} /> Motivo (opcional)</span>
            <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: cancelación de reserva" />
          </label>
        </div>

        <button type="button" className="mpt-btn mpt-btn--refund" onClick={ejecutar} disabled={reembolsando}>
          {reembolsando ? <Loader2 className="mpt-spin" size={17} /> : <ArrowUpRight size={17} />}
          {reembolsando ? "Reembolsando…" : "Ejecutar reembolso"}
        </button>

        {resultado ? (
          <div className="mpt-resultado mpt-resultado--ok">
            <div className="mpt-resultado__icon"><BadgeCheck size={26} /></div>
            <div className="mpt-resultado__info">
              <div><EstadoBadge estado={resultado.status || resultado.estado} /></div>
              <dl>
                <div><dt>Refund ID</dt><dd>{resultado.refundId || resultado.id}</dd></div>
                <div><dt>Monto</dt><dd>{formatearImporte(resultado.amount)}</dd></div>
                <div><dt>Estado</dt><dd>{resultado.status || resultado.estado || "—"}</dd></div>
              </dl>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const TABS = [
  { id: "crear", label: "Crear pago", icon: Wallet },
  { id: "consultar", label: "Consultar pagos", icon: Search },
  { id: "webhooks", label: "Webhooks", icon: CalendarClock },
  { id: "reembolsos", label: "Reembolsos", icon: ArrowUpRight },
];

export default function SuperadminPagosTest() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("crear");

  const irAConsultar = () => setTab("consultar");

  return (
    <div className="mpt-page">
      <HeaderSuperadmin />
      <main className="mpt-main">
        <header className="mpt-header">
          <div className="mpt-title-row">
            <button type="button" className="mpt-back" onClick={() => navigate("/superadmin_dashboard")} aria-label="Volver al panel de control">
              <ArrowLeft size={19} />
            </button>
            <div>
              <span className="mpt-eyebrow">Sandbox de pagos</span>
              <h1>Testing Mercado Pago</h1>
              <p>Creá preferencias, pagá con Checkout Pro, verificá estados, webhooks y reembolsos.</p>
            </div>
          </div>
        </header>

        <nav className="mpt-tabs" aria-label="Secciones de testing">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`mpt-tab ${tab === id ? "mpt-tab--active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {tab === "crear" && <CrearPagoTab onPagoVerificado={irAConsultar} />}
        {tab === "consultar" && <ConsultarPagosTab />}
        {tab === "webhooks" && <WebhooksTab />}
        {tab === "reembolsos" && <ReembolsosTab onVerificarPago={irAConsultar} />}
      </main>
      <FooterSuperadmin />
    </div>
  );
}