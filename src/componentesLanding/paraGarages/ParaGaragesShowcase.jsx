import { useRef } from "react";
import useSectionReveal from "./useSectionReveal";

const METRICS = [
  { value: "4", label: "Garages propios" },
  { value: "78%", label: "Ocupación media" },
  { value: "12", label: "Tratos vigentes" },
  { value: "260", label: "Capacidad total" },
];

export default function ParaGaragesShowcase() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section ref={container} className="relative z-10 bg-transparent px-6 py-20 content-visibility-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="pg-header mb-3 block text-sm font-semibold tracking-[0.2em] text-brand-navy uppercase">
            Visibilidad total
          </span>
          <h2 className="pg-header mb-4 text-brand-warm">Tus números, siempre a mano</h2>
          <p className="pg-header max-w-2xl text-brand-muted">
            Entrá y sabé, sin abrir una planilla, cómo está rindiendo cada garage.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {METRICS.map((m) => (
            <article
              key={m.label}
              className="pg-item glass-card rounded-[1.5rem] px-5 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            >
              <p className="font-display text-4xl font-black tracking-tight text-brand-warm tabular-nums md:text-5xl">
                {m.value}
              </p>
              <p className="mt-2 text-xs font-semibold tracking-widest text-brand-muted uppercase">
                {m.label}
              </p>
            </article>
          ))}
        </div>

        <p className="pg-item mt-6 text-center text-xs text-brand-muted/80">
          Datos de ejemplo de un portafolio de dueño. Consumos generados: no representan cobros ni pagos recibidos.
        </p>
      </div>
    </section>
  );
}
