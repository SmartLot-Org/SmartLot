import { useRef } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Filter, FileDown, Building2 } from "lucide-react";
import useSectionReveal from "./useSectionReveal";

const ITEMS = [
  {
    icon: ListChecks,
    title: "Detalle por movimiento",
    desc: "Reserva, tipo de vehículo, fecha y hora, minutos utilizados, tarifa por hora aplicada e importe.",
  },
  {
    icon: Filter,
    title: "Filtros reales",
    desc: "Búsqueda por empresa, sede o garage; filtro por garage propio; período de hasta 24 meses.",
  },
  {
    icon: FileDown,
    title: "Exportación profesional",
    desc: "PDF para presentar y Excel con formato de moneda ARS para analizar.",
  },
  {
    icon: Building2,
    title: "Resumen por empresa",
    desc: "Reservas utilizadas, tiempo total e importe generado, listos para compartir.",
  },
];

const ROWS = [
  { empresa: "Norte Logistics", garage: "Palermo", reservas: 48, importe: "$ 412.300" },
  { empresa: "Atlas Salud", garage: "Recoleta", reservas: 31, importe: "$ 287.150" },
  { empresa: "Andes Tech", garage: "Núñez", reservas: 22, importe: "$ 198.040" },
];

export default function ParaGaragesReports() {
  const container = useRef(null);
  useSectionReveal(container);

  return (
    <section ref={container} className="relative z-10 bg-transparent px-6 py-20 content-visibility-auto">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="pg-header mb-3 block text-sm font-semibold tracking-[0.2em] text-brand-navy uppercase">
            Transparencia
          </span>
          <h2 className="pg-header mb-4 text-brand-warm">El detalle, reserva por reserva</h2>
          <p className="pg-header max-w-2xl text-brand-muted">
            Cada consumo queda registrado para que puedas revisar y respaldar lo generado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <ul className="flex flex-col gap-4">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="pg-item glass-card flex gap-4 rounded-[1.25rem] p-5 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-base font-bold text-brand-warm">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-brand-muted">{item.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="pg-item overflow-x-auto rounded-[1.5rem] border border-brand-navy/10 bg-white/70 shadow-[0_8px_30px_rgba(12,30,63,0.06)]">
            <div className="flex items-center justify-between border-b border-brand-navy/10 px-5 py-3">
              <p className="text-sm font-bold text-brand-warm">Consumos del mes</p>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold tracking-widest text-brand-navy uppercase">
                Ejemplo
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Tabla de ejemplo de consumos generados por empresa, garage, reservas e importe
              </caption>
              <thead className="text-xs tracking-wider text-brand-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-3 py-3 font-semibold">Garage</th>
                  <th className="px-3 py-3 font-semibold">Reservas</th>
                  <th className="px-5 py-3 font-semibold">Importe</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.empresa} className="border-t border-brand-navy/10">
                    <td className="px-5 py-3 font-semibold text-brand-warm">{row.empresa}</td>
                    <td className="px-3 py-3 text-brand-muted">{row.garage}</td>
                    <td className="px-3 py-3 tabular-nums text-brand-muted">{row.reservas}</td>
                    <td className="px-5 py-3 font-bold tabular-nums text-brand-warm">{row.importe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="pg-item mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Ver el detalle en la app
          </Link>
        </p>
      </div>
    </section>
  );
}
