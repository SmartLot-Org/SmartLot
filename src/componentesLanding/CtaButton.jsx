import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SIZES = {
  sm: {
    box: 'gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold sm:px-4',
    icon: 'h-4 w-4',
  },
  lg: {
    box: 'gap-2 rounded-2xl px-10 py-5 text-base font-bold',
    icon: 'h-5 w-5',
  },
};

export default function CtaButton({ to, children, size = 'lg', arrow = true, className = '' }) {
  const s = SIZES[size] ?? SIZES.lg;

  return (
    <Link
      to={to}
      className={`group/cta relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap bg-brand-blue text-white shadow-lg shadow-brand-blue/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand-blue/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg ${s.box} ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-[200%] motion-reduce:hidden"
      />
      <span className="relative">{children}</span>
      {arrow && (
        <ArrowRight
          className={`relative shrink-0 transition-transform duration-300 group-hover/cta:translate-x-1 ${s.icon}`}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
