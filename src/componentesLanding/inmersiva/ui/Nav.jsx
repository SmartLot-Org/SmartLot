import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import { getUserHomeRoute } from '../../../helpers/roles';
import { NAVEGACION } from '../contenido/comun';
import { BotonBrillo, Cta, EnlacePagina } from './Cta';

// Tres niveles, del más fuerte al más callado:
// 1. La CTA de la página: la acción principal, botón lleno con brillo.
// 2. Iniciar sesión: acción secundaria, botón con borde (button-secondary de DESIGN.md).
// 3. La otra página del plano: es un destino, no una acción. Va con la marca, como navegación.
export function Nav({ cta, enlace }) {
  const { usuario } = useAuth();

  return (
    <header className="plano-barra">
      <div className="plano-barra__inicio">
        <Link to="/" className="plano-marca" aria-label={`${NAVEGACION.marca}, inicio`}>
          <img src="/landing/marca.webp" alt="" width="23" height="32" />
          <span>{NAVEGACION.marca}</span>
        </Link>
        <nav aria-label="Principal" className="plano-barra__nav">
          <EnlacePagina enlace={enlace} className="plano-navlink" />
        </nav>
      </div>
      <div className="plano-barra__acciones">
        {usuario ? (
          <BotonBrillo to={getUserHomeRoute(usuario)} chico>{NAVEGACION.panel}</BotonBrillo>
        ) : (
          <>
            <Link to={NAVEGACION.ingresar.destino} className="plano-boton-secundario">
              {NAVEGACION.ingresar.etiqueta}
            </Link>
            <Cta cta={cta} chico />
          </>
        )}
      </div>
    </header>
  );
}
