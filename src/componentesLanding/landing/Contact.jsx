import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const container = useRef();
  const pathRef = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top 85%",
        }
      });

      tl.fromTo(".cta-box", 
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" }
      )
      .fromTo(".cta-content", 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out" },
        "-=0.8"
      );

      gsap.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 5,
        ease: "none",
        repeat: -1,
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([".cta-box", ".cta-content"], { opacity: 1, y: 0, scale: 1 });
    });

  }, { scope: container });

  return (
    <footer ref={container} className="bg-transparent pt-24 pb-12 relative overflow-hidden">
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-brand-navy/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">

        <div className="cta-box relative rounded-[2.5rem] p-[1px] mb-24 overflow-hidden group shadow-[0_8px_30px_rgba(12,30,63,0.04)]">
          
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              ref={pathRef}
              x="0" y="0" width="100" height="100"
              rx="8"
              fill="none"
              stroke="url(#warm-beam)"
              strokeWidth="1"
              strokeDasharray="30 120"
              strokeDashoffset="150"
            />
            
            <defs>
              <linearGradient id="warm-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A5CBF" stopOpacity="0" />
                <stop offset="25%" stopColor="#2A5CBF" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#0C1E3F" stopOpacity="0.7" />
                <stop offset="75%" stopColor="#2A5CBF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0C1E3F" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 w-full h-full bg-[rgba(253,252,249,0.65)] backdrop-blur-2xl rounded-[2.5rem] p-10 md:p-16 text-center border border-white/80">
            
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-navy/[0.03] rounded-full blur-[80px]" aria-hidden="true"></div>

            <div className="relative z-10 flex flex-col items-center gap-8">
              <h2 className="cta-content text-brand-warm">
                ¿Listo para modernizar <br className="hidden md:block"/> tu estacionamiento?
              </h2>
              
              <p className="cta-content text-brand-muted max-w-2xl mx-auto">
                Dejá de perder tiempo gestionando planillas. Implementá SmartLot hoy mismo y mejorá la experiencia de tu equipo.
              </p>
              
              <Link to="/register" className="cta-content group flex items-center gap-2 px-10 py-5 bg-brand-blue text-white rounded-2xl font-bold text-base hover:bg-brand-deep focus-visible:bg-brand-deep active:scale-95 transition-all duration-300 shadow-xl shadow-brand-deep/20">
                <span>Regístrate</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-base flex flex-col md:flex-row justify-between items-center border-t border-brand-navy/10 pt-12 gap-8">
          
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-navy blur-md opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full"></div>
              <img
                src="/logo.png"
                alt="SmartLot Logo"
                width="48"
                height="48"
                className="relative h-10 md:h-12 w-auto grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
              />
            </div>
            <span className="text-base md:text-lg font-bold text-brand-muted/40 group-hover:text-brand-warm transition-colors duration-300 font-display">
              SmartLot
            </span>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            <p className="text-brand-muted/40 text-[1px] font-medium">
              © {new Date().getFullYear()} SmartLot. El estacionamiento del futuro.
            </p>
            <p className="text-brand-muted/30 text-[1px]">
              Digitalización de espacios B2B sin hardware.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
