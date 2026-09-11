import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Lock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function ParaGaragesCTA() {
  const container = useRef(null);
  const pathRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
          },
        });

        tl.fromTo(
          ".cta-box",
          { y: 40, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" }
        ).fromTo(
          ".cta-content",
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

      return () => mm.revert();
    },
    { scope: container }
  );

  return (
    <footer ref={container} className="relative overflow-hidden bg-transparent pt-24 pb-12">
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-full max-w-5xl -translate-x-1/2 rounded-full bg-brand-navy/5 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <div className="cta-box group relative mb-24 overflow-hidden rounded-[2.5rem] p-px shadow-[0_8px_30px_rgba(12,30,63,0.04)]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              ref={pathRef}
              x="0"
              y="0"
              width="100"
              height="100"
              rx="8"
              fill="none"
              stroke="url(#garage-beam)"
              strokeWidth="1"
              strokeDasharray="30 120"
              strokeDashoffset="150"
            />
            <defs>
              <linearGradient id="garage-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A5CBF" stopOpacity="0" />
                <stop offset="25%" stopColor="#2A5CBF" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#0C1E3F" stopOpacity="0.7" />
                <stop offset="75%" stopColor="#2A5CBF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0C1E3F" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 h-full w-full rounded-[2.5rem] border border-white/80 bg-[rgba(253,252,249,0.65)] p-10 text-center backdrop-blur-2xl md:p-16">
            <div
              className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-brand-navy/[0.03] blur-[80px]"
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col items-center gap-8">
              <h2 className="cta-content text-brand-warm">
                Tus cocheras vacías pueden empezar <br className="hidden md:block" /> a generar esta semana
              </h2>
              <p className="cta-content mx-auto max-w-2xl text-brand-muted">
                Creá tu cuenta, cargá tu primer garage y publicitalo para que las empresas de tu zona lo
                encuentren. Sin hardware y sin costo de instalación.
              </p>
              <Link
                to="/register?modo=garage"
                className="cta-content group flex min-h-11 items-center gap-2 rounded-2xl bg-brand-blue px-10 py-5 text-base font-bold text-white shadow-xl shadow-brand-deep/20 transition-all duration-300 hover:bg-brand-deep focus-visible:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 active:scale-95"
              >
                <span>Registrar mi garage</span>
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
              <p className="cta-content flex items-center gap-2 text-xs text-brand-muted">
                <Lock size={14} aria-hidden="true" />
                Registro en minutos. Tus datos quedan protegidos y podés dejar de usar la plataforma cuando
                quieras.
              </p>
              <Link
                to="/login"
                className="cta-content text-sm font-semibold text-brand-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                ¿Ya tenés cuenta? Iniciar sesión
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-8 border-t border-brand-navy/10 pt-12 md:flex-row">
          <Link to="/" className="group flex items-center gap-4">
            <img
              src="/logo.png"
              alt="SmartLot Logo"
              width="48"
              height="48"
              className="h-10 w-auto opacity-50 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 md:h-12"
            />
            <span className="font-display text-base font-bold text-brand-muted/40 transition-colors duration-300 group-hover:text-brand-warm md:text-lg">
              SmartLot
            </span>
          </Link>

          <nav aria-label="Pie de página" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-brand-muted">
            <Link
              to="/"
              className="min-h-11 inline-flex items-center hover:text-brand-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Volver al inicio
            </Link>
            <Link
              to="/login"
              className="min-h-11 inline-flex items-center hover:text-brand-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register?modo=garage"
              className="min-h-11 inline-flex items-center hover:text-brand-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Registrar mi garage
            </Link>
          </nav>

          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-sm font-medium text-brand-muted/50">
              © {new Date().getFullYear()} SmartLot. El estacionamiento del futuro.
            </p>
            <p className="text-xs text-brand-muted/40">Digitalización de espacios B2B sin hardware.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
