import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Sin valores por defecto: cada página pasa datos con fuente verificable
// (la landing "/" ya no muestra métricas; ver docs/specs/SPEC-landing-inmersiva.md).
export default function StatsTicker({
  stats,
  ariaLabel = "Estadísticas de la plataforma",
}) {
  const tickerRef = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(".ticker-track", {
        xPercent: -50,
        duration: 20,
        ease: "none",
        repeat: -1,
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".ticker-track", { xPercent: 0 });
    });

  }, { scope: tickerRef });

  return (
    <div ref={tickerRef} className="w-full bg-brand-deep py-6 overflow-hidden border-y border-white/5" aria-label={ariaLabel}>
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
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {stats.map((s) => `${s.value} ${s.label}`).join(', ')}
      </div>
    </div>
  );
}
