import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

function DashboardBoton({ icono, titulo, descripcion, onClick }) {
  const cardRef = useRef(null);
  const bgIconRef = useRef(null);

  const { contextSafe } = useGSAP({ scope: cardRef });

  // Animación coordinada de alto rendimiento (GPU) en el Hover
  const onMouseEnter = contextSafe(() => {
    if (!cardRef.current) return;
    // Elevación de la tarjeta
    gsap.to(cardRef.current, {
      y: -6,
      backgroundColor: "#E2EEFF", // Un azul ligeramente más vivo e interactivo al posarse
      boxShadow: "0 16px 32px rgba(25, 28, 30, 0.08)",
      duration: 0.3,
      ease: "power2.out",
    });

    // Efecto dinámico en el icono gigante gris del fondo
    if (bgIconRef.current) {
      gsap.to(bgIconRef.current, {
        scale: 1.15,
        rotation: -8,
        opacity: 0.15, // Se vuelve ligeramente más visible
        duration: 0.4,
        ease: "back.out(1.4)",
      });
    }
  });

  const onMouseLeave = contextSafe(() => {
    if (!cardRef.current) return;
    // Retorno al estado inicial limpio
    gsap.to(cardRef.current, {
      y: 0,
      backgroundColor: "#DBEAFE",
      boxShadow: "0 0px 0px rgba(0, 0, 0, 0)",
      duration: 0.25,
      ease: "power2.inOut",
    });

    if (bgIconRef.current) {
      gsap.to(bgIconRef.current, {
        scale: 1,
        rotation: 0,
        opacity: 0.08, // Vuelve a su estado sutil de marca de agua
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  });

  return (
    <div
      ref={cardRef}
      className="dashboard-card"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* 1. Icono pequeño superior izquierdo con fondo blanco */}
      {icono && <div className="dashboard-icon">{icono}</div>}
      
      {/* Contenedor de Textos */}
      <div className="dashboard-card-content">
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
      </div>

      {/* 2. ICONO GIGANTE GRIS EN EL LADO DERECHO (Marca de agua) */}
      {icono && (
        <div ref={bgIconRef} className="dashboard-icon-bg" aria-hidden="true">
          {icono}
        </div>
      )}
    </div>
  );
}

export default DashboardBoton;