import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Car, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CtaButton from '../CtaButton';
import { CTA_PRINCIPAL, hero } from './contenido';


const Hero = forwardRef(function Hero(_props, ref) {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Realce que no esconde nada: título, subtítulo y CTAs se pintan en el
      // primer render (son el LCP) y las palabras solo se asientan unos píxeles.
      gsap.from(".word", {
        yPercent: 14,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08
      });

      gsap.to(".floating-logo", {
        y: "-=12",
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }, { scope: ref });


  return (
    <section ref={ref} className="relative pt-32 pb-12 overflow-hidden bg-transparent min-h-[75vh] flex items-center z-10">
      <div className="max-w-6xl mx-auto px-6 w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          <div className="text-left relative z-20 lg:pl-8">
            <h1 className="pb-8 text-brand-warm">
              {hero.titulo.map((palabra, i) => (
                <div key={palabra} className="overflow-hidden py-1">
                  <span className={`word inline-block${i === hero.titulo.length - 1 ? ' text-brand-blue' : ''}`}>{palabra}</span>
                </div>
              ))}
            </h1>

            <p className="hero-p texto-relato text-brand-muted max-w-lg">
              {hero.subtitulo}
            </p>

            <div className="hero-btn mt-10 flex flex-wrap items-center gap-3">
              <CtaButton to={CTA_PRINCIPAL.destino}>{CTA_PRINCIPAL.etiqueta}</CtaButton>
              <Link
                to={hero.secundaria.destino}
                aria-label={hero.secundaria.ariaLabel}
                className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-navy/10 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-muted shadow-sm transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-brand-blue/40 hover:bg-brand-blue/10 hover:text-brand-deep hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                <Car size={16} aria-hidden="true" className="shrink-0" />
                <span>{hero.secundaria.etiqueta}</span>
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5"
                />
              </Link>
            </div>
          </div>


          <div className="hero-logo-container relative flex justify-center lg:justify-end z-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-navy rounded-full blur-[100px] opacity-[0.07] -z-10"></div>
            {/* Ancla de medición del LogoWatermark: caja de reposo del logo.
                No la anima nadie (el float va en .floating-logo), así el rect
                medido es estable desde el primer layout. */}
            <div className="hero-logo-anchor w-full max-w-[480px]">
              <img src="/logoEntero.png" alt="SmartLot" width="1408" height="768" className="floating-logo w-full h-auto drop-shadow-xl" />
            </div>
          </div>


        </div>
      </div>
    </section>
  );
});


export default Hero;
