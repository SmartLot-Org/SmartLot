import { useState, useRef } from "react";
import { ChevronDown, History, Clock, UserRound } from "lucide-react";
import gsap from "gsap";
import EmptyState from "./EmptyState";

import "./AuditoriaPanel.css";

const formatearFechaAuditoria = (valor) => {
  if (!valor) return "Sin fecha";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
};

const AuditoriaPanel = ({
  titulo = "Auditoría",
  descripcion = "Últimos movimientos registrados.",
  eventos = [],
  loading = false,
  maxItems = 10,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const animatingRef = useRef(false);

  const toggleOpen = () => {
    if (animatingRef.current || !contentRef.current) return;

    if (isOpen) {
      animatingRef.current = true;
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          setIsOpen(false);
          animatingRef.current = false;
        },
      });
    } else {
      animatingRef.current = true;
      const el = contentRef.current;
      gsap.set(el, { height: "auto", opacity: 0, display: "block" });
      const h = el.scrollHeight;
      gsap.set(el, { height: 0, opacity: 0 });
      gsap.to(el, {
        height: h,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(el, { height: "auto" });
          setIsOpen(true);
          animatingRef.current = false;
        },
      });
    }
  };

  return (
    <section className="auditoria-panel-compartido">
      <button
        type="button"
        className="auditoria-header-compartido"
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <div>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>
        <div className="auditoria-header-right">
          <History size={20} />
          <ChevronDown
            size={18}
            className={`auditoria-chevron ${isOpen ? "rotated" : ""}`}
          />
        </div>
      </button>

      <div
        ref={contentRef}
        className="auditoria-collapse-content"
        style={{ overflow: "hidden", height: 0, opacity: 0 }}
      >
        {loading ? (
          <p className="auditoria-empty-msg">Cargando auditoría...</p>
        ) : eventos.length === 0 ? (
          <EmptyState
            size="sm"
            icon={History}
            title="Todavía no hay movimientos registrados."
            description="Las acciones sobre esta sección van a quedar registradas acá."
          />
        ) : (
          <div className="auditoria-listado">
            {eventos.slice(0, maxItems).map((evento) => (
              <article className="auditoria-item" key={evento.id}>
                <span className={`auditoria-badge ${evento.clase}`}>{evento.accion}</span>
                <div className="auditoria-detalle">
                  <h3>{evento.entidad}</h3>
                  <p>
                    <UserRound size={13} /> {evento.actor}
                  </p>
                </div>
                <div className="auditoria-fecha">
                  <Clock size={13} />
                  <span>{formatearFechaAuditoria(evento.fecha)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AuditoriaPanel;
