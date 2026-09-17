import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Navbar from '../componentesLanding/landing/Navbar';
import Hero from '../componentesLanding/landing/Hero';
import '../componentesLanding/landing/landing.css';
import StatsTicker from '../componentesLanding/landing/StatsTicker';
import InteractiveBackground from '../componentesLanding/landing/InteractiveBackground';
import IntroAnimation from '../componentesLanding/landing/IntroAnimation';
import LogoWatermark from '../componentesLanding/landing/LogoWatermark';
import usePageMeta from '../hooks/usePageMeta';

const BentoGrid = lazy(() => import('../componentesLanding/landing/BentoGrid'));
const Contact = lazy(() => import('../componentesLanding/landing/Contact'));

const INTRO_SEEN_KEY = 'smartlot-intro-seen';

function SkeletonFallback() {
  return (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LandingPage() {
  const [isIntroComplete, setIsIntroComplete] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
    } catch {
      return true;
    }
  });
  const [startHero, setStartHero] = useState(isIntroComplete);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const heroRef = useRef(null);

  usePageMeta({
    title: 'SmartLot — El estacionamiento del futuro',
    description:
      'Publicás tu garage, las empresas piden lugar para su gente y vos manejás tratos, ocupación y consumos. Sin hardware, sin planillas.',
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // El scroll solo queda bloqueado mientras la intro está en pantalla.
  // Con prefers-reduced-motion no hay intro, así que nunca se bloquea.
  useEffect(() => {
    const locked = !isIntroComplete && !prefersReducedMotion;
    document.body.classList.toggle('no-scroll', locked);
    return () => document.body.classList.remove('no-scroll');
  }, [isIntroComplete, prefersReducedMotion]);

  const markIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Sin sessionStorage la intro puede repetirse; nada se rompe
    }
    setIsIntroComplete(true);
  }, []);

  const openDoors = useCallback(() => setStartHero(true), []);

  const showIntro = !prefersReducedMotion && !isIntroComplete;

  return (
    <>
      {showIntro && (
        <IntroAnimation
          onComplete={markIntroComplete}
          onOpenDoors={openDoors}
        />
      )}
      <InteractiveBackground
        count={prefersReducedMotion ? 35 : 45}
        interactionRadius={150}
        repelForce={80}
      />
      <div className="min-h-screen overflow-x-hidden bg-noise landing-page">
        <Navbar />
        <main id="main-content" className="relative z-10">
          <Hero ref={heroRef} startAnimation={startHero} />
          <StatsTicker />
          <Suspense fallback={<SkeletonFallback />}><BentoGrid /></Suspense>
        </main>
        <Suspense fallback={<SkeletonFallback />}><Contact /></Suspense>
        <LogoWatermark heroRef={heroRef} />
      </div>
    </>
  );
}
