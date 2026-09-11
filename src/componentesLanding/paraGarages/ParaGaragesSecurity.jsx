import { useRef } from "react";
import { ShieldCheck, EyeOff, Gauge, Lock } from "lucide-react";
import useSectionReveal from "./useSectionReveal";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Aprobación en dos pasos",
    desc: "Nada se activa sin tu confirmación: ni un trato nuevo, ni un cambio de cocheras.",
  },
  {
    icon: EyeOff,
    title: "Ocultamiento reversible",
    desc: "Un garage en borrador no aparece para las empresas. Restaurarlo es un clic.",
  },
  {
    icon: Gauge,
    title: "Ocupaciones bajo control operativo",
    desc: "Las ocupaciones las mueve la operación real (reservas y accesos), no se editan a mano.",
  },
  {
    icon: Lock,
    title: "Cuenta protegida",
    desc: "Contraseña con requisitos y datos sensibles de solo lectura. Cada dueño ve solo sus garages.",
  },
];

export default function ParaGaragesSecurity() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section ref={container} className="relative z-10 bg-transparent px-6 py-20 content-visibility-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="pg-header mb-3 block text-sm font-semibold tracking-[0.2em] text-brand-navy uppercase">
            Tranquilidad
          </span>
          <h2 className="pg-header text-brand-warm">Vos decidís qué pasa con tus plazas</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <article
                key={point.title}
                className="pg-item glass-card rounded-[1.5rem] p-6 text-left"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-[1.15rem] font-bold text-brand-warm">{point.title}</h3>
                <p className="text-sm leading-relaxed text-brand-muted">{point.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
