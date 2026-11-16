import { Link } from 'react-router-dom';
import { CTA } from '../contenido/secciones';

// La acción principal de la landing. Misma etiqueta en la barra, el hero y el cierre.
export function Cta({ chico = false }) {
  return (
    <Link to={CTA.principal.destino} className={chico ? 'plano-boton plano-boton--chico' : 'plano-boton'}>
      {CTA.principal.etiqueta}
    </Link>
  );
}

// Acción secundaria, más callada: lleva al lado del dueño de garage.
export function EnlaceGarage() {
  return (
    <Link to={CTA.secundaria.destino} className="plano-enlace">
      {CTA.secundaria.etiqueta}
    </Link>
  );
}
