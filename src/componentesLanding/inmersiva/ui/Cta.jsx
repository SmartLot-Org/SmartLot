import { Link } from 'react-router-dom';
import { CTA } from '../contenido/secciones';

// Botón principal con el brillo de la landing anterior: una sombra azul en reposo,
// otra más intensa en hover y un barrido de luz que cruza el botón una vez.
export function BotonBrillo({ to, chico = false, children }) {
  return (
    <Link to={to} className={chico ? 'plano-boton plano-boton--chico' : 'plano-boton'}>
      <span className="plano-boton__brillo" aria-hidden="true" />
      <span className="plano-boton__texto">{children}</span>
    </Link>
  );
}

// La acción principal de la landing. Misma etiqueta en la barra, el hero y el cierre.
export function Cta({ chico = false }) {
  return <BotonBrillo to={CTA.principal.destino} chico={chico}>{CTA.principal.etiqueta}</BotonBrillo>;
}

// El lado del dueño de garage: un enlace simple, en la barra y en el pie.
export function EnlaceGarage() {
  return (
    <Link to={CTA.secundaria.destino} className="plano-enlace">
      {CTA.secundaria.etiqueta}
    </Link>
  );
}
