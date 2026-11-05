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
      // El momento de la sección: cada problema se tacha recién cuando su
      // fila llega a la mitad de la pantalla, así primero se lee entero y la
      // raya termina mientras la fila sigue a la vista. Cada fila lleva
      // --tachado de 0 a 1 y el CSS deriva de ese valor la raya, el tono y la
      // cruz que pasa a tilde (landing.css). Con reduced motion queda sin
      // tachar y el cierre dice lo mismo en palabras.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('[data-problema]', ref.current).forEach((fila) => {
          gsap.fromTo(
            fila,
            { '--tachado': 0 },
            {
              '--tachado': 1,
              ease: 'none',
              scrollTrigger: {
                trigger: fila,
                start: 'top 68%',
                end: 'top 40%',
                scrub: true,
              },
            },
          );
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
      className="relative z-10 py-24 md:py-40"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 text-left md:gap-14">
        <h2 id="problema-titulo" className="titulo-relato max-w-[16ch]">{problema.titulo}</h2>

        {/* Mismo panel que los pasos del recorrido (superficie blanca, radio
            de 14 px), pero a todo el ancho: con el texto grande cada problema
            entra en una o dos líneas y la raya no se pierde entre renglones. */}
        <div className="overflow-hidden rounded-[14px] bg-white shadow-lg shadow-brand-navy/5">
          <ul data-lista className="divide-y divide-brand-navy/10">
            {problema.lista.map((item) => (
              <li
                key={item}
                data-problema
                className="problema-item flex items-start gap-4 px-5 py-7 sm:gap-6 sm:px-10 sm:py-10"
              >
                <span
                  aria-hidden="true"
                  className="relative mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-brand-muted sm:h-12 sm:w-12"
                >
                  <X className="marca-cruz h-5 w-5" />
                  <span className="marca-tilde absolute inset-0 grid place-items-center rounded-full bg-brand-blue text-white">
                    <Check className="h-5 w-5" />
                  </span>
                </span>
                {/* La raya avanza palabra por palabra (--i de --n): cuando el
                    texto se parte en dos líneas se tacha en orden de lectura
                    y no los dos renglones a la vez. */}
                <p className="problema-texto min-w-0" style={{ '--n': item.split(' ').length }}>
                  {item.split(' ').map((palabra, i, palabras) => (
                    <span key={i} className="tachado" style={{ '--i': i }}>
                      {i < palabras.length - 1 ? `${palabra} ` : palabra}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <p className="problema-cierre flex items-center gap-3 bg-brand-blue px-5 py-6 sm:gap-4 sm:px-10 sm:py-7">
            <CircleCheck className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden="true" />
            <span>{problema.cierre}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
