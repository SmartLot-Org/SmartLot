import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import "./agregar_sede.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { SedesCreate } from "../servicies/API_Sede";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import useLiveValidation from "../hooks/useLiveValidation";
import FieldValidation from "../components/FieldValidation";

const libraries = ['places'];

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
  <section className="agregar-sede-form agregar-sede-form-skeleton" aria-label="Cargando formulario">
    {Array.from({ length: 4 }).map((_, index) => (
      <div className="input-skeleton-superadmin" key={index}>
        <span className="skeleton-line skeleton-form-label" />
        <span className={`skeleton-line ${index === 2 ? "skeleton-form-textarea" : "skeleton-form-control"}`} />
      </div>
    ))}
    <div className="agregar-sede-actions">
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

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_FRONTEND_KEY,
    libraries
  });
  if (loadError) console.warn('agregar_sede: Google Maps no cargó:', loadError);

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

  const { isValid, touched, getFieldProps } = useLiveValidation(formData, validationSchema);
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

  const handleGuardar = async () => {
    setError("");

    if (!isValid) return;

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
          <button className="boton-back" onClick={() => navigate("/superadmin/gestion_empresas", { state: { empresaId: Number(formData.idEmpresa) || undefined } })}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p>SUPERADMIN</p>
            <h1>Agregar Sede</h1>
          </div>
        </div>

        {loadingEmpresas ? (
          <AgregarSedeSkeleton />
        ) : (
        <section className="agregar-sede-form">
          <div className="input-group-superadmin">
            <label>Empresa</label>
            <select value={formData.idEmpresa} onChange={(e) => setFormData((prev) => ({ ...prev, idEmpresa: e.target.value }))} autoComplete="off" required>
              <option value="">Seleccionar empresa...</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group-superadmin">
            <label>Nombre de la sede</label>
            <input
              type="text"
              placeholder="Ej: Sede Central"
              {...field("nombre")}
              autoComplete="off"
              required
            />
            <FieldValidation conditions={buildConditions("nombre")} isTouched={touched.nombre} />
          </div>

          <div className="input-group-superadmin">
            <label>Descripción</label>
            <textarea
              placeholder="Descripción de la sede (opcional)"
              value={formData.descripcion}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              autoComplete="off"
              required
            />
          </div>

          <div className="input-group-superadmin">
            <label>Ubicación</label>
            {isLoaded ? (
              <Autocomplete
                onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                onPlaceChanged={handlePlaceChanged}
              >
                <input
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
                type="text"
                placeholder="Ej: Av. Corrientes 1234, CABA"
                value={formData.ubicacion}
                onChange={(e) => setFormData((prev) => ({ ...prev, ubicacion: e.target.value }))}
                autoComplete="off"
                required
              />
            )}
          </div>

          {error && <p className="form-error-superadmin">{error}</p>}

          <div className="agregar-sede-actions">
            <BotonGenerico
              className="btn-guardar-grande"
              onClick={handleGuardar}
              disabled={loading}
            >
              <CircleCheck size={20} color="white" />
              <span>{loading ? "Guardando..." : "Guardar sede"}</span>
            </BotonGenerico>

            <BotonGenerico
              style={{ backgroundColor: "grey" }}
              className="btn-cancelar-grande"
              onClick={() => navigate("/superadmin/gestion_empresas", { replace: true, state: { empresaId: Number(formData.idEmpresa) || undefined } })}
            >
              <span>Cancelar</span>
            </BotonGenerico>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}

export default AgregarSede;
