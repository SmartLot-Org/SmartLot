import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function BrandPanel() {
  const panelRef = useRef(null);
  const logoRef = useRef(null);
  const shadowRef = useRef(null);

  useGSAP(() => {
    if (!logoRef.current || !shadowRef.current) return;
    const mm = gsap.matchMedia();

    // Animación de levitación suave (Logo)
    gsap.to(logoRef.current, {
      y: -15,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    // Animación de la sombra proyectada (Se encoge y desvanece cuando el logo sube)
    gsap.to(shadowRef.current, {
      scale: 0.8,
      opacity: 0.15,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    // Accesibilidad: Detener animaciones si el usuario lo prefiere
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.killTweensOf([logoRef.current, shadowRef.current]);
      gsap.set(logoRef.current, { y: 0 });
      gsap.set(shadowRef.current, { scale: 1, opacity: 0.3 });
    });

    return () => mm.kill();
  }, { scope: panelRef });

  return (
    <div 
      ref={panelRef} 
      className="w-full h-full min-h-screen relative flex flex-col items-center justify-center bg-white px-8 select-none"
    >
      {/* ─── DETALLE ESTRUCTURAL SUTIL ─── */}
      {/* Un patrón de puntos extremadamente tenue para que no sea un bloque de blanco vacío */}
      <div 
        className="absolute inset-0 opacity-[0.3] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
      />

      {/* ─── COMPOSICIÓN CENTRAL (LOGO Y SOMBRA) ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
        
        {/* Logo Flotante */}
        <div ref={logoRef} className="relative z-10 will-change-transform">
          <img 
            src="/logoEntero.png" 
            alt="Smartlot Logo" 
            className="w-auto h-32 md:h-44 object-contain drop-shadow-sm pointer-events-none"
          />
        </div>

        {/* Sombra de Levitación en el suelo */}
        <div 
          ref={shadowRef}
          className="w-48 h-3 bg-slate-400 blur-md rounded-full mt-8 opacity-30 will-change-transform"
        />
      </div>

      {/* ─── TEXTOS MINIMALISTAS ─── */}
      <div className="absolute bottom-16 text-center z-10 w-full px-6 flex flex-col items-center">
        {/* Pequeña línea de acento azul para mantener la marca */}
        <div className="w-8 h-[3px] bg-blue-600 rounded-full mb-6" />
        
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-sans mb-2">
          Gestión inteligente de espacios
        </h2>
        
        <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">
          Optimiza la infraestructura de tu estacionamiento con precisión y control total.
        </p>
      </div>

    </div>
  );
}
