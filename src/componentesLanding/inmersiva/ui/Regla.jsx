import { useMemo, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NAVEGACION } from '../contenido/comun';
import { useUI } from '../estado/store';
import { largoTotal, rangosDeScroll } from '../scroll/rangos';
import { scrollToSection } from '../scroll/smoothScroll';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const numero = (i) => String(i + 1).padStart(2, '0');

// Cada sección se marca donde empieza su estadía, medido en pantallas de scroll.
function marcasDe(secciones) {
  const pesos = secciones.map((s) => s.weight);
  const total = largoTotal(pesos);
  return rangosDeScroll(pesos).map((r, i) => ({ ...secciones[i], en: i ? r.arriba / total : 0 }));
}

// Regla de progreso: una regla de dibujo al costado, con una marca por
// sección. Se llena con el scroll y cada marca lleva a su sección.
export function Regla({ secciones }) {
  const raiz = useRef(null);
  const seccion = useUI((s) => s.seccion);
  const marcas = useMemo(() => marcasDe(secciones), [secciones]);

  useGSAP(() => {
    gsap.fromTo(raiz.current.querySelector('.plano-regla__avance'), { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: true },
    });
  }, { scope: raiz });

  return (
    <nav ref={raiz} className="plano-regla" aria-label={NAVEGACION.regla}>
      <span className="plano-regla__carril" aria-hidden="true"><i className="plano-regla__avance" /></span>
      <ol>
        {marcas.map((m, i) => (
          <li key={m.id} style={{ '--en': m.en }}>
            <a
              href={`#${m.id}`}
              aria-current={seccion === i ? 'step' : undefined}
              onClick={(e) => { e.preventDefault(); scrollToSection(m.id); }}
            >
              <span className="plano-regla__num">{numero(i)}</span>
              <span className="plano-regla__titulo">{m.titulo}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
