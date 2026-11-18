import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { VISIBILIDAD } from '../../contenido/garages';
import { useGarages } from '../../estado/garages';
import { Figura } from '../Seccion';

// Sin 3D, el póster del estado elegido, con la misma figura que las demás secciones.
// Los dos quedan cargados y se cruzan por opacidad, así el cambio no espera la
// descarga del otro. El que no se ve no tiene alt: no es contenido.
function Poster({ posters, visible }) {
  return (
    <div className="garages-poster" data-estado={visible ? 'visible' : 'borrador'}>
      {[VISIBILIDAD.visible, VISIBILIDAD.borrador].map((e) => {
        const activo = (e === VISIBILIDAD.visible) === visible;
        return <Figura key={e.poster} s={{ id: 'control', poster: e.poster, figura: activo ? e.figura : '' }} i={1} posters={posters} />;
      })}
    </div>
  );
}

// "Visible / En borrador": lo único que el visitante maneja en la página. Es un botón
// con role="switch", así el teclado (Espacio o Enter), el clic y el toque lo alternan
// sin código aparte; el renglón entero es el objetivo. El texto de abajo es una región
// viva: anuncia qué cambia para las empresas. Con el 3D, el guion lee useGarages y
// redibuja; sin 3D, la pieza pone su propio póster en la columna de la figura
// (por eso paginas/garages.js la marca con reemplazaFigura).
export function Visibilidad({ sinEscena, posters }) {
  const visible = useGarages((s) => s.visible);
  const setVisible = useGarages((s) => s.setVisible);
  const id = useId();
  const estado = visible ? VISIBILIDAD.visible : VISIBILIDAD.borrador;
  // El póster va en la sección, al lado de la nota, no adentro de la nota.
  const [seccion, setSeccion] = useState(null);
  const raiz = useCallback((nodo) => setSeccion(nodo?.closest('.plano-seccion') ?? null), []);

  // Cada visita a la página empieza con el garage visible.
  useEffect(() => () => useGarages.getState().setVisible(true), []);

  return (
    <div ref={raiz} className="garages-visibilidad" data-ui="visibilidad" data-estado={visible ? 'visible' : 'borrador'}>
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-describedby={`${id}-estado`}
        onClick={() => setVisible(!visible)}
      >
        <span className="garages-visibilidad__titulo">{VISIBILIDAD.titulo}</span>
        <span className="garages-visibilidad__pista" aria-hidden="true">
          <span className="garages-visibilidad__perilla" />
        </span>
      </button>
      <p id={`${id}-estado`} className="garages-visibilidad__estado" aria-live="polite" aria-atomic="true">
        <span className="garages-visibilidad__insignia">{estado.estado}</span> {estado.texto}
      </p>
      <small>{VISIBILIDAD.aviso}</small>
      {sinEscena && posters && seccion && createPortal(<Poster posters={posters} visible={visible} />, seccion)}
    </div>
  );
}
