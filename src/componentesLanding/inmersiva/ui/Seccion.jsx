import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useUI } from '../estado/store';
import { Comparador } from './Comparador';
import { Cta, EnlaceGarage } from './Cta';
import { Dato } from './Dato';
import { ElegirDia } from './ElegirDia';
import { TablaConsumos } from './TablaConsumos';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Una sección = una idea = un encuadre. La nota viaja con el scroll, se queda
// quieta durante la estadía y se desvanece al irse para dejar ver el dibujo.
// El hero (i === 0) lleva el único h1 y no espera ninguna animación.
export function Seccion({ s, i, ultima, sinEscena, tema }) {
  const ref = useRef(null);
  const Titulo = i === 0 ? 'h1' : 'h2';
  const poster = `/landing/posters/${s.poster ?? s.id}${tema === 'cianotipo' ? '-cianotipo' : ''}.webp`;

  useGSAP(() => {
    if (sinEscena || ultima) return;
    gsap.fromTo(ref.current.querySelector('.plano-nota'), { autoAlpha: 1 }, {
      autoAlpha: 0, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: ref.current, start: 'bottom bottom', end: 'bottom 62%', scrub: true },
    });
  }, { scope: ref, dependencies: [sinEscena, ultima], revertOnUpdate: true });

  // Texto cinético: el título sube palabra por palabra desde una máscara y el
  // resto de la nota lo sigue. El hero entra al cargar; las demás, al asomar.
  // Con movimiento reducido no se parte nada y el texto queda quieto.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const nota = ref.current.querySelector('.plano-nota');
      const titulo = nota.querySelector('h1, h2');
      const resto = nota.querySelectorAll(':scope > :not(h1):not(h2)');
      SplitText.create(titulo, {
        type: 'words',
        mask: 'words',
        aria: 'auto',
        wordsClass: 'plano-palabra',
        autoSplit: true,
        onSplit: (self) => {
          const tl = gsap.timeline({
            // El hero espera a que se levante el cajetín de la intro.
            delay: i === 0 ? (useUI.getState().intro ? 2.75 : 0.35) : 0,
            scrollTrigger: i === 0 ? undefined : { trigger: ref.current, start: 'top 82%', toggleActions: 'play none none reverse' },
          });
          tl.from(self.words, { yPercent: 110, rotate: 4, duration: 0.9, ease: 'expo.out', stagger: 0.06 })
            .from(resto, { y: 14, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, '-=0.55');
          return tl;
        },
      });
    });
  }, { scope: ref, dependencies: [sinEscena], revertOnUpdate: true });

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
        {s.comparador && !sinEscena && <Comparador />}
        {s.dato && !sinEscena && <Dato />}
        {s.elegirDia && !sinEscena && <ElegirDia />}
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
