import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Building2, Car } from "lucide-react";
import { MODO_EMPRESA } from "./RegisterRoleToggle";

gsap.registerPlugin(useGSAP);

const CONTENIDO = {
  [MODO_EMPRESA]: {
    titulo: "Gestión para tu empresa",
    descripcion:
      "Registrá tu empresa y administrá los vehículos y las cocheras de tu flota en un solo lugar.",
  },
  garage: {
    titulo: "Tu garage, trabajando",
    descripcion:
      "Publicá tus espacios, recibí solicitudes de empresas y gestioná todo desde tu panel.",
  },
};

export default function RegisterBrandPanel({ modo }) {
  const panelRef = useRef(null);
  const floatRef = useRef(null);
  const shadowRef = useRef(null);
  const iconRef = useRef(null);
  const textRef = useRef(null);
  const esEmpresa = modo === MODO_EMPRESA;
  const contenido = CONTENIDO[modo] ?? CONTENIDO[MODO_EMPRESA];

  useGSAP(
    () => {
      gsap.to(floatRef.current, {
        y: -14,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(shadowRef.current, {
        scaleX: 0.82,
        opacity: 0.15,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        gsap.killTweensOf([floatRef.current, shadowRef.current]);
      };
    },
    { scope: panelRef }
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          iconRef.current,
          { autoAlpha: 0, scale: 0.82, rotate: -8 },
          { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.45, ease: "back.out(1.4)" }
        );
        gsap.fromTo(
          textRef.current,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.08 }
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([iconRef.current, textRef.current], { clearProps: "all", autoAlpha: 1, y: 0 });
      });
      return () => mm.kill();
    },
    { scope: panelRef, dependencies: [modo] }
  );

  return (
    <div
      ref={panelRef}
      className="w-full h-full min-h-screen relative flex flex-col items-center justify-center bg-white px-8 select-none"
    >
      <div
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <img
        src="/logoEntero.png"
        alt="SmartLot"
        className="absolute top-10 left-10 h-10 w-auto object-contain pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
        <div ref={floatRef} className="relative z-10 will-change-transform">
          <div
            key={modo}
            ref={iconRef}
            className={`flex items-center justify-center w-44 h-44 md:w-56 md:h-56 rounded-[2rem] border shadow-xl ${
              esEmpresa
                ? "bg-brand-deep border-brand-deep text-white shadow-brand-deep/20"
                : "bg-white border-brand-blue/20 text-brand-blue shadow-brand-blue/20"
            }`}
          >
            {esEmpresa ? (
              <Building2 size={96} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Car size={96} strokeWidth={1.5} aria-hidden="true" />
            )}
          </div>
        </div>

        <div
          ref={shadowRef}
          className="w-48 h-3 bg-slate-400 blur-md rounded-full mt-8 opacity-30 will-change-transform"
        />
      </div>

      <div
        key={`text-${modo}`}
        ref={textRef}
        className="absolute bottom-16 text-center z-10 w-full px-6 flex flex-col items-center"
      >
        <div className="w-8 h-[3px] bg-blue-600 rounded-full mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-sans mb-2">
          {contenido.titulo}
        </h2>
        <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">
          {contenido.descripcion}
        </p>
      </div>
    </div>
  );
}
