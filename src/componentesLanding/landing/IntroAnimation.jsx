import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const IntroAnimation = ({ onComplete, onOpenDoors }) => {
  const containerRef = useRef(null);
  const leftDoorRef = useRef(null);
  const rightDoorRef = useRef(null);
  const logoContainerRef = useRef(null);
  const tlRef = useRef(null);
  const skippedRef = useRef(false);

  // Salto manual: mata el timeline, abre de inmediato y suelta el scroll.
  // Idempotente: click, teclado y botón pueden llegar juntos.
  const skip = useCallback(() => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    tlRef.current?.kill();
    onOpenDoors?.();
    onComplete?.();
  }, [onOpenDoors, onComplete]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  useGSAP(() => {
    if (!logoContainerRef.current || !leftDoorRef.current || !rightDoorRef.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Total ≈ 2.3s: golpe de marca con aire, no una espera. Saltable
      // con cualquier click / Esc / Enter / Espacio o el botón de abajo.
      const tl = gsap.timeline({ onComplete });

      gsap.set(logoContainerRef.current, { opacity: 0, scale: 0.8, y: 20 });

      tl.to(logoContainerRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.7,
        ease: "back.out(1.2)",
      })
      .to(logoContainerRef.current, {
        opacity: 0,
        scale: 1.05,
        y: -20,
        duration: 0.4,
        ease: "power2.inOut",
      }, "+=0.7")
      .addLabel("doorsStart", "-=0.25")
      .add(onOpenDoors, "doorsStart")
      .to([leftDoorRef.current, rightDoorRef.current], {
        xPercent: (i) => (i === 0 ? -100 : 100),
        duration: 0.75,
        ease: "expo.inOut",
      }, "doorsStart");

      tlRef.current = tl;
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(logoContainerRef.current, { opacity: 1, scale: 1, y: 0 });
      gsap.set([leftDoorRef.current, rightDoorRef.current], { opacity: 0 });
      onOpenDoors();
      onComplete();
    });

  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-transparent"
    >
      {/* Cualquier click en la pantalla salta la intro */}
      <div
        className="absolute inset-0 z-30 pointer-events-auto"
        onClick={skip}
        aria-hidden="true"
      />
      <div ref={leftDoorRef} className="absolute left-0 top-0 h-full w-1/2 bg-brand-navy will-change-transform" />
      <div ref={rightDoorRef} className="absolute right-0 top-0 h-full w-1/2 bg-brand-navy will-change-transform" />

      <div
        ref={logoContainerRef}
        className="relative z-10 flex items-center justify-center bg-white/95 backdrop-blur-md px-10 py-10 md:px-16 md:py-12 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(12,30,63,0.5)] border border-white/50"
      >
        <img
          src="/logoEntero.png"
          alt="SmartLot"
          width="448"
          height="120"
          className="w-64 md:w-[28rem] h-auto object-contain"
        />
      </div>

      <button
        type="button"
        onClick={skip}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
      >
        Saltar
      </button>
    </div>
  );
};

export default IntroAnimation;
