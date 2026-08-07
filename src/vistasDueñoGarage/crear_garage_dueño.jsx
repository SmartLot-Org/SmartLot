import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CirclePlus } from "lucide-react";
import Swal from "sweetalert2";
import HeaderDueñoGarage from "../componentesDueñoGarage/header_dueño_garage";
import FooterDueñoGarage from "../componentesDueñoGarage/footer_dueño_garage";
import FormularioZona from "../componentesAdmin/formulario_zona";
import FormularioCapacidad from "../componentesAdmin/formulario_capacidad";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { GaragesCreate } from "../servicies/API_Garage";
import useLiveValidation from "../hooks/useLiveValidation";
import "../vistasAdmin/agregar_zona.css";
import FormularioPreciosGarage from "../componentesCompartidos/FormularioPreciosGarage";
import { buildGaragePricesPayload } from "../helpers/prices";
import { Z_INDEX } from "../helpers/zIndex";

function CrearGarageDueño() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    piso: "",
    ubicacion: "",
    hora_apertura: "",
    hora_cierre: "",
    capacidad_reservas: "",
    capacidad_para_no_reservas: "",
    dias: [],
    precio_pickup: "",
    precio_auto: "",
    precio_moto: "",
  });
  const [coordenadas, setCoordenadas] = useState({ lat: null, lng: null, direccion: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialForm] = useState(() => ({ ...formData, dias: [...formData.dias] }));

  const isDirty = useMemo(() => {
    const ini = initialForm;
    if (!ini) return false;
    const keys = Object.keys(formData);
    for (const key of keys) {
      const a = formData[key];
      const b = ini[key];
      if (Array.isArray(a) || Array.isArray(b)) {
        if (JSON.stringify(a ?? []) !== JSON.stringify(b ?? [])) return true;
        continue;
      }
      if (String(a ?? "") !== String(b ?? "")) return true;
    }
    return false;
  }, [formData, initialForm]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Tienes datos sin guardar. ¿Seguro que deseas salir?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const volverADashboard = async () => {
    if (isDirty) {
      const result = await Swal.fire({
        title: "Datos sin guardar",
        text: "Has comenzado a cargar el garage. Si sales ahora, perderás los datos ingresados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748B",
        confirmButtonText: "Salir sin guardar",
        cancelButtonText: "Permanecer aquí",
        reverseButtons: true,
        zIndex: Z_INDEX.SWAL_DIALOG,
      });
      if (!result.isConfirmed) return;
    }
    navigate("/duenio-garage/dashboard");
  };

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
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Garage creado correctamente",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        zIndex: Z_INDEX.SWAL_TOAST,
      });
      navigate("/duenio-garage/dashboard", { replace: true });
      return;
    }

    const mensaje = response.datos?.message || response.datos || "Error desconocido.";
    setError(`No se pudo crear el garage: ${typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje)}`);
  };

return (
    <div className="agregar-zona">
      <HeaderDueñoGarage />

      <div className="contenido-agregar-zona">
        <div className="top-garage">
          <button className="boton-back" onClick={volverADashboard} aria-label="Volver al panel del dueño">
            <ArrowLeft size={24} />
          </button>

          <div className="info-top">
            <p>ALTA DE ACTIVO</p>
            <h1>Crear nuevo garage</h1>
            <span>Esta funcion ahora pertenece al rol dueño de garage. El garage queda asociado a tu usuario como propietario.</span>
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

          <FormularioCapacidad formData={formData} onChange={handleChange} />
          <FormularioPreciosGarage values={formData} onChange={handleChange} disabled={loading} />
        </div>

        {error && <p className="form-error" style={{ color: '#d32f2f', padding: '12px', marginBottom: '16px', backgroundColor: '#ffebee', borderRadius: '4px', fontWeight: 'bold' }}>{error}</p>}

        <div className="acciones-garage">
          <BotonGenerico
            className="btn-guardar-grande"
            onClick={handleCrearGarage}
            disabled={loading}
          >
            <CirclePlus size={22} />
            <span>{loading ? "Creando..." : "Crear Garage"}</span>
          </BotonGenerico>

          <BotonGenerico
            className="btn-cancelar-grande"
            onClick={volverADashboard}
          >
            <span>Cancelar</span>
          </BotonGenerico>
        </div>
      </div>

      <FooterDueñoGarage />
    </div>
  );
}

export default CrearGarageDueño;
