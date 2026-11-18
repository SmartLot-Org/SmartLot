import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { VISIBILIDAD } from '../../contenido/garages';
import { useGarages } from '../../estado/garages';

const ESTADOS = [VISIBILIDAD.visible, VISIBILIDAD.borrador];

// Sin 3D, el póster del estado elegido. Los dos están cargados y se cruzan por
// opacidad, así el cambio no espera la descarga del otro.
function Poster({ posters, visible }) {
  return (
    <figure className="plano-figura garages-poster">
      {ESTADOS.map((e) => {
        const base = `${posters}/${e.poster}`;
        const activo = (e === VISIBILIDAD.visible) === visible;
        return (
          <img
            key={e.poster}
            src={`${base}.webp`}
            srcSet={`${base}-600.webp 600w, ${base}.webp 1200w`}
            sizes="(min-width: 900px) 720px, 45vw"
            alt={activo ? e.figura : ''}
            width={1200}
            height={900}
            loading="lazy"
            decoding="async"
            data-activo={activo}
          />
        );
      })}
    </figure>
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
