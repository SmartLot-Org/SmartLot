import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Z_INDEX } from "../helpers/zIndex";

const SELECTOR_FOCOABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ModalPortal({ children, onClose, overlayClassName = "" }) {
  const [portalEl] = useState(() => document.createElement("div"));
  const overlayRef = useRef(null);
  const disparadorRef = useRef(null);

  useEffect(() => {
    document.body.appendChild(portalEl);
    document.body.style.overflow = "hidden";
    // El foco vuelve al control que abrió el modal cuando este se cierra.
    disparadorRef.current = document.activeElement;
    return () => {
      document.body.removeChild(portalEl);
      document.body.style.overflow = "";
      disparadorRef.current?.focus?.();
    };
  }, [portalEl]);

  // Foco inicial: el primer control enfocable del modal.
  useEffect(() => {
    overlayRef.current?.querySelector(SELECTOR_FOCOABLES)?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      // Focus trap: Tab/Shift+Tab ciclan dentro del modal.
      const focoables = overlayRef.current?.querySelectorAll(SELECTOR_FOCOABLES);
      if (!focoables?.length) return;
      const primero = focoables[0];
      const ultimo = focoables[focoables.length - 1];
      const activo = document.activeElement;
      const dentro = overlayRef.current.contains(activo);
      if (e.shiftKey) {
        if (!dentro || activo === primero) {
          e.preventDefault();
          ultimo.focus();
        }
      } else if (!dentro || activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={overlayRef}
      className={`modal-portal-overlay ${overlayClassName}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z_INDEX.MODAL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: "20px",
      }}
      onClick={onClose}
    >
      {children}
    </div>,
    portalEl
  );
}

export default ModalPortal;
