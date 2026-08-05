import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CirclePlus } from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import HeaderDueñoGarage from "../componentesDueñoGarage/header_dueño_garage";
import FooterDueñoGarage from "../componentesDueñoGarage/footer_dueño_garage";
import FormularioZona from "../componentesAdmin/formulario_zona";
import FormularioCapacidad from "../componentesAdmin/formulario_capacidad";
import { GaragesCreate } from "../servicies/API_Garage";
import { SedesGetAll } from "../servicies/API_Sede";
import useLiveValidation from "../hooks/useLiveValidation";
import "./duenio_garage.css";
import FormularioPreciosGarage from "../componentesCompartidos/FormularioPreciosGarage";
import { buildGaragePricesPayload } from "../helpers/prices";

function CrearGarageDueño() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    piso: "",
    ubicacion: "",
    hora_apertura: "",
    hora_cierre: "",
    capacidad_reservas: "",
    capacidad_para_no_reservas: "",
    id_sede: usuario?.id_sede ?? "",
    dias: [],
    precio_pickup: "",
    precio_auto: "",
    precio_moto: "",
  });
  const [coordenadas, setCoordenadas] = useState({ lat: null, lng: null, direccion: "" });
  const [sedes, setSedes] = useState([]);
  const [sedesLoading, setSedesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let montado = true;

    const cargarSedes = async () => {
      const response = await SedesGetAll();
      if (!montado) return;

      if (response.respuesta) {
        const lista = Array.isArray(response.datos)
          ? response.datos
          : Array.isArray(response.datos?.datos) ? response.datos.datos : [];
        const sedesFiltradas = usuario?.id_sede
          ? lista.filter((sede) => Number(sede.id) === Number(usuario.id_sede))
          : lista;

        setSedes(sedesFiltradas);
        if (sedesFiltradas.length > 0) {
          setFormData((prev) => ({ ...prev, id_sede: prev.id_sede || String(sedesFiltradas[0].id) }));
        }
      } else {
        setError("No se encontraron sedes disponibles para asociar el garage.");
      }

      setSedesLoading(false);
    };

    cargarSedes();

    return () => {
      montado = false;
    };
  }, [usuario]);

  const getSchema = () => ({
    nombre: [
      { rule: (v) => v?.trim().length > 0, message: "Requerido" },
      { rule: (v) => v?.trim().length >= 3, message: "Minimo 3 caracteres" },
    ],
    piso: [
      { rule: (v) => v !== "" && v !== null && v !== undefined, message: "Requerido" },
      { rule: (v) => !Number.isNaN(Number(v)) && Number.isInteger(Number(v)), message: "Debe ser numero entero" },
    ],
    ubicacion: [
      { rule: (v) => v?.trim().length > 0, message: "Requerido" },
      { rule: (v) => v?.trim().length >= 5, message: "Minimo 5 caracteres" },
      () => ({ rule: () => coordenadas.lat !== null && coordenadas.lng !== null, message: "Selecciona una ubicacion valida del mapa" }),
    ],
    hora_apertura: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || "")), message: "Formato HH:MM requerido" },
    ],
    hora_cierre: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || "")), message: "Formato HH:MM requerido" },
      () => ({ rule: () => !formData.hora_apertura || !formData.hora_cierre || formData.hora_apertura < formData.hora_cierre, message: "Apertura debe ser anterior a cierre" }),
    ],
    capacidad_reservas: [
      { rule: (v) => v !== "" && v !== null && v !== undefined, message: "Requerido" },
      { rule: (v) => Number.isInteger(Number(v)) && Number(v) >= 0, message: "Numero entero >= 0" },
    ],
    capacidad_para_no_reservas: [
      { rule: (v) => v !== "" && v !== null && v !== undefined, message: "Requerido" },
      { rule: (v) => Number.isInteger(Number(v)) && Number(v) >= 0, message: "Numero entero >= 0" },
    ],
    dias: [
      { rule: (v) => Array.isArray(v) && v.length > 0, message: "Selecciona al menos un dia" },
    ],
  });

  const { isValid, touched, handleChangeWithTouch } = useLiveValidation(formData, getSchema());

  const fieldsValidation = Object.keys(getSchema()).reduce((acc, field) => {
    acc[field] = {
      isTouched: touched[field],
      conditions: getSchema()[field].map((item) => {
        const ruleConfig = typeof item === "function" ? item(formData[field]) : item;
        return { label: ruleConfig.message, met: ruleConfig.rule(formData[field]) };
      }),
    };
    return acc;
  }, {});

  const handleChange = (field, value) => {
    if (typeof field === "object" && field !== null) {
      setFormData(field);
      return;
    }
    handleChangeWithTouch(field, value, setFormData);
  };

  const handleCrearGarage = async () => {
    setError("");

    if (sedesLoading) {
      setError("Las sedes todavia se estan cargando.");
      return;
    }

    if (!isValid) {
      setError("Corrige los campos marcados antes de guardar.");
      return;
    }

    const capReservas = Number(formData.capacidad_reservas);
    const capNoReservas = Number(formData.capacidad_para_no_reservas);
    let precios;
    try {
      precios = buildGaragePricesPayload(formData);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    const garage = {
      id_sede: Number(formData.id_sede),
      nombre: formData.nombre.trim(),
      piso: String(formData.piso).trim(),
      ubicacion: formData.ubicacion.trim(),
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
      hora_apertura: formData.hora_apertura,
      hora_cierre: formData.hora_cierre,
      estado: true,
      capacidad: capReservas + capNoReservas,
      capacidad_reservas: capReservas,
      capacidad_para_no_reservas: capNoReservas,
      ocupacion_reservas: 0,
      ocupacion_no_reservas: 0,
      dias: formData.dias,
      ...precios,
    };

    setLoading(true);
    const response = await GaragesCreate(garage);
    setLoading(false);

    if (response.respuesta) {
      navigate("/duenio-garage/dashboard", { replace: true });
      return;
    }

    const mensaje = response.datos?.message || response.datos || "Error desconocido.";
    setError(`No se pudo crear el garage: ${typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje)}`);
  };

  return (
    <div className="duenio-garage-page">
      <HeaderDueñoGarage />

      <main className="duenio-garage-shell duenio-form-shell">
        <button className="duenio-back-button" onClick={() => navigate("/duenio-garage/dashboard")}>
          <ArrowLeft size={20} />
          Volver
        </button>

        <section className="duenio-section-head left">
          <span>Alta de activo</span>
          <h1>Crear nuevo garage</h1>
          <p>Esta funcion ahora pertenece al rol dueño de garage. El garage queda asociado a tu usuario como propietario.</p>
        </section>

        <div className="duenio-form-card">
          <FormularioZona
            formData={formData}
            onChange={handleChange}
            sedes={sedes}
            fieldsValidation={fieldsValidation}
            onCoordenadasChange={setCoordenadas}
          />
          <FormularioCapacidad formData={formData} onChange={handleChange} />
          <FormularioPreciosGarage values={formData} onChange={handleChange} disabled={loading} />
        </div>

        {error && <p className="duenio-feedback error">{error}</p>}

        <div className="duenio-form-actions">
          <button onClick={handleCrearGarage} disabled={loading || sedesLoading || sedes.length === 0}>
            <CirclePlus size={20} />
            {loading ? "Creando..." : "Crear garage"}
          </button>
          <button className="secondary" onClick={() => navigate("/duenio-garage/dashboard")}>
            Cancelar
          </button>
        </div>
      </main>

      <FooterDueñoGarage />
    </div>
  );
}

export default CrearGarageDueño;
