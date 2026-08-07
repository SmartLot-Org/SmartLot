import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CirclePlus, MapPinned, BarChart3 } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import "./superadmin_dashboard.css";
import "./superadmin_gestion_garages.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import TarjetaGarage from "../componentesAdmin/tarjeta_garages";
import { GaragesGetAll } from "../servicies/API_Garage";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { TratosGetAll } from "../servicies/API_TratoEmpresaGarage";
import fotoGarage1 from "../Imagenes/Garage1.jpg";
import fotoGarage2 from "../Imagenes/Garage2.jpg";
import fotoGarage3 from "../Imagenes/Garage3.jpg";

gsap.registerPlugin(useGSAP);

const imagenesGarage = [fotoGarage1, fotoGarage2, fotoGarage3];

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.garages)) return datos.garages;
  if (Array.isArray(datos?.value)) return datos.value;
  return [];
};

const obtenerEstadoGarage = (estado) => {
  if (typeof estado === "boolean") return estado ? "Abierto" : "Cerrado";
  if (typeof estado === "number") return estado === 1 ? "Abierto" : "Cerrado";
  if (typeof estado === "string") {
    const estadoNormalizado = estado.toLowerCase();
    return ["true", "activo", "abierto", "1"].includes(estadoNormalizado)
      ? "Abierto"
      : "Cerrado";
  }
  return "Abierto";
};

const obtenerOcupacion = (garage) =>
  Number(garage.ocupacion_reservas || 0) +
  Number(garage.ocupacion_no_reservas || 0);

const obtenerCapacidadPorcentaje = (garage) => {
  const capacidad = Number(garage.capacidad || 0);
  if (capacidad <= 0) return "0%";
  const porcentaje = Math.min(
    100,
    Math.round((obtenerOcupacion(garage) / capacidad) * 100)
  );
  return `${porcentaje}%`;
};

const obtenerIdGarage = (garage, index) =>
  garage.id_garage ?? garage.idGarage ?? garage.id ?? garage._id ?? index;

const GarageSkeletonGrid = () => (
  <div className="contenedor-tarjetas" aria-label="Cargando garages">
    {Array.from({ length: 6 }).map((_, index) => (
      <article className="tarjeta-garage-skeleton" key={index}>
        <div className="skeleton-media">
          <span className="skeleton-pill" />
        </div>
        <div className="skeleton-content">
          <div className="skeleton-header">
            <span className="skeleton-line skeleton-title" />
            <span className="skeleton-button" />
          </div>
          <div className="skeleton-meta">
            <span className="skeleton-line skeleton-meta-item" />
            <span className="skeleton-line skeleton-meta-item skeleton-meta-short" />
          </div>
          <div className="skeleton-capacity">
            <div className="skeleton-capacity-label">
              <span className="skeleton-line skeleton-label" />
              <span className="skeleton-line skeleton-percent" />
            </div>
            <span className="skeleton-bar" />
          </div>
        </div>
      </article>
    ))}
  </div>
);

const GarageStatsSkeleton = () => (
  <section className="stats-container" aria-label="Cargando resumen de garages">
    {Array.from({ length: 2 }).map((_, index) => (
      <div className="stats-card stats-card-skeleton" key={index}>
        <div className="stats-card-content">
          <div className="stats-card-header">
            <span className="skeleton-stat-line skeleton-stat-badge" />
            <span className="skeleton-stat-icon-block" />
          </div>
          <span className="skeleton-stat-line skeleton-stat-value-lg" />
          <span className="skeleton-stat-line skeleton-stat-desc" />
        </div>
      </div>
    ))}
  </section>
);

const GarageActionSkeleton = () => (
  <section className="garages-actions" aria-label="Cargando acciones de garages">
    <span className="btn-nueva-zona-skeleton" />
  </section>
);

function SuperadminGestionGarages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [garages, setGarages] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tratos, setTratos] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);

      const [garagesRes, empresasRes, tratosRes] = await Promise.all([
        GaragesGetAll(),
        EmpresasGetAll(),
        TratosGetAll(),
      ]);

      if (!mounted) return;

      if (garagesRes.respuesta) {
        setGarages(obtenerListado(garagesRes.datos));
      }
      if (empresasRes.respuesta) {
        setEmpresas(obtenerListado(empresasRes.datos));
      }
      if (tratosRes.respuesta) {
        setTratos(obtenerListado(tratosRes.datos));
      }

      setLoading(false);
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  const relacionesPorGarage = new Map();
  tratos.forEach((trato) => {
    const idGarage = Number(trato.id_garage);
    if (!Number.isFinite(idGarage)) return;
    const relaciones = relacionesPorGarage.get(idGarage) || [];
    const relacion = {
      idEmpresa: Number(trato.id_empresa),
      empresaNombre: trato.empresa_nombre || `Empresa #${trato.id_empresa}`,
      idSede: Number(trato.id_sede),
      sedeNombre: trato.sede_nombre || `Sede #${trato.id_sede}`,
    };
    if (!relaciones.some((item) => item.idSede === relacion.idSede)) relaciones.push(relacion);
    relacionesPorGarage.set(idGarage, relaciones);
  });

  const garagesConInfo = garages.map((g) => {
    const relaciones = relacionesPorGarage.get(Number(obtenerIdGarage(g))) || [];
    return {
      ...g,
      _relaciones: relaciones,
      _idEmpresas: [...new Set(relaciones.map((item) => item.idEmpresa))],
    };
  });

  const garagesFiltrados = empresaFilter
    ? garagesConInfo.filter((g) => g._idEmpresas.includes(Number(empresaFilter)))
    : garagesConInfo;

  const ocupacionMedia =
    garagesFiltrados.length > 0
      ? Math.round(
          garagesFiltrados.reduce((total, garage) => {
            const capacidad = Number(garage.capacidad || 0);
            if (capacidad <= 0) return total;
            return total + (obtenerOcupacion(garage) / capacidad) * 100;
          }, 0) / garagesFiltrados.length
        )
      : 0;

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
            <GarageActionSkeleton />
            <GarageStatsSkeleton />
            <GarageSkeletonGrid />
          </>
        ) : (
          <>
            <div className="gestion-garages-top superadmin-stagger-title">
              <button className="boton-back" onClick={() => navigate("/superadmin_dashboard")}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="pGarageSuperAdmin">CONTROL DE GARAGES</p>
                <h1>Gestión de Garages</h1>
              </div>
            </div>

            <section className="garages-actions superadmin-stagger-stat">
              <button
                className="btn-nueva-zona-superAdmin"
                onClick={() => navigate("/agregar_zona")}
              >
                <CirclePlus size={20} />
                <span>Nuevo Garage</span>
              </button>
            </section>

            <section className="stats-container superadmin-stagger-stat">
              <div className="stats-card">
                <div className="stats-card-bg-icon">
                  <MapPinned size={100} />
                </div>
                <div className="stats-card-content">
                  <div className="stats-card-header">
                    <span className="stats-card-badge">Total</span>
                    <span className="stats-card-icon">
                      <MapPinned  size={18} />
                    </span>
                  </div>
                  <div className="stats-card-value">
                    <h2>{garagesFiltrados.length}</h2>
                  </div>
                <p className="stats-card-footer">
                    <span className="stats-card-dot" />
                  <span>Registradas en la base de datos</span>
                </p>
              </div>
            </div>
              <div className="stats-card">
                <div className="stats-card-bg-icon">
                  <BarChart3 size={100} />
                </div>
                <div className="stats-card-content">
                  <div className="stats-card-header">
                    <span className="stats-card-badge">Ocupación</span>
                    <span className="stats-card-icon">
                      <BarChart3 size={18} />
                    </span>
                  </div>
                  <div className="stats-card-value">
                    <h2>{`${ocupacionMedia}%`}</h2>
                  </div>
                  <p className="stats-card-footer">
                    <span className="stats-card-dot" />
                    <span>Calculada sobre la capacidad total</span>
                  </p>
                </div>
            </div>
            </section>

            <section className="gestion-garages-container">
              <div className="garages-section-heading superadmin-stagger-title">
                <h2 className="titulo-garages">Listado de Garages</h2>
                <p className="subtitulo-garages">
                  Administra los garages disponibles, revisa su estado y actualiza su
                  capacidad en tiempo real.
                </p>
              </div>

              <div className="filter-container superadmin-stagger-stat">
                <label htmlFor="filter-empresa">Filtrar por empresa:</label>
                <select
                  id="filter-empresa"
                  className="filter-select"
                  value={empresaFilter}
                  onChange={(e) => setEmpresaFilter(e.target.value)}
                >
                  <option value="">Todas las empresas</option>
                  {empresas.map((emp) => {
                    const id = emp.id ?? emp.id_empresa ?? emp.idEmpresa;
                    const nombre = emp.nombre || emp.name || "Sin nombre";
                    return (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>

              {garagesFiltrados.length === 0 && (
                <p className="garages-feedback">No hay garages para la empresa seleccionada.</p>
              )}

              {garagesFiltrados.length > 0 && (
                <div className="contenedor-tarjetas superadmin-stagger-card">
                  {garagesFiltrados.map((garage, index) => (
                    <TarjetaGarage
                      key={obtenerIdGarage(garage, index)}
                      titulo={garage.nombre || "Garage sin nombre"}
                      plazas={Number(garage.capacidad || 0)}
                      estado={obtenerEstadoGarage(garage.estado)}
                      capacidad={obtenerCapacidadPorcentaje(garage)}
                      dias={garage.dias}
                      ultimoReporte={garage.piso ? `Nivel ${garage.piso}` : "Sin nivel"}
                      imagen={imagenesGarage[index % imagenesGarage.length]}
                      relaciones={garage._relaciones}
                      onClick={() => navigate("/editar_zona", { state: { garage } })}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <FooterSuperadmin />
    </>
  );
}

export default SuperadminGestionGarages;
