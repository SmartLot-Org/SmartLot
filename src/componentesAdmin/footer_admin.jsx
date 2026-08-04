import "./footer_admin.css";
import {
  House,
  CarFront,
  UsersRound,
  ChartBarDecreasing,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFooterCompacto } from "../hooks/useFooterCompacto";
import FooterBotton from "./admin_dashboard_boton_footer";

const FOOTER_STORAGE_KEY = "smartlot-footer-admin-active-index";

const FOOTER_ITEMS = [
  {
    titulo: "INICIO",
    path: "/admin_dashboard",
    icono: <House size={28} />,
  },
  {
    titulo: "GARAGE",
    path: "/gestion_garages",
    icono: <CarFront size={28} />,
  },
  {
    titulo: "GESTION",
    path: "/gestion_de_empleados",
    icono: <UsersRound size={28} />,
  },
  {
    titulo: "PANEL",
    path: "/admin_panel_de_control",
    icono: <ChartBarDecreasing size={28} />,
  },
  {
    titulo: "PAGOS",
    path: "/admin_pagos",
    icono: <CreditCard size={28} />,
  },
];

const obtenerIndiceGuardado = (fallback) => {
  const guardado = Number(sessionStorage.getItem(FOOTER_STORAGE_KEY));
  return Number.isInteger(guardado) && guardado >= 0 && guardado < FOOTER_ITEMS.length
    ? guardado
    : fallback;
};

function FooterAdmin() {
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
      className={`footer-admin${compacto ? " footer-compacto" : ""}`}
      style={{ "--footer-active-offset": activeOffset, "--footer-items": FOOTER_ITEMS.length }}
      aria-label="Navegacion principal del administrador"
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

export default FooterAdmin;
