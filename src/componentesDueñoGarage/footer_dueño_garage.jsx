import { Building2, CirclePlus, ClipboardList } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./footer_dueño_garage.css";

const ITEMS = [
  { label: "Garages", path: "/duenio-garage/dashboard", icon: <Building2 size={24} /> },
  { label: "Crear", path: "/duenio-garage/crear-garage", icon: <CirclePlus size={24} /> },
  { label: "Tratos", path: "/duenio-garage/tratos", icon: <ClipboardList size={24} /> },
];

function FooterDueñoGarage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeIndex = Math.max(ITEMS.findIndex((item) => item.path === pathname), 0);

  return (
    <footer
      className="duenio-footer"
      style={{ "--duenio-footer-offset": `${activeIndex * 100}%` }}
      aria-label="Navegacion del dueño de garage"
    >
      <span className="duenio-footer-indicator" aria-hidden="true" />
      {ITEMS.map((item) => (
        <button
          key={item.path}
          className={`duenio-footer-item${pathname === item.path ? " is-active" : ""}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </footer>
  );
}

export default FooterDueñoGarage;
