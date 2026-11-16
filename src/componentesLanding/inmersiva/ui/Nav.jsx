import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import { getUserHomeRoute } from '../../../helpers/roles';
import { NAVEGACION } from '../contenido/secciones';
import { Cta, EnlaceGarage } from './Cta';

export function Nav() {
  const { usuario } = useAuth();

  return (
    <header className="plano-barra">
      <Link to="/" className="plano-marca" aria-label={`${NAVEGACION.marca}, inicio`}>
        <img src="/landing/marca.webp" alt="" width="23" height="32" />
        <span>{NAVEGACION.marca}</span>
      </Link>
      <nav aria-label="Principal">
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
