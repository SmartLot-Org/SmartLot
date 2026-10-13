import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Plus } from "lucide-react";
import Swal from "sweetalert2";
import { Z_INDEX } from "../helpers/zIndex";
import Header from "../componentesEmpleado/header_empleado";
import Footer from "../componentesEmpleado/footer_empleado";
import { useAuth } from "../contexts/useAuth";
import { VehiculosCreate } from "../servicies/API_Vehiculo";
import { ModelosGetAll } from "../servicies/API_Modelo";
import { MarcasGetAll } from "../servicies/API_Marca";
import useLiveValidation from "../hooks/useLiveValidation";
import FieldValidation from "../components/FieldValidation";
import { mensajeToast } from "../helpers/erroresMensajes";
import "../componentesEmpleado/formulario_PerfilPersonal.css";
import "../componentesEmpleado/formulario_vehiculo.css";

const validationSchema = {
  modelo: [
    { rule: (v) => v?.trim().length > 0, message: "Requerido" },
  ],
  patente: [
    { rule: (v) => v?.trim().length > 0, message: "Requerido" },
    { rule: (v) => !v || /^[a-zA-Z0-9]{6,8}$/.test(v?.trim()), message: "6-8 caracteres alfanuméricos (ej: AA123BB)" },
  ],
};

export default function AgregarVehiculo() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [formData, setFormData] = useState({ modelo: "", patente: "", idModelo: "" });
  const [guardando, setGuardando] = useState(false);
  const [modelosGlobales, setModelosGlobales] = useState([]);
  const [marcasLookup, setMarcasLookup] = useState({});
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [activoIndex, setActivoIndex] = useState(-1);
  const autocompleteRef = useRef(null);
  const listaAbierta = mostrarSugerencias && sugerencias.length > 0;

  const { touched } = useLiveValidation(formData, validationSchema);

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
    async function cargarCatalogo() {
      try {
        // Ejecutamos ambas llamadas en paralelo para optimizar la velocidad de carga de la pantalla
        const [resultadoModelos, resultadoMarcas] = await Promise.allSettled([
          typeof ModelosGetAll === "function" ? ModelosGetAll() : null,
          typeof MarcasGetAll === "function" ? MarcasGetAll() : null
        ]);

        // 1. Procesamos y guardamos las Marcas en un objeto Indexado por ID para búsquedas O(1)
        let lookupMarcas = {};
        if (resultadoMarcas.status === "fulfilled" && resultadoMarcas.value) {
          const arrayMarcas = resultadoMarcas.value?.datos || resultadoMarcas.value?.data || [];
          if (Array.isArray(arrayMarcas)) {
            arrayMarcas.forEach(m => {
              if (m && m.id) {
                lookupMarcas[m.id] = m.nombre || m.nombre_marca || String(m);
              }
            });
          }
        }
        setMarcasLookup(lookupMarcas);

        // 2. Procesamos y guardamos los Modelos globales
        if (resultadoModelos.status === "fulfilled" && resultadoModelos.value) {
          const arrayModelos = resultadoModelos.value?.datos || [];
          if (Array.isArray(arrayModelos)) {
            setModelosGlobales(arrayModelos);
          } else if (arrayModelos && typeof arrayModelos === "object") {
            const fallback = arrayModelos.data || Object.values(arrayModelos);
            setModelosGlobales(Array.isArray(fallback) ? fallback : []);
          }
        }
      } catch (error) {
        console.error("Error cargando el catálogo de vehículos:", error);
        setModelosGlobales([]);
      }
    }
    cargarCatalogo();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const obtenerIdUsuario = (usr) => usr?.id ?? usr?.id_usuario ?? usr?._id;

  // CORREGIDO: Buscamos el nombre de la marca dinámicamente en nuestro diccionario cruzando el id_marca
  const handleFiltradoModelo = (e) => {
    const valor = e.target.value;
    setFormData((prev) => ({ ...prev, modelo: valor, idModelo: "" }));
    setActivoIndex(-1);

    if (valor.trim().length > 0 && modelosGlobales.length > 0) {
      const filtrados = modelosGlobales.filter((item) => {
        if (!item) return false;
        const nombreModelo = item.nombre || item.nombre_modelo || item.modelo || "";
        
        // Obtenemos el ID de marca del modelo (suele venir como id_marca o marca_id)
        const idMarca = item.id_marca || item.marca_id || item.marca;
        const nombreMarca = marcasLookup[idMarca] || "";
        
        const stringDeBusqueda = `${nombreMarca} ${nombreModelo}`.toLowerCase();
        return stringDeBusqueda.includes(valor.toLowerCase());
      });
      setSugerencias(filtrados);
      setMostrarSugerencias(true);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  // Navegación accesible del listbox: ↑↓ para recorrer, Enter para elegir, Escape para cerrar.
  const handleModeloKeyDown = (e) => {
    const total = sugerencias.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!mostrarSugerencias && formData.modelo) setMostrarSugerencias(true);
      if (total > 0) setActivoIndex((prev) => (prev + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total > 0) setActivoIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activoIndex >= 0 && activoIndex < total) {
        e.preventDefault();
        handleSeleccionarItem(sugerencias[activoIndex]);
      }
    } else if (e.key === "Escape") {
      setMostrarSugerencias(false);
      setActivoIndex(-1);
    }
  };

  // CORREGIDO: Al seleccionar, traemos la marca asociada mediante el ID y seteamos "Marca Modelo" en el input
  const handleSeleccionarItem = (item) => {
    if (!item) return;
    const nombreModelo = item.nombre || item.nombre_modelo || item.modelo || String(item);
    
    const idMarca = item.id_marca || item.marca_id || item.marca;
    const nombreMarca = marcasLookup[idMarca] || "";
    
    const textoCompleto = nombreMarca ? `${nombreMarca} ${nombreModelo}` : nombreModelo;
    
    setFormData((prev) => ({ ...prev, modelo: textoCompleto, idModelo: item.id }));
    setMostrarSugerencias(false);
    setActivoIndex(-1);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (guardando) return;

    const modeloTrim = formData.modelo?.trim();
    const patenteTrim = formData.patente?.trim();
    if (!modeloTrim || !patenteTrim || !formData.idModelo) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Tenés que seleccionar un modelo del catálogo y completar la patente.",
        confirmButtonColor: "#2563EB",
        zIndex: Z_INDEX.SWAL_DIALOG,
      });
      return;
    }

    const subUsuario = usuario?.datos || usuario?.usuario || {};
    const idUsuarioFinal = obtenerIdUsuario(usuario) || subUsuario.id_usuario || subUsuario.id;
    if (!idUsuarioFinal) {
      Swal.fire({
        icon: "error",
        title: "Error de sesión",
        text: "No se pudo detectar el ID del usuario.",
        confirmButtonColor: "#2563EB",
        zIndex: Z_INDEX.SWAL_DIALOG,
      });
      return;
    }

    try {
      setGuardando(true);
      const response = await VehiculosCreate({
        id_usuario: Number(idUsuarioFinal),
        id_modelo: Number(formData.idModelo),
        patente: patenteTrim.toUpperCase(),
      });
      if (response.respuesta) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Vehículo agregado correctamente",
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          zIndex: Z_INDEX.SWAL_DIALOG,
        });
        navigate("/empleados_dashboard");
      } else {
        // Se traduce la razón del servidor en vez de descartarla con un error genérico.
        Swal.fire({
          icon: "error",
          title: "No se pudo agregar el vehículo",
          text: mensajeToast(response?.datos?.message ?? response?.datos?.mensaje ?? response?.datos),
          confirmButtonColor: "#2563EB",
          zIndex: Z_INDEX.SWAL_DIALOG,
        });
      }
    } catch (error) {
      console.error("Error al agregar vehículo:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo agregar el vehículo",
        text: mensajeToast(error?.response?.data?.message ?? error?.message),
        confirmButtonColor: "#2563EB",
        zIndex: Z_INDEX.SWAL_DIALOG,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="Perfil-contenedor">
      <Header />
      <div className="perfilUsuario-Contenedor">
        <main className="perfilUsuario-contenido">
          <div className="top-navigation-bar">
            <button
              className="boton-back"
              onClick={() => navigate("/empleados_dashboard")}
              aria-label="Volver"
              type="button"
            >
              <ArrowLeft size={20} />
            </button>
            <header className="textosTitulosPerfil">
              <h1>Agregar vehículo</h1>
            </header>
          </div>

          <form onSubmit={handleGuardar} className="perfil-form-wrapper">
            <section className="vehiculo-card-seccion formulario-seccion animate-section">
              <div className="form-card-header" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div className="icon-badge-box" style={{ width: "36px", height: "36px", background: "#DBEAFE", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Car size={20} style={{ color: "#2563EB" }} />
                </div>
                <h2 className="formulario-subtitulo" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
                  Nuevo vehículo
                </h2>
              </div>

              <div className="formulario-grid-vehiculo">
                <div className="vehiculo-input-grupo" ref={autocompleteRef} style={{ position: "relative" }}>
                  <label htmlFor="nuevo-modelo">Modelo del vehículo</label>
                  <input
                    type="text"
                    id="nuevo-modelo"
                    className="formulario-input"
                    role="combobox"
                    aria-expanded={listaAbierta}
                    aria-controls="modelo-sugerencias"
                    aria-autocomplete="list"
                    aria-activedescendant={activoIndex >= 0 ? `modelo-opcion-${activoIndex}` : undefined}
                    value={formData.modelo}
                    onChange={handleFiltradoModelo}
                    onFocus={() => formData.modelo && setMostrarSugerencias(true)}
                    onKeyDown={handleModeloKeyDown}
                    placeholder="Ej. Toyota Corolla"
                    autoComplete="off"
                    required
                  />
                  <FieldValidation conditions={buildConditions("modelo")} isTouched={touched.modelo} />
                  {listaAbierta && (
                    <ul
                      id="modelo-sugerencias"
                      role="listbox"
                      aria-label="Sugerencias de modelo"
                      className="autocomplete-suggestions-panel"
                      style={{ listStyle: "none", padding: 0, margin: 0, position: "absolute", width: "100%", zIndex: 100, background: "#fff", border: "1px solid #CBD5E1", borderRadius: "8px", maxHeight: "200px", overflowY: "auto" }}
                    >
                      {sugerencias.map((item, index) => {
                        if (!item) return null;
                        const textoModelo = item.nombre || item.nombre_modelo || item.modelo || String(item);
                        
                        // Extraemos el id_marca de la relación del modelo y buscamos el string real
                        const idMarca = item.id_marca || item.marca_id || item.marca;
                        const textoMarca = marcasLookup[idMarca] || "";

                        return (
                          <li
                            key={item.id || index}
                            id={`modelo-opcion-${index}`}
                            role="option"
                            aria-selected={index === activoIndex}
                            className="autocomplete-item"
                            onClick={() => handleSeleccionarItem(item)}
                            onMouseEnter={() => setActivoIndex(index)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.75rem 1rem",
                              cursor: "pointer",
                              borderBottom: "1px solid #F1F5F9"
                            }}
                          >
                            <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: "500", color: "#1E293B" }}>{textoModelo}</span>
                              {textoMarca && (
                                <span style={{
                                  fontSize: "0.75rem",
                                  backgroundColor: "#DBEAFE",
                                  color: "#2563EB",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "6px",
                                  fontWeight: "600",
                                  border: "1px solid #DBEAFE"
                                }}>
                                  {textoMarca}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="vehiculo-input-grupo">
                  <label htmlFor="nuevo-patente">Matrícula / Patente</label>
                  <input
                    type="text"
                    id="nuevo-patente"
                    className="formulario-input"
                    value={formData.patente}
                    onChange={(e) => setFormData((prev) => ({ ...prev, patente: e.target.value }))}
                    placeholder="Ej. AA123BB"
                    autoComplete="off"
                    required
                  />
                  <FieldValidation conditions={buildConditions("patente")} isTouched={touched.patente} />
                </div>
              </div>

              <button
                type="submit"
                className="btn-add-vehicle"
                disabled={guardando}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  width: "100%",
                  height: "44px",
                  borderRadius: "12px",
                  border: "1px dashed #CBD5E1",
                  backgroundColor: guardando ? "#F1F5F9" : "transparent",
                  color: "#2563EB",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: guardando ? "not-allowed" : "pointer",
                  transition: "border-color 0.2s, background-color 0.2s",
                  marginTop: "0.75rem",
                }}
              >
                <Plus size={18} />
                <span>{guardando ? "Guardando..." : "Agregar vehículo"}</span>
              </button>
            </section>

            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => navigate("/empleados_dashboard")}
            >
              Cancelar
            </button>
          </form>
        </main>
      </div>
      <Footer />
    </div>
  );
}