import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Car, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';


const Hero = forwardRef(function Hero({ startAnimation }, ref) {
  useGSAP(() => {
    if (!startAnimation) return;


    const mm = gsap.matchMedia();


    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: 0.4
      });
     
      tl.from(".hero-badge", { y: -16, opacity: 0, duration: 1 })
        .from(".word", {
          y: 80,
          rotateX: -30,
          opacity: 0,
          duration: 1.2,
          stagger: 0.2
        }, "-=0.5")
        .from(".hero-p", { opacity: 0, x: -16, duration: 1 }, "-=0.6")
        .from(".hero-btn", { scale: 0.85, opacity: 0, duration: 0.7 }, "-=0.8")
        .from(".hero-logo-container", { x: 80, opacity: 0, duration: 1.4 }, "-=1");


      gsap.to(".floating-logo", {
        y: "-=12",
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });


    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([".hero-badge", ".word", ".hero-p", ".hero-btn", ".hero-logo-container"], { opacity: 1, y: 0, x: 0 });
    });


  }, {
    scope: ref,
    dependencies: [startAnimation]
  });


  return (
    <section ref={ref} className="relative pt-32 pb-12 overflow-hidden bg-transparent min-h-[75vh] flex items-center z-10">
      <div className="max-w-6xl mx-auto px-6 w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
         
          <div className="text-left relative z-20 lg:pl-8">
            <span className="hero-badge inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-brand-navy uppercase bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-brand-navy/10">
              SmartLot App
            </span>
           
            <h1 className="pb-8 text-brand-warm">
              <div className="overflow-hidden py-1"><span className="word inline-block">Gestioná.</span></div>
              <div className="overflow-hidden py-1"><span className="word inline-block">Optimizá.</span></div>
              <div className="overflow-hidden py-1"><span className="word inline-block text-brand-blue">Escalá.</span></div>
            </h1>
           
            <p className="hero-p text-brand-muted max-w-lg">
              La plataforma SaaS que redefine el control de accesos y estacionamientos corporativos con IA.
            </p>

            <div className="hero-btn mt-10 flex items-center gap-3">
              <div className="h-px max-w-[4rem] flex-1 bg-brand-navy/10" aria-hidden="true" />
              <Link
                to="/para-garages"
                aria-label="Ver funcionalidades para dueños de garages"
                className="group inline-flex items-center gap-2 rounded-full border border-brand-navy/10 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand-muted shadow-sm transition-all duration-300 hover:border-[#93C5FD] hover:bg-[#BFDBFE]/50 hover:text-brand-deep hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                <Car size={14} aria-hidden="true" className="shrink-0" />
                <span>Para dueños de garages</span>
                <ChevronRight
                  size={12}
                  aria-hidden="true"
                  className="shrink-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5"
                />
              </Link>
              <div className="h-px flex-1 bg-brand-navy/10" aria-hidden="true" />
            </div>
          </div>


          <div className="hero-logo-container relative flex justify-center lg:justify-end z-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-navy rounded-full blur-[100px] opacity-[0.07] -z-10"></div>
            <img src="/logoEntero.png" alt="SmartLot" width="1408" height="768" className="floating-logo w-full max-w-[480px] h-auto drop-shadow-xl" />
          </div>


        </div>
      </div>
    </section>
  );
});


export default Hero;
