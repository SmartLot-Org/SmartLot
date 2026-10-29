import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowLeftRight, Building2, Gauge, IdCard } from 'lucide-react';
import { capacidades } from './contenido';

gsap.registerPlugin(ScrollTrigger);

// Ícono y lugar en la grilla de cada capacidad (el copy vive en contenido.js).
const PRESENTACION = {
  sedes: { Icono: Building2, celdas: 'md:col-span-2 md:row-span-2' },
  limite: { Icono: Gauge, celdas: 'md:col-span-2' },
  personal: { Icono: IdCard, celdas: 'md:col-span-1' },
  cambios: { Icono: ArrowLeftRight, celdas: 'md:col-span-1' },
};

export default function BentoGrid() {
  const container = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%",
        }
      });

      tl.fromTo(".bento-header-text",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out" }
      )
      .fromTo(".bento-card",
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 1.2, ease: "expo.out" },
        "-=0.6"
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([".bento-header-text", ".bento-card"], { opacity: 1, y: 0, scale: 1 });
    });

  }, { scope: container });

  return (
    <section
      id="capacidades"
      ref={container}
      aria-labelledby="capacidades-titulo"
      className="relative z-10 pt-20 pb-8 bg-transparent content-visibility-auto"
    >
      <div className="max-w-6xl mx-auto px-6">

        <div className="mb-12 text-center relative z-20 flex flex-col items-center gap-6">
          <h2 id="capacidades-titulo" className="bento-header-text titulo-relato text-brand-warm">
            {capacidades.titulo}
          </h2>
          <p className="bento-header-text texto-relato text-brand-muted max-w-2xl mx-auto">
            {capacidades.cuerpo}
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[minmax(13rem,auto)]">
          {capacidades.items.map(({ id, titulo, cuerpo }) => {
            const { Icono, celdas } = PRESENTACION[id];
            return (
              <li
                key={id}
                className={`bento-card relative ${celdas} glass-card p-6 rounded-3xl flex flex-col justify-between gap-8 text-left`}
              >
                <div className="w-14 h-14 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
                  <Icono className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[1.25rem] font-bold text-brand-warm mb-2 tracking-tight leading-snug">
                    {titulo}
                  </h3>
                  <p className="texto-relato text-brand-muted">
                    {cuerpo}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
