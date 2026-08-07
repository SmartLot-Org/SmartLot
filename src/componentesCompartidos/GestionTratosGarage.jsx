import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Building2, CarFront, Check, Handshake, Inbox, ParkingCircle, RefreshCw, Truck, Warehouse, X } from "lucide-react";
import { GaragesGetAll } from "../servicies/API_Garage";
import { TratosGetAll } from "../servicies/API_TratoEmpresaGarage";
import { SolicitudesAceptar, SolicitudesGetRecibidas, SolicitudesRechazar } from "../servicies/API_SolicitudEmpresaGarage";
import { formatARS } from "../helpers/prices";
import { normalizeList } from "../helpers/tratos";

const nombreEmpresa = (item) => item.empresa_nombre || `Empresa #${item.id_empresa}`;
const nombreGarage = (item) => item.garage_nombre || `Garage #${item.id_garage}`;
const nombreSede = (item) => item.sede_nombre || `Sede #${item.id_sede}`;
const formatearFecha = (valor) => valor
  ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(valor))
  : "Sin fecha";

export default function GestionTratosGarage() {
  const [tratos, setTratos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolviendo, setResolviendo] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [tratosResponse, solicitudesResponse, garagesResponse] = await Promise.all([
      TratosGetAll({ force: true }),
      SolicitudesGetRecibidas({ force: true }),
      GaragesGetAll({ force: true }),
    ]);
    if (!tratosResponse.respuesta || !solicitudesResponse.respuesta || !garagesResponse.respuesta) {
      setError(tratosResponse.datos?.message || solicitudesResponse.datos?.message || garagesResponse.datos?.message || "No se pudo cargar la gestión de tratos.");
    } else {
      setError("");
      setTratos(normalizeList(tratosResponse.datos));
      setSolicitudes(normalizeList(solicitudesResponse.datos));
      setGarages(normalizeList(garagesResponse.datos));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const pendientes = useMemo(() => solicitudes.filter((solicitud) => solicitud.estado === "pendiente"), [solicitudes]);
  const cocherasComprometidas = useMemo(() => tratos.reduce((total, trato) => total + Number(trato.cantidad_cocheras || 0), 0), [tratos]);

  const resolve = async (solicitud, action) => {
    const accepting = action === "aceptar";
    const confirm = await Swal.fire({
      title: accepting ? "¿Aceptar solicitud?" : "¿Rechazar solicitud?",
      text: accepting
        ? `Vas a cerrar un trato con ${nombreEmpresa(solicitud)} (${nombreSede(solicitud)}) por ${solicitud.cantidad_cocheras} cocheras en ${nombreGarage(solicitud)}.`
        : `La solicitud de ${nombreEmpresa(solicitud)} será rechazada.`,
      icon: accepting ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: accepting ? "Sí, aceptar trato" : "Sí, rechazar",
      cancelButtonText: "Volver",
      confirmButtonColor: accepting ? "#2563eb" : "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    setResolviendo(solicitud.id);
    const response = accepting ? await SolicitudesAceptar(solicitud.id) : await SolicitudesRechazar(solicitud.id);
    setResolviendo(null);
    if (!response.respuesta) {
      await Swal.fire("No se pudo completar", response.datos?.message || "Ocurrió un error.", "error");
      return;
    }
    await load();
    await Swal.fire(accepting ? "Trato aceptado" : "Solicitud rechazada", accepting ? "El acuerdo fue creado correctamente." : "La solicitud fue rechazada.", "success");
  };

  if (loading) return <div className="deal-loading" role="status"><span /><p>Cargando solicitudes y tratos…</p></div>;
  if (error) return <div className="deal-state deal-state--error" role="alert"><X size={24}/><div><strong>No pudimos cargar esta sección</strong><p>{error}</p></div><button type="button" onClick={load}>Reintentar</button></div>;

  const resumen = [
    { label: "Solicitudes pendientes", valor: pendientes.length, icono: Inbox, tono: "amber" },
    { label: "Tratos vigentes", valor: tratos.length, icono: Handshake, tono: "blue" },
    { label: "Cocheras comprometidas", valor: cocherasComprometidas, icono: ParkingCircle, tono: "green" },
    { label: "Garages administrados", valor: garages.length, icono: Warehouse, tono: "slate" },
  ];

  return <section className="tratos-manager" aria-label="Gestión de tratos del garage">
    <div className="deal-toolbar">
      <div><span>Gestión comercial del garage</span><h2>Empresas interesadas en tus garages</h2><p>Evaluá nuevas solicitudes y consultá los acuerdos que ya están activos.</p></div>
      <button type="button" onClick={load} aria-label="Actualizar solicitudes y acuerdos"><RefreshCw size={17}/>Actualizar</button>
    </div>

    {!garages.length ? <div className="deal-state deal-state--warning"><ParkingCircle size={25}/><div><strong>Tu cuenta no tiene garages asociados</strong><p>Necesitás al menos un garage asignado para recibir y aceptar solicitudes de empresas.</p></div></div> : null}

    <section className="deal-summary" aria-label="Resumen de tratos">
      {resumen.map(({ label, valor, icono: Icono, tono }) => <article key={label}><div className={`deal-summary__icon deal-summary__icon--${tono}`}><Icono size={20}/></div><div><span>{label}</span><strong>{valor}</strong></div></article>)}
    </section>

    <section className="deal-panel" aria-labelledby="solicitudes-title">
      <header className="deal-section-title"><div><span className="deal-section-icon"><Inbox size={19}/></span><div><h3 id="solicitudes-title">Solicitudes de empresas</h3><p>Propuestas que esperan una decisión de tu garage.</p></div></div><span>{pendientes.length} pendientes</span></header>
      {!pendientes.length ? <div className="deal-empty"><Inbox size={28}/><strong>No hay solicitudes pendientes</strong><p>Cuando una empresa solicite cocheras en uno de tus garages, aparecerá acá.</p></div> : <div className="deal-request-grid">{pendientes.map((solicitud) => <article className="deal-request-card" key={solicitud.id}>
        <header className="deal-request-card__top"><span><Building2 size={16}/>{nombreEmpresa(solicitud)}</span><small>Pendiente</small></header>
        <div className="deal-request-garage"><ParkingCircle size={18}/><div><span>Garage solicitado</span><strong>{nombreGarage(solicitud)}</strong></div></div>
        <p><strong>Sede:</strong> {nombreSede(solicitud)}{solicitud.sede_ubicacion ? ` · ${solicitud.sede_ubicacion}` : ""}</p>
        <div className="deal-request-amount"><strong>{solicitud.cantidad_cocheras}</strong><span>cocheras solicitadas</span></div>
        <p>{solicitud.descripcion || "La empresa no agregó una descripción."}</p>
        <div className="deal-request-actions"><button type="button" disabled={resolviendo === solicitud.id} onClick={() => resolve(solicitud, "aceptar")}><Check size={17}/>{resolviendo === solicitud.id ? "Procesando…" : "Aceptar trato"}</button><button type="button" disabled={resolviendo === solicitud.id} className="danger" onClick={() => resolve(solicitud, "rechazar")}><X size={17}/>Rechazar</button></div>
      </article>)}</div>}
    </section>

    <section className="deal-panel" aria-labelledby="vigentes-title">
      <header className="deal-section-title"><div><span className="deal-section-icon"><Handshake size={19}/></span><div><h3 id="vigentes-title">Tratos vigentes</h3><p>Empresas con acuerdos activos en tus garages.</p></div></div><span>{tratos.length} activos</span></header>
      {!tratos.length ? <div className="deal-empty"><Handshake size={28}/><strong>Todavía no hay tratos vigentes</strong><p>Los acuerdos aceptados de tus garages aparecerán en esta sección.</p></div> : <>
        <div className="tratos-table-wrap"><table><thead><tr><th>Empresa asociada</th><th>Sede</th><th>Tu garage</th><th>Inicio</th><th>Cocheras</th><th>Tarifa auto</th><th>Tarifa pickup</th></tr></thead><tbody>{tratos.map((trato) => <tr key={trato.id}><td><strong>{nombreEmpresa(trato)}</strong><small>Empresa asociada</small></td><td>{nombreSede(trato)}</td><td><strong>{nombreGarage(trato)}</strong></td><td>{formatearFecha(trato.created_at)}</td><td><span className="deal-spaces-badge">{trato.cantidad_cocheras}</span></td><td>{formatARS(trato.precio_auto)}</td><td>{formatARS(trato.precio_pickup)}</td></tr>)}</tbody></table></div>
        <div className="deal-active-cards">{tratos.map((trato) => <article key={trato.id}><header><div><span>Empresa asociada</span><strong>{nombreEmpresa(trato)}</strong></div><span className="deal-spaces-badge">{trato.cantidad_cocheras} cocheras</span></header><div className="deal-active-garage"><ParkingCircle size={17}/><span>{nombreGarage(trato)}</span></div><dl><div><dt>Sede</dt><dd>{nombreSede(trato)}</dd></div><div><dt>Inicio</dt><dd>{formatearFecha(trato.created_at)}</dd></div><div><dt><CarFront size={14}/> Auto</dt><dd>{formatARS(trato.precio_auto)}</dd></div><div><dt><Truck size={14}/> Pickup</dt><dd>{formatARS(trato.precio_pickup)}</dd></div></dl></article>)}</div>
      </>}
    </section>
  </section>;
}
