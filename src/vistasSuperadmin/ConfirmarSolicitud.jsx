import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle, Inbox, Mail, ShieldCheck, User } from 'lucide-react';
import {
  SolicitudRegistroGetById,
  SolicitudesRegistroAprobar,
  SolicitudesRegistroRechazar,
} from '../servicies/API_SolicitudRegistro';
import usePageMeta from '../hooks/usePageMeta';
import '../pages/Login.css';
import './ConfirmarSolicitud.css';

const ACCIONES = new Set(['aprobar', 'rechazar']);

export default function ConfirmarSolicitud() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('solicitud');
  const accionMail = searchParams.get('accion');

  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [procesando, setProcesando] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [resuelta, setResuelta] = useState(null);

  usePageMeta({
    title: 'Revisar solicitud de registro | SmartLot',
    description: 'Confirmá la decisión sobre la solicitud de registro de empresa.',
  });

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!id || !/^\d+$/.test(String(id))) {
        setErrorCarga('El enlace no es válido: falta el identificador de la solicitud.');
        setCargando(false);
        return;
      }
      const res = await SolicitudRegistroGetById(Number(id));
      if (!activo) return;
      if (res.respuesta) {
        setSolicitud(res.datos);
        if (res.datos.estado && res.datos.estado !== 'pendiente') {
          setResuelta(res.datos.estado);
        }
      } else {
        const detalle = typeof res.datos === 'string' ? res.datos : res.datos?.message;
        setErrorCarga(detalle || 'No se pudo cargar la solicitud.');
      }
      setCargando(false);
    };
    cargar();
    return () => { activo = false; };
  }, [id]);

  const confirmar = async (accion) => {
    setErrorAccion('');
    setProcesando(accion);
    const transicion = accion === 'aprobar' ? SolicitudesRegistroAprobar : SolicitudesRegistroRechazar;
    const res = await transicion(Number(id));
    if (res.respuesta) {
      setResuelta(accion === 'aprobar' ? 'aceptada' : 'rechazada');
    } else {
      const detalle = typeof res.datos === 'string' ? res.datos : res.datos?.message;
      setErrorAccion(detalle || 'No se pudo completar la acción.');
    }
    setProcesando('');
  };

  const nombreCompleto = solicitud
    ? `${solicitud.nombre ?? ''} ${solicitud.apellido ?? ''}`.trim()
    : '';

  const prioridad = ACCIONES.has(accionMail) ? accionMail : 'aprobar';
  const orden = prioridad === 'aprobar' ? ['aprobar', 'rechazar'] : ['rechazar', 'aprobar'];

  return (
    <div className="login-page">
      <div className="login-glow login-glow--uno" aria-hidden="true" />
      <div className="login-glow login-glow--dos" aria-hidden="true" />

      <main className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">
            <ShieldCheck size={26} />
          </span>
          <span className="login-brand-nombre">SmartLot</span>
        </div>

        {cargando && (
          <>
            <h1 className="login-titulo">Revisando solicitud…</h1>
            <p className="login-subtitulo">Cargando los datos de la solicitud de registro.</p>
          </>
        )}

        {!cargando && errorCarga && (
          <div className="login-form">
            <div className="login-ok">
              <AlertCircle size={48} className="login-ok-icon" />
              <h3 className="login-ok-titulo">No se pudo abrir la solicitud</h3>
              <p className="login-ok-mensaje">{errorCarga}</p>
              <Link to="/superadmin/gestion_usuarios" className="login-boton">
                Ir al panel de solicitudes
              </Link>
            </div>
          </div>
        )}

        {!cargando && !errorCarga && resuelta && (
          <div className="login-form">
            <div className="login-ok">
              <CheckCircle size={48} className="login-ok-icon" />
              <h3 className="login-ok-titulo">Solicitud {resuelta}</h3>
              <p className="login-ok-mensaje">
                Esta solicitud ya fue revisada{resuelta === 'aceptada' ? ' y aceptada' : ' y rechazada'}.
                El administrador de empresa correspondiente ya recibió su notificación.
              </p>
              <Link to="/superadmin/gestion_usuarios" className="login-boton">
                Ver solicitudes en el panel
              </Link>
            </div>
          </div>
        )}

        {!cargando && !errorCarga && !resuelta && solicitud && (
          <>
            <h1 className="login-titulo">Revisar solicitud</h1>
            <p className="login-subtitulo">
              Un administrador de empresa pidió registrarse. Confirmá tu decisión con tu sesión de superadmin.
            </p>

            <div className="confirmar-datos">
              <div className="confirmar-dato">
                <span className="confirmar-dato-label">Solicitante</span>
                <span className="confirmar-dato-valor"><User size={14} /> {nombreCompleto}</span>
              </div>
              <div className="confirmar-dato">
                <span className="confirmar-dato-label">Correo</span>
                <span className="confirmar-dato-valor"><Mail size={14} /> {solicitud.email}</span>
              </div>
              <div className="confirmar-dato">
                <span className="confirmar-dato-label">Empresa</span>
                <span className="confirmar-dato-valor"><Building2 size={14} /> {solicitud.empresa_nombre}</span>
              </div>
              {solicitud.empresa_descripcion && (
                <div className="confirmar-dato">
                  <span className="confirmar-dato-label">Descripción</span>
                  <span className="confirmar-dato-valor confirmar-dato-valor--debil">
                    <Inbox size={14} /> {solicitud.empresa_descripcion}
                  </span>
                </div>
              )}
            </div>

            {errorAccion && (
              <div className="login-error" role="alert">{errorAccion}</div>
            )}

            <div className="confirmar-acciones">
              {orden.map((accion) => (
                <button
                  key={accion}
                  type="button"
                  className={accion === 'aprobar' ? 'confirmar-boton-aprobar' : 'confirmar-boton-rechazar'}
                  disabled={Boolean(procesando)}
                  onClick={() => confirmar(accion)}
                >
                  {procesando === accion ? 'Confirmando…' : (accion === 'aprobar' ? 'Aceptar solicitud' : 'Rechazar solicitud')}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
