import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CirclePlus, UserPlus } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import "./gestion_sedes.css";
import Header from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { SedesGetAll } from "../servicies/API_Sede";
import { useAuth } from "../contexts/useAuth";

gsap.registerPlugin(useGSAP);

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const SedesAdminSkeletonCard = () => (
  <div className="sede-admin-card sede-admin-card-skeleton">
    <span className="skl-line skl-sede-icon" />
    <div className="skl-sede-body">
      <span className="skl-line skl-sede-name" />
      <span className="skl-line skl-sede-desc" />
      <span className="skl-line skl-sede-ubicacion" />
    </div>
  </div>
);

function GestionSedesAdmin() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const empresaAdmin = Number(usuario?.id_empresa);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await SedesGetAll();
        if (!mounted) return;
        if (res.respuesta) {
          const todas = obtenerListado(res.datos);
          setSedes(todas.filter((s) => Number(s.id_empresa) === empresaAdmin));
        } else {
          setError("No se pudieron cargar las sedes.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [empresaAdmin]);

  useGSAP(() => {
    if (!loading && sedes.length > 0) {
      gsap.fromTo(
        ".sede-admin-card",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, sedes]);

  return (
    <div className="gestion-sedes-admin">
      <Header />
      <main className="sedes-admin-main">
        <div className="sedes-admin-top">
          <button className="boton-back-admin" onClick={() => navigate("/admin_dashboard")} aria-label="Volver al dashboard">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p>PANEL DE ADMINISTRACIÓN</p>
            <h1>Gestión de Sedes</h1>
          </div>
        </div>

        {loading ? (
          <div className="sedes-admin-stats-skeleton">
            <div className="stats-sedes-card-skeleton">
              <span className="skl-line skl-stat-label" />
              <span className="skl-line skl-stat-valor" />
            </div>
          </div>
        ) : (
          <div className="sedes-stats-admin">
            <div className="stats-sedes-card">
              <div className="stats-sedes-header">
                <h4>Total sedes</h4>
                <MapPin size={22} />
              </div>
              <h2>{sedes.length}</h2>
              <p>Sedes registradas de tu empresa</p>
            </div>
          </div>
        )}

        <div className="sedes-admin-toolbar">
          <BotonGenerico className="btn-nueva-sede-admin" onClick={() => navigate("/agregar_sede")}>
            <CirclePlus size={20} />
            <span>Nueva sede</span>
          </BotonGenerico>
        </div>

        {loading ? (
          <div className="sedes-admin-grid">
            {Array.from({ length: 4 }).map((_, i) => <SedesAdminSkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="sedes-admin-feedback-error">{error}</p>
        ) : sedes.length === 0 ? (
          <p className="sedes-admin-feedback">
            Tu empresa todavía no tiene sedes registradas. Creá la primera con el botón "Nueva sede".
          </p>
        ) : (
          <div className="sedes-admin-grid">
            {sedes.map((sede) => (
              <article key={sede.id} className="sede-admin-card">
                <div className="sede-admin-card-header">
                  <div className="sede-admin-icon">
                    <MapPin size={22} />
                  </div>
                  <div className="sede-admin-info">
                    <h3>{sede.nombre}</h3>
                    <p className="sede-admin-descripcion">{sede.descripcion || "Sin descripción"}</p>
                    {sede.ubicacion && (
                      <p className="sede-admin-ubicacion">
                        <MapPin size={14} />
                        {sede.ubicacion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="sede-admin-actions">
                  <button
                    className="btn-crear-admin-sede"
                    onClick={() => navigate("/agregar_admin_sede", { state: { sedeId: sede.id, sedeNombre: sede.nombre } })}
                  >
                    <UserPlus size={16} />
                    <span>Crear administrador</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <FooterAdmin />
    </div>
  );
}

export default GestionSedesAdmin;
