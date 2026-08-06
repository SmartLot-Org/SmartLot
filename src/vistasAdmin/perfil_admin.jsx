import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, ShieldAlert, LogOut } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Header from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import { useAuth } from "../contexts/useAuth";
import { obtenerSuperadminBackup, eliminarSuperadminBackup, eliminarUsuarioImpersonado } from "../helpers/superadminSession";
import { clearCache } from "../cache/cacheStore";
import apiClient from "../api/client";
import "./perfil_admin.css";

gsap.registerPlugin(useGSAP);

export default function PerfilAdmin() {
  const navigate = useNavigate();
  const mainScopeRef = useRef(null);
  const { usuario, setUsuario, loading, setRoleTransition } = useAuth();

  const [personalData, setPersonalData] = useState({
    nombre: "", apellido: "", email: "", telefono: ""
  });

  useEffect(() => {
    if (usuario) {
      const infoUsuario = usuario.datos || usuario.usuario || usuario;
      setPersonalData({
        nombre: infoUsuario.nombre || usuario.nombre || "",
        apellido: infoUsuario.apellido || usuario.apellido || "",
        email: infoUsuario.email || usuario.email || "",
        telefono: infoUsuario.telefono || usuario.telefono || ""
      });
    }
  }, [usuario]);

  useGSAP(() => {
    if (loading || !usuario) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".animate-back-admin", { opacity: 0, x: -15 }, { opacity: 1, x: 0, duration: 0.4 })
      .fromTo(".textosTitulosPerfilAdmin", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
      .fromTo(".admin-bento-card-view", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, "-=0.3")
      .fromTo(".action-buttons-group-admin", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2");
  }, { dependencies: [loading, usuario], scope: mainScopeRef });

  const handleCerrarSesion = async () => {
    const superadminBackup = obtenerSuperadminBackup();

    if (superadminBackup) {
      const response = await apiClient.post('/api/usuario/stop-impersonate');
      eliminarSuperadminBackup();
      eliminarUsuarioImpersonado();
      clearCache();
      setRoleTransition(true);
      setUsuario(response.data?.usuario || superadminBackup);
      navigate('/superadmin_dashboard', { replace: true });
      return;
    }

    try {
      await apiClient.post('/api/usuario/logout');
    } catch (err) {}
    setUsuario(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="admin-profile-loading-screen">
        <p>Cargando sesión segura...</p>
      </div>
    );
  }

  return (
    <div className="admin-scope-root">
      <div className="admin-profile-layout-root">
        <Header />
        <div className="admin-profile-main-container" ref={mainScopeRef}>
          <div className="admin-profile-inner-content">

            <div className="top-navigation-bar-admin">
              <div className="animate-back-admin">
                <button
                  className="boton-back-admin"
                  onClick={() => navigate("/admin_dashboard")}
                  aria-label="Volver al panel"
                  type="button"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
              <header className="textosTitulosPerfilAdmin">
                <h1>Mi Perfil</h1>
                <div className="admin-role-badge">
                  <Shield size={13} />
                  <span>Administrador de Sede</span>
                </div>
              </header>
            </div>

            <div className="admin-bento-grid-wrapper">
              <div className="admin-bento-card-view info-personal-wrapper-card">
                <InfoPersonalDisplay data={personalData} />
              </div>

              <div className="admin-bento-card-view security-system-status-card">
                <div className="security-card-header">
                  <div className="security-badge-icon">
                    <ShieldAlert size={20} />
                  </div>
                  <h3>Estado de Credenciales</h3>
                </div>

                <div className="security-status-indicators">
                  <div className="indicator-row">
                    <span className="indicator-pulse-dot"></span>
                    <div className="indicator-text-block">
                      <p className="ind-label">Nivel de Acceso</p>
                      <p className="ind-val text-brand-blue-accent">Privilegios Críticos Activos</p>
                    </div>
                  </div>
                  <div className="indicator-row">
                    <div className="indicator-text-block">
                      <p className="ind-label">Consola de Control</p>
                      <p className="ind-val">Gestión de Garages & Empleados</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons-group-admin">
              <button
                type="button"
                className="btn-secondary-action-admin"
                onClick={handleCerrarSesion}
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>
        <FooterAdmin />
      </div>
    </div>
  );
}

function InfoPersonalDisplay({ data }) {
  const fields = [
    { label: "Nombre", value: `${data.nombre} ${data.apellido}` },
    { label: "Email", value: data.email },
    { label: "Teléfono", value: data.telefono },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 1.25rem", color: "#1e293b", textAlign: "left", fontSize: "1.05rem", fontWeight: 700 }}>
        Información Personal
      </h3>
      {fields.map((f) => (
        <div
          key={f.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 0",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase" }}>
            {f.label}
          </span>
          <span style={{ color: "#1e293b", fontWeight: 600, fontSize: "0.95rem" }}>
            {f.value || "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
