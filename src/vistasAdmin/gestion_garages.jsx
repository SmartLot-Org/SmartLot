import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/useAuth';
import Header from '../componentesAdmin/header_admin';
import FooterAdmin from '../componentesAdmin/footer_admin';
import { SedesGetAll } from '../servicies/API_Sede';
import { GaragesGetCercanos } from '../servicies/API_Garage';
import { TratosDelete, TratosGetAll, TratosUpdate } from '../servicies/API_TratoEmpresaGarage';
import { SolicitudesCreate, SolicitudesGetEnviadas } from '../servicies/API_SolicitudEmpresaGarage';
import { buildSolicitudPayload, filterGarages, normalizeDays, normalizeList, parsePositiveInteger } from '../helpers/tratos';
import './gestion_garages.css';

const money = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;
const messageOf = (response) => response?.datos?.message || response?.datos?.error || 'No se pudo completar la operación.';

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
  const [solicitudes, setSolicitudes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
  const pendingGarageIds = useMemo(() => new Set(solicitudes.filter((s) => s.estado === 'pendiente').map((s) => Number(s.id_garage))), [solicitudes]);
  const cantidadNumero = Number(cantidad);
  const cantidadValida = Number.isInteger(cantidadNumero) && cantidadNumero > 0 && cantidadNumero <= Number(selected?.cocheras_disponibles || 0);

  const openRequest = (garage) => {
    setSelected(garage);
    setCantidad('1');
    setDescripcion('');
  };

  const submit = async () => {
    if (!cantidadValida || submitting) return;
    try {
      setSubmitting(true);
      const payload = buildSolicitudPayload({ id_garage: selected.id, cantidad_cocheras: cantidad, descripcion });
      if (payload.cantidad_cocheras > Number(selected.cocheras_disponibles)) throw new Error('La cantidad supera las cocheras disponibles.');
      const confirm = await Swal.fire({ title: 'Enviar solicitud', text: `Solicitar ${payload.cantidad_cocheras} cocheras en ${selected.nombre}?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Enviar', cancelButtonText: 'Cancelar' });
      if (!confirm.isConfirmed) return;
      const response = await SolicitudesCreate(payload);
      if (!response.respuesta) {
        const detail = messageOf(response);
        throw new Error(response.status ? `${detail} (código ${response.status})` : `${detail} Verificá que la API esté iniciada.`);
      }
      setSelected(null); setCantidad(''); setDescripcion('');
      await loadRequests();
      const nearby = await GaragesGetCercanos(Number(sedeId), radio, { force: true });
      if (nearby.respuesta) setCercanos(normalizeList(nearby.datos));
      await Swal.fire('Solicitud enviada', 'El dueño del garage podrá aceptarla o rechazarla.', 'success');
    } catch (e) { await Swal.fire({ title: 'No se pudo enviar la solicitud', text: e.message, icon: 'error', confirmButtonText: 'Revisar datos' }); }
    finally { setSubmitting(false); }
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
    <section className="gestion-garages-top"><button className="boton-back" onClick={() => navigate('/admin_dashboard')}><ArrowLeft size={20} /></button><div><p>GARAGES Y TRATOS</p><h1>Gestión de garages</h1></div></section>
    <div className="garage-tabs" role="tablist"><button className={tab === 'contratados' ? 'active' : ''} onClick={() => setTab('contratados')}>Mis garages contratados</button><button className={tab === 'buscar' ? 'active' : ''} onClick={() => setTab('buscar')}>Buscar garages</button></div>
    <section className="garage-toolbar">
      <select aria-label="Sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} disabled={Boolean(usuario?.id_sede)}>
        {!usuario?.id_sede && tab === 'contratados' && <option value="">Todas las sedes</option>}
        {!sedeId && tab === 'buscar' && <option value="">Seleccioná una sede</option>}
        {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre || s.ubicacion}</option>)}
      </select>
      <label className="garage-search"><Search size={18}/><input aria-label="Buscar" placeholder="Nombre o dirección" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {tab === 'buscar' && <><select aria-label="Distancia" value={radio} onChange={(e) => setRadio(Number(e.target.value))}><option value={5}>5 km</option><option value={15}>15 km</option><option value={50}>50 km</option><option value={100}>100 km</option></select><label><input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)}/> Con disponibilidad</label><label><input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)}/> Activos/abiertos</label></>}
    </section>
    {loading && <p className="garages-feedback">Cargando garages…</p>}{error && <p className="garages-feedback garages-feedback-error">{error}</p>}
    {!loading && !error && tab === 'contratados' && <section className="trato-grid">{contracts.length === 0 ? <p className="garages-feedback">No hay garages contratados para esta selección.</p> : contracts.map((t) => <article className="trato-card" key={t.id}><span className="trato-sede">{t.sede_nombre || `Sede ${t.id_sede || 'legacy'}`}</span><h2>{t.garage_nombre}</h2><p>{t.garage_ubicacion}</p><p>{t.hora_apertura || '—'} a {t.hora_cierre || '—'} · {normalizeDays(t.dias).join(', ') || 'Días no informados'}</p><strong>{t.cantidad_cocheras} cocheras</strong><p>Desde {t.created_at ? new Date(t.created_at).toLocaleDateString('es-AR') : 'fecha legacy'}</p><p>Auto {money(t.precio_auto)} · Pickup {money(t.precio_pickup)}</p><div className="trato-actions"><button onClick={() => editContract(t)}>Cambiar cantidad</button><button className="danger" onClick={() => cancelContract(t)}>Cancelar trato</button></div></article>)}</section>}
    {!loading && !error && tab === 'buscar' && !sedeId && <p className="garages-feedback">Seleccioná una sede para buscar garages cercanos.</p>}
    {!loading && !error && tab === 'buscar' && sedeId && <section className="trato-grid">{results.length === 0 ? <p className="garages-feedback">No se encontraron garages con esos filtros.</p> : results.map((g) => { const pending = pendingGarageIds.has(Number(g.id)); return <article className="trato-card" key={g.id}><span className="trato-sede">{g.distanciaTexto || `${Number(g.distance).toFixed(1)} km`} · {g.tiempoConduccion || 'tiempo estimado'}</span><h2>{g.nombre}</h2><p>{g.ubicacion}</p><p>{g.hora_apertura || '—'} a {g.hora_cierre || '—'} · {normalizeDays(g.dias).join(', ') || 'Días no informados'}</p><strong>{g.cocheras_disponibles} de {g.capacidad} disponibles</strong><p>Auto {money(g.precio_auto)} · Moto {money(g.precio_moto)} · Pickup {money(g.precio_pickup)}</p><button disabled={g.ya_contratado || pending || Number(g.cocheras_disponibles) < 1} onClick={() => openRequest(g)}>{g.ya_contratado ? 'Ya contratado' : pending ? 'Solicitud pendiente' : 'Solicitar cocheras'}</button></article>; })}</section>}
    {selected && <div className="trato-modal" role="dialog" aria-modal="true"><div><h2>Solicitar cocheras en {selected.nombre}</h2><p>Sede de referencia: {sedes.find((s) => Number(s.id) === Number(sedeId))?.nombre}</p><p>Disponibles: <strong>{selected.cocheras_disponibles}</strong></p><p>Auto {money(selected.precio_auto)} · Moto {money(selected.precio_moto)} · Pickup {money(selected.precio_pickup)}</p><label>Cantidad de cocheras <input type="number" min="1" max={selected.cocheras_disponibles} step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}/>{!cantidadValida && <small className="trato-field-error">Ingresá un número entero entre 1 y {selected.cocheras_disponibles}.</small>}</label><label>Descripción opcional <textarea maxLength="1000" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></label><div className="trato-actions"><button disabled={submitting} onClick={() => setSelected(null)}>Volver</button><button disabled={!cantidadValida || submitting} onClick={submit}>{submitting ? 'Enviando…' : 'Revisar y enviar'}</button></div></div></div>}
  </main><FooterAdmin /></div>;
}
