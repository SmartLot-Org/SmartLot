import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="unauthorized-page flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-bg p-8">
      <p className="font-display text-7xl font-extrabold text-error-strong tabular-nums" aria-hidden="true">403</p>
      <h1 className="text-brand-warm">Acceso Denegado</h1>
      <p className="max-w-sm text-center text-brand-muted">
        No tenés permisos suficientes para acceder a esta página.
      </p>
      <Link
        to="/login"
        className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-brand-blue px-8 font-semibold text-white transition-colors hover:bg-brand-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
      >
        Ir al inicio de sesión
      </Link>
    </div>
  );
}
