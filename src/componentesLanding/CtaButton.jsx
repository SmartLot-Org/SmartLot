import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SIZES = {
  sm: {
    box: 'gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold sm:px-4',
    icon: 'h-4 w-4',
  },
  // Botón grande de DESIGN.md: 48 px de alto, radio de 10 px.
  md: {
    box: 'min-h-12 gap-2 rounded-[10px] px-6 py-3 text-base font-semibold',
    icon: 'h-4 w-4',
  },
  lg: {
    box: 'gap-2 rounded-2xl px-10 py-5 text-base font-bold',
    icon: 'h-5 w-5',
  },
};

// Hover y presión van en propiedades concretas y por debajo de 200 ms: es un
// control que se usa seguido, así que responde rápido y no decora.
export default function CtaButton({ to, children, size = 'lg', arrow = true, className = '' }) {
  const s = SIZES[size] ?? SIZES.lg;

  return (
    <Link
      to={to}
      className={`group/cta relative inline-flex items-center justify-center whitespace-nowrap bg-brand-blue text-white shadow-accent transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-brand-accent-hover hover:shadow-lg hover:shadow-brand-blue/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg ${s.box} ${className}`}
    >
      <span className="relative">{children}</span>
      {arrow && (
        <ArrowRight
          className={`relative shrink-0 transition-transform duration-200 ease-out group-hover/cta:translate-x-0.5 ${s.icon}`}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
