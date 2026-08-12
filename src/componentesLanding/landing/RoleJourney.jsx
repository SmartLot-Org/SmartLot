import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { CalendarCheck, ScanLine, SlidersHorizontal, ShieldAlert } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, SplitText);

const roles = [
  { role: 'Empleado', action: 'Reservá tu lugar antes de llegar.', icon: CalendarCheck },
  { role: 'Garajista', action: 'Verificá la patente en el acceso.', icon: ScanLine },
  { role: 'Administrador', action: 'Configurá capacidad y zonas.', icon: SlidersHorizontal },
  { role: 'Superadministrador', action: 'Resolvé conflictos entre sedes.', icon: ShieldAlert },
];

// Icon frame — shared wrapper so the icon reads as an intentional
// architectural glyph, not a floating lonely symbol. A subtle glass
// chip with a radial halo gives it presence in the dark void.
function IconFrame({ children, className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl glass-dark p-4 ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_32px_rgba(0,0,0,0.35)] ${className}`}
      aria-hidden="true"
    >
      {/* Radial glow behind icon — subtle, feels like backlit panel */}
      <div
        className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(108,147,214,0.18)_0%,transparent_70%)] pointer-events-none"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function RoleJourney() {
  const container = useRef(null);
  const pinRef = useRef(null);
  const headingRefs = useRef([]);
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
    if (prefersReducedMotion) return undefined;

    const splits = headingRefs.current.map((el) => (
      el ? new SplitText(el, { type: 'chars', charsClass: 'role-char' }) : null
    ));
    const iconRefs = roles.map((_, i) => document.querySelector(`.role-icon-${i}`)).filter(Boolean);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinRef.current,
        start: 'top top',
        end: '+=300%',
        scrub: 1,
        pin: true,
      },
    });

    // Leave the intro panel visible at progress 0 for a brief moment so
    // sighted users can read "Cuatro roles, una operación" before the
    // first role's char-reveal kicks in. Aligns with the same immersivity
    // used one pin up in ParkingStructureSection.
    tl.to('.role-intro', { autoAlpha: 0, duration: 0.1 }, 0.05);

    roles.forEach((_, i) => {
      const split = splits[i];
      const icon = iconRefs[i];
      if (!split) return;
      const label = `role${i}`;
      // First role starts slightly after the intro fade-out. Subsequent
      // roles get a small staggered gap for breathing room.
      tl.addLabel(label, i === 0 ? 0.08 : `>0.1`);

      // Outgoing role: subtle scale-down + fade before the hard swap.
      // This creates a sense of "passing the baton" instead of a jarring
      // cut. Duration kept tiny (0.12) so it reads as a smooth handoff
      // within the same scroll scrub window.
      if (i > 0) {
        const prevIcon = iconRefs[i - 1];
        if (prevIcon) {
          tl.to(prevIcon, { scale: 0.92, opacity: 0.6, duration: 0.12, ease: 'power2.out' }, label);
        }
        tl.to(`.role-panel-${i - 1}`, { autoAlpha: 0, duration: 0.12 }, label);
      }

      // Incoming role: icon scales up from 0.85→1 with a slight overshoot
      // while the chars reveal — the two motions are synced so the
      // icon's "pop" coincides with the first char landing.
      tl.set(`.role-panel-${i}`, { autoAlpha: 1 }, label);
      if (icon) {
        tl.fromTo(
          icon,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' },
          label
        );
      }
      tl.from(
        split.chars,
        { yPercent: 110, opacity: 0, stagger: 0.02, duration: 0.5, ease: 'power3.out' },
        label
      );
    });

    return () => splits.forEach((s) => s && s.revert());
  }, { scope: container, dependencies: [prefersReducedMotion] });

  return (
    <section
      ref={container}
      aria-labelledby="role-journey-h2"
      className="relative bg-gradient-to-b from-brand-deep to-[#050B16]"
    >
      {prefersReducedMotion ? (
        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <div className="mb-12 text-center">
            <span className="block font-display font-bold tracking-[0.2em] uppercase text-sm text-brand-sky mb-3">
              Recorrido por roles
            </span>
            <h2
              id="role-journey-h2"
              className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl !text-white mb-4 leading-tight"
            >
              Cuatro roles, una operación.
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Cada actor de tu ecosistema accede a una experiencia diseñada a medida.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map(({ role, action, icon: Icon }) => (
              <article
                key={role}
                className="glass-dark rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
              >
                <IconFrame className="w-fit">
                  <Icon className="w-10 h-10 text-brand-sky" aria-hidden="true" />
                </IconFrame>
                <h3 className="text-white font-display font-bold text-xl">{role}</h3>
                <p className="text-white/70">{action}</p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div ref={pinRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
          {/* Radial vignette keeps the dark scene from feeling flat and
              bridges ParkingStructureSection's tail transition smoothly. */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,30,63,0)_0%,rgba(5,11,22,0.7)_100%)] pointer-events-none"
            aria-hidden="true"
          />

{/* Always-visible-intro panel. Fades out early in the timeline
              (see tl.to('.role-intro') above) so it doesn't crowd the
              role panels but still provides a real <h2> landmark for AT
              users and context for sighted ones before rotation starts. */}
            <div className="role-intro absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center pointer-events-none">
              <span className="block font-display font-bold tracking-[0.2em] uppercase text-xs sm:text-sm text-brand-sky mb-2">
                Recorrido por roles
              </span>
              <h2
                id="role-journey-h2"
                className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl !text-white leading-tight drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
              >
                Cuatro roles,<br className="hidden sm:block" /> una operación.
              </h2>
              <p className="text-white/70 max-w-md text-base md:text-lg">
                Cada actor de tu ecosistema accede a una experiencia diseñada a medida.
              </p>
            </div>

          {roles.map(({ role, action, icon: Icon }, i) => (
            <div
              key={role}
              role="group"
              aria-label={`${role} — ${action}`}
              className={`role-panel role-panel-${i} absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center opacity-0 ${i === 0 ? '' : ''}`}
            >
              <IconFrame className="role-icon-wrapper">
                <Icon className={`role-icon-${i} w-12 h-12 text-brand-sky drop-shadow-[0_2px_12px_rgba(37,99,235,0.35)]`} aria-hidden="true" />
              </IconFrame>
              <h3
                ref={(el) => { headingRefs.current[i] = el; }}
                className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white overflow-hidden drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
              >
                {role}
              </h3>
              <p className="role-action text-white/80 text-xl md:text-2xl max-w-md drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
                {action}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
