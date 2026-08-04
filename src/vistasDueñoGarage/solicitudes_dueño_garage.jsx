import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderDueñoGarage from "../componentesDueñoGarage/header_dueño_garage";
import FooterDueñoGarage from "../componentesDueñoGarage/footer_dueño_garage";
import SolicitudGarageCard from "../componentesDueñoGarage/solicitud_garage_card";
import { SolicitudesGarageGetAll, SolicitudGarageUpdateEstado } from "../servicies/API_SolicitudGarage";
import "./duenio_garage.css";

const mockSolicitudes = [
  {
    id: "mock-1",
    empresa: "Nexo Corp",
    garage: "SmartLot Norte",
    estado: "pendiente",
    fecha: "Demo",
    mensaje: "Solicita cupos mensuales para su sede comercial.",
  },
  {
    id: "mock-2",
    empresa: "Distrito Legal",
    garage: "Garage Central",
    estado: "pendiente",
    fecha: "Demo",
    mensaje: "Quiere habilitar reservas recurrentes para empleados.",
  },
];

const normalizarSolicitud = (solicitud, index) => ({
  id: solicitud.id_solicitud ?? solicitud.idSolicitud ?? solicitud.id ?? solicitud._id ?? `solicitud-${index}`,
  empresa: solicitud.empresa_nombre ?? solicitud.nombre_empresa ?? solicitud.empresa?.nombre ?? solicitud.empresa ?? "Empresa sin nombre",
  garage: solicitud.garage_nombre ?? solicitud.nombre_garage ?? solicitud.garage?.nombre ?? solicitud.garage ?? "Garage no especificado",
  estado: solicitud.estado ?? "pendiente",
  fecha: solicitud.fecha ?? solicitud.created_at ?? solicitud.createdAt ?? "Sin fecha",
  mensaje: solicitud.mensaje ?? solicitud.descripcion ?? solicitud.detalle,
});

function SolicitudesDueñoGarage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usaDemo, setUsaDemo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let montado = true;

    const cargarSolicitudes = async () => {
      const response = await SolicitudesGarageGetAll();
      if (!montado) return;

      if (response.respuesta) {
        setSolicitudes(response.datos.map(normalizarSolicitud));
        setUsaDemo(false);
      } else {
        setSolicitudes(mockSolicitudes);
        setUsaDemo(true);
      }
      setLoading(false);
    };

    cargarSolicitudes();

    return () => {
      montado = false;
    };
  }, []);

  const pendientes = useMemo(
    () => solicitudes.filter((solicitud) => {
      const estado = String(solicitud.estado || "pendiente").toLowerCase();
      return estado === "pendiente" || estado === "pending";
    }).length,
    [solicitudes]
  );

  const actualizarEstado = async (id, estado) => {
    setError("");

    if (!usaDemo) {
      const response = await SolicitudGarageUpdateEstado(id, estado);
      if (!response.respuesta) {
        setError("No se pudo actualizar la solicitud en el servidor.");
        return;
      }
    }

    setSolicitudes((prev) =>
      prev.map((solicitud) =>
        solicitud.id === id
          ? { ...solicitud, estado, estadoLabel: estado === "aceptada" ? "Aceptada" : "Rechazada" }
          : solicitud
      )
    );
  };

  return (
    <div className="duenio-garage-page">
      <HeaderDueñoGarage solicitudesPendientes={pendientes} />

      <main className="duenio-garage-shell">
        <button className="duenio-back-button" onClick={() => navigate("/duenio-garage/dashboard")}>
          <ArrowLeft size={20} />
          Volver
        </button>

        <section className="duenio-section-head left">
          <span>Solicitudes</span>
          <h1>Empresas que quieren usar tus garages</h1>
          <p>Aproba o rechaza las solicitudes que hacen los admins de empresas para operar sobre tus garages.</p>
        </section>

        <section className="duenio-requests-summary">
          <ClipboardList size={24} />
          <div>
            <span>Pendientes</span>
            <strong>{loading ? "..." : pendientes}</strong>
          </div>
          {usaDemo && <p>Mostrando datos demo porque el endpoint de solicitudes todavia no respondio.</p>}
        </section>

        {error && <p className="duenio-feedback error">{error}</p>}

        {loading && (
          <div className="duenio-requests-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="duenio-request-skeleton" key={index} />
            ))}
          </div>
        )}

        {!loading && solicitudes.length === 0 && (
          <section className="duenio-empty-state">
            <h3>No hay solicitudes por revisar.</h3>
            <p>Cuando una empresa pida acceso a uno de tus garages, va a aparecer en esta pantalla.</p>
          </section>
        )}

        {!loading && solicitudes.length > 0 && (
          <div className="duenio-requests-list">
            {solicitudes.map((solicitud) => (
              <SolicitudGarageCard
                key={solicitud.id}
                solicitud={solicitud}
                onAceptar={() => actualizarEstado(solicitud.id, "aceptada")}
                onRechazar={() => actualizarEstado(solicitud.id, "rechazada")}
              />
            ))}
          </div>
        )}
      </main>

      <FooterDueñoGarage />
    </div>
  );
}

export default SolicitudesDueñoGarage;
