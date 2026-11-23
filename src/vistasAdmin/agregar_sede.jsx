import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import "./agregar_sede.css";
import Header from "../componentesAdmin/header_admin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { SedesCreate } from "../servicies/API_Sede";
import { EmpresasGetById } from "../servicies/API_Empresa";
import useLiveValidation from "../hooks/useLiveValidation";
import { useAuth } from "../contexts/useAuth";
import { useGoogleMaps } from "../contexts/useGoogleMaps";

const validationSchema = {
  nombre: [
    { rule: (v) => v?.trim().length > 0, message: "Ingresá el nombre de la sede." },
    { rule: (v) => v?.trim().length >= 2, message: "El nombre debe tener al menos 2 caracteres." },
  ],
};

const CENTRO_INICIAL = { lat: -34.6037, lng: -58.3816 };
const OPCIONES_MAPA = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "cooperative",
};
const CAMPOS_DIRECCION = ["formatted_address", "geometry"];

const AgregarSedeAdminSkeleton = ({ mapaNoDisponible }) => (
  <section className="agregar-sede-admin-form" aria-busy="true" aria-label="Cargando formulario de sede">
    <div className="sede-admin-layout" aria-hidden="true">
      <div className="sede-admin-section">
        <span className="sede-admin-skeleton sede-admin-skeleton--heading" />
        <span className="sede-admin-skeleton sede-admin-skeleton--company" />
        <div className="sede-admin-field">
          <span className="sede-admin-skeleton sede-admin-skeleton--label" />
          <span className="sede-admin-skeleton sede-admin-skeleton--control" />
        </div>
        <div className="sede-admin-field">
          <span className="sede-admin-skeleton sede-admin-skeleton--label" />
          <span className="sede-admin-skeleton sede-admin-skeleton--textarea" />
        </div>
      </div>
      <div className="sede-admin-section sede-admin-section--location">
        <span className="sede-admin-skeleton sede-admin-skeleton--heading" />
        <div className="sede-admin-field">
          <span className="sede-admin-skeleton sede-admin-skeleton--label" />
          <span className="sede-admin-skeleton sede-admin-skeleton--control" />
        </div>
        <div className={`sede-admin-skeleton sede-admin-map-frame${mapaNoDisponible ? " sede-admin-map-frame--unavailable" : ""}`} />
      </div>
    </div>
    <div className="sede-admin-footer" aria-hidden="true">
      <div className="agregar-sede-admin-actions">
        <span className="sede-admin-skeleton sede-admin-skeleton--button" />
        <span className="sede-admin-skeleton sede-admin-skeleton--button" />
      </div>
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
  const [coordenadas, setCoordenadas] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isLoaded, loadError } = useGoogleMaps();
  const autocompleteRef = useRef(null);
  const nombreRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const ubicacion = place?.geometry?.location;
    if (!ubicacion || !place.formatted_address) return;

    setFormData((prev) => ({ ...prev, ubicacion: place.formatted_address }));
    setCoordenadas({ lat: ubicacion.lat(), lng: ubicacion.lng() });
  };

  const inputUbicacion = (
    <input
      id="sede-admin-ubicacion"
      type="text"
      placeholder="Ej: Av. Corrientes 1234, CABA"
      value={formData.ubicacion}
      onChange={(e) => {
        setFormData((prev) => ({ ...prev, ubicacion: e.target.value }));
        setCoordenadas(null);
      }}
      autoComplete="off"
      aria-describedby="sede-admin-ubicacion-estado"
    />
  );

  const { errors, isValid, touched, touchAll, getFieldProps } = useLiveValidation(formData, validationSchema);
  const errorNombre = touched.nombre ? errors.nombre?.[0] : undefined;

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

  const handleGuardar = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (!isValid) {
      touchAll();
      nombreRef.current?.focus();
      return;
    }
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
      latitud: coordenadas?.lat ?? null,
      longitud: coordenadas?.lng ?? null,
    });

    if (response.respuesta) {
      navigate("/gestion_sedes", { replace: true });
    } else {
      setLoading(false);
      setError(response.datos?.message || "No se pudo guardar la sede. Intentá de nuevo.");
    }
  };

  return (
    <div className="agregar-sede-admin">
      <Header />
      <main className="agregar-sede-admin-main">
        <header className="agregar-sede-admin-top">
          <Link className="sede-admin-back" to="/gestion_sedes">
            <ArrowLeft size={18} aria-hidden="true" />
            Gestión de sedes
          </Link>
          <h1>Agregar sede</h1>
        </header>

        {loadingEmpresa ? (
          <AgregarSedeAdminSkeleton mapaNoDisponible={Boolean(loadError)} />
        ) : (
          <form className="agregar-sede-admin-form" onSubmit={handleGuardar} noValidate>
            <div className="sede-admin-layout">
              <section className="sede-admin-section" aria-labelledby="sede-admin-datos-titulo">
                <h2 id="sede-admin-datos-titulo">Datos de la sede</h2>
                <div className="sede-admin-company">
                  <Building2 size={20} aria-hidden="true" />
                  <dl>
                    <dt>Empresa</dt>
                    <dd>{empresaNombre || "Nombre no disponible"}</dd>
                  </dl>
                </div>

                <div className="sede-admin-field">
                  <label htmlFor="sede-admin-nombre">Nombre de la sede <span aria-hidden="true" className="sede-admin-required">*</span></label>
                  <input
                    ref={nombreRef}
                    id="sede-admin-nombre"
                    type="text"
                    placeholder="Ej. Sede Centro"
                    {...getFieldProps("nombre", setFormData)}
                    autoComplete="off"
                    aria-invalid={errorNombre ? true : undefined}
                    aria-describedby={errorNombre ? "sede-admin-nombre-error" : undefined}
                    required
                  />
                  {errorNombre && <p id="sede-admin-nombre-error" className="sede-admin-field-error" role="alert">{errorNombre}</p>}
                </div>

                <div className="sede-admin-field">
                  <label htmlFor="sede-admin-descripcion">Descripción <span className="sede-admin-optional">(opcional)</span></label>
                  <textarea
                    id="sede-admin-descripcion"
                    placeholder="Ej. Ingreso por la calle lateral"
                    value={formData.descripcion}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                  />
                </div>
              </section>

              <section className="sede-admin-section sede-admin-section--location" aria-labelledby="sede-admin-ubicacion-titulo">
                <h2 id="sede-admin-ubicacion-titulo">Ubicación</h2>
                <div className="sede-admin-field">
                  <label htmlFor="sede-admin-ubicacion">Dirección</label>
                  {isLoaded ? (
                    <Autocomplete
                      fields={CAMPOS_DIRECCION}
                      onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                      onPlaceChanged={handlePlaceChanged}
                    >
                      {inputUbicacion}
                    </Autocomplete>
                  ) : inputUbicacion}
                </div>

                {loadError ? (
                  <div className="sede-admin-map-frame sede-admin-map-frame--unavailable" id="sede-admin-ubicacion-estado" role="status">
                    <MapPin size={22} aria-hidden="true" />
                    <div>
                      <strong>Mapa no disponible</strong>
                      <p>Podés ingresar la dirección manualmente.</p>
                    </div>
                  </div>
                ) : (
                  <div className="sede-admin-map-preview">
                    <p id="sede-admin-ubicacion-estado" role="status">
                      {!isLoaded ? "Cargando mapa…" : coordenadas ? "La dirección seleccionada está marcada en el mapa." : "Elegí una sugerencia para marcar la dirección en el mapa."}
                    </p>
                    <div className="sede-admin-map-frame" role="group" aria-label="Mapa de ubicación de la sede" aria-busy={!isLoaded}>
                      {isLoaded ? (
                        <GoogleMap
                          mapContainerClassName="sede-admin-map"
                          center={coordenadas || CENTRO_INICIAL}
                          zoom={coordenadas ? 16 : 11}
                          options={OPCIONES_MAPA}
                        >
                          {coordenadas && <Marker position={coordenadas} title={formData.ubicacion} />}
                        </GoogleMap>
                      ) : (
                        <div className="sede-admin-skeleton sede-admin-map" aria-hidden="true"><MapPin size={24} /></div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <footer className="sede-admin-footer">
              {error && <p className="sede-admin-form-error" role="alert">{error}</p>}
              <div className="agregar-sede-admin-actions">
                <BotonGenerico
                  className="sede-admin-button sede-admin-button--secondary"
                  onClick={() => navigate("/gestion_sedes", { replace: true })}
                >
                  Cancelar
                </BotonGenerico>
                <BotonGenerico type="submit" className="sede-admin-button btn-guardar-sede" disabled={loading}>
                  {loading ? "Guardando…" : "Guardar sede"}
                </BotonGenerico>
              </div>
            </footer>
          </form>
        )}
      </main>
    </div>
  );
}

export default AgregarSedeAdmin;
