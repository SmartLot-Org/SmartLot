// Armazón de las páginas del plano (ADR-008, ADR-014): decide la versión, inicia
// Lenis y el director, y arma el salto al contenido, la barra, la regla, las
// secciones y el pie. El contenido, las piezas, la escena y el guion llegan en
// `pagina` (paginas/*.js). Capa DOM: nunca importa three ni @react-three/*; el
// 3D entra por pagina.escena, un componente lazy(), y habla con esta capa por rig.
import { Suspense, useEffect, useRef } from 'react';
import 'lenis/dist/lenis.css';
import '../inmersiva.css';
import usePageMeta from '../../../hooks/usePageMeta';
import { NAVEGACION } from '../contenido/comun';
import { useMovimientoReducido } from '../estado/useMovimientoReducido';
import { asegurarInicio, useUI } from '../estado/store';
import { initSmoothScroll } from '../scroll/smoothScroll';
import { useStoryTimeline } from '../scroll/useStoryTimeline';
import { EnlacePagina } from './Cta';
import { Intro } from './Intro';
import { Nav } from './Nav';
import { Regla } from './Regla';
import { Seccion } from './Seccion';

export function PaginaPlano({ pagina }) {
  asegurarInicio();
  const main = useRef(null);
  // Solo importa si el tier es estático: así, cuando el monitor de rendimiento alterna
  // entre 'high' y 'low', la página no se vuelve a renderizar.
  const estatico = useUI((s) => s.tier === 'static');
  const sin3d = useUI((s) => s.sin3d);
  const inicializado = useUI((s) => s.inicializado);
  const alternarSin3d = useUI((s) => s.alternarSin3d);
  const reducido = useMovimientoReducido();
  // lazy() pide el chunk 3D recién cuando se renderiza la escena. Sin WebGL, con
  // ahorro de datos, con ?sin3d o si se pierde el contexto, queda la versión
  // estática y el chunk no se descarga. Una página sin escena va siempre en el flujo.
  const Escena = pagina.escena;
  const mostrar3d = inicializado && !estatico && !sin3d && !!pagina.escena;
  const sinEscena = inicializado && !mostrar3d;
  const { secciones } = pagina;

  usePageMeta({ title: pagina.meta.titulo, description: pagina.meta.descripcion });

  useEffect(() => initSmoothScroll(), []);

  // Cambiar de versión rehace toda la página. Se cede primero un frame para que
  // el botón responda al toque y el trabajo pesado quede después del pintado.
  const cambiarVersion = () => requestAnimationFrame(() => setTimeout(alternarSin3d, 0));
  useStoryTimeline(main, pagina);

  return (
    <div className="plano" data-pagina={pagina.id} data-sin3d={sinEscena}>
      <a className="plano-saltar" href="#contenido">{NAVEGACION.saltar}</a>
      {mostrar3d && <Suspense fallback={null}><Escena /></Suspense>}
      {pagina.intro && <Intro />}
      <Nav cta={pagina.cta} enlace={pagina.enlace} />
      <Regla secciones={secciones} />
      <main id="contenido" ref={main} tabIndex={-1}>
        {secciones.map((s, i) => (
          <Seccion
            key={s.id}
            s={s}
            i={i}
            ultima={i === secciones.length - 1}
            sinEscena={sinEscena}
            piezas={pagina.piezas}
            posters={pagina.posters}
            cta={pagina.cta}
          />
        ))}
      </main>
      <footer className="plano-pie">
        <p>© {new Date().getFullYear()} {NAVEGACION.marca}. {pagina.pie}</p>
        <div>
          <EnlacePagina enlace={pagina.enlace} />
          {/* La versión sin 3D se ofrece solo con movimiento reducido. Si ya se está en
              ella (por ejemplo con ?sin3d), el botón queda para poder volver. Una
              página sin escena no tiene otra versión que ofrecer. */}
          {pagina.escena && !estatico && (reducido || sin3d) && (
            <button type="button" className="plano-enlace" onClick={cambiarVersion} aria-pressed={sin3d}>
              {sin3d ? NAVEGACION.sin3d.desactivar : NAVEGACION.sin3d.activar}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
