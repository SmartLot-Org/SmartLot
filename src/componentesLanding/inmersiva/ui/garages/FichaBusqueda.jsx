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

// La tarjeta del listado de "Buscar garages" (vistasAdmin/gestion_garages.jsx) con los
// datos de tu garage, en el orden del producto. La usan la ficha de la nota y la tarjeta
// del dibujo (three/FichaMapa.jsx), así las dos replican la misma tarjeta real. Su botón
// está en el estado deshabilitado que el producto muestra después de pedir cocheras
// ("Solicitud pendiente"): es parte de la imagen, no un control, así que no es un botón
// ni toma el foco o el clic. "Ver en mapa" no va: en la página la flecha del dibujo
// une la tarjeta con tu garage.
export function TarjetaBusqueda() {
  return (
    <div className="garages-ficha__tarjeta">
      <span className="garages-ficha__distancia">{BUSQUEDA.distancia}</span>
      <strong className="garages-ficha__nombre">{BUSQUEDA.nombre}</strong>
      <p><Datos texto={BUSQUEDA.horario} /></p>
      <p className="garages-ficha__disponibles">{BUSQUEDA.disponibles}</p>
      <p><Datos texto={BUSQUEDA.tarifas} /></p>
      <span className="garages-ficha__boton">{BUSQUEDA.boton}</span>
    </div>
  );
}

// "Así te ve una empresa": un fragmento del producto (data-ui). Sin 3D se ve en la nota.
// Con 3D la tarjeta se ve en el dibujo, al final de la flecha que sale de tu garage, y
// acá queda oculta solo a la vista: el escenario es aria-hidden y el contenido nunca
// puede existir solo en el dibujo. Además, la nota de 390 px vuelve a ser corta y deja
// lugar a la tarjeta.
export function FichaBusqueda({ sinEscena = true }) {
  return (
    <figure className={sinEscena ? 'garages-ficha' : 'garages-ficha garages-ficha--en-dibujo'} data-ui="busqueda">
      <figcaption>
        {BUSQUEDA.titulo} <small>{BUSQUEDA.aviso}</small>
      </figcaption>
      <TarjetaBusqueda />
    </figure>
  );
}
