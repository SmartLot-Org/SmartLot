import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import "./agregar_sede.css";
import Header from "../componentesAdmin/header_admin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { SedesCreate } from "../servicies/API_Sede";
import { EmpresasGetById } from "../servicies/API_Empresa";
import useLiveValidation from "../hooks/useLiveValidation";
import FieldValidation from "../components/FieldValidation";
import { useAuth } from "../contexts/useAuth";
import { useGoogleMaps } from "../contexts/useGoogleMaps";

const validationSchema = {
  nombre: [
    { rule: (v) => v?.trim().length > 0, message: "Requerido" },
    { rule: (v) => v?.trim().length >= 2, message: "Mínimo 2 caracteres" },
  ],
};

const AgregarSedeAdminSkeleton = () => (
  <section className="agregar-sede-admin-form agregar-sede-admin-form-skeleton" aria-label="Cargando formulario">
    {Array.from({ length: 4 }).map((_, index) => (
      <div className="input-sede-admin-skeleton" key={index}>
        <span className="skl-line skl-form-label" />
        <span className={`skl-line ${index === 2 ? "skl-form-textarea" : "skl-form-control"}`} />
      </div>
    ))}
    <div className="agregar-sede-admin-actions">
      <span className="skl-line skl-form-button" />
      <span className="skl-line skl-form-button secondary" />
    </div>
  </section>
);

function AgregarSedeAdmin() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    ubicacion: "",
  });
  const [coordenadas, setCoordenadas] = useState({ lat: null, lng: null, direccion: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isLoaded, loadError } = useGoogleMaps();
  if (loadError) console.warn("agregar_sede (admin): Google Maps no cargó:", loadError);

  const autocompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const direccion = place.formatted_address || "";
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

    const fetchEmpresa = async () => {
      setLoadingEmpresa(true);
      try {
        if (!usuario?.id_empresa) return;
        const res = await EmpresasGetById(Number(usuario.id_empresa));
        if (!mounted) return;
        if (res.respuesta) {
          const emp = Array.isArray(res.datos) ? res.datos[0] : res.datos;
          setEmpresaNombre(emp?.nombre || "");
        }
      } finally {
        if (mounted) setLoadingEmpresa(false);
      }
    };

    fetchEmpresa();
    return () => { mounted = false; };
  }, [usuario?.id_empresa]);

  const handleGuardar = async () => {
    setError("");

    if (!isValid) return;
    if (!usuario?.id_empresa) {
      setError("Tu usuario no tiene una empresa asociada.");
      return;
    }

    setLoading(true);

    const response = await SedesCreate({
      id_empresa: Number(usuario.id_empresa),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      ubicacion: formData.ubicacion.trim(),
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
    });

    if (response.respuesta) {
      navigate("/gestion_sedes", { replace: true });
    } else {
      setLoading(false);
      setError(response.datos?.message || "Error al crear la sede.");
    }
  };

  return (
    <div className="agregar-sede-admin">
      <Header />
      <main className="agregar-sede-admin-main">
        <div className="agregar-sede-admin-top">
          <button className="boton-back-agregar" onClick={() => navigate("/gestion_sedes")} aria-label="Volver a gestión de sedes">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p>PANEL DE ADMINISTRACIÓN</p>
            <h1>Agregar Sede</h1>
          </div>
        </div>

        {loadingEmpresa ? (
          <AgregarSedeAdminSkeleton />
        ) : (
          <section className="agregar-sede-admin-form">
            <div className="input-group-sede-admin">
              <label>Empresa</label>
              <div className="empresa-fija-admin">{empresaNombre || "—"}</div>
            </div>

            <div className="input-group-sede-admin">
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

            <div className="input-group-sede-admin">
              <label>Descripción</label>
              <textarea
                placeholder="Descripción de la sede (opcional)"
                value={formData.descripcion}
                onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                rows={3}
                autoComplete="off"
              />
            </div>

            <div className="input-group-sede-admin">
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

            {error && <p className="form-error-sede-admin">{error}</p>}

            <div className="agregar-sede-admin-actions">
              <BotonGenerico
                className="btn-guardar-sede"
                onClick={handleGuardar}
                disabled={loading}
              >
                <CircleCheck size={20} color="white" />
                <span>{loading ? "Guardando..." : "Guardar sede"}</span>
              </BotonGenerico>

              <BotonGenerico
                className="btn-cancelar-sede"
                onClick={() => navigate("/gestion_sedes", { replace: true })}
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

export default AgregarSedeAdmin;
