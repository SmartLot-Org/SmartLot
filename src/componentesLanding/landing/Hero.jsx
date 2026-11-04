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
      gsap.to(".floating-logo", {
        y: "-=12",
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }, { scope: ref });


  // Título, bajada y CTAs se pintan en el primer render, sin animación de
  // entrada (son el LCP). La tira de datos que cierra la primera pantalla
  // vive en Landing.jsx, justo debajo.
  return (
    <section ref={ref} className="relative z-10 flex flex-1 flex-col overflow-hidden pt-28">
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 lg:py-12">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-8">

          <div className="relative z-20 flex flex-col gap-7 text-left lg:pl-8">
            <h1 className="hero-titulo text-brand-warm">
              {hero.titulo.map((palabra, i) => (
                <span key={palabra} className={`block${i === hero.titulo.length - 1 ? ' text-brand-blue' : ''}`}>
                  {palabra}
                </span>
              ))}
            </h1>

            <p className="hero-bajada max-w-xl text-brand-muted">
              {hero.subtitulo}
            </p>

            {/* Registro y puerta para garages en la misma línea, unidos por las
                líneas finas de la versión anterior. En celulares las líneas y
                el auto se ocultan para que entren los dos botones. */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3 pt-2 sm:flex-nowrap sm:gap-3">
              <CtaButton to={CTA_PRINCIPAL.destino} size="md">{CTA_PRINCIPAL.etiqueta}</CtaButton>
              <span aria-hidden="true" className="hidden h-px w-10 shrink-0 bg-brand-navy/10 sm:block" />
              <Link
                to={hero.secundaria.destino}
                aria-label={hero.secundaria.ariaLabel}
                className="group inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-brand-navy/10 bg-white/70 px-4 py-3 text-sm font-semibold text-brand-muted shadow-sm transition-[color,background-color,border-color,box-shadow,transform] duration-300 hover:border-brand-blue/40 hover:bg-brand-blue/10 hover:text-brand-deep hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg sm:px-5"
              >
                <Car size={16} aria-hidden="true" className="hidden shrink-0 sm:block" />
                <span>{hero.secundaria.etiqueta}</span>
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="shrink-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5"
                />
              </Link>
              <span aria-hidden="true" className="hidden h-px min-w-0 flex-1 bg-brand-navy/10 sm:block" />
            </div>
          </div>


          <div className="hero-logo-container relative flex justify-center lg:justify-end z-20">
            {/* Ancla de medición del LogoWatermark: caja de reposo del logo.
                No la anima nadie (el float va en .floating-logo), así el rect
                medido es estable desde el primer layout. */}
            <div className="hero-logo-anchor w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[480px]">
              <img
                src="/logoEntero.png"
                alt="SmartLot"
                width="1408"
                height="768"
                fetchPriority="high"
                className="floating-logo w-full h-auto drop-shadow-xl"
              />
            </div>
          </div>


        </div>
      </div>
    </section>
  );
});


export default Hero;
