import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

function SuperadminDashboardBoton({ icono, titulo, descripcion, onClick }) {
  const cardRef = useRef(null);
  const bgIconRef = useRef(null);

  const { contextSafe } = useGSAP({ scope: cardRef });

  const onMouseEnter = contextSafe(() => {
    if (!cardRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(cardRef.current, {
      y: reduced ? 0 : -6,
      backgroundColor: "#1E2A45",
      boxShadow: "0 16px 32px rgba(15, 26, 46, 0.2)",
      duration: reduced ? 0 : 0.3,
      ease: "power2.out",
    });

    if (bgIconRef.current) {
      gsap.to(bgIconRef.current, {
        scale: reduced ? 1 : 1.15,
        rotation: reduced ? 0 : -8,
        opacity: 0.12,
        duration: reduced ? 0 : 0.4,
        ease: "power2.out",
      });
    }
  });

  const onMouseLeave = contextSafe(() => {
    if (!cardRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(cardRef.current, {
      y: 0,
      backgroundColor: "#1A2744",
      boxShadow: "0 0px 0px rgba(0, 0, 0, 0)",
      duration: reduced ? 0 : 0.25,
      ease: "power2.inOut",
    });

    if (bgIconRef.current) {
      gsap.to(bgIconRef.current, {
        scale: 1,
        rotation: 0,
        opacity: 0.06,
        duration: reduced ? 0 : 0.3,
        ease: "power2.inOut",
      });
    }
  });

  return (
    <div
      ref={cardRef}
      className="superadmin-dashboard-card"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      {icono && <div className="superadmin-dashboard-icon">{icono}</div>}

      <div className="superadmin-dashboard-card-content">
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
      </div>

      {icono && (
        <div ref={bgIconRef} className="superadmin-dashboard-icon-bg" aria-hidden="true">
          {icono}
        </div>
      )}
    </div>
  );
}

export default SuperadminDashboardBoton;
