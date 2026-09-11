import { useRef } from "react";
import { MapPinned, Inbox, LineChart } from "lucide-react";
import useSectionReveal from "./useSectionReveal";

const STEPS = [
  {
    n: "01",
    icon: MapPinned,
    title: "Cargá tu garage",
    desc: "Nombre, ubicación con mapa, niveles, horarios, días y capacidad. Definí cuántas plazas destinás a reservas y cuántas a uso libre. En minutos ya está publicado para las empresas.",
  },
  {
    n: "02",
    icon: Inbox,
    title: "Recibí solicitudes de empresas",
    desc: "Las empresas piden cocheras para sus equipos. Ves quién pide, para qué sede, cuántas plazas y con qué modalidad de pago. Aceptás o rechazás vos.",
  },
  {
    n: "03",
    icon: LineChart,
    title: "Gestioná y cobrá por uso",
    desc: "Cada trato activo queda registrado. Seguí la ocupación, los consumos por reserva y exportá importes por empresa y período en PDF o Excel.",
  },
];

export default function ParaGaragesSteps() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section ref={container} className="relative z-10 bg-transparent px-6 py-20 content-visibility-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="pg-header mb-3 block text-sm font-semibold tracking-[0.2em] text-brand-navy uppercase">
            Cómo funciona
          </span>
          <h2 className="pg-header mb-4 text-brand-warm">
            De plaza vacía a trato activo <br className="hidden md:block" /> en 3 pasos
          </h2>
          <p className="pg-header max-w-2xl text-brand-muted">
            Sin hardware, sin instalaciones complejas y sin cambiar tu operación diaria.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="pg-item glass-card flex flex-col rounded-[1.5rem] p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="font-display text-3xl font-black text-brand-navy/15 tabular-nums">
                    {step.n}
                  </span>
                </div>
                <h3 className="mb-2 text-[1.2rem] font-bold tracking-tight text-brand-warm">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-muted">{step.desc}</p>
              </li>
            );
          })}
        </ol>

        <div className="pg-item mt-10 text-center">
          <a
            href="#funcionalidades"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand-navy/10 bg-white/70 px-5 py-2.5 text-sm font-semibold text-brand-muted transition-colors hover:border-[#93C5FD] hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          >
            Ver el panel en detalle
          </a>
        </div>
      </div>
    </section>
  );
}
