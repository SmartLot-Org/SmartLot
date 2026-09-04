import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, Clock3, MapPin, ParkingCircle, Search, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/useAuth';
import Header from '../componentesAdmin/header_admin';
import FooterAdmin from '../componentesAdmin/footer_admin';
import { SedesGetAll } from '../servicies/API_Sede';
import { GaragesGetCercanos } from '../servicies/API_Garage';
import { TratosDelete, TratosGetAll, TratosUpdate, TratosUpdatePaymentModality } from '../servicies/API_TratoEmpresaGarage';
import { SolicitudesCreate, SolicitudesGetEnviadas } from '../servicies/API_SolicitudEmpresaGarage';
import { buildSolicitudPayload, filterGarages, normalizeDays, normalizeList, parsePositiveInteger } from '../helpers/tratos';
import './gestion_garages.css';

const MapaGaragesCercanos = lazy(() => import('../componentesAdmin/MapaGaragesCercanos'));

const money = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;
const messageOf = (response) => response?.datos?.message || response?.datos?.error || 'No se pudo completar la operación.';
const showGarageAlert = (options) => Swal.fire({
  ...options,
  customClass: { ...options.customClass, container: 'garage-swal-container' },
});

export default function GestionGarages() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [tab, setTab] = useState('contratados');
  const [sedes, setSedes] = useState([]);
  const [sedeId, setSedeId] = useState(usuario?.id_sede ? String(usuario.id_sede) : '');
  const [tratos, setTratos] = useState([]);
  const [cercanos, setCercanos] = useState([]);
  const [search, setSearch] = useState('');
  const [radio, setRadio] = useState(50);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalidadPago, setModalidadPago] = useState('empresa_cubre_cupo');
  const [solicitudes, setSolicitudes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mapSelectedGarageId, setMapSelectedGarageId] = useState(null);
  const garageCardRefs = useRef(new Map());

  const loadContracts = useCallback(async () => {
    const response = await TratosGetAll({ force: true });
    if (!response.respuesta) throw new Error(messageOf(response));
    setTratos(normalizeList(response.datos));
  }, []);

  const loadRequests = useCallback(async () => {
    const response = await SolicitudesGetEnviadas({ force: true });
    if (!response.respuesta) throw new Error(messageOf(response));
    setSolicitudes(normalizeList(response.datos));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError('');
      const response = await SedesGetAll();
      if (!active) return;
      if (!response.respuesta) setError('No se pudieron cargar las sedes.');
      else {
        const rows = normalizeList(response.datos);
        setSedes(rows);
        if (usuario?.id_sede) setSedeId(String(usuario.id_sede));
        else if (rows.length === 1) setSedeId(String(rows[0].id));
      }
      try { await Promise.all([loadContracts(), loadRequests()]); } catch (e) { if (active) setError(e.message); }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [loadContracts, loadRequests, usuario?.id_sede]);

  useEffect(() => {
    if (tab !== 'buscar' || !sedeId) return;
    let active = true;
    (async () => {
      setLoading(true); setError('');
      const response = await GaragesGetCercanos(Number(sedeId), radio, { force: true });
      if (!active) return;
      if (response.respuesta) setCercanos(normalizeList(response.datos));
      else setError(messageOf(response));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [tab, sedeId, radio]);

  const contracts = useMemo(() => tratos.filter((t) =>
    (!sedeId || Number(t.id_sede) === Number(sedeId)) &&
    `${t.garage_nombre || ''} ${t.garage_ubicacion || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [tratos, sedeId, search]);
  const results = useMemo(() => filterGarages(cercanos, { search, maxDistance: radio, availableOnly, activeOnly }), [cercanos, search, radio, availableOnly, activeOnly]);
  const pendingRequests = useMemo(() => solicitudes.filter((s) =>
    s.estado === 'pendiente' &&
    (!sedeId || Number(s.id_sede) === Number(sedeId)) &&
    `${s.garage_nombre || ''} ${s.garage_ubicacion || ''} ${s.sede_nombre || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [solicitudes, sedeId, search]);
  const pendingGarageKeys = useMemo(() => new Set(solicitudes.filter((s) => s.estado === 'pendiente').map((s) => `${Number(s.id_sede)}:${Number(s.id_garage)}`)), [solicitudes]);
  const contractedSpaces = useMemo(() => tratos.reduce((total, trato) => total + Number(trato.cantidad_cocheras || 0), 0), [tratos]);
  const selectedSede = useMemo(() => sedes.find((s) => String(s.id) === String(sedeId)) || null, [sedes, sedeId]);
  const visibleMapSelectedId = useMemo(() => results.some((garage) => String(garage.id) === String(mapSelectedGarageId)) ? mapSelectedGarageId : null, [mapSelectedGarageId, results]);
  const cantidadNumero = Number(cantidad);
  const cantidadValida = Number.isInteger(cantidadNumero) && cantidadNumero > 0 && cantidadNumero <= Number(selected?.cocheras_disponibles || 0);

  const openRequest = (garage) => {
    if (!sedeId) return;
    setSelected(garage);
    setCantidad('1');
    setDescripcion('');
    setModalidadPago('empresa_cubre_cupo');
  };

  const selectGarageOnMap = useCallback((garage, { scroll = true } = {}) => {
    const garageId = garage?.id ?? garage?.id_garage;
    setMapSelectedGarageId(garageId);
    if (!scroll) return;
    requestAnimationFrame(() => {
      garageCardRefs.current.get(String(garageId))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const submit = async () => {
    if (!sedeId || !cantidadValida || submitting) return;
    try {
      setSubmitting(true);
      const payload = buildSolicitudPayload({ id_sede: sedeId, id_garage: selected.id, cantidad_cocheras: cantidad, descripcion, modalidad_pago: modalidadPago });
      if (payload.cantidad_cocheras > Number(selected.cocheras_disponibles)) throw new Error('La cantidad supera las cocheras disponibles.');
      const confirm = await showGarageAlert({ title: 'Enviar solicitud', text: `Solicitar ${payload.cantidad_cocheras} cocheras en ${selected.nombre}?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Enviar', cancelButtonText: 'Cancelar' });
      if (!confirm.isConfirmed) return;
      const response = await SolicitudesCreate(payload);
      if (!response.respuesta) {
        const detail = messageOf(response);
        throw new Error(response.status ? `${detail} (código ${response.status})` : `${detail} Verificá que la API esté iniciada.`);
      }
      setSelected(null); setCantidad(''); setDescripcion('');
      setSubmitting(false);
      const refreshRequests = loadRequests().catch(() => null);
      const refreshNearby = GaragesGetCercanos(Number(sedeId), radio, { force: true });
      await showGarageAlert({ title: 'Solicitud enviada', text: 'El dueño del garage podrá aceptarla o rechazarla.', icon: 'success', confirmButtonText: 'Entendido' });
      const [, nearby] = await Promise.all([refreshRequests, refreshNearby]);
      if (nearby.respuesta) setCercanos(normalizeList(nearby.datos));
    } catch (e) { await showGarageAlert({ title: 'No se pudo enviar la solicitud', text: e.message, icon: 'error', confirmButtonText: 'Revisar datos' }); }
    finally { setSubmitting(false); }
  };

  const changeModality = async (trato) => {
    const confirm = await Swal.fire({
      title: 'Elegí la modalidad de pago',
      html: `<div style="text-align:left;line-height:1.45">
        <p><strong>La empresa cubre el cupo</strong><br>La empresa paga las reservas que usan una cochera dentro del cupo contratado. Si el cupo está completo, el empleado puede reservar un lugar extra y pagarlo.</p>
        <p><strong>El empleado paga todo</strong><br>Cada empleado paga su reserva, tanto dentro del cupo como en una cochera extra. El cupo contratado sigue reservado para la sede.</p>
        <hr><p><strong>Importante:</strong> el cambio se aplicará solamente a las reservas nuevas. Las reservas existentes conservarán su responsable de pago.</p>
      </div>`,
      input: 'select',
      inputOptions: {
        empresa_cubre_cupo: 'La empresa cubre el cupo',
        empleado_paga_todo: 'El empleado paga todo',
      },
      inputValue: trato.modalidad_pago,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Aplicar modalidad',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => !value && 'Seleccioná una modalidad.',
    });
    if (!confirm.isConfirmed) return;
    if (confirm.value === trato.modalidad_pago) return Swal.fire('Sin cambios', 'El trato ya utiliza esa modalidad.', 'info');
    const response = await TratosUpdatePaymentModality(trato.id, confirm.value);
    if (!response.respuesta) return Swal.fire('Error', messageOf(response), 'error');
    await loadContracts();
  };

  const editContract = async (trato) => {
    const result = await Swal.fire({ title: 'Cantidad de cocheras', input: 'number', inputValue: trato.cantidad_cocheras, inputAttributes: { min: 1, step: 1 }, showCancelButton: true });
    if (!result.isConfirmed) return;
    try {
      const response = await TratosUpdate(trato.id, { cantidad_cocheras: parsePositiveInteger(result.value, 'Cantidad') });
      if (!response.respuesta) throw new Error(messageOf(response));
      await loadContracts();
    } catch (e) { await Swal.fire('Error', e.message, 'error'); }
  };
  const cancelContract = async (trato) => {
    const confirm = await Swal.fire({ title: '¿Cancelar trato?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, cancelar' });
    if (!confirm.isConfirmed) return;
    const response = await TratosDelete(trato.id);
    if (!response.respuesta) return Swal.fire('Error', messageOf(response), 'error');
    await loadContracts();
  };

  return <div className="gestion-garages"><Header /><main className="gestion-garages-main">
    <header className="garage-page-header"><button className="boton-back" onClick={() => navigate('/admin_dashboard')} aria-label="Volver al panel"><ArrowLeft size={20} /></button><div><span className="garage-page-eyebrow">GARAGES Y TRATOS</span><h1>Gestión de garages</h1><p>Administrá tus acuerdos, seguí cada solicitud y encontrá nuevas cocheras para tu sede.</p></div></header>
    <section className="garage-kpis" aria-label="Resumen de garages"><article><span className="garage-kpi-icon"><Building2 size={20}/></span><div><small>Acuerdos activos</small><strong>{tratos.length}</strong></div></article><article><span className="garage-kpi-icon"><Clock3 size={20}/></span><div><small>Solicitudes pendientes</small><strong>{pendingRequests.length}</strong></div></article><article><span className="garage-kpi-icon"><ParkingCircle size={20}/></span><div><small>Cocheras contratadas</small><strong>{contractedSpaces}</strong></div></article></section>
    {pendingRequests.length > 0 && tab !== 'pendientes' ? <button type="button" className="garage-pending-banner" onClick={() => setTab('pendientes')}><span className="garage-pending-banner__icon"><Clock3 size={22}/></span><span><strong>{pendingRequests.length === 1 ? 'Tenés una solicitud esperando respuesta' : `Tenés ${pendingRequests.length} solicitudes esperando respuesta`}</strong><small>El garage todavía no aceptó la propuesta. Consultá su estado acá.</small></span><span className="garage-pending-banner__action">Ver pendientes <ArrowLeft size={16}/></span></button> : null}
    <div className="garage-tabs" role="tablist" aria-label="Secciones de gestión"><button role="tab" aria-selected={tab === 'contratados'} className={tab === 'contratados' ? 'active' : ''} onClick={() => setTab('contratados')}><CheckCircle2 size={17}/>Contratados <span>{tratos.length}</span></button><button role="tab" aria-selected={tab === 'pendientes'} className={tab === 'pendientes' ? 'active' : ''} onClick={() => setTab('pendientes')}><Clock3 size={17}/>Pendientes {pendingRequests.length > 0 ? <span className="pending-count">{pendingRequests.length}</span> : null}</button><button role="tab" aria-selected={tab === 'buscar'} className={tab === 'buscar' ? 'active' : ''} onClick={() => setTab('buscar')}><Search size={17}/>Buscar garages</button></div>
    <section className="garage-toolbar" aria-label="Filtros de garages">
      <label className="garage-filter-field"><span>Sede</span><select value={sedeId} onChange={(e) => setSedeId(e.target.value)} disabled={Boolean(usuario?.id_sede)}>
        {!usuario?.id_sede && tab !== 'buscar' && <option value="">Todas las sedes</option>}
        {!sedeId && tab === 'buscar' && <option value="">Seleccioná una sede</option>}
        {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre || s.ubicacion}</option>)}
      </select></label>
      <label className="garage-filter-field garage-search"><span>Buscar garage</span><span className="garage-search__control"><Search size={18}/><input placeholder="Nombre o dirección" value={search} onChange={(e) => setSearch(e.target.value)} /></span></label>
      {tab === 'buscar' && <><label className="garage-filter-field"><span>Radio de búsqueda</span><select value={radio} onChange={(e) => setRadio(Number(e.target.value))}><option value={5}>5 km</option><option value={15}>15 km</option><option value={50}>50 km</option><option value={100}>100 km</option></select></label><label className="garage-check"><input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)}/> Con disponibilidad</label><label className="garage-check"><input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)}/> Activos/abiertos</label></>}
    </section>
    {loading && <p className="garages-feedback">Cargando garages…</p>}{error && <p className="garages-feedback garages-feedback-error">{error}</p>}
    {!loading && !error && tab === 'contratados' && <section className="trato-grid">{contracts.length === 0 ? <p className="garages-feedback">No hay garages contratados para esta selección.</p> : contracts.map((t) => <article className="trato-card" key={t.id}><span className="trato-sede">{t.sede_nombre || `Sede ${t.id_sede || 'legacy'}`}</span><h2>{t.garage_nombre}</h2><p>{t.garage_ubicacion}</p><p>{t.hora_apertura || '—'} a {t.hora_cierre || '—'} · {normalizeDays(t.dias).join(', ') || 'Días no informados'}</p><strong>{t.cantidad_cocheras} cocheras</strong><p>Modalidad: {t.modalidad_pago === 'empleado_paga_todo' ? 'Paga el empleado' : 'La empresa cubre el cupo'}</p><p>Desde {t.created_at ? new Date(t.created_at).toLocaleDateString('es-AR') : 'fecha legacy'}</p><p>Auto {money(t.precio_auto)} · Pickup {money(t.precio_pickup)}</p><div className="trato-actions"><button onClick={() => editContract(t)}>Cambiar cantidad</button><button onClick={() => changeModality(t)}>Cambiar modalidad</button><button className="danger" onClick={() => cancelContract(t)}>Cancelar trato</button></div></article>)}</section>}
    {!loading && !error && tab === 'pendientes' && <section className="trato-grid">{pendingRequests.length === 0 ? <div className="garage-empty"><CheckCircle2 size={31}/><h2>Estás al día</h2><p>No hay solicitudes esperando respuesta para esta selección.</p><button onClick={() => setTab('buscar')}>Buscar garages</button></div> : pendingRequests.map((s) => <article className="trato-card trato-card--pending" key={s.id}><header className="trato-card__header"><span className="trato-sede"><Building2 size={14}/>{s.sede_nombre || `Sede ${s.id_sede}`}</span><span className="trato-status"><Clock3 size={13}/> Pendiente</span></header><h2>{s.garage_nombre || `Garage ${s.id_garage}`}</h2><p className="trato-location"><MapPin size={16}/>{s.garage_ubicacion || 'Ubicación no informada'}</p><div className="trato-request-capacity"><Send size={21}/><strong>{s.cantidad_cocheras}</strong><span>cocheras solicitadas</span></div>{s.descripcion ? <p className="trato-request-note">“{s.descripcion}”</p> : null}<div className="trato-waiting"><Clock3 size={18}/><div><strong>Esperando confirmación del garage</strong><span>Si la acepta, aparecerá automáticamente entre tus contratos.</span></div></div><small className="trato-request-date">Enviada el {s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR') : 'fecha no informada'}</small></article>)}</section>}
    {!loading && !error && tab === 'buscar' && !sedeId && <p className="garages-feedback">Seleccioná una sede para buscar garages cercanos.</p>}
    {!loading && !error && tab === 'buscar' && sedeId && <section className="garage-search-results" aria-label="Mapa y garages cercanos">
      <aside className="garage-map-panel" aria-label="Mapa de garages cercanos">
        <header><div><span>Ubicaciones cercanas</span><strong>{results.length} {results.length === 1 ? 'garage encontrado' : 'garages encontrados'}</strong></div><small><span className="garage-map-legend garage-map-legend--sede"/>Sede <span className="garage-map-legend"/>Garage</small></header>
        <div className="garage-map-container">
          <Suspense fallback={<div className="garage-map-state" role="status"><span className="garage-map-spinner"/><div><strong>Cargando mapa</strong><span>Preparando las ubicaciones…</span></div></div>}>
            <MapaGaragesCercanos sede={selectedSede} garages={results} selectedGarageId={visibleMapSelectedId} onSelectGarage={selectGarageOnMap} onClearSelection={() => setMapSelectedGarageId(null)}/>
          </Suspense>
        </div>
        <p>Seleccioná un marcador para encontrar su tarjeta en el listado.</p>
      </aside>
      <div className="garage-results-list" aria-live="polite">
        {results.length === 0 ? <p className="garages-feedback">No se encontraron garages con esos filtros.</p> : results.map((g) => {
          const pending = pendingGarageKeys.has(`${Number(sedeId)}:${Number(g.id)}`);
          const highlighted = String(visibleMapSelectedId) === String(g.id);
          return <article
            className={`trato-card trato-card--search${highlighted ? ' trato-card--map-selected' : ''}`}
            key={g.id}
            ref={(node) => { if (node) garageCardRefs.current.set(String(g.id), node); else garageCardRefs.current.delete(String(g.id)); }}
            onClick={() => selectGarageOnMap(g, { scroll: false })}
          >
            <span className="trato-sede">{g.distanciaTexto || `${Number(g.distance).toFixed(1)} km`} · {g.tiempoConduccion || 'tiempo estimado'}</span>
            <h2>{g.nombre}</h2><p>{g.ubicacion}</p><p>{g.hora_apertura || '—'} a {g.hora_cierre || '—'} · {normalizeDays(g.dias).join(', ') || 'Días no informados'}</p><strong>{g.cocheras_disponibles} de {g.capacidad} disponibles</strong><p>Auto {money(g.precio_auto)} · Moto {money(g.precio_moto)} · Pickup {money(g.precio_pickup)}</p>
            <div className="garage-search-card-actions"><button type="button" className="garage-locate-button" onClick={(event) => { event.stopPropagation(); selectGarageOnMap(g, { scroll: false }); }}><MapPin size={15}/>Ver en mapa</button><button disabled={g.ya_contratado || pending || Number(g.cocheras_disponibles) < 1} onClick={(event) => { event.stopPropagation(); openRequest(g); }}>{g.ya_contratado ? 'Ya contratado' : pending ? 'Solicitud pendiente' : 'Solicitar cocheras'}</button></div>
          </article>;
        })}
      </div>
    </section>}
    {selected && <div className="trato-modal" role="dialog" aria-modal="true"><div><h2>Solicitar cocheras en {selected.nombre}</h2><p>Sede de referencia: {sedes.find((s) => Number(s.id) === Number(sedeId))?.nombre}</p><p>Disponibles: <strong>{selected.cocheras_disponibles}</strong></p><p>Auto {money(selected.precio_auto)} · Moto {money(selected.precio_moto)} · Pickup {money(selected.precio_pickup)}</p><label>Cantidad de cocheras <input type="number" min="1" max={selected.cocheras_disponibles} step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}/>{!cantidadValida && <small className="trato-field-error">Ingresá un número entero entre 1 y {selected.cocheras_disponibles}.</small>}</label><label>Modalidad de pago <select value={modalidadPago} onChange={(e) => setModalidadPago(e.target.value)}><option value="empresa_cubre_cupo">La empresa cubre el cupo</option><option value="empleado_paga_todo">El empleado paga todo</option></select></label><label>Descripción opcional <textarea maxLength="1000" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></label><div className="trato-actions"><button disabled={submitting} onClick={() => setSelected(null)}>Volver</button><button disabled={!cantidadValida || submitting} onClick={submit}>{submitting ? 'Enviando…' : 'Revisar y enviar'}</button></div></div></div>}
  </main><FooterAdmin /></div>;
}
