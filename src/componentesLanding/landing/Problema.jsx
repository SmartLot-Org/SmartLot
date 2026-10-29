import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { problema } from './contenido';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export default function Problema() {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Con reduced motion no se parte el texto: queda quieto y legible.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        SplitText.create(ref.current.querySelector('h2'), {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          // Devolver el tween permite que SplitText lo rehaga al re-partir
          // (resize o carga de fuentes) sin duplicar animaciones.
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.9,
              ease: 'power4.out',
              stagger: 0.09,
              scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' },
            }),
        });
        gsap.from(ref.current.querySelectorAll('[data-revelar]'), {
          autoAlpha: 0,
          y: 24,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: 'top 60%', toggleActions: 'play none none reverse' },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section
      id="problema"
      ref={ref}
      aria-labelledby="problema-titulo"
      className="relative z-10 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-6 text-left md:grid-cols-[1.25fr_1fr] md:items-end md:gap-16">
        <h2 id="problema-titulo">{problema.titulo}</h2>
        <div className="space-y-4">
          {problema.cuerpo.map((parrafo) => (
            <p key={parrafo} data-revelar className="texto-relato">
              {parrafo}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
