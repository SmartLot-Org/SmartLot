import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import Navbar from '../componentesLanding/landing/Navbar';
import Hero from '../componentesLanding/landing/Hero';
import '../componentesLanding/landing/landing.css';
import InteractiveBackground from '../componentesLanding/landing/InteractiveBackground';
import LogoWatermark from '../componentesLanding/landing/LogoWatermark';
import { meta, navegacion } from '../componentesLanding/landing/contenido';
import usePageMeta from '../hooks/usePageMeta';

const Problema = lazy(() => import('../componentesLanding/landing/Problema'));
const Recorrido = lazy(() => import('../componentesLanding/landing/recorrido/Recorrido'));
const BentoGrid = lazy(() => import('../componentesLanding/landing/BentoGrid'));
const Contact = lazy(() => import('../componentesLanding/landing/Contact'));

// Un solo refresh por frame aunque resuelvan varios chunks a la vez: al
// reemplazar el skeleton por la sección real cambia el alto de la página y
// los start/end de los ScrollTrigger deben re-medirse.
let refreshRaf = 0;
function scheduleTriggerRefresh() {
  cancelAnimationFrame(refreshRaf);
  refreshRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
}

function SectionReady({ children }) {
  useEffect(() => {
    scheduleTriggerRefresh();
  }, []);
  return children;
}

function SkeletonFallback({ className = 'h-96' }) {
  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LandingPage() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const heroRef = useRef(null);

  usePageMeta({
    title: meta.titulo,
    description: meta.descripcion,
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Lenis solo en "/" y solo con movimiento habilitado: con reduced motion el
  // scroll queda nativo. Se carga aparte para no sumar al bundle principal.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    let cancelado = false;
    let detener = null;
    import('../componentesLanding/landing/smoothScroll').then(({ initSmoothScroll }) => {
      if (!cancelado) detener = initSmoothScroll();
    });
    return () => {
      cancelado = true;
      detener?.();
    };
  }, [prefersReducedMotion]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-warm focus:shadow-lg focus:ring-2 focus:ring-brand-blue"
      >
        Saltar al contenido principal
      </a>
      <InteractiveBackground
        count={prefersReducedMotion ? 35 : 45}
        interactionRadius={150}
        repelForce={80}
      />
      <div className="min-h-screen overflow-x-clip bg-noise landing-page">
        <Navbar links={navegacion} />
        <main id="main-content" tabIndex={-1} className="relative z-10 focus:outline-none">
          <Hero ref={heroRef} />
          <Suspense fallback={<SkeletonFallback className="min-h-[24rem]" />}>
            <SectionReady><Problema /></SectionReady>
          </Suspense>
          <Suspense fallback={<SkeletonFallback className="min-h-svh" />}>
            <SectionReady><Recorrido /></SectionReady>
          </Suspense>
          <Suspense fallback={<SkeletonFallback className="min-h-[44rem]" />}>
            <SectionReady><BentoGrid /></SectionReady>
          </Suspense>
        </main>
        <Suspense fallback={<SkeletonFallback className="min-h-[32rem]" />}>
          <SectionReady><Contact /></SectionReady>
        </Suspense>
        <LogoWatermark heroRef={heroRef} />
      </div>
    </>
  );
}
