import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Check, CircleCheck, X } from 'lucide-react';
import { problema } from './contenido';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Problema() {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // El momento de la sección: con el panel a la vista, los problemas se
      // tachan de a uno. Cada fila lleva --tachado de 0 a 1 y el CSS deriva de
      // ese valor la raya, el tono del texto y la cruz que pasa a tilde
      // (landing.css). Primero se lee entero; con reduced motion queda sin
      // tachar y el cierre dice lo mismo en palabras.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-problema]',
          { '--tachado': 0 },
          {
            '--tachado': 1,
            ease: 'none',
            duration: 1,
            stagger: 1.15,
            scrollTrigger: {
              trigger: ref.current.querySelector('[data-lista]'),
              start: 'top 75%',
              end: 'bottom 45%',
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
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 text-left md:grid-cols-[1fr_1.2fr] md:gap-14">
        <h2 id="problema-titulo" className="titulo-relato">{problema.titulo}</h2>

        {/* Mismo panel que los pasos del recorrido: superficie blanca, borde
            fino y radio de 14 px. */}
        <div className="overflow-hidden rounded-[14px] border border-brand-navy/10 bg-white shadow-lg">
          <ul data-lista className="divide-y divide-brand-navy/10">
            {problema.lista.map((item) => (
              <li key={item} data-problema className="problema-item flex items-center gap-4 px-5 py-5 sm:gap-5 sm:px-7 sm:py-6">
                <span
                  aria-hidden="true"
                  className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-brand-muted"
                >
                  <X className="marca-cruz h-5 w-5" />
                  <span className="marca-tilde absolute inset-0 grid place-items-center rounded-full bg-brand-blue text-white">
                    <Check className="h-5 w-5" />
                  </span>
                </span>
                <p className="problema-texto min-w-0">
                  <span className="tachado">{item}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="problema-cierre flex items-center gap-3 bg-brand-blue px-5 py-5 sm:px-7">
            <CircleCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>{problema.cierre}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
