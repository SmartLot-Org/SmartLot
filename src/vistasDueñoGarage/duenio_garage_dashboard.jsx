import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CirclePlus, ClipboardList, Gauge, Warehouse } from "lucide-react";
import HeaderDueñoGarage from "../componentesDueñoGarage/header_dueño_garage";
import FooterDueñoGarage from "../componentesDueñoGarage/footer_dueño_garage";
import TarjetaGarageDueño from "../componentesDueñoGarage/tarjeta_garage_dueño";
import { GaragesGetAll } from "../servicies/API_Garage";
import { TratosGetAll } from "../servicies/API_TratoEmpresaGarage";
import "./duenio_garage.css";

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.garages)) return datos.garages;
  if (Array.isArray(datos?.value)) return datos.value;
  return [];
};

const obtenerIdGarage = (garage, index) => garage.id ?? index;

const obtenerOcupacion = (garage) =>
  Number(garage.ocupacion_reservas || 0) + Number(garage.ocupacion_no_reservas || 0);

const obtenerPorcentajeOcupacion = (garage) => {
  const capacidad = Number(garage.capacidad || 0);
  if (capacidad <= 0) return 0;
  return Math.min(100, Math.round((obtenerOcupacion(garage) / capacidad) * 100));
};

function DuenioGarageDashboard() {
  const navigate = useNavigate();
  const [garages, setGarages] = useState([]);
  const [tratos, setTratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let montado = true;

    const cargarDatos = async () => {
      setLoading(true);
      setError("");

      const [garagesRes, tratosRes] = await Promise.all([
        GaragesGetAll(),
        TratosGetAll(),
      ]);

      if (!montado) return;

      if (garagesRes.respuesta) {
        setGarages(obtenerListado(garagesRes.datos));
      } else {
        setGarages([]);
        setError(garagesRes.status === 403 ? "No tenés permiso para consultar estos garages." : "No se pudieron cargar tus garages.");
      }

      if (tratosRes.respuesta) setTratos(obtenerListado(tratosRes.datos));

      setLoading(false);
    };

    cargarDatos();

    return () => {
      montado = false;
    };
  }, []);

  const resumen = useMemo(() => {
    const capacidadTotal = garages.reduce((total, garage) => total + Number(garage.capacidad || 0), 0);
    const ocupacionMedia = garages.length
      ? Math.round(garages.reduce((total, garage) => total + obtenerPorcentajeOcupacion(garage), 0) / garages.length)
      : 0;

    return { capacidadTotal, ocupacionMedia };
  }, [garages]);

  return (
    <div className="duenio-garage-page">
      <HeaderDueñoGarage />

      <main className="duenio-garage-shell">
        <section className="duenio-hero">
          <div className="duenio-hero-copy">
            <span className="duenio-kicker">SMARTLOT OWNER</span>
            <h1>Controla tus garages como activos operativos.</h1>
            <p>
              Visualiza tus propiedades, disponibilidad y tratos con empresas desde una consola separada del flujo admin.
            </p>
          </div>

          <div className="duenio-hero-actions">
            <button onClick={() => navigate("/duenio-garage/crear-garage")}>
              <CirclePlus size={19} />
              Crear garage
            </button>
            <button className="secondary" onClick={() => navigate("/duenio-garage/tratos")}>
              <ClipboardList size={19} />
              Ver tratos
            </button>
          </div>
        </section>

        <section className="duenio-stats-grid" aria-label="Resumen del dueño de garage">
          <article>
            <Warehouse size={22} />
            <span>Garages propios</span>
            <strong>{loading ? "..." : garages.length}</strong>
          </article>
          <article>
            <Gauge size={22} />
            <span>Ocupacion media</span>
            <strong>{loading ? "..." : `${resumen.ocupacionMedia}%`}</strong>
          </article>
          <article>
            <ClipboardList size={22} />
            <span>Tratos vigentes</span>
            <strong>{tratos.length}</strong>
          </article>
          <article>
            <ArrowUpRight size={22} />
            <span>Capacidad total</span>
            <strong>{loading ? "..." : resumen.capacidadTotal}</strong>
          </article>
        </section>

        <section className="duenio-section-head">
          <span>Portafolio</span>
          <h2>Garages registrados</h2>
        </section>

        {error && <p className="duenio-feedback error">{error}</p>}

        {loading && (
          <div className="duenio-garages-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="duenio-card-skeleton" key={index} />
            ))}
          </div>
        )}

        {!loading && !error && garages.length === 0 && (
          <section className="duenio-empty-state">
            <h3>Todavia no tenes garages asociados.</h3>
            <p>Creá tu primer garage para que las empresas puedan solicitar acceso operativo.</p>
            <button onClick={() => navigate("/duenio-garage/crear-garage")}>
              <CirclePlus size={18} />
              Crear primer garage
            </button>
          </section>
        )}

        {!loading && !error && garages.length > 0 && (
          <div className="duenio-garages-grid">
            {garages.map((garage, index) => (
              <TarjetaGarageDueño
                key={obtenerIdGarage(garage, index)}
                garage={garage}
                porcentajeOcupacion={obtenerPorcentajeOcupacion(garage)}
                onClick={() => navigate(`/duenio-garage/garage/${garage.id}/editar`)}
              />
            ))}
          </div>
        )}
      </main>

      <FooterDueñoGarage />
    </div>
  );
}

export default DuenioGarageDashboard;
