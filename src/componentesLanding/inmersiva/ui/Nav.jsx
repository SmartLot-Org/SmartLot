import { Link } from 'react-router-dom';
import { useUI } from '../estado/store';
import { useAuth } from '../../../contexts/useAuth';
import { getUserHomeRoute } from '../../../helpers/roles';
import { NAVEGACION } from '../contenido/secciones';
import { Cta, EnlaceGarage } from './Cta';

// Interruptor día / noche: el plano claro o el cianotipo, con transición.
function Tema() {
  const tema = useUI((s) => s.tema);
  const alternar = useUI((s) => s.alternarTema);
  const noche = tema === 'cianotipo';
  return (
    <button type="button" className="plano-tema" onClick={alternar} aria-pressed={noche} aria-label={noche ? NAVEGACION.tema.dia : NAVEGACION.tema.noche} title={noche ? NAVEGACION.tema.dia : NAVEGACION.tema.noche}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g className="plano-tema__sol">
          <circle cx="12" cy="12" r="4.2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="2.6" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
        <path className="plano-tema__luna" d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" />
      </svg>
    </button>
  );
}

export function Nav() {
  const { usuario } = useAuth();

  return (
    <header className="plano-barra">
      <Link to="/" className="plano-marca" aria-label={`${NAVEGACION.marca}, inicio`}>
        <img src="/landing/marca.webp" alt="" width="23" height="32" />
        <span>{NAVEGACION.marca}</span>
      </Link>
      <nav aria-label="Principal">
        <Tema />
        <span className="plano-barra__ancho"><EnlaceGarage /></span>
        {usuario ? (
          <Link to={getUserHomeRoute(usuario)} className="plano-boton plano-boton--chico">
            {NAVEGACION.panel}
          </Link>
        ) : (
          <>
            <Link to={NAVEGACION.ingresar.destino} className="plano-enlace plano-enlace--tinta">
              {NAVEGACION.ingresar.etiqueta}
            </Link>
            <Cta chico />
          </>
        )}
      </nav>
    </header>
  );
}
