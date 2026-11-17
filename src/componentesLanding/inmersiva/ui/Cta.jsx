import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CTA } from '../contenido/secciones';
import { useMagnetico } from './useMagnetico';

// Botón principal: el brillo de la landing anterior (sombra azul en reposo, otra más
// intensa en hover y un barrido de luz) y el leve imán hacia el cursor.
export function BotonBrillo({ to, chico = false, children }) {
  const ref = useRef(null);
  useMagnetico(ref, chico ? 0.18 : 0.28);
  return (
    <Link ref={ref} to={to} className={chico ? 'plano-boton plano-boton--chico' : 'plano-boton'}>
      <span className="plano-boton__brillo" aria-hidden="true" />
      <span className="plano-boton__texto">{children}</span>
    </Link>
  );
}

// La acción principal de la landing. Misma etiqueta en la barra, el hero y el cierre.
export function Cta({ chico = false }) {
  return <BotonBrillo to={CTA.principal.destino} chico={chico}>{CTA.principal.etiqueta}</BotonBrillo>;
}

// El lado del dueño de garage: navegación en la barra y enlace simple en el pie.
export function EnlaceGarage({ className = 'plano-enlace' }) {
  return (
    <Link to={CTA.secundaria.destino} className={className}>
      {CTA.secundaria.etiqueta}
    </Link>
  );
}
