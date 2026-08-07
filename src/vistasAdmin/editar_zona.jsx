import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import "./editar_zona.css";
import Header from "../componentesAdmin/header_admin";
import {
  ArrowLeft,
  Star,
  CarFront,
  Minus,
  Plus,
  Building2,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  WifiOff,
  Save,
  X,
  PersonStanding,
  ShieldAlert,
  Trash2, 
  Mail
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { Z_INDEX } from "../helpers/zIndex";
import { DIAS_SEMANA } from "../helpers/diasSemana";
import ToastUndo from "../componentesShared/ToastUndo";
import BotonGenerico from "../componentesAdmin/boton_generico";
import SelectorDiasOperativos from "../componentesAdmin/selector_dias_operativos";
import { GaragesUpdate } from "../servicies/API_Garage";
import { UsuariosGetByGarage, UsuariosPatchEstado } from '../servicies/API_Usuario';
import useLiveValidation from "../hooks/useLiveValidation";
import FieldValidation from "../components/FieldValidation";
import FormularioPreciosGarage from "../componentesCompartidos/FormularioPreciosGarage";
import { buildGaragePricesPayload } from "../helpers/prices";

const libraries = ['places'];

const parseEstadoBool = (estado) => {
  if (estado === 1 || estado === true || estado === "1" || estado === "activo" || estado === "Abierto" || estado === "abierto" || estado === "true") return true;
  return false;
};

const obtenerListadoUsuarios = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const obtenerHoraGarage = (garage, claves) => {
  for (const clave of claves) {
    const valor = garage?.[clave];
    if (valor) return String(valor).slice(0, 5);
  }
  return "";
};



function EditarZona() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoGarajistas, setCargandoGarajistas] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const garageData = location.state?.garage;

  const [toast, setToast] = useState(null);
  const toastKeyRef = useRef(0);

  const mostrarToast = (mensaje, onDeshacer) => {
    toastKeyRef.current += 1;
    setToast({ id: toastKeyRef.current, mensaje, onDeshacer });
  };

  const handleArchivarEmpleado = async (id) => {
    try {
      const response = await UsuariosPatchEstado(id, false);

      if (response.respuesta) {
        setUsuarios((prev) =>
          prev.map((user) =>
            (user.id ?? user.id_usuario) === id ? { ...user, activo: false } : user
          )
        );
        mostrarToast("Garajista archivado", async () => {
          const restore = await UsuariosPatchEstado(id, true);
          if (restore.respuesta) {
            setUsuarios((prev) =>
              prev.map((user) =>
                (user.id ?? user.id_usuario) === id ? { ...user, activo: true } : user
              )
            );
          }
        });
      } else {
        Swal.fire("Error", "No se pudo archivar al garajista.", "error");
      }
    } catch (err) {
      console.error("Error al archivar el garajista en el servidor:", err);
      Swal.fire("Error de red", "Hubo un error de red o de servidor. Por favor, inténtalo de nuevo.", "error");
    }
  };

  const obtenerIdGarage = (garage) => garage?.id_garage ?? garage?.idGarage ?? garage?.id ?? garage?._id;

  const [estadoActivo, setEstadoActivo] = useState(() => {
    return garageData ? parseEstadoBool(garageData.estado) : true;
  });
  const [capacidadReservas, setCapacidadReservas] = useState(() => {
    return garageData ? Number(garageData.capacidad_reservas || 0) : 0;
  });
  const [capacidadNoReservas, setCapacidadNoReservas] = useState(() => {
    return garageData ? Number(garageData.capacidad_para_no_reservas || 0) : 0;
  });
  const [nombreGarage, setNombreGarage] = useState(() => {
    return garageData ? (garageData.nombre || '') : 'Garage B';
  });
  const [piso, setPiso] = useState(() => {
    return garageData ? (garageData.piso || '') : 'Piso 2';
  });
  const [ubicacion, setUbicacion] = useState(() => {
    return garageData ? (garageData.ubicacion || '') : '';
  });
  const [horaApertura, setHoraApertura] = useState(() => {
    return garageData ? obtenerHoraGarage(garageData, ['hora_apertura', 'horaApertura', 'apertura']) : '';
  });
  const [horaCierre, setHoraCierre] = useState(() => {
    return garageData ? obtenerHoraGarage(garageData, ['hora_cierre', 'horaCierre', 'cierre']) : '';
  });
  const [es24Horas, setEs24Horas] = useState(false);
  const [precios, setPrecios] = useState({ precio_pickup: garageData?.precio_pickup ?? '', precio_auto: garageData?.precio_auto ?? '', precio_moto: garageData?.precio_moto ?? '' });

  const [diasSeleccionados, setDiasSeleccionados] = useState(() => {
    let diasArray = garageData?.dias;
    if (typeof diasArray === 'string') {
      diasArray = diasArray.replace(/[{}]/g, '').split(',').filter(Boolean);
    }
    if (Array.isArray(diasArray) && diasArray.length > 0) {
      return diasArray.map(d => {
        const found = DIAS_SEMANA.find(dia => dia.api === d || dia.display === d);
        return found ? found.api : d;
      }).filter(Boolean);
    }
    return [];
  });

  const [coordenadas, setCoordenadas] = useState(() => {
    if (garageData?.latitud || garageData?.longitud) {
      return { lat: garageData.latitud ?? null, lng: garageData.longitud ?? null, direccion: garageData.ubicacion || '' };
    }
    return { lat: null, lng: null, direccion: '' };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const capacidad = capacidadReservas + capacidadNoReservas;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_FRONTEND_KEY,
    libraries
  });
  if (loadError) console.warn('editar_zona: Google Maps no cargó:', loadError);

  const autocompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const direccion = place.formatted_address || '';
      setUbicacion(direccion);
      setCoordenadas({ lat, lng, direccion });
    }
  };

  const formDataVal = {
    nombreGarage,
    piso,
    ubicacion,
    horaApertura,
    horaCierre,
    capacidadReservas,
    capacidadNoReservas,
    diasSeleccionados,
  };

  const getSchema = () => ({
    nombreGarage: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 3, message: 'Mínimo 3 caracteres' },
    ],
    piso: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
    ],
    ubicacion: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 5, message: 'Mínimo 5 caracteres' },
      () => ({ rule: () => coordenadas.lat !== null && coordenadas.lng !== null, message: 'Selecciona una ubicación válida del mapa' }),
    ],
    horaApertura: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')), message: 'Formato HH:MM requerido' },
    ],
    horaCierre: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')), message: 'Formato HH:MM requerido' },
      () => ({ rule: () => !formDataVal.horaApertura || !formDataVal.horaCierre || formDataVal.horaApertura < formDataVal.horaCierre, message: 'Apertura debe ser anterior a cierre' }),
    ],
    capacidadReservas: [
      { rule: (v) => Number.isInteger(v) && v >= 0, message: 'Número entero ≥ 0' },
    ],
    capacidadNoReservas: [
      { rule: (v) => Number.isInteger(v) && v >= 0, message: 'Número entero ≥ 0' },
    ],
    diasSeleccionados: [
      { rule: (v) => Array.isArray(v) && v.length > 0, message: 'Selecciona al menos un día' },
    ],
  });

  const { isValid, touched, touch, touchAll } = useLiveValidation(formDataVal, getSchema());

  const buildConditions = (fieldName) => {
    const schema = getSchema();
    if (!schema[fieldName]) return [];
    const value = formDataVal[fieldName];
    return schema[fieldName].map((item) => {
      if (typeof item === 'function') {
        const result = item(value);
        return { label: result.message, met: result.rule(value) };
      }
      return { label: item.message, met: item.rule(value) };
    });
  };

  // --- LÓGICA DE DETECCIÓN DE CAMBIOS (DIRTY STATE) ---
  const isDirty = useMemo(() => {
    if (!garageData) return false;
    
    const origNombre = garageData.nombre || '';
    const origPiso = garageData.piso !== undefined && garageData.piso !== null ? garageData.piso.toString() : '';
    const origUbicacion = garageData.ubicacion || '';
    const origHoraApertura = obtenerHoraGarage(garageData, ['hora_apertura', 'horaApertura', 'apertura']);
    const origHoraCierre = obtenerHoraGarage(garageData, ['hora_cierre', 'horaCierre', 'cierre']);
    const origEstado = parseEstadoBool(garageData.estado);
    const origCapReservas = Number(garageData.capacidad_reservas || 0);
    const origCapNoReservas = Number(garageData.capacidad_para_no_reservas || 0);
    const origDias = Array.isArray(garageData.dias) ? [...garageData.dias].sort() : [];

    return (
      nombreGarage !== origNombre ||
      piso.toString() !== origPiso ||
      ubicacion !== origUbicacion ||
      horaApertura !== origHoraApertura ||
      horaCierre !== origHoraCierre ||
      estadoActivo !== origEstado ||
      capacidadReservas !== origCapReservas ||
      capacidadNoReservas !== origCapNoReservas ||
      [...diasSeleccionados].sort().join(',') !== origDias.join(',')
      || precios.precio_pickup !== (garageData.precio_pickup ?? '')
      || precios.precio_auto !== (garageData.precio_auto ?? '')
      || precios.precio_moto !== (garageData.precio_moto ?? '')
    );
  }, [nombreGarage, piso, ubicacion, horaApertura, horaCierre, estadoActivo, capacidadReservas, capacidadNoReservas, diasSeleccionados, garageData, precios]);

  // Prevenir cierre accidental de pestaña o recarga del navegador
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Tienes cambios sin guardar en el garage. ¿Seguro que deseas salir?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
  // ----------------------------------------------------

  useEffect(() => {
    if (!garageData) {
      navigate("/gestion_garages", { replace: true });
    }
  }, [garageData, navigate]);

  useEffect(() => {
    let estaMontado = true;

    const cargarGarajistasDelGarage = async () => {
      const garageId = obtenerIdGarage(garageData);
      if (!garageId) return;

      setCargandoGarajistas(true);
      const response = await UsuariosGetByGarage(garageId);
      
      if (!estaMontado) return;

      if (response.respuesta) {
        const listaLimpia = obtenerListadoUsuarios(response.datos);
        setUsuarios(listaLimpia);
      }
      setCargandoGarajistas(false);
    };

    cargarGarajistasDelGarage();

    return () => {
      estaMontado = false;
    };
  }, [garageData]);

  const garajistasAsignados = useMemo(() => {
    return usuarios.filter(
      (user) => Number(user.id_rol) === 3 && user.activo !== false
    );
  }, [usuarios]);

  // Interceptor Premium para salidas internas en la SPA
  const volverAGarages = async () => {
    if (isDirty) {
      const result = await Swal.fire({
        title: "Cambios sin guardar",
        text: "Has modificado la configuración del garage. Si sales ahora, perderás las modificaciones.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444", // Rojo destructivo elegante
        cancelButtonColor: "#64748B",
        confirmButtonText: "Salir sin guardar",
        cancelButtonText: "Permanecer aquí",
        reverseButtons: true,
        zIndex: Z_INDEX.SWAL_DIALOG,
      });

      if (!result.isConfirmed) return; // Se queda en la vista
    }
    navigate("/gestion_garages");
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValid) {
      touchAll();
      setError('❌ Corrige los errores antes de guardar.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
         nombre: nombreGarage.trim(),
         piso: String(piso ?? '').trim(),
         ubicacion: ubicacion.trim(),
         latitud: coordenadas.lat ?? null,
         longitud: coordenadas.lng ?? null,
         hora_apertura: horaApertura,
         hora_cierre: horaCierre,
         estado: estadoActivo,
         capacidad: Number(capacidad),
         capacidad_reservas: Number(capacidadReservas),
         capacidad_para_no_reservas: Number(capacidadNoReservas),
         dias: diasSeleccionados
         ,...buildGaragePricesPayload(precios)
      };

      const id = obtenerIdGarage(garageData);

      const response = await GaragesUpdate(id, payload);

      if (response.respuesta) {
        Swal.fire({
          title: "¡Configuración Actualizada!",
          text: "Los cambios del garage han sido guardados correctamente.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          zIndex: Z_INDEX.SWAL_DIALOG,
        });
        navigate("/gestion_garages", { replace: true });
      } else {
        const errorMsg = response.datos?.message || response.datos || 'Error desconocido al actualizar en la BD.';
        const limpio = typeof errorMsg === 'string' ? errorMsg.replace(/\b\d{2,}\b/g, "").replace(/\s+/g, " ").trim() : 'Error al actualizar el garage.';
        setError(`❌ Error al actualizar el garage: ${limpio}`);
      }
    } catch (err) {
      console.error('Error inesperado al guardar:', err);
      setError('❌ Ocurrió un error inesperado. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editar-zona">
      <Header />

      <main className="contenido-editar-zona">
        <section className="editar-zona-top">
          <button
            className="boton-back-editar"
            onClick={volverAGarages}
            aria-label="Volver a gestión de garages"
          >
            <ArrowLeft size={20} />
          </button>

          <p>CONFIGURACIÓN</p>
          <h1>Edición de garage</h1>
          <span>
            Ajusta la información operativa, el estado y la capacidad del garage seleccionado.
          </span>
        </section>

        <form className="formulario-editar-zona" onSubmit={guardarCambios}>
          <FormularioPreciosGarage values={precios} onChange={(name, value) => setPrecios((current) => ({ ...current, [name]: value }))} disabled={loading} />

          <section className="bloque-formulario">
            <div className="bloque-titulo">
              <span className="bloque-icono">
                <Building2 size={20} />
              </span>
              <h3>Información general</h3>
            </div>

            <div className="campo-formulario">
              <label>Nombre del garage</label>
              <input
                type="text"
                placeholder="Garage B, Exterior Norte"
                value={nombreGarage}
                onChange={(e) => { setNombreGarage(e.target.value); touch("nombreGarage"); }}
                autoComplete="off"
                required
              />
              <FieldValidation conditions={buildConditions("nombreGarage")} isTouched={touched.nombreGarage} />
            </div>

            <div className="campo-formulario">
              <label>Nivel / Planta</label>
              <input
                type="text"
                value={piso}
                onChange={(e) => { setPiso(e.target.value); touch("piso"); }}
                placeholder="Ej: Piso 1, Subsuelo"
                autoComplete="off"
                required
              />
              <FieldValidation conditions={buildConditions("piso")} isTouched={touched.piso} />
            </div>

            <div className="campo-formulario">
              <label>Ubicación</label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Ubicación del garage"
                    value={ubicacion}
                    onChange={(e) => { setUbicacion(e.target.value); touch("ubicacion"); }}
                    autoComplete="off"
                    required
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="Ubicación del garage"
                  value={ubicacion}
                  onChange={(e) => { setUbicacion(e.target.value); touch("ubicacion"); }}
                  autoComplete="off"
                  required
                />
              )}
              <FieldValidation conditions={buildConditions("ubicacion")} isTouched={touched.ubicacion} />
            </div>
          </section>

          <section className="bloque-formulario">
            <div className="bloque-titulo">
              <span className="bloque-icono">
                <Clock size={20} />
              </span>
              <h3>Horario operativo</h3>
            </div>

            <div className="horario-grid">
              <div className="horario-field">
                <label className="horario-label">
                  <Clock size={14} />
                  Hora de apertura
                </label>
                <div className={`horario-input-wrap ${es24Horas ? 'horario-input-wrap--disabled' : ''}`}>
                  <input
                    type="time"
                    value={horaApertura}
                    onChange={(e) => {
                      setHoraApertura(e.target.value);
                      touch("horaApertura");
                      if (es24Horas) setEs24Horas(false);
                    }}
                    disabled={es24Horas}
                    required={!es24Horas}
                  />
                  <FieldValidation conditions={buildConditions("horaApertura")} isTouched={touched.horaApertura} />
                </div>
              </div>

              <div className="horario-divider">
                <ArrowLeft size={14} />
              </div>

              <div className="horario-field">
                <label className="horario-label">
                  <Clock size={14} />
                  Hora de cierre
                </label>
                <div className={`horario-input-wrap ${es24Horas ? 'horario-input-wrap--disabled' : ''}`}>
                  <input
                    type="time"
                    value={horaCierre}
                    onChange={(e) => {
                      setHoraCierre(e.target.value);
                      touch("horaCierre");
                      if (es24Horas) setEs24Horas(false);
                    }}
                    disabled={es24Horas}
                    required={!es24Horas}
                  />
                  <FieldValidation conditions={buildConditions("horaCierre")} isTouched={touched.horaCierre} />
                </div>
              </div>

              <label className="toggle-24hs">
                <span className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={es24Horas}
                    onChange={(e) => {
                      const marcado = e.target.checked;
                      setEs24Horas(marcado);
                      if (marcado) {
                        setHoraApertura('00:00');
                        setHoraCierre('23:59');
                      } else {
                        setHoraApertura('');
                        setHoraCierre('');
                      }
                    }}
                  />
                  <span className="toggle-slider" />
                </span>
                <span className="toggle-text">Abierto 24 horas</span>
              </label>
            </div>

            <SelectorDiasOperativos
              value={diasSeleccionados}
              onChange={setDiasSeleccionados}
              validation={{ conditions: buildConditions("diasSeleccionados"), isTouched: touched.diasSeleccionados }}
            />
          </section>

          <section className="bloque-formulario">
            <div className="bloque-titulo">
              <span className="bloque-icono">
                <MapPin size={20} />
              </span>
              <h3>Estado operativo</h3>
            </div>

            <div className="estado-container">
              <button
                type="button"
                className={`estado-btn estado-activo ${estadoActivo ? "activo" : ""}`}
                onClick={() => setEstadoActivo(true)}
              >
                <CheckCircle2 size={21} />
                <strong>Activo</strong>
                <span>Operando normal</span>
              </button>
              <button
                type="button"
                className={`estado-btn estado-desconectado ${!estadoActivo ? "activo" : ""}`}
                onClick={() => setEstadoActivo(false)}
              >
                <WifiOff size={21} />
                <strong>Inactivo</strong>
                <span>Sin conexión</span>
              </button>
            </div>
          </section>

          <section className="bloque-formulario">
            <div className="bloque-titulo">
              <span className="bloque-icono">
                <Layers size={20} />
              </span>
              <h3>Gestión de plazas</h3>
            </div>

            <div className="plazas-resumen">
              <span>Capacidad total de la zona</span>
              <strong>{capacidad} plazas</strong>
            </div>

            <div className="plazas-grid">
              <div className="plaza-item">
                <div className="plaza-top">
                  <div className="plaza-icon">
                    <Star size={18} />
                  </div>
                  <span className="plaza-tag">RESERVAS</span>
                </div>

                <h4>Capacidad Reservas</h4>
                <p>Plazas para usuarios con reserva.</p>

                <div className="contador">
                  <button
                    type="button"
                    onClick={() => setCapacidadReservas((valor) => Math.max(0, valor - 1))}
                    disabled={capacidadReservas === 0}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={capacidadReservas}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setCapacidadReservas(Number.isNaN(value) ? 0 : Math.max(0, value));
                      touch("capacidadReservas");
                    }}
                    autoComplete="off"
                  />
                  <FieldValidation conditions={buildConditions("capacidadReservas")} isTouched={touched.capacidadReservas} />
                  <button
                    type="button"
                    onClick={() => setCapacidadReservas((valor) => valor + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="plaza-item">
                <div className="plaza-top">
                  <div className="plaza-icon">
                    <CarFront size={18} />
                  </div>
                  <span className="plaza-tag">NO RESERVAS</span>
                </div>

                <h4>Capacidad No Reservas</h4>
                <p>Plazas de uso general por llegada.</p>

                <div className="contador">
                  <button
                    type="button"
                    onClick={() => setCapacidadNoReservas((valor) => Math.max(0, valor - 1))}
                    disabled={capacidadNoReservas === 0}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={capacidadNoReservas}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setCapacidadNoReservas(Number.isNaN(value) ? 0 : Math.max(0, value));
                      touch("capacidadNoReservas");
                    }}
                    autoComplete="off"
                  />
                  <FieldValidation conditions={buildConditions("capacidadNoReservas")} isTouched={touched.capacidadNoReservas} />
                  <button
                    type="button"
                    onClick={() => setCapacidadNoReservas((valor) => valor + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bloque-formulario">
            <div className="seccion-garajistas-zona">
              <div className="bloque-titulo" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span className="bloque-icono">
                    <PersonStanding size={20} />
                  </span>
                  <h3>Garajistas Asignados</h3>
                </div>
                <BotonGenerico
                  type="button"
                  className="btn-agregar-garajista-zona"
                  onClick={() => {
                    const garageId = obtenerIdGarage(garageData);
                    navigate("/agregar_garajista", { 
                      state: { 
                        id_garage: garageId,
                        garage: garageData
                      } 
                    })
                  }}
                >
                  <Plus size={16} />
                  <span>Agregar Garajista</span>
                </BotonGenerico>
              </div>

              {cargandoGarajistas ? (
                <div className="gz-no-results">
                  <p>Buscando personal asignado en la base de datos...</p>
                </div>
              ) : garajistasAsignados.length > 0 ? (
                <div className="gz-garajistas-grid">
                  {garajistasAsignados.map((garajista) => {
                    const nombreCompleto = `${garajista.nombre || ''} ${garajista.apellido || ''}`.trim() || "Garajista sin nombre";
                    const garajistaId = garajista.id || garajista.id_usuario;
                    return (
                      <article key={garajistaId} className="gz-garajista-card">
                        <div className="gz-card-header">
                          <h3 className="gz-garajista-name">{nombreCompleto}</h3>
                          <span className="gz-role-badge">Garajista</span>
                        </div>

                        <div className="gz-parking-section">
                          <p className="gz-parking-label">CONTACTO OPERATIVO</p>
                          <div className="gz-parking-pill">
                            <div className="gz-icon-box"><Mail size={16}/></div>
                            <div className="gz-parking-details">
                              <span className="gz-spot-text">{garajista.email || 'Sin email'}</span>
                              <span className="gz-level-text">Tel: {garajista.telefono || 'Sin teléfono'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="gz-footer-row">
                          <BotonGenerico
                            className="gz-btn-eliminar"
                            onClick={() => handleArchivarEmpleado(garajistaId, nombreCompleto)}
                            aria-label={`Archivar garajista ${nombreCompleto}`} 
                          >
                            <Trash2 size={16} className="gz-trash-icon" />
                          </BotonGenerico>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="gz-no-results" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={32} style={{ color: '#94a3b8' }} />
                  <p>No hay ningún garajista asignado operando en este garage actualmente.</p>
                </div>
              )}
            </div>
          </section>

          {error && <div className="error-message" style={{ color: '#d32f2f', padding: '12px', marginBottom: '16px', backgroundColor: '#ffebee', borderRadius: '4px', border: '1px solid #d32f2f' }}>{error}</div>}

          <div className="acciones-formulario">
            <BotonGenerico
              type="button"
              className="btn-cancelar"
              onClick={volverAGarages}
            >
              <X size={18} />
              <span>Cancelar</span>
            </BotonGenerico>

            <BotonGenerico type="submit" className="btn-guardar" disabled={loading}>
              <Save size={18} />
              <span>{loading ? "Guardando..." : "Guardar cambios"}</span>
            </BotonGenerico>
          </div>
        </form>
      </main>

      {toast && (
        <ToastUndo
          key={toast.id}
          message={toast.mensaje}
          onUndo={toast.onDeshacer}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default EditarZona;
