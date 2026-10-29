import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { problema } from './contenido';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Problema() {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // El momento de la sección: mientras se scrollea hacia "Cómo funciona",
      // cada problema se tacha en azul. Primero se lee entero; con reduced
      // motion queda sin tachar y el cierre dice lo mismo en palabras.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-tachar]',
          { backgroundSize: '0% 2px' },
          {
            backgroundSize: '100% 2px',
            ease: 'none',
            stagger: 0.4,
            scrollTrigger: {
              trigger: ref.current.querySelector('[data-lista]'),
              start: 'top 55%',
              end: 'bottom 25%',
              scrub: true,
            },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section
      id="problema"
      ref={ref}
      aria-labelledby="problema-titulo"
      className="relative z-10 py-20 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 text-left md:grid-cols-[1fr_1.1fr] md:gap-16">
        <h2 id="problema-titulo" className="titulo-relato">{problema.titulo}</h2>
        <div className="flex flex-col gap-8">
          <ul data-lista className="divide-y divide-brand-navy/10 border-y border-brand-navy/10">
            {problema.lista.map((item) => (
              <li key={item} className="problema-item py-5">
                <span data-tachar className="tachado">{item}</span>
              </li>
            ))}
          </ul>
          <p className="texto-relato problema-cierre">{problema.cierre}</p>
        </div>
      </div>
    </section>
  );
}
