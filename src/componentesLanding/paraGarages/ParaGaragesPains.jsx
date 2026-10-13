import { useRef } from "react";
import { MessageCircle, EyeOff, ParkingSquare, Sheet } from "lucide-react";
import useSectionReveal from "./useSectionReveal";

const PAINS = [
  {
    icon: ParkingSquare,
    title: "Cocheras vacías",
    desc: "Espacio ocioso que no genera ingresos mientras las empresas de la zona no encuentran dónde estacionar.",
  },
  {
    icon: MessageCircle,
    title: "Acuerdos en WhatsApp y papel",
    desc: "Cantidades, precios y cambios que se pierden entre mensajes y no quedan registrados.",
  },
  {
    icon: EyeOff,
    title: "Sin visibilidad real",
    desc: "No sabés cuánto se usa cada garage ni cuánto generó cada empresa el mes pasado.",
  },
  {
    icon: Sheet,
    title: "Cobros y reportes manuales",
    desc: "Armar números en una planilla cada mes, sin respaldo ni detalle por reserva.",
  },
];

export default function ParaGaragesPains() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section ref={container} className="relative z-10 bg-transparent px-6 py-20 content-visibility-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="pg-header mb-6 text-brand-warm">
            Lo que hoy te cuesta plata <br className="hidden md:block" /> (y tiempo)
          </h2>
        </div>

        <ul className="pg-item mx-auto max-w-3xl divide-y divide-brand-deep/10">
          {PAINS.map((pain) => {
            const Icon = pain.icon;
            return (
              <li
                key={pain.title}
                className="flex items-start gap-4 py-6 first:pt-0 last:pb-0 sm:gap-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[1.15rem] font-bold tracking-tight text-brand-warm">
                    {pain.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-muted">{pain.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 flex justify-center">
          <p className="pg-item max-w-2xl text-center text-brand-muted">
            SmartLot convierte ese caos en un panel con reglas claras: tu garage, tus precios, tus decisiones.
          </p>
        </div>
      </div>
    </section>
  );
}
