import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CtaButton from '../CtaButton';
import { useAuth } from '../../contexts/useAuth';
import { getUserHomeRoute } from '../../helpers/roles';

export default function Navbar({ links = [] }) {
  const { usuario } = useAuth();
  const navRef = useRef();

  useGSAP(() => {
    if (!navRef.current) return;
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(navRef.current, {
        yPercent: -100,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power4.out",
        delay: 0.1,
        pointerEvents: "none",
        clearProps: "pointerEvents"
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(navRef.current, { autoAlpha: 1 });
    });
  });

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 w-full z-50 glass-nav"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-x-3 gap-y-2">

        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <img
            src="/logo.png"
            alt="SmartLot Logo"
            className="h-10 md:h-12 w-auto drop-shadow-sm transition-all duration-300 group-hover:brightness-110"
          />
          <span className="hidden sm:inline text-xl md:text-2xl font-extrabold text-brand-warm tracking-tight font-display">
            SmartLot
          </span>
        </Link>

        {links.length > 0 && (
          <nav className="hidden md:flex items-center gap-7" aria-label="Secciones de la página">
            {links.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="rounded-md text-sm font-medium text-brand-muted transition-colors duration-200 hover:text-brand-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {usuario ? (
            <Link
              to={getUserHomeRoute(usuario)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-brand-blue px-3 sm:px-4 py-2.5 text-sm font-semibold text-white shadow-accent hover:bg-brand-accent-hover active:scale-[0.97] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
            >
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-brand-navy/10 bg-white/70 px-3 sm:px-4 py-2.5 text-sm font-semibold text-brand-muted shadow-sm hover:border-brand-blue/40 hover:bg-brand-blue/10 hover:text-brand-deep hover:shadow-md active:scale-[0.97] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                Iniciar sesión
              </Link>
              <CtaButton to="/register" size="sm" arrow={false}>Regístrate</CtaButton>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
