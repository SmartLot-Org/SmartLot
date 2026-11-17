// Capa DOM de la landing (ADR-008). Nunca importa three ni @react-three/*:
// el 3D va en un chunk aparte y se comunica a través de scroll/rig.js.
import { lazy, Suspense, useEffect, useRef } from 'react';
import 'lenis/dist/lenis.css';
import '../componentesLanding/inmersiva/inmersiva.css';
import { META, NAVEGACION, SECCIONES } from '../componentesLanding/inmersiva/contenido/secciones';
import { initSmoothScroll } from '../componentesLanding/inmersiva/scroll/smoothScroll';
import { useStoryTimeline } from '../componentesLanding/inmersiva/scroll/useStoryTimeline';
import { asegurarInicio, useUI } from '../componentesLanding/inmersiva/estado/store';
import { Nav } from '../componentesLanding/inmersiva/ui/Nav';
import { Seccion } from '../componentesLanding/inmersiva/ui/Seccion';
import usePageMeta from '../hooks/usePageMeta';

const Experience = lazy(() => import('../componentesLanding/inmersiva/three/Experience'));

export default function LandingPage() {
  asegurarInicio();
  const main = useRef(null);
  const tier = useUI((s) => s.tier);
  const sin3d = useUI((s) => s.sin3d);
  const inicializado = useUI((s) => s.inicializado);
  const alternarSin3d = useUI((s) => s.alternarSin3d);
  // lazy() pide el chunk 3D recién cuando se renderiza Experience. Sin WebGL, con
  // ahorro de datos, con ?sin3d o si se pierde el contexto, queda la versión
  // estática y el chunk no se descarga.
  const mostrar3d = inicializado && tier !== 'static' && !sin3d;
  const sinEscena = inicializado && !mostrar3d;

  usePageMeta({ title: META.titulo, description: META.descripcion });

  useEffect(() => initSmoothScroll(), []);

  // Cambiar de versión rehace toda la página. Se cede primero un frame para que
  // el botón responda al toque y el trabajo pesado quede después del pintado.
  const cambiarVersion = () => requestAnimationFrame(() => setTimeout(alternarSin3d, 0));
  useStoryTimeline(main);

  return (
    <div className="plano" data-sin3d={sinEscena}>
      <a className="plano-saltar" href="#contenido">{NAVEGACION.saltar}</a>
      {mostrar3d && <Suspense fallback={null}><Experience /></Suspense>}
      <Nav />
      <main id="contenido" ref={main} tabIndex={-1}>
        {SECCIONES.map((s, i) => (
          <Seccion key={s.id} s={s} i={i} ultima={i === SECCIONES.length - 1} sinEscena={sinEscena} />
        ))}
      </main>
      <footer className="plano-pie">
        <p>© {new Date().getFullYear()} {NAVEGACION.marca}. {NAVEGACION.pie}</p>
        <div>
          {tier !== 'static' && (
            <button type="button" className="plano-enlace" onClick={cambiarVersion} aria-pressed={sin3d}>
              {sin3d ? NAVEGACION.sin3d.desactivar : NAVEGACION.sin3d.activar}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
