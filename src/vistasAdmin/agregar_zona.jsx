import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./agregar_zona.css";
import Header from "../componentesAdmin/header_admin";
import { CirclePlus, ArrowLeft } from "lucide-react";
import FormularioZona from "../componentesAdmin/formulario_zona";
import FormularioCapacidad from "../componentesAdmin/formulario_capacidad";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { GaragesCreate } from "../servicies/API_Garage";
import useLiveValidation from "../hooks/useLiveValidation";
import FormularioPreciosGarage from "../componentesCompartidos/FormularioPreciosGarage";
import { buildGaragePricesPayload } from "../helpers/prices";

function AgregarZona() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    piso: "",
    ubicacion: "",
    hora_apertura: "",
    hora_cierre: "",
    capacidad_reservas: "",
    capacidad_para_no_reservas: "",
    dias: [], precio_pickup: "", precio_auto: "", precio_moto: ""
  });
  const [coordenadas, setCoordenadas] = useState({ lat: null, lng: null, direccion: '' });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getSchema = () => ({
    nombre: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 3, message: 'Mínimo 3 caracteres' },
    ],
    piso: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
      { rule: (v) => v === '' || v === null || v === undefined || (!isNaN(Number(v)) && Number.isInteger(Number(v))), message: 'Debe ser número entero' },
    ],
    ubicacion: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 5, message: 'Mínimo 5 caracteres' },
      () => ({ rule: () => coordenadas.lat !== null && coordenadas.lng !== null, message: 'Selecciona una ubicación válida del mapa' }),
    ],
    hora_apertura: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')), message: 'Formato HH:MM requerido' },
    ],
    hora_cierre: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')), message: 'Formato HH:MM requerido' },
      () => ({ rule: () => !formData.hora_apertura || !formData.hora_cierre || formData.hora_apertura < formData.hora_cierre, message: 'Apertura debe ser anterior a cierre' }),
    ],
    capacidad_reservas: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
      { rule: (v) => v === '' || v === null || v === undefined || (!isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 0), message: 'Número entero ≥ 0' },
    ],
    capacidad_para_no_reservas: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
      { rule: (v) => v === '' || v === null || v === undefined || (!isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 0), message: 'Número entero ≥ 0' },
    ],
    dias: [
      { rule: (v) => Array.isArray(v) && v.length > 0, message: 'Selecciona al menos un día' },
    ],
  });

  const { isValid, touched, handleChangeWithTouch } = useLiveValidation(formData, getSchema());

  const buildConditions = (fieldName) => {
    const schema = getSchema();
    if (!schema[fieldName]) return [];
    const value = formData[fieldName];
    return schema[fieldName].map((item) => {
      if (typeof item === 'function') {
        const result = item(value);
        return { label: result.message, met: result.rule(value) };
      }
      return { label: item.message, met: item.rule(value) };
    });
  };

  const fieldsValidation = {};
  Object.keys(getSchema()).forEach((field) => {
    fieldsValidation[field] = {
      conditions: buildConditions(field),
      isTouched: touched[field],
    };
  });

  const handleChange = (field, value) => {
    if (typeof field === "object" && field !== null) {
      setFormData(field);
    } else {
      handleChangeWithTouch(field, value, setFormData);
    }
  };

  const handleCrearZona = async () => {
    setError("");

    if (!isValid) {
      setError("❌ Corrige los errores antes de guardar.");
      return;
    }

    const capRes = Number(formData.capacidad_reservas);
    const capNoRes = Number(formData.capacidad_para_no_reservas);
    const cap = capRes + capNoRes;

    let precios;
    try { precios = buildGaragePricesPayload(formData); }
    catch (validationError) { setError(validationError.message); return; }

    setLoading(true);

    const garage = {
      nombre: formData.nombre.trim(),
      piso: String(formData.piso).trim(),
      ubicacion: formData.ubicacion.trim(),
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
      hora_apertura: formData.hora_apertura,
      hora_cierre: formData.hora_cierre,
      estado: true,
      capacidad: cap,
      capacidad_para_no_reservas: capNoRes,
      capacidad_reservas: capRes,
      ocupacion_reservas: 0,
      ocupacion_no_reservas: 0,
      dias: formData.dias,
      ...precios
    };

    const response = await GaragesCreate(garage);
    setLoading(false);

    if (response.respuesta) {
      navigate("/gestion_garages", { replace: true });
    } else {
      const errorMsg = response.datos?.message || response.datos || 'Error desconocido al conectar con la BD.';
      setError(`❌ Error al crear garage: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
    }
  };

  return (
    <div className="agregar-zona">
      <Header />

      <div className="contenido-agregar-zona">
        <div className="top-garage">
          <button className="boton-back" onClick={() => navigate("/gestion_garages", { replace: true })}>
            <ArrowLeft size={24} />
          </button>

          <div className="info-top">
            <p>AGREGAR GARAGE</p>
            <h1>Nuevo Garage</h1>
            <span>Configura los detalles de la nueva zona de estacionamiento.</span>
          </div>
        </div>

        <div className="form-garage">
          <FormularioZona
            formData={formData}
            onChange={handleChange}
            hideSede
            fieldsValidation={fieldsValidation}
            onCoordenadasChange={setCoordenadas}
          />

          <FormularioCapacidad
            formData={formData}
            onChange={handleChange}
          />
          <FormularioPreciosGarage values={formData} onChange={handleChange} disabled={loading} />
        </div>

        {error && <p className="form-error" style={{ color: '#d32f2f', padding: '12px', marginBottom: '16px', backgroundColor: '#ffebee', borderRadius: '4px', fontWeight: 'bold' }}>{error}</p>}

        <div className="acciones-garage">
          <BotonGenerico
            className="btn-guardar-grande"
            onClick={handleCrearZona}
            disabled={loading}
          >
            <CirclePlus size={22} />
            <span>{loading ? "Creando..." : "Crear Garage"}</span>
          </BotonGenerico>

          <BotonGenerico
            className="btn-cancelar-grande"
            onClick={() => navigate("/gestion_garages", { replace: true })}
          >
            <span>Cancelar</span>
          </BotonGenerico>
        </div>
      </div>
    </div>
  );
}

export default AgregarZona;
