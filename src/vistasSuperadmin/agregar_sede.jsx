import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { Autocomplete } from '@react-google-maps/api';
import "./agregar_empresa.css";
import "./agregar_sede.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { SedesCreate } from "../servicies/API_Sede";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import useLiveValidation from "../hooks/useLiveValidation";
import FieldValidation from "../components/FieldValidation";
import { useGoogleMaps } from "../contexts/useGoogleMaps";

const validationSchema = {
  idEmpresa: [
    { rule: (v) => v !== "", message: "Selecciona una empresa" },
  ],
  nombre: [
    { rule: (v) => v?.trim().length > 0, message: "Requerido" },
    { rule: (v) => v?.trim().length >= 2, message: "Mínimo 2 caracteres" },
  ],
};

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const AgregarSedeSkeleton = () => (
  <section className="agregar-empresa-form agregar-sede-form-skeleton" aria-label="Cargando formulario">
    {Array.from({ length: 4 }).map((_, index) => (
      <div className="input-skeleton-superadmin" key={index}>
        <span className="skeleton-line skeleton-form-label" />
        <span className={`skeleton-line ${index === 2 ? "skeleton-form-textarea" : "skeleton-form-control"}`} />
      </div>
    ))}
    <div className="agregar-empresa-actions">
      <span className="skeleton-line skeleton-form-button" />
      <span className="skeleton-line skeleton-form-button secondary" />
    </div>
  </section>
);

function AgregarSede() {
  const navigate = useNavigate();
  const location = useLocation();
  const [empresas, setEmpresas] = useState([]);
  const [formData, setFormData] = useState({
    idEmpresa: location.state?.empresaId ? String(location.state.empresaId) : "",
    nombre: "",
    descripcion: "",
    ubicacion: "",
  });
  const [coordenadas, setCoordenadas] = useState({ lat: null, lng: null, direccion: '' });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  const { isLoaded } = useGoogleMaps();

  const autocompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const direccion = place.formatted_address || '';
      setFormData((prev) => ({ ...prev, ubicacion: direccion }));
      setCoordenadas({ lat, lng, direccion });
    }
  };

  const { isValid, touched, getFieldProps, touchAll } = useLiveValidation(formData, validationSchema);
  const field = (name) => getFieldProps(name, setFormData);

  const buildConditions = (fieldName) => {
    if (!validationSchema[fieldName]) return [];
    const value = formData[fieldName];
    return validationSchema[fieldName].map((item) => {
      const ruleFn = item.rule;
      const message = item.message;
      return { label: message, met: ruleFn(value) };
    });
  };

  useEffect(() => {
    let mounted = true;

    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const res = await EmpresasGetAll();
        if (!mounted) return;
        if (res.respuesta) {
          setEmpresas(obtenerListado(res.datos));
        }
      } finally {
        if (mounted) setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
    return () => { mounted = false; };
  }, []);

  const handleGuardar = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (!isValid) {
      touchAll();
      return;
    }

    setLoading(true);

    const response = await SedesCreate({
      id_empresa: Number(formData.idEmpresa),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      ubicacion: formData.ubicacion.trim(),
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
    });

    if (response.respuesta) {
      navigate("/superadmin/gestion_empresas", { replace: true, state: { empresaId: Number(formData.idEmpresa) } });
    } else {
      setLoading(false);
      setError(response.datos?.message || "Error al crear la sede.");
    }
  };

  return (
    <div className="agregar-sede-page">
      <HeaderSuperadmin />
      <main className="agregar-sede-main">
        <div className="agregar-sede-top">
          <button type="button" className="boton-back" aria-label="Volver a gestión de empresas" onClick={() => navigate("/superadmin/gestion_empresas", { state: { empresaId: Number(formData.idEmpresa) || undefined } })}>
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div>
            <p>SUPERADMIN</p>
            <h1>Agregar Sede</h1>
          </div>
        </div>

        {loadingEmpresas ? (
          <AgregarSedeSkeleton />
        ) : (
        <form className="agregar-empresa-form" onSubmit={handleGuardar} noValidate>
          <div className="input-group-superadmin">
            <label htmlFor="superadmin-sede-empresa">Empresa</label>
            <select id="superadmin-sede-empresa" {...field("idEmpresa")} autoComplete="off" required>
              <option value="">Seleccionar empresa...</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
            <FieldValidation conditions={buildConditions("idEmpresa")} isTouched={touched.idEmpresa} />
          </div>

          <div className="input-group-superadmin">
            <label htmlFor="superadmin-sede-nombre">Nombre de la sede</label>
            <input
              id="superadmin-sede-nombre"
              type="text"
              placeholder="Ej: Sede Central"
              {...field("nombre")}
              autoComplete="off"
              required
            />
            <FieldValidation conditions={buildConditions("nombre")} isTouched={touched.nombre} />
          </div>

          <div className="input-group-superadmin">
            <label htmlFor="superadmin-sede-descripcion" className="label-optional">Descripción (opcional)</label>
            <textarea
              id="superadmin-sede-descripcion"
              placeholder="Descripción de la sede"
              value={formData.descripcion}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              autoComplete="off"
            />
          </div>

          <div className="input-group-superadmin">
            <label htmlFor="superadmin-sede-ubicacion">Ubicación</label>
            {isLoaded ? (
              <Autocomplete
                onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                onPlaceChanged={handlePlaceChanged}
              >
                <input
                  id="superadmin-sede-ubicacion"
                  type="text"
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ubicacion: e.target.value }))}
                  autoComplete="off"
                  required
                />
              </Autocomplete>
            ) : (
              <input
                id="superadmin-sede-ubicacion"
                type="text"
                placeholder="Ej: Av. Corrientes 1234, CABA"
                value={formData.ubicacion}
                onChange={(e) => setFormData((prev) => ({ ...prev, ubicacion: e.target.value }))}
                autoComplete="off"
                required
              />
            )}
          </div>

          {error && <p className="form-error-superadmin" role="alert">{error}</p>}

          <div className="agregar-empresa-actions">
            <BotonGenerico
              className="superadmin-form-save"
              type="submit"
              disabled={loading}
            >
              <CircleCheck size={20} color="white" />
              <span>{loading ? "Guardando..." : "Guardar sede"}</span>
            </BotonGenerico>

            <BotonGenerico
              className="superadmin-form-cancel"
              onClick={() => navigate("/superadmin/gestion_empresas", { replace: true, state: { empresaId: Number(formData.idEmpresa) || undefined } })}
            >
              <span>Cancelar</span>
            </BotonGenerico>
          </div>
        </form>
        )}
      </main>
    </div>
  );
}

export default AgregarSede;
