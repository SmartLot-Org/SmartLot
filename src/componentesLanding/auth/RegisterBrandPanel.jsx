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

const MASK_RADIAL = {
  WebkitMaskImage: "radial-gradient(closest-side, black 82%, transparent 100%)",
  maskImage: "radial-gradient(closest-side, black 82%, transparent 100%)",
};

const MARK_CLASSES =
  "absolute inset-0 invisible opacity-0 flex items-center justify-center text-slate-300 will-change-[transform,opacity,filter]";

const EN_FOCO = { autoAlpha: 1, scale: 1, filter: "blur(0px)" };
const OCULTO = { autoAlpha: 0, scale: 0.94, filter: "blur(10px)" };
const DESFOCADO = { autoAlpha: 0, scale: 1.06, filter: "blur(10px)" };

export default function RegisterBrandPanel({ modo }) {
  const panelRef = useRef(null);
  const logoRef = useRef(null);
  const shadowRef = useRef(null);
  const empresaMarkRef = useRef(null);
  const garageMarkRef = useRef(null);
  const textRef = useRef(null);
  const primerCambio = useRef(true);
  const esEmpresa = modo === MODO_EMPRESA;
  const contenido = CONTENIDO[modo] ?? CONTENIDO[MODO_EMPRESA];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(logoRef.current, {
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
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.killTweensOf([logoRef.current, shadowRef.current]);
        gsap.set(logoRef.current, { y: 0 });
        gsap.set(shadowRef.current, { scaleX: 1, opacity: 0.3 });
      });

      return () => {
        gsap.killTweensOf([logoRef.current, shadowRef.current]);
        mm.kill();
      };
    },
    { scope: panelRef }
  );

  useGSAP(
    () => {
      const entrada = esEmpresa ? empresaMarkRef.current : garageMarkRef.current;
      const salida = esEmpresa ? garageMarkRef.current : empresaMarkRef.current;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (primerCambio.current) {
          gsap.set(entrada, EN_FOCO);
          gsap.set(salida, OCULTO);
          return;
        }
        gsap.to(salida, { ...DESFOCADO, duration: 0.55, ease: "power2.inOut", overwrite: "auto" });
        gsap.to(entrada, { ...EN_FOCO, duration: 0.55, ease: "power2.inOut", overwrite: "auto" });
        gsap.fromTo(
          logoRef.current,
          { scale: 1 },
          { scale: 1.03, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.inOut", overwrite: "auto" }
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(entrada, EN_FOCO);
        gsap.set(salida, OCULTO);
      });

      primerCambio.current = false;
      return () => mm.kill();
    },
    { scope: panelRef, dependencies: [modo] }
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          textRef.current,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.08 }
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(textRef.current, { clearProps: "all", autoAlpha: 1, y: 0 });
      });
      return () => mm.kill();
    },
    { scope: panelRef, dependencies: [modo] }
  );

  return (
    <div
      ref={panelRef}
      className="w-full h-full min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white px-8 select-none"
    >
      <div
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#BFDBFE 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="relative w-[70vw] h-[70vw] md:w-[min(46vw,480px)] md:h-[min(46vw,480px)] -translate-y-5">
          <div ref={empresaMarkRef} className={MARK_CLASSES} style={MASK_RADIAL}>
            <Building2 className="w-full h-full" strokeWidth={1} aria-hidden="true" />
          </div>
          <div ref={garageMarkRef} className={MARK_CLASSES} style={MASK_RADIAL}>
            <Car className="w-full h-full" strokeWidth={1} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
        <div ref={logoRef} className="relative z-10 will-change-transform">
          <img
            src="/logoEntero.png"
            alt="SmartLot"
            className="w-auto h-32 md:h-44 object-contain drop-shadow-sm pointer-events-none"
          />
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
