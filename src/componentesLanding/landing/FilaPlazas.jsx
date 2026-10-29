import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Fila de plazas que hace de piso del hero: la misma demarcación que la
// maqueta del recorrido, con tres plazas en azul (trato activo = lugar
// asegurado). Es decorativa: el mensaje está en el texto del hero.
// Proporción de plaza real (el doble de larga que de ancha); el borde inferior
// corta la fila para que se lea como un estacionamiento que sigue.
const PLAZAS = 32;
const ANCHO = 48;
const ALTO = 120;
// Debajo del logo en escritorio y a la vista en celulares (el SVG se recorta
// desde la derecha con xMaxYMax slice).
const PLAZAS_ASEGURADAS = [23, 24, 25];

export default function FilaPlazas({ className = '' }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // El único momento animado del hero: se demarca la fila al cargar.
      // Con reduced motion queda dibujada desde el primer render.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-tope]', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.7 })
          .from('[data-separador]', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.45, stagger: 0.03 }, 0.1)
          .from(
            '[data-plaza]',
            { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.6, stagger: 0.08, ease: 'power4.out' },
            0.55,
          );
      });
    },
    { scope: ref },
  );

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${PLAZAS * ANCHO} ${ALTO}`}
      preserveAspectRatio="xMaxYMax slice"
      className={`block w-full ${className}`}
      aria-hidden="true"
    >
      {PLAZAS_ASEGURADAS.map((i) => (
        <rect key={i} data-plaza x={i * ANCHO + 5} y="16" width={ANCHO - 10} height={ALTO} rx="3" className="fill-brand-blue" />
      ))}
      <line data-tope x1="0" y1="10" x2={PLAZAS * ANCHO} y2="10" strokeWidth="2" className="stroke-slate-300" />
      {Array.from({ length: PLAZAS + 1 }, (_, i) => (
        <line
          key={i}
          data-separador
          x1={i * ANCHO}
          y1="10"
          x2={i * ANCHO}
          y2={ALTO + 4}
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-slate-400"
        />
      ))}
    </svg>
  );
}
