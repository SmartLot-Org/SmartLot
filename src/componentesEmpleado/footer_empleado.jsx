import "./footer_empleado.css";
import {
  House,
  BookCheck,
  ClipboardClock,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFooterCompacto } from "../hooks/useFooterCompacto";
import FooterBottonEmpleado from "./boton_footer_empleado";

const FOOTER_STORAGE_KEY = "smartlot-footer-active-index";

const FOOTER_ITEMS = [
  {
    titulo: "INICIO",
    path: "/empleados_dashboard",
    icono: <House size={28} />,
  },
  {
    titulo: "RESERVA",
    path: "/nueva_reserva",
    icono: <BookCheck size={28} />,
  },
  {
    titulo: "HISTORIAL",
    path: "/historial_reserva",
    icono: <ClipboardClock size={28} />,
  },
  {
    titulo: "PERFIL",
    path: "/perfil_empleado",
    icono: <UserRound size={28} />,
  },
];

const obtenerIndiceGuardado = (fallback) => {
  const guardado = Number(sessionStorage.getItem(FOOTER_STORAGE_KEY));
  return Number.isInteger(guardado) && guardado >= 0 && guardado < FOOTER_ITEMS.length
    ? guardado
    : fallback;
};

function FooterEmpleado() {
  const navigate = useNavigate();
  const location = useLocation();
  const compacto = useFooterCompacto();

  const isPathActive = (path) => location.pathname === path;
  const activeIndex = Math.max(
    FOOTER_ITEMS.findIndex((item) => isPathActive(item.path)),
    0
  );
  const [visualIndex, setVisualIndex] = useState(() => obtenerIndiceGuardado(activeIndex));
  const activeOffset = `${visualIndex * 100}%`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setVisualIndex(activeIndex);
      sessionStorage.setItem(FOOTER_STORAGE_KEY, String(activeIndex));
    });

    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  return (
    <footer
      className={`footer-empleado${compacto ? " footer-compacto" : ""}`}
      style={{ "--footer-active-offset": activeOffset }}
      aria-label="Navegación principal del empleado"
    >
      <span className="footer-active-indicator" aria-hidden="true" />
      {FOOTER_ITEMS.map((item) => (
        <FooterBottonEmpleado
          key={item.path}
          titulo={item.titulo}
          icono={item.icono}
          onClick={() => navigate(item.path)}
          isActive={isPathActive(item.path)}
        />
      ))}
    </footer>
  );
}

export default FooterEmpleado;
