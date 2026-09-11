import { Building2, Car } from "lucide-react";

export const MODO_EMPRESA = "empresa";
export const MODO_GARAGE = "garage";

const OPCIONES = [
  { id: MODO_EMPRESA, etiqueta: "Empresa", icono: Building2 },
  { id: MODO_GARAGE, etiqueta: "Garage", icono: Car },
];

export default function RegisterRoleToggle({ modo, onChange, disabled = false }) {
  const indiceActivo = OPCIONES.findIndex((o) => o.id === modo);

  const handleKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const direccion = e.key === "ArrowRight" ? 1 : -1;
    const siguiente = OPCIONES[(indiceActivo + direccion + OPCIONES.length) % OPCIONES.length];
    onChange(siguiente.id);
    document.getElementById(`register-tab-${siguiente.id}`)?.focus();
  };

  return (
    <div className="auth-stagger">
      <div
        role="tablist"
        aria-label="Tipo de cuenta"
        onKeyDown={handleKeyDown}
        className="relative grid grid-cols-2 rounded-2xl border border-brand-deep/10 bg-brand-bg p-1.5"
      >
        <span
          aria-hidden="true"
          className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-brand-deep shadow-md transition-transform duration-300 ease-out ${
            modo === MODO_GARAGE ? "translate-x-full" : "translate-x-0"
          }`}
        />
        {OPCIONES.map((opcion) => {
          const Icono = opcion.icono;
          const activo = opcion.id === modo;
          return (
            <button
              key={opcion.id}
              id={`register-tab-${opcion.id}`}
              role="tab"
              aria-selected={activo}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opcion.id)}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-display font-bold text-sm sm:text-base transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                activo ? "text-white" : "text-brand-muted hover:text-brand-warm"
              }`}
            >
              <Icono size={20} aria-hidden="true" />
              <span>{opcion.etiqueta}</span>
            </button>
          );
        })}
      </div>
      <p
        className="flex items-center justify-center gap-2 text-sm leading-none text-brand-muted"
        style={{ marginTop: "1.25rem" }}
        aria-live="polite"
      >
        <span className="h-1 w-1 rounded-full bg-brand-blue/60 shrink-0" aria-hidden="true" />
        {modo === MODO_EMPRESA
          ? "Gestioná la flota y las cocheras de tu empresa."
          : "Publicá tus garages y aparecé en el mapa de empresas."}
      </p>
    </div>
  );
}
