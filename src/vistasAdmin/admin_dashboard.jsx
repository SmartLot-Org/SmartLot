import "./admin_dashboard.css";
import DashboardBoton from "../componentesAdmin/admin_dashboard_boton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import { UserPlus, Car, SlidersVertical, PersonStanding, WalletCards, Handshake } from "lucide-react";

const DashboardHeaderSkeleton = () => (
  <section className="dashboard-header-skeleton" aria-label="Cargando dashboard">
    <span className="dashboard-skeleton-line dashboard-skeleton-title" />
    <span className="dashboard-skeleton-line dashboard-skeleton-subtitle" />
  </section>
);

const DashboardSkeletonGrid = () => (
  <div className="dashboard-grid" aria-label="Cargando acciones rapidas">
    {Array.from({ length: 5 }).map((_, index) => (
      <article className="dashboard-card dashboard-card-skeleton" key={index}>
        <span className="dashboard-skeleton-icon" />

        <div className="dashboard-card-content">
          <span className="dashboard-skeleton-line dashboard-skeleton-card-title" />
          <span className="dashboard-skeleton-line dashboard-skeleton-card-text" />
        </div>

        <span className="dashboard-skeleton-bg-icon" aria-hidden="true" />
      </article>
    ))}
  </div>
);

function AdminDashboard() {
  const navigate = useNavigate(); // esto sirve para poder navegar a otras paginas
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => { //simula una carga de datos
      setLoading(false); //desactiva el estado de carga después de 600ms
    }, 600);

    return () => window.clearTimeout(timer); //limpia el timer si el componente se desmonta antes de que termine el tiempo
  }, []);

  return (
    <>
      <Header />

      <div className="admin-dashboard">
        {loading ? (
          <DashboardHeaderSkeleton />
        ) : (
          <>
            <h1>Acciones Rápidas</h1>
            <p>Desde aquí puedes acceder a las funciones de mayor uso.</p>
          </>
        )}

        {loading ? (
          <DashboardSkeletonGrid />
        ) : (
          <div className="dashboard-grid">
            <DashboardBoton
              icono={<UserPlus />}
              titulo="Gestión de Usuarios"
              descripcion="Gestionar y agregar nuevos usuarios"
              onClick={() => navigate("/gestion_de_empleados")}
            />

            <DashboardBoton
              icono={<Car />}
              titulo="Gestión de garages"
              descripcion="Gestión y definición de nuevos garages"
              onClick={() => navigate("/gestion_garages")}
            />

            <DashboardBoton
              icono={<SlidersVertical />}
              titulo="Panel de control"
              descripcion="Información de vital importancia"
              onClick={() => navigate("/admin_panel_de_control")}
            />

            <DashboardBoton
              icono={<PersonStanding />}
              titulo="Control de acceso"
              descripcion="Control de entradas y salidas"
              onClick={() => navigate("/control-acceso")}
            />

            <DashboardBoton
              icono={<WalletCards />}
              titulo="Pagos"
              descripcion="Consultá saldos, liquidaciones y movimientos"
              onClick={() => navigate("/admin_pagos")}
            />
            <DashboardBoton icono={<Handshake />} titulo="Tratos con garages" descripcion="Acuerdos de cocheras y precios" onClick={() => navigate('/admin/tratos-garages')} />
          </div>
        )}
      </div>
      <FooterAdmin />
    </>
  );
}

export default AdminDashboard;
