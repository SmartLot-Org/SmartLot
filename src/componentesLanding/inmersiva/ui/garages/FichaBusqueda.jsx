import { Fragment } from 'react';
import { BUSQUEDA } from '../../contenido/garages';

// Cada dato queda entero en su renglón: el separador va pegado al dato siguiente,
// así ningún renglón termina en un "·" suelto en el celular.
function Datos({ texto }) {
  return texto.split(' · ').map((dato, i) => (
    <Fragment key={dato}>
      {i > 0 && ' '}
      <span>{i > 0 ? `· ${dato}` : dato}</span>
    </Fragment>
  ));
}

// "Así te ve una empresa": la tarjeta del listado de "Buscar garages"
// (vistasAdmin/gestion_garages.jsx) con los datos de tu garage. Es un fragmento del
// producto (data-ui) y se ve tal cual. Su botón está en el estado deshabilitado que el
// producto muestra después de pedir cocheras ("Solicitud pendiente"): es parte de la
// imagen, no un control, así que no es un botón ni toma el foco o el clic.
export function FichaBusqueda() {
  return (
    <figure className="garages-ficha" data-ui="busqueda">
      <figcaption>
        {BUSQUEDA.titulo} <small>{BUSQUEDA.aviso}</small>
      </figcaption>
      <div className="garages-ficha__tarjeta">
        <span className="garages-ficha__distancia">{BUSQUEDA.distancia}</span>
        <strong className="garages-ficha__nombre">{BUSQUEDA.nombre}</strong>
        <p><Datos texto={BUSQUEDA.horario} /></p>
        <p className="garages-ficha__disponibles">{BUSQUEDA.disponibles}</p>
        <p><Datos texto={BUSQUEDA.tarifas} /></p>
        <span className="garages-ficha__boton">{BUSQUEDA.boton}</span>
      </div>
    </figure>
  );
}
