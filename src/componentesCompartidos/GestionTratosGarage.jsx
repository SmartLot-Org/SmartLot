import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Building2, Check, Handshake, Inbox, ParkingCircle, RefreshCw, X } from 'lucide-react';
import { GaragesGetAll } from '../servicies/API_Garage';
import { TratosGetAll } from '../servicies/API_TratoEmpresaGarage';
import { SolicitudesAceptar, SolicitudesGetRecibidas, SolicitudesRechazar } from '../servicies/API_SolicitudEmpresaGarage';
import { formatARS } from '../helpers/prices';
import { normalizeList } from '../helpers/tratos';

export default function GestionTratosGarage() {
  const [tratos, setTratos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [tratosResponse, solicitudesResponse, garagesResponse] = await Promise.all([
      TratosGetAll({ force: true }),
      SolicitudesGetRecibidas({ force: true }),
      GaragesGetAll({ force: true }),
    ]);
    if (!tratosResponse.respuesta || !solicitudesResponse.respuesta || !garagesResponse.respuesta) {
      setError(tratosResponse.datos?.message || solicitudesResponse.datos?.message || garagesResponse.datos?.message || 'No se pudo cargar la gestión de tratos.');
    } else {
      setError('');
      setTratos(normalizeList(tratosResponse.datos));
      setSolicitudes(normalizeList(solicitudesResponse.datos));
      setGarages(normalizeList(garagesResponse.datos));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (solicitud, action) => {
    const accepting = action === 'aceptar';
    const confirm = await Swal.fire({
      title: accepting ? '¿Aceptar solicitud?' : '¿Rechazar solicitud?',
      text: accepting
        ? `Se cerrará el trato con ${solicitud.empresa_nombre || 'la empresa'} por ${solicitud.cantidad_cocheras} cocheras.`
        : 'La empresa será informada del rechazo.',
      icon: accepting ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: accepting ? 'Sí, cerrar trato' : 'Sí, rechazar',
      cancelButtonText: 'Volver',
    });
    if (!confirm.isConfirmed) return;
    const response = accepting
      ? await SolicitudesAceptar(solicitud.id)
      : await SolicitudesRechazar(solicitud.id);
    if (!response.respuesta) {
      return Swal.fire('No se pudo completar', response.datos?.message || 'Ocurrió un error.', 'error');
    }
    await load();
    return Swal.fire(accepting ? 'Trato cerrado' : 'Solicitud rechazada', accepting ? 'El acuerdo fue creado correctamente.' : 'La solicitud fue rechazada.', 'success');
  };

  if (loading) return <div className="deal-loading"><span /><p>Cargando solicitudes y tratos…</p></div>;
  if (error) return <div className="deal-state deal-state--error"><X size={24}/><div><strong>No pudimos cargar esta sección</strong><p>{error}</p></div><button onClick={load}>Reintentar</button></div>;
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');
  return <section className="tratos-manager">
    <div className="deal-toolbar"><div><span>Panel comercial</span><h2>Solicitudes y acuerdos</h2><p>Revisá las propuestas enviadas por empresas para tus garages.</p></div><button onClick={load}><RefreshCw size={17}/>Actualizar</button></div>
    {!garages.length && <div className="deal-state deal-state--warning"><ParkingCircle size={25}/><div><strong>Tu cuenta no tiene garages asociados</strong><p>Mientras no se asigne un garage a este usuario, no podrás recibir ni aceptar solicitudes. Pedile a un administrador de SmartLot que revise la asignación.</p></div></div>}
    <div className="duenio-requests-summary"><div><Inbox/><span>Solicitudes pendientes</span><strong>{pendientes.length}</strong></div><div><Handshake/><span>Tratos vigentes</span><strong>{tratos.length}</strong></div><div><ParkingCircle/><span>Cocheras comprometidas</span><strong>{tratos.reduce((sum, t) => sum + Number(t.cantidad_cocheras || 0), 0)}</strong></div></div>
    <div className="deal-section-title"><div><Inbox size={20}/><div><h3>Solicitudes de empresas</h3><p>Propuestas que esperan tu decisión.</p></div></div><span>{pendientes.length} pendientes</span></div>
    {!pendientes.length ? <div className="deal-empty"><Inbox size={28}/><strong>No hay solicitudes pendientes</strong><p>Cuando una empresa solicite cocheras en uno de tus garages, aparecerá acá.</p></div> : <div className="deal-request-grid">{pendientes.map((s) => <article className="deal-request-card" key={s.id}><div className="deal-request-card__top"><span><Building2 size={16}/>{s.empresa_nombre || `Empresa #${s.id_empresa}`}</span><small>Pendiente</small></div><h4>{s.garage_nombre || `Garage #${s.id_garage}`}</h4><div className="deal-request-amount"><strong>{s.cantidad_cocheras}</strong><span>cocheras solicitadas</span></div><p>{s.descripcion || 'La empresa no agregó una descripción.'}</p><div className="deal-request-actions"><button onClick={() => resolve(s, 'aceptar')}><Check size={17}/>Cerrar trato</button><button className="danger" onClick={() => resolve(s, 'rechazar')}><X size={17}/>Rechazar</button></div></article>)}</div>}
    <div className="deal-section-title"><div><Handshake size={20}/><div><h3>Tratos vigentes</h3><p>Acuerdos activos en tus garages.</p></div></div><span>{tratos.length} activos</span></div>
    {!tratos.length ? <section className="duenio-empty-state"><p>Los acuerdos de tus garages aparecerán aquí.</p></section> : <div className="tratos-table-wrap"><table><thead><tr><th>Empresa</th><th>Sede</th><th>Garage</th><th>Fecha</th><th>Cocheras</th><th>Auto</th><th>Pickup</th></tr></thead><tbody>{tratos.map((t) => <tr key={t.id}><td>{t.empresa_nombre || `Empresa #${t.id_empresa}`}</td><td>{t.sede_nombre || `Sede #${t.id_sede || 'legacy'}`}</td><td>{t.garage_nombre || `Garage #${t.id_garage}`}</td><td>{t.created_at ? new Date(t.created_at).toLocaleDateString('es-AR') : 'Legacy'}</td><td>{t.cantidad_cocheras}</td><td>{formatARS(t.precio_auto)}</td><td>{formatARS(t.precio_pickup)}</td></tr>)}</tbody></table></div>}
  </section>;
}
