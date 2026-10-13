import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CirclePlus, ClipboardList, Trash2, Warehouse } from "lucide-react";
import Swal from "sweetalert2";
import HeaderDueñoGarage from "../componentesDueñoGarage/header_dueño_garage";
import FooterDueñoGarage from "../componentesDueñoGarage/footer_dueño_garage";
import TarjetaGarageDueño from "../componentesDueñoGarage/tarjeta_garage_dueño";
import { SkeletonGarages, SkeletonValorMetrica } from "../componentesDueñoGarage/skeleton_admin_garage";
import { GaragesGetAll, GaragesGetPapelera, GaragesMoveToPapelera, GaragesRestore } from "../servicies/API_Garage";
import { TratosGetAll } from "../servicies/API_TratoEmpresaGarage";
import { Z_INDEX } from "../helpers/zIndex";
import EmptyState from "../componentesCompartidos/EmptyState";
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
  const [tab, setTab] = useState("activos");
  const [garages, setGarages] = useState([]);
  const [garagesPapelera, setGaragesPapelera] = useState([]);
  const [tratos, setTratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intentoCarga, setIntentoCarga] = useState(0);
  const pestanasRef = useRef({});
  const ordenPestanas = ["activos", "borrador"];

  const seleccionarPestana = (id) => {
    setTab(id);
    setError("");
  };

  // Navegación de pestañas con ← → Home/End según el patrón ARIA de tabs.
  const manejarTecladoPestanas = (event, actual) => {
    const indice = ordenPestanas.indexOf(actual);
    let destino = null;
    if (event.key === "ArrowRight") destino = ordenPestanas[(indice + 1) % ordenPestanas.length];
    else if (event.key === "ArrowLeft") destino = ordenPestanas[(indice - 1 + ordenPestanas.length) % ordenPestanas.length];
    else if (event.key === "Home") destino = ordenPestanas[0];
    else if (event.key === "End") destino = ordenPestanas[ordenPestanas.length - 1];
    if (!destino) return;
    event.preventDefault();
    seleccionarPestana(destino);
    pestanasRef.current[destino]?.focus();
  };

  const cargarPapelera = async (montado) => {
    const res = await GaragesGetPapelera({ force: true });
    if (!montado) return;
    if (res.respuesta) setGaragesPapelera(obtenerListado(res.datos));
  };

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

      await cargarPapelera(montado);

      setLoading(false);
    };

    cargarDatos();

    return () => {
      montado = false;
    };
  }, [intentoCarga]);

  const recargarDatos = () => {
    setError("");
    setLoading(true);
    setIntentoCarga((n) => n + 1);
  };

  const moverABorrador = async (garage) => {
    const id = garage.id;
    const nombre = garage.nombre || garage.name || "el garage";

    const result = await Swal.fire({
      title: "Mover a borrador",
      text: `El garage "${nombre}" ya no estará visible para las empresas, pero podrás restaurarlo cuando quieras.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#475569",
      confirmButtonText: "Sí, mover a borrador",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      zIndex: Z_INDEX.SWAL_DIALOG,
    });

    if (!result.isConfirmed) return;

    const response = await GaragesMoveToPapelera(id);

    if (response.respuesta) {
      setGarages((prev) => prev.filter((item) => item.id !== id));
      setGaragesPapelera((prev) => [{ ...garage, en_papelera: true }, ...prev]);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Garage movido a borrador",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        zIndex: Z_INDEX.SWAL_TOAST,
      });
    } else {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "No se pudo mover el garage a borrador",
        showConfirmButton: false,
        timer: 2500,
        zIndex: Z_INDEX.SWAL_TOAST,
      });
    }
  };

  const restaurarGarage = async (garage) => {
    const id = garage.id;
    const nombre = garage.nombre || garage.name || "este garage";

    const result = await Swal.fire({
      title: "Restaurar garage",
      text: `El garage "${nombre}" volverá a estar visible para las empresas.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#475569",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      zIndex: Z_INDEX.SWAL_DIALOG,
    });

    if (!result.isConfirmed) return;

    const response = await GaragesRestore(id);

    if (response.respuesta) {
      setGaragesPapelera((prev) => prev.filter((item) => item.id !== id));
      setTab("activos");

      const actualizados = await GaragesGetAll();
      if (actualizados.respuesta) setGarages(obtenerListado(actualizados.datos));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Garage restaurado",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        zIndex: Z_INDEX.SWAL_TOAST,
      });
    } else {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "No se pudo restaurar el garage",
        showConfirmButton: false,
        timer: 2500,
        zIndex: Z_INDEX.SWAL_TOAST,
      });
    }
  };

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

      <main className="duenio-garage-main">
        <section className="duenio-hero">
          <div className="duenio-hero-copy">
            <h1>Controlá tus garages como activos operativos.</h1>
            <p>
              Visualizá tus propiedades, disponibilidad y tratos con empresas desde una consola separada del flujo admin.
            </p>
          </div>

          <div className="duenio-hero-actions">
            <button onClick={() => navigate("/duenio-garage/crear-garage")}>
              <CirclePlus size={19} aria-hidden="true" focusable="false" />
              Crear garage
            </button>
            <button className="secondary" onClick={() => navigate("/duenio-garage/tratos")}>
              <ClipboardList size={19} aria-hidden="true" focusable="false" />
              Ver tratos
            </button>
          </div>
        </section>

        <dl className="duenio-metrics" aria-label="Resumen del dueño de garage">
          <div>
            <dt>Garages propios</dt>
            <dd>{loading ? <SkeletonValorMetrica /> : garages.length}</dd>
          </div>
          <div>
            <dt>Ocupación media</dt>
            <dd>{loading ? <SkeletonValorMetrica /> : `${resumen.ocupacionMedia}%`}</dd>
          </div>
          <div>
            <dt>Tratos vigentes</dt>
            <dd>{loading ? <SkeletonValorMetrica /> : tratos.length}</dd>
          </div>
          <div>
            <dt>Capacidad total</dt>
            <dd>{loading ? <SkeletonValorMetrica /> : resumen.capacidadTotal}</dd>
          </div>
          <div>
            <dt>En borrador</dt>
            <dd>{loading ? <SkeletonValorMetrica /> : garagesPapelera.length}</dd>
          </div>
        </dl>

        <section className="duenio-section-head">
          <h2>Garages registrados</h2>
        </section>

        <div className="duenio-tabs" role="tablist" aria-label="Estado de los garages">
          <button
            type="button"
            id="duenio-tab-activos"
            className={`duenio-tab${tab === "activos" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "activos"}
            aria-controls="duenio-panel-garages"
            tabIndex={tab === "activos" ? 0 : -1}
            ref={(el) => { pestanasRef.current.activos = el; }}
            onKeyDown={(event) => manejarTecladoPestanas(event, "activos")}
            onClick={() => seleccionarPestana("activos")}>
            Activos
            <span className="duenio-tab-badge">{garages.length}</span>
          </button>
          <button
            type="button"
            id="duenio-tab-borrador"
            className={`duenio-tab${tab === "borrador" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "borrador"}
            aria-controls="duenio-panel-garages"
            tabIndex={tab === "borrador" ? 0 : -1}
            ref={(el) => { pestanasRef.current.borrador = el; }}
            onKeyDown={(event) => manejarTecladoPestanas(event, "borrador")}
            onClick={() => seleccionarPestana("borrador")}>
            Borrador
            {garagesPapelera.length > 0 && <span className="duenio-tab-badge">{garagesPapelera.length}</span>}
          </button>
        </div>

        <div
          role="tabpanel"
          id="duenio-panel-garages"
          aria-labelledby={`duenio-tab-${tab}`}
          tabIndex={0}
          className="duenio-tabpanel">

          {error && (
            <div className="duenio-load-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={recargarDatos}>Reintentar</button>
            </div>
          )}

          {loading && <SkeletonGarages />}

          {!loading && !error && tab === "activos" && garages.length === 0 && (
            <EmptyState
              icon={Warehouse}
              title="Todavía no tenés garages asociados."
              description="Creá tu primer garage para que las empresas puedan solicitar acceso operativo."
              action={{ label: "Crear primer garage", to: "/duenio-garage/crear-garage", icon: CirclePlus }}
            />
          )}

          {!loading && !error && tab === "activos" && garages.length > 0 && (
            <div className="duenio-garages-grid">
              {garages.map((garage, index) => (
                <TarjetaGarageDueño
                  key={obtenerIdGarage(garage, index)}
                  garage={garage}
                  porcentajeOcupacion={obtenerPorcentajeOcupacion(garage)}
                  onClick={() => navigate(`/duenio-garage/garage/${garage.id}/editar`)}
                  onBorrador={() => moverABorrador(garage)}
                />
              ))}
            </div>
          )}

          {!loading && !error && tab === "borrador" && garagesPapelera.length === 0 && (
            <EmptyState
              icon={Trash2}
              title="No hay garages en borrador."
              description="Los garages que muevas a borrador aparecerán acá para que puedas restaurarlos cuando quieras."
              action={{ label: "Ver garages activos", onClick: () => seleccionarPestana("activos"), variant: "secondary" }}
            />
          )}

          {!loading && !error && tab === "borrador" && garagesPapelera.length > 0 && (
            <div className="duenio-garages-grid">
              {garagesPapelera.map((garage, index) => (
                <TarjetaGarageDueño
                  key={obtenerIdGarage(garage, index)}
                  garage={garage}
                  esBorrador
                  onRestaurar={() => restaurarGarage(garage)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterDueñoGarage />
    </div>
  );
}

export default DuenioGarageDashboard;