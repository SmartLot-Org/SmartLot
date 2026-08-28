import "./footer_superadmin.css";
import {
  House,
  Building2,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFooterCompacto } from "../hooks/useFooterCompacto";
import FooterBotton from "./superadmin_dashboard_boton_footer";

const FOOTER_STORAGE_KEY = "smartlot-footer-superadmin-active-index";

const FOOTER_ITEMS = [
  {
    titulo: "INICIO",
    path: "/superadmin_dashboard",
    icono: <House size={28} />,
  },
  {
    titulo: "EMPRESAS",
    path: "/superadmin/gestion_empresas",
    icono: <Building2 size={28} />,
  },
  {
    titulo: "USUARIOS",
    path: "/superadmin/gestion_usuarios",
    icono: <Users size={28} />,
  },
  {
    titulo: "CONFLICTOS",
    path: "/superadmin/conflictos",
    icono: <MessageSquareWarning size={28} />,
  },
];

const obtenerIndiceGuardado = (fallback) => {
  const guardado = Number(sessionStorage.getItem(FOOTER_STORAGE_KEY));
  return Number.isInteger(guardado) && guardado >= 0 && guardado < FOOTER_ITEMS.length
    ? guardado
    : fallback;
};

function FooterSuperadmin() {
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
      className={`footer-superadmin${compacto ? " footer-compacto" : ""}`}
      style={{
        "--footer-active-offset": activeOffset,
        "--footer-items": FOOTER_ITEMS.length,
      }}
      aria-label="Navegacion principal del superadministrador"
    >
      <span className="footer-active-indicator" aria-hidden="true" />
      {FOOTER_ITEMS.map((item) => (
        <FooterBotton
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

export default FooterSuperadmin;
