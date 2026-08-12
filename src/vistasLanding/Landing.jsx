import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../componentesLanding/landing/Navbar';
import Hero from '../componentesLanding/landing/Hero';
import '../componentesLanding/landing/landing.css';
import StatsTicker from '../componentesLanding/landing/StatsTicker';
import InteractiveBackground from '../componentesLanding/landing/InteractiveBackground';
import IntroAnimation from '../componentesLanding/landing/IntroAnimation';
import LogoWatermark from '../componentesLanding/landing/LogoWatermark';

const BentoGrid = lazy(() => import('../componentesLanding/landing/BentoGrid'));
const PinnedScrollSections = lazy(() => import('../componentesLanding/landing/PinnedScrollSections'));
const Contact = lazy(() => import('../componentesLanding/landing/Contact'));

function SkeletonFallback() {
  return (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LandingPage() {
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [startHero, setStartHero] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const heroRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // The lock only protects the door-opening intro sequence, which never
    // renders under prefers-reduced-motion — so isIntroComplete would
    // otherwise stay false forever and leave the page permanently unscrollable
    // for those users.
    document.body.classList.toggle('no-scroll', !isIntroComplete && !prefersReducedMotion);
    return () => document.body.classList.remove('no-scroll');
  }, [isIntroComplete, prefersReducedMotion]);

  // BentoGrid/PinnedScrollSections/Contact each sit
  // behind their own React.lazy() boundary and can swap in their real (taller)
  // content at unpredictable times as chunks finish loading. GSAP ScrollTrigger
  // caches each trigger's start/end at creation time, so a trigger measured
  // before a later section's chunk has resolved ends up scrubbing against a
  // stale position. Watching document.body's size and refreshing (debounced)
  // whenever it changes keeps every non-pinned ScrollTrigger on the page
  // aligned regardless of load order. (The two pinned sections inside
  // PinnedScrollSections avoid this by mounting together, in order, instead of
  // relying on a post-hoc refresh — see that file for why.)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let raf = null;
    const resizeObserver = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    resizeObserver.observe(document.body);
    return () => {
      resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (prefersReducedMotion) {
    return (
      <>
        <InteractiveBackground count={70} interactionRadius={150} repelForce={80} />
        <div className="min-h-screen overflow-x-hidden bg-noise landing-page">
          <Navbar />
          <main id="main-content" className="relative z-10">
            <Hero ref={heroRef} startAnimation={true} />
            <StatsTicker />
            <Suspense fallback={<SkeletonFallback />}><BentoGrid /></Suspense>
            <Suspense fallback={<SkeletonFallback />}><PinnedScrollSections /></Suspense>
          </main>
          <Suspense fallback={<SkeletonFallback />}><Contact /></Suspense>
          <LogoWatermark heroRef={heroRef} />
        </div>
      </>
    );
  }

  return (
    <>
      {!isIntroComplete && (
        <IntroAnimation
          onComplete={() => setIsIntroComplete(true)}
          onOpenDoors={() => setStartHero(true)}
        />
      )}
      <InteractiveBackground count={90} interactionRadius={150} repelForce={80} />
      <div className="min-h-screen overflow-x-hidden bg-noise landing-page">
        <Navbar />
        <main id="main-content" className="relative z-10">
          <Hero ref={heroRef} startAnimation={startHero} />
          <StatsTicker />
          <Suspense fallback={<SkeletonFallback />}><BentoGrid /></Suspense>
          <Suspense fallback={<SkeletonFallback />}><PinnedScrollSections /></Suspense>
        </main>
        <Suspense fallback={<SkeletonFallback />}><Contact /></Suspense>
        <LogoWatermark heroRef={heroRef} />
      </div>
    </>
  );
}
