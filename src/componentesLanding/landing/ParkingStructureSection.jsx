import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ParkingStructureScene from './ParkingStructureScene';

gsap.registerPlugin(ScrollTrigger);

const LEVEL_COUNT = 4;

const callouts = [
  {
    num: '01',
    text: 'Empresa → Sede → Garage: toda tu operación en una sola jerarquía.',
  },
  {
    num: '02',
    text: 'Capacidad para reservas y para uso libre, definida por vos.',
  },
  {
    num: '03',
    text: 'Ingreso validado hasta 60 minutos antes de la reserva.',
  },
  {
    num: '04',
    text: 'Ocupación, picos de uso y tiempo promedio, siempre a la vista.',
  },
];

export default function ParkingStructureSection() {
  const sectionRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Pinning is done via ScrollTrigger's own `pin: true` (which positions the
    // element with `position: fixed` + an auto-generated spacer) rather than
    // CSS `position: sticky` — a shared ancestor further up the tree sets
    // `overflow-x-hidden`, and a non-"visible" overflow-x with no explicit
    // overflow-y forces the used value of overflow-y to `auto`, which breaks
    // `position: sticky` for descendants. ScrollTrigger's pin is immune to
    // that because it never relies on CSS sticky positioning.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=300%',
          scrub: 1,
          pin: true,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
          },
        },
      });

      // SVG progress line draws top-to-bottom across the whole pin and the
      // glow head rides along it — both linear, scrubbed 0 → 1 so the line
      // "accompanies" the scroll 1:1.
      tl.fromTo(
        '.parking-progress-line',
        { strokeDashoffset: 1000 },
        { strokeDashoffset: 0, duration: 1, ease: 'none' },
        0
      );
      tl.fromTo(
        '.parking-progress-head',
        { top: '0%' },
        { top: '100%', duration: 1, ease: 'none' },
        0
      );

      // Each callout's window must match ParkingStructureScene's own
      // levelProgress = scrollProgress * (levelCount - 1) mapping (level i is
      // "active" from the midpoint before it to the midpoint after it), so
      // the copy on screen always matches whichever level is actually lit up
      // — equal 1/N-wide windows drift out of sync with the camera's motion.
      // NOTE: every tween must target its OWN wrapper via [data-index] — a
      // bare `.parking-callout-wrapper` selector makes every tween fight over
      // all four wrappers, leaving several texts visible at once.
      callouts.forEach((_, i) => {
        const start = i === 0 ? 0 : (i - 0.5) / (LEVEL_COUNT - 1);
        const end = i === callouts.length - 1 ? 1 : (i + 0.5) / (LEVEL_COUNT - 1);
        const span = end - start;
        const sel = `.parking-callout-wrapper[data-index="${i}"]`;
        // Each callout enters from the sides (alternating left/right) and
        // exits to the opposite side — a directional sweep, not a vertical fade.
        const inFrom = i % 2 === 0 ? -64 : 64;
        const outTo = i % 2 === 0 ? 64 : -64;
        tl.fromTo(
          sel,
          { autoAlpha: 0, x: inFrom },
          { autoAlpha: 1, x: 0, duration: span * 0.3 },
          start
        ).to(
          sel,
          { autoAlpha: 0, x: outTo, duration: span * 0.25 },
          end - span * 0.25
        );

        // Rail node lighting, in sync with its callout's window.
        const nodeSel = `.parking-rail .parking-rail-node[data-level="${i}"]`;
        tl.to(
          nodeSel,
          {
            backgroundColor: '#3B82F6',
            boxShadow: '0 0 14px rgba(59,130,246,0.9)',
            opacity: 1,
            duration: span * 0.3,
          },
          start
        ).to(
          nodeSel,
          {
            backgroundColor: 'rgba(59,130,246,0)',
            boxShadow: '0 0 0px rgba(59,130,246,0)',
            opacity: 0.4,
            duration: span * 0.25,
          },
          end - span * 0.25
        );
      });

      // Tail transition (last ~12%): the foreground kicker ("La
      // arquitectura de SmartLot") scales down and dims rather than
      // vanishing entirely — earlier it was autoAlpha:0'd, which left the
      // final stretch of the pin visually empty above an opaque watermark,
      // reading as a stale/abandoned screen. Keeping it present (just
      // quieter) hands off cleanly to RoleJourney while still anchoring
      // the foreground throughout the pin.
      tl.to('.parking-intro', { scale: 0.92, opacity: 0.5, duration: 0.12 }, 0.88);

      // Drive the giant callout numeral + its CAPA badge to light up in
      // sync with each callout's window — previously they were stuck at
      // (i === 0 ? text-brand-sky : text-white/40) forever, so as levels
      // became active the rail node beside them lit up while the giant
      // foreground numeral stayed grayed: a broken visual contract. Now
      // each wrapper's numeral:0 + badge:border/badge:text simultaneously
      // saturate to brand-sky at the same GSAP moment the rail node does.
      callouts.forEach((_, i) => {
        const start = i === 0 ? 0 : (i - 0.5) / (LEVEL_COUNT - 1);
        const end = i === callouts.length - 1 ? 1 : (i + 0.5) / (LEVEL_COUNT - 1);
        const span = end - start;
        const numSel = `.parking-callout-wrapper[data-index="${i}"] .parking-callout-num`;
        const badgeSel = `.parking-callout-wrapper[data-index="${i}"] .parking-callout-badge`;
        tl.to(
          numSel,
          { color: '#6C93D6', duration: span * 0.3, ease: 'sine.inOut' },
          start
        ).to(
          badgeSel,
          {
            borderColor: 'rgba(108,147,214,0.6)',
            backgroundColor: 'rgba(108,147,214,0.12)',
            duration: span * 0.3,
            ease: 'sine.inOut',
          },
          start
        );
        if (i < callouts.length - 1) {
          tl.to(
            numSel,
            { color: 'rgba(255,255,255,0.4)', duration: span * 0.2, ease: 'sine.inOut' },
            end - span * 0.18
          ).to(
            badgeSel,
            {
              borderColor: 'rgba(108,147,214,0.3)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              duration: span * 0.2,
              ease: 'sine.inOut',
            },
            end - span * 0.18
          );
        }
      });
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('.parking-callout-wrapper', { autoAlpha: 1, y: 0, x: 0 });
    });
  }, { scope: sectionRef });

  if (prefersReducedMotion) {
    return (
      <section
        ref={sectionRef}
        aria-labelledby="parking-structure-h2"
        className="relative content-visibility-auto py-24 overflow-hidden bg-gradient-to-b from-brand-deep to-[#050B16]"
      >
        {/* Giant background heading — static version, bottom-anchored.
            This is the section's real landmark heading for AT users, so
            it must NOT be aria-hidden. Kept dim so it reads as a watermark
            behind the content instead of covering it. */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
        >
<h2
          id="parking-structure-h2"
          className="parking-giant-heading font-display font-extrabold uppercase text-[clamp(3rem,12vw,10rem)] leading-[0.85] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-sky/45 via-[rgba(173,216,230,0.15)] to-transparent drop-shadow-[0_0_30px_rgba(37,99,235,0.18)]"
        >
          Tu operación,
          <br className="hidden sm:block" />
          nivel por nivel.
        </h2>
        </div>

        {/* Persistent left rail — static: full progress line drawn, first
            node lit (no motion under prefers-reduced-motion). */}
        <div className="parking-rail absolute inset-y-0 left-0 w-12 md:w-16" aria-hidden="true">
          <svg
            className="absolute inset-0 h-full w-full opacity-30 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1="50" y1="0" x2="50" y2="100"
              stroke="#3B82F6"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-between py-8 items-center pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                role="menuitem"
                type="button"
                className={`parking-rail-node ${i === 0 ? 'bg-brand-sky opacity-100' : 'opacity-20'} rounded-full w-2.5 h-2.5 border-2 border-brand-sky/40 transition-colors duration-150`}
                aria-label={`Nivel ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Narrow left scrim — backs the text without covering the view. */}
        <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black/65 via-black/30 to-transparent pointer-events-none" aria-hidden="true" />

        {/* Callouts — floor monitor readouts, all visible statically since reduced-motion. */}
        <div className="relative z-10 max-w-2xl ml-12 md:ml-16 px-6 md:px-10">
          <span className="block font-display font-bold tracking-[0.2em] uppercase text-sm text-brand-sky mb-3">
            La arquitectura de SmartLot
          </span>

          {/* Four floor-monitor cards in a column, each with numeral, badge, and description. */}
          <div className="space-y-6 max-w-2xl">
            {callouts.map(({ num, text }, i) => (
              <div
                key={text}
                className="parking-callout-wrapper flex flex-col items-start gap-2 py-4"
              >
                {/* Giant level numeral + badge kicker */}
                <div className="flex items-baseline gap-2 my-2">
                  <span
                    className={`parking-callout-num font-display font-extrabold text-5xl sm:text-6xl md:text-7xl ${i === 0 ? 'text-brand-sky' : 'text-white/40'}`}
                  >
                    {num}
                  </span>
                  <button
                    role="button"
                    type="button"
                    className={`parking-callout-badge rounded-full border-2 ${i === 0 ? 'border-brand-sky/60 bg-brand-sky/12 text-brand-sky' : 'border-brand-sky/30 bg-white/5 text-brand-sky/60'} text-xs sm:text-sm font-bold uppercase tracking-[0.2em] px-2.5 py-1`}
                    aria-label={`Capa ${num}`}
                  >
                    Capa {num}
                  </button>
                </div>

                {/* Descriptive text */}
                <p className="parking-callout-text font-display font-extrabold text-lg sm:text-xl md:text-2xl leading-tight tracking-[-0.01em] text-white max-w-[26ch]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="parking-structure-h2"
      className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-brand-deep to-[#050B16]"
    >
      <div
        className="absolute inset-0"
        role="img"
        aria-label="Animación 3D de una estructura de estacionamiento de varios niveles que se ilumina en azul a medida que se recorre cada nivel"
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [5, 4.8, 10], fov: 45, near: 0.1, far: 50 }}
          onCreated={() => setCanvasReady(true)}
          className={`!absolute inset-0 transition-opacity duration-700 ${canvasReady ? 'opacity-100' : 'opacity-0'}`}
        >
          <Suspense fallback={null}>
            <ParkingStructureScene scrollProgressRef={scrollProgressRef} levelCount={LEVEL_COUNT} />
          </Suspense>
        </Canvas>
      </div>

      {/* Giant background heading — monumental architectural inscription, bottom-anchored,
          bleeds off the bottom edge. This is the section's real landmark
          heading (aria-labelledby="parking-structure-h2"), so it must NOT be
          aria-hidden. Kept dim (from-brand-sky/45) so it reads as a carved
          watermark BEHIND the 3D drawing instead of covering it. */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
      >
        <h2
          id="parking-structure-h2"
          className="parking-giant-heading font-display font-extrabold uppercase text-[clamp(3rem,12vw,10rem)] leading-[0.85] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-sky/45 via-[rgba(173,216,230,0.15)] to-transparent drop-shadow-[0_0_30px_rgba(37,99,235,0.18)]"
        >
          Tu operación,
          <br className="hidden sm:block" />
          nivel por nivel.
        </h2>
      </div>

      {/* Narrow left scrim — backs the callout text column without dimming
          the 3D drawing: fades to transparent by ~58% of the viewport and
          only spans the left side, leaving the structure fully lit. */}
      <div
        className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black/65 via-black/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Persistent left rail — an SVG progress line that draws top-to-bottom
          with the scroll, a traveling glow head, and 4 level nodes lit by the
          GSAP timeline in sync with each callout window. */}
      <div className="parking-rail absolute inset-y-0 left-0 w-12 md:w-16" aria-hidden="true">
        {/* The line is straight vertical so strokeDashoffset 1000 → 0 (via
            pathLength normalization) maps linearly to scroll progress.
            vector-effect keeps the stroke crisp under preserveAspectRatio. */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1="50" y1="0" x2="50" y2="100"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="50" y1="0" x2="50" y2="100"
            className="parking-progress-line"
            stroke="#3B82F6"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            pathLength="1000"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 5px rgba(59,130,246,0.9))' }}
          />
        </svg>

        {/* Traveling glow head — a div (SVG fills would distort under
            preserveAspectRatio="none"); GSAP animates top 0% → 100%. */}
        <div className="parking-progress-head absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-brand-sky shadow-[0_0_14px_rgba(59,130,246,1)] ring-2 ring-brand-sky/30 pointer-events-none" />

        {/* Level nodes — evenly spaced along the line, lit by GSAP. */}
        <div className="absolute inset-0 flex flex-col justify-between py-8 items-center pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              role="menuitem"
              type="button"
              data-level={i}
              className="parking-rail-node rounded-full w-2.5 h-2.5 border-2 border-brand-sky/40 bg-transparent opacity-40 transition-colors duration-150"
              aria-label={`Nivel ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 h-full flex items-center px-6 md:px-16 pointer-events-none">
        <div className="relative w-full max-w-2xl ml-12 md:ml-16">

          {/* Giant heading — kept as the real h2 above; here we use the kicker
              in foreground position inside the callout block. */}
          <span className="parking-intro block font-display font-bold tracking-[0.2em] uppercase text-xs sm:text-sm text-brand-sky mb-3">
            La arquitectura de SmartLot
          </span>

          {/* Callouts — each one a floor-monitor readout:
              giant level numeral, CAPA badge kicker, descriptive text.
              Each sweeps in from alternating sides (left/right) and exits
              to the opposite side, driven by the GSAP timeline.

              The wrapper is sized to the worst-case content (numeral
              cap-height at 7xl ≈ 72px + multi-line body at 2xl) instead
              of a fixed h-40/w-48 — the old fixed height clipped the
              longest Spanish descriptions ("Empresa → Sede → Garage…")
              mid-descender, which read as floating letters). Left-aligned
              (not centered) so the numeral's baseline cap-height doesn't
              visually tip over inside the window, and the badge's tracking
              reads rightward from a clean start. */}
          <div className="relative min-h-[14rem] sm:min-h-[16rem] flex items-center">
            {callouts.map(({ num, text }, i) => (
              <div
                key={text}
                data-index={i}
                className="parking-callout-wrapper absolute inset-0 flex flex-col justify-center gap-3 opacity-0"
              >
                {/* Giant level numeral + badge kicker */}
                <div className="flex items-end gap-3">
                  <span
                    className={`parking-callout-num font-display font-extrabold text-6xl sm:text-7xl md:text-8xl leading-none text-white/40 transition-colors duration-200 selection:bg-brand-sky/30`}
                  >
                    {num}
                  </span>
                  <span
                    className={`parking-callout-badge inline-block rounded-full border-2 border-brand-sky/30 bg-white/5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-brand-sky px-2.5 py-1 mb-2`}
                  >
                    Capa {num}
                  </span>
                </div>

                {/* Descriptive text — allowed to wrap to two lines, tight
                    leading, tracked -0.01em so a long line stays a single
                    visual mass instead of a stack of unrelated words. */}
                <p
                  className={`parking-callout-text font-display font-extrabold text-lg sm:text-xl md:text-2xl leading-tight tracking-[-0.01em] text-white max-w-[26ch]`}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
