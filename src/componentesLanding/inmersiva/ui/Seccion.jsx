import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cta, EnlaceGarage } from './Cta';
import { Dato } from './Dato';
import { TablaConsumos } from './TablaConsumos';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Una sección = una idea = un encuadre. La nota viaja con el scroll, se queda
// quieta durante la estadía y se desvanece al irse para dejar ver el dibujo.
// El hero (i === 0) lleva el único h1 y no espera ninguna animación.
export function Seccion({ s, i, ultima, sinEscena, tema }) {
  const ref = useRef(null);
  const Titulo = i === 0 ? 'h1' : 'h2';
  const poster = `/landing/posters/${s.id}${tema === 'cianotipo' ? '-cianotipo' : ''}.webp`;

  useGSAP(() => {
    if (sinEscena || ultima) return;
    gsap.fromTo(ref.current.querySelector('.plano-nota'), { autoAlpha: 1 }, {
      autoAlpha: 0, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: ref.current, start: 'bottom bottom', end: 'bottom 62%', scrub: true },
    });
  }, { scope: ref, dependencies: [sinEscena, ultima], revertOnUpdate: true });

  return (
    <section
      ref={ref}
      id={s.id}
      data-seccion={i}
      className="plano-seccion"
      style={{ '--peso': s.weight }}
      aria-labelledby={`${s.id}-titulo`}
    >
      <div className="plano-nota">
        <Titulo id={`${s.id}-titulo`}>{s.titulo}</Titulo>
        <p>{s.cuerpo}</p>
        {s.dato && !sinEscena && <Dato />}
        {s.tabla && <TablaConsumos />}
        {s.cta && (
          <div className="plano-acciones">
            <Cta />
            {i === 0 && <EnlaceGarage />}
          </div>
        )}
      </div>
      {sinEscena && (
        <figure className="plano-figura">
          <img src={poster} alt={s.figura} width={1200} height={900} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
        </figure>
      )}
    </section>
  );
}
