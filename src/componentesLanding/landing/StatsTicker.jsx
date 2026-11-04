import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Pause, Play } from 'lucide-react';

// Sin valores por defecto: cada página pasa datos con fuente verificable
// (en "/" son datos del producto; ver datosProducto en contenido.js).
export default function StatsTicker({
  stats,
  ariaLabel = "Estadísticas de la plataforma",
}) {
  const tickerRef = useRef();
  const marquesina = useRef(null);
  const [pausado, setPausado] = useState(false);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      marquesina.current = gsap.to(".ticker-track", {
        xPercent: -50,
        duration: 20,
        ease: "none",
        repeat: -1,
      });
      return () => {
        marquesina.current = null;
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".ticker-track", { xPercent: 0 });
    });

  }, { scope: tickerRef });

  // WCAG 2.2.2: lo que se mueve solo por más de cinco segundos tiene que
  // poder pausarse. Con reduced motion la tira ya está quieta y el botón no
  // se muestra.
  const alternar = () => {
    const tween = marquesina.current;
    if (!tween) return;
    tween.paused(!pausado);
    setPausado(!pausado);
  };

  return (
    <div
      ref={tickerRef}
      role="group"
      aria-label={ariaLabel}
      className="flex w-full items-center overflow-hidden border-y border-white/5 bg-brand-deep py-6"
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex whitespace-nowrap w-fit" aria-hidden="true">

          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-12 px-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-6 min-w-0 group"
                >
                  <span className="text-5xl md:text-6xl font-black text-white group-hover:text-brand-blue transition-colors duration-300 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </span>
                  <span className="text-sm md:text-base text-white/50 uppercase tracking-widest font-semibold leading-tight whitespace-pre-line group-hover:text-white/70 transition-colors duration-300">
                    {stat.label.split(' ').join('\n')}
                  </span>
                  <div className="h-8 w-[1px] bg-white/10 ml-12 hidden md:block"></div>
                </div>
              ))}
            </div>
          ))}

        </div>
      </div>
      <p className="sr-only">
        {stats.map((s) => `${s.value} ${s.label}`).join('. ')}.
      </p>
      <button
        type="button"
        onClick={alternar}
        aria-label={pausado ? 'Reanudar la tira de datos' : 'Pausar la tira de datos'}
        className="mx-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-[color,background-color,transform] duration-200 ease-out hover:bg-white/10 hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep motion-reduce:hidden sm:mx-6"
      >
        {pausado
          ? <Play className="h-4 w-4" aria-hidden="true" />
          : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
