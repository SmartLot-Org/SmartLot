import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  MapPin,
  Car,
  MessageSquareWarning,
  CalendarDays,
  Database,
  CreditCard,
  Mail,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import "./superadmin_dashboard.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import SuperadminDashboardBoton from "../componentesSuperadmin/superadmin_dashboard_boton";
import { UsuariosGetAll } from "../servicies/API_Usuario";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { SedesGetAll } from "../servicies/API_Sede";
import { GaragesGetAll } from "../servicies/API_Garage";

gsap.registerPlugin(useGSAP);

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const StatCard = ({ icono, label, valor, color }) => (
  <div className="superadmin-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="superadmin-stat-header">
      <span className="superadmin-stat-label">{label}</span>
      <span className="superadmin-stat-icon" style={{ color }}>
        {icono}
      </span>
    </div>
    <span className="superadmin-stat-valor">{valor}</span>
  </div>
);

const StatSkeleton = () => (
  <div className="superadmin-stat-card superadmin-stat-skeleton">
    <div className="superadmin-stat-header">
      <span className="skeleton-line skeleton-stat-label" />
      <span className="skeleton-stat-icon skeleton-icon" />
    </div>
    <span className="skeleton-line skeleton-stat-valor" />
  </div>
);

function SuperadminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ usuarios: 0, empresas: 0, sedes: 0, garages: 0 });

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [usuariosRes, empresasRes, sedesRes, garagesRes] = await Promise.all([
          UsuariosGetAll(),
          EmpresasGetAll(),
          SedesGetAll(),
          GaragesGetAll(),
        ]);

        if (!mounted) return;

        setStats({
          usuarios: usuariosRes.respuesta ? obtenerListado(usuariosRes.datos).length : 0,
          empresas: empresasRes.respuesta ? obtenerListado(empresasRes.datos).length : 0,
          sedes: sedesRes.respuesta ? obtenerListado(sedesRes.datos).length : 0,
          garages: garagesRes.respuesta ? obtenerListado(garagesRes.datos).length : 0,
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();
    return () => { mounted = false; };
  }, []);

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.6 } });
      tl.from(".superadmin-stagger-title", { y: 24, opacity: 0 })
        .from(".superadmin-stagger-stat", { y: 18, opacity: 0, stagger: 0.08 }, "-=0.3")
        .from(".superadmin-stagger-card", { y: 24, opacity: 0, stagger: 0.1 }, "-=0.3");
    }
  }, { dependencies: [loading] });

  return (
    <>
      <HeaderSuperadmin />
      <div className="superadmin-dashboard">
        {loading ? (
          <>
            <div className="superadmin-dashboard-header">
              <span className="skeleton-line skeleton-title" />
              <span className="skeleton-line skeleton-subtitle" />
            </div>
            <div className="superadmin-stats-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatSkeleton key={i} />
              ))}
            </div>
            <div className="superadmin-dashboard-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="superadmin-dashboard-card superadmin-dashboard-card-skeleton" key={i}>
                  <span className="skeleton-line skeleton-card-icon" />
                  <span className="skeleton-line skeleton-card-title" />
                  <span className="skeleton-line skeleton-card-desc" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="superadmin-dashboard-header superadmin-dashboard-header--with-cache superadmin-stagger-title">
              <div className="superadmin-dashboard-title">
                <h1>Panel de Control</h1>
                <p>Visión general del sistema SmartLot</p>
              </div>

              <button
                type="button"
                className="superadmin-cache-link"
                onClick={() => navigate("/superadmin/cache")}
              >
                <Database size={17} />
                Caché
              </button>
            </div>

            <div className="superadmin-stats-grid">
              <div className="superadmin-stagger-stat">
                <StatCard icono={<Users size={24} />} label="Usuarios" valor={stats.usuarios} color="#3B82F6" />
              </div>
              <div className="superadmin-stagger-stat">
                <StatCard icono={<Building2 size={24} />} label="Empresas" valor={stats.empresas} color="#F59E0B" />
              </div>
              <div className="superadmin-stagger-stat">
                <StatCard icono={<MapPin size={24} />} label="Sedes" valor={stats.sedes} color="#10B981" />
              </div>
              <div className="superadmin-stagger-stat">
                <StatCard icono={<Car size={24} />} label="Garages" valor={stats.garages} color="#8B5CF6" />
              </div>
            </div>

            <h2 className="superadmin-acciones-titulo superadmin-stagger-title">Acciones Rápidas</h2>

            <div className="superadmin-dashboard-grid">
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<Users />}
                  titulo="Gestión de Usuarios"
                  descripcion="Administrar todos los roles del sistema"
                  onClick={() => navigate("/superadmin/gestion_usuarios")}
                />
              </div>
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<Building2 />}
                  titulo="Empresas y Sedes"
                  descripcion="Gestionar empresas y consultar sus sedes"
                  onClick={() => navigate("/superadmin/gestion_empresas")}
                />
              </div>
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<Car />}
                  titulo="Gestión de Garages"
                  descripcion="Administrar todos los garages del sistema"
                  onClick={() => navigate("/superadmin/gestion_garages")}
                />
              </div>
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<CalendarDays />}
                  titulo="Reservas del Sistema"
                  descripcion="Ver todas las reservas con filtros por dia, hora, empresa y sede"
                  onClick={() => navigate("/superadmin/reservas")}
                />
              </div>
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<MessageSquareWarning />}
                  titulo="Conflictos"
                  descripcion="Ver conflictos enviados por administradores"
                  onClick={() => navigate("/superadmin/conflictos")}
                />
              </div>
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<CreditCard />}
                  titulo="Testing Pagos MP"
                  descripcion="Crear preferencias, pagar, verificar estados, webhooks y reembolsos"
                  onClick={() => navigate("/superadmin/pagos-test")}
                />
              </div>
              <div className="superadmin-stagger-card">
                <SuperadminDashboardBoton
                  icono={<Mail />}
                  titulo="Plantillas de Email"
                  descripcion="Editar los correos del sistema con preview en vivo y envío de pruebas"
                  onClick={() => navigate("/superadmin/email-templates")}
                />
              </div>
            </div>

          </>
        )}
      </div>
      <FooterSuperadmin />
    </>
  );
}

export default SuperadminDashboard;
