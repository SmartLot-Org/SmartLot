import { Building2, CirclePlus, ClipboardList, HandCoins } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFooterCompacto } from "../hooks/useFooterCompacto";
import "./footer_dueño_garage.css";

const ITEMS = [
  { label: "Garages", path: "/duenio-garage/dashboard", icon: <Building2 size={24} /> },
  { label: "Crear", path: "/duenio-garage/crear-garage", icon: <CirclePlus size={24} /> },
  { label: "Tratos", path: "/duenio-garage/tratos", icon: <ClipboardList size={24} /> },
  { label: "Por cobrar", path: "/duenio-garage/cuentas-por-cobrar", icon: <HandCoins size={24} /> },
];

function FooterDueñoGarage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const compacto = useFooterCompacto();
  const activeIndex = Math.max(ITEMS.findIndex((item) => item.path === pathname), 0);
  const [visualIndex, setVisualIndex] = useState(activeIndex);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisualIndex(activeIndex));
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  return (
    <footer
      className={`duenio-footer${compacto ? " footer-compacto" : ""}`}
      style={{ "--duenio-footer-offset": `${visualIndex * 100}%`, "--duenio-footer-items": ITEMS.length }}
      aria-label="Navegacion del dueño de garage"
    >
      <span className="duenio-footer-indicator" aria-hidden="true" />
      {ITEMS.map((item) => (
        <button
          key={item.path}
          className={`duenio-footer-item${pathname === item.path ? " is-active" : ""}`}
          onClick={() => navigate(item.path)}
          aria-current={pathname === item.path ? "page" : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </footer>
  );
}

export default FooterDueñoGarage;
