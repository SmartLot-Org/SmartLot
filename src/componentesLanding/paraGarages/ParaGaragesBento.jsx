import { useRef } from "react";
import { LayoutGrid, MapPinned, Handshake, FileSpreadsheet } from "lucide-react";
import useSectionReveal from "./useSectionReveal";

const FEATURES = [
  {
    title: "Portafolio con estado real",
    icon: LayoutGrid,
    desc: "Tus garages en una sola pantalla: operativos, cerrados o en borrador. Ocupación actual, capacidad total y ocupación media del portafolio.",
    size: "md:col-span-2 md:row-span-2",
    badge: "Core",
    badgeStyle: "border-brand-navy/15 text-brand-navy bg-white/90",
  },
  {
    title: "Alta con mapa y tus precios",
    icon: MapPinned,
    desc: "Ubicación con autocompletado, horarios, días y tarifas por hora para auto, moto y pickup.",
    size: "md:col-span-2 md:row-span-1",
    badge: null,
    badgeStyle: "",
  },
  {
    title: "Solicitudes con tu OK",
    icon: Handshake,
    desc: "Aceptás o rechazás cada empresa y cada cambio de cocheras. Nada se activa sin tu confirmación.",
    size: "md:col-span-1 md:row-span-1",
    badge: "Control",
    badgeStyle: "border-brand-navy/10 text-brand-navy bg-white/90",
  },
  {
    title: "Consumos y avisos",
    icon: FileSpreadsheet,
    desc: "Importes por reserva, PDF/Excel y notificaciones de cada solicitud.",
    size: "md:col-span-1 md:row-span-1",
    badge: "Export",
    badgeStyle: "border-brand-navy/10 text-brand-navy bg-white/90",
  },
];

export default function ParaGaragesBento() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section
      id="funcionalidades"
      ref={container}
      className="relative z-10 bg-transparent pt-16 pb-8 content-visibility-auto"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative z-20 mb-12 flex flex-col items-center text-center">
          <span className="pg-header mb-3 block text-sm font-semibold tracking-[0.2em] text-brand-navy uppercase">
            Tu panel de dueño
          </span>
          <h2 className="pg-header mb-6 text-brand-warm">
            Todo lo que necesitás para <br className="hidden md:block" /> administrar tus garages
          </h2>
          <p className="pg-header max-w-2xl text-brand-muted">
            Herramientas pensadas para el dueño, no para un equipo de IT.
          </p>
        </div>

        <div className="grid auto-rows-[200px] grid-cols-1 gap-4 md:auto-rows-[260px] md:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className={`pg-item group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(12,30,63,0.08)] glass-card ${f.size}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  {f.badge ? (
                    <span
                      className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase shadow-sm ${f.badgeStyle}`}
                    >
                      {f.badge}
                    </span>
                  ) : null}
                </div>
                <div className="relative z-10 mt-6">
                  <h3 className="mb-1 text-[1.25rem] leading-snug font-bold tracking-tight text-brand-warm">
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-brand-muted">{f.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
