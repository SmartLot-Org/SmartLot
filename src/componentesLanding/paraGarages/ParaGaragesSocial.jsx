import { useRef } from "react";
import useSectionReveal from "./useSectionReveal";

const CASES = [
  {
    quote:
      "En tres semanas las plazas de la planta baja ya estaban pedidas por dos empresas de la zona.",
    name: "Martín Alegre",
    place: "Garage Recoleta, CABA",
    extra: "2 garages administrados",
  },
  {
    quote:
      "Dejé de pelearme con WhatsApp. Acepto o rechazo desde el celular y queda el trato escrito.",
    name: "Paula Benítez",
    place: "Playas Núñez",
    extra: "1 garage administrado",
  },
  {
    quote:
      "El PDF de consumos me ahorra el cierre de mes. Las empresas ven el mismo número que yo.",
    name: "Diego Funes",
    place: "Estacionamiento Microcentro",
    extra: "3 garages administrados",
  },
];

export default function ParaGaragesSocial() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section ref={container} className="relative z-10 bg-transparent px-6 py-20 content-visibility-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="pg-header mb-3 block text-sm font-semibold tracking-[0.2em] text-brand-navy uppercase">
            Casos
          </span>
          <h2 className="pg-header mb-4 text-brand-warm">Dueños que ya aparecen en el mapa</h2>
          <p className="pg-header max-w-2xl text-brand-muted">
            Relatos de dueños que publicaron sus plazas y empezaron a recibir solicitudes de empresas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CASES.map((item) => (
            <blockquote
              key={item.name}
              className="pg-item glass-card flex flex-col rounded-[1.5rem] p-6 text-left"
            >
              <p className="text-base leading-relaxed text-brand-warm">“{item.quote}”</p>
              <footer className="mt-6">
                <cite className="not-italic">
                  <span className="block font-bold text-brand-warm">{item.name}</span>
                  <span className="mt-1 block text-sm text-brand-muted">
                    {item.place} · {item.extra}
                  </span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
