import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircleQuestion, X } from "lucide-react";
import "./empleados_dashboard.css";
import HeaderEmpleado from "../componentesEmpleado/header_empleado";
import TarjetaReserva from "../componentesEmpleado/tarjeta_reserva";
import ModalEditarReserva from "../componentesEmpleado/modal_editar_reserva";
import { ReservasGetAll, ReservasGetDisponibilidadPorHora } from "../servicies/API_Reserva";
import { VehiculosGetAll } from "../servicies/API_Vehiculo";
import { GaragesGetAll } from "../servicies/API_Garage";
import { UsuariosGetById } from "../servicies/API_Usuario";
import { ModelosGetAll } from "../servicies/API_Modelo";
import { MarcasGetAll } from "../servicies/API_Marca";
import { ConflictosCreate } from "../servicies/API_Conflicto";
import { useAuth } from "../contexts/useAuth";
import FooterEmpleado from "../componentesEmpleado/footer_empleado";
import FormularioDetallesVehiculo from "../componentesEmpleado/formulario_detalles_vehiculo";


const GARAGE_DASHBOARD_STORAGE_KEY = "smartlot_empleado_dashboard_garage";

const MAX_PALABRAS = 300;
const contarPalabras = (texto) => (texto || "").trim().split(/\s+/).filter(Boolean).length;

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.reservas)) return datos.reservas;
  if (Array.isArray(datos?.vehiculos)) return datos.vehiculos;
  if (Array.isArray(datos?.garages)) return datos.garages;
  if (Array.isArray(datos?.value)) return datos.value;
  return [];
};

const obtenerIdUsuario = (usuario) =>
  usuario?.id ??
  usuario?.id_usuario ??
  usuario?.idUsuario ??
  usuario?._id ??
  usuario?.usuario?.id_usuario ??
  usuario?.usuario?.idUsuario ??
  usuario?.usuario?.id ??
  usuario?.datos?.id_usuario ??
  usuario?.datos?.idUsuario ??
  usuario?.datos?.id;
const obtenerIdVehiculo = (vehiculo) => vehiculo?.id ?? vehiculo?.id_vehiculo ?? vehiculo?._id;
const obtenerIdGarage = (item) => item?.id_garage ?? item?.idGarage ?? item?.garage_id ?? item?.garageId ?? item?.garage?.id_garage ?? item?.garage?.id ?? item?.id;
const obtenerIdGarageAsignado = (item) =>
  item?.id_garage ??
  item?.idGarage ??
  item?.garage_id ??
  item?.garageId ??
  item?.garage?.id_garage ??
  item?.garage?.idGarage ??
  item?.garage?.id;
const obtenerIdSedeUsuario = (item) =>
  item?.id_sede ??
  item?.idSede ??
  item?.sede_id ??
  item?.sedeId ??
  item?.sede?.id ??
  item?.sede?.id_sede ??
  item?.usuario?.id_sede ??
  item?.usuario?.idSede ??
  item?.datos?.id_sede ??
  item?.datos?.idSede;

const esGarageActivo = (garage) => {
  const estado = garage?.estado ?? garage?.activo ?? garage?.status;

  if (estado === undefined || estado === null || estado === "") return true;
  if (typeof estado === "boolean") return estado;
  if (typeof estado === "number") return estado === 1;

  if (typeof estado === "string") {
    const estadoNormalizado = estado.trim().toLowerCase();
    return ["true", "activo", "activa", "abierto", "habilitado", "1"].includes(estadoNormalizado);
  }

  return true;
};

const obtenerHoraApertura = (garage) => obtenerCampo(garage, ["hora_apertura", "horaApertura", "apertura"], "");
const obtenerHoraCierre = (garage) => obtenerCampo(garage, ["hora_cierre", "horaCierre", "cierre"], "");

const obtenerObjeto = (datos) => {
  if (!datos || Array.isArray(datos)) return null;
  return datos.usuario ?? datos.datos ?? datos.data ?? datos;
};

const esNombreGenerico = (valor) => {
  const normalizado = String(valor || "").trim().toLowerCase();
  return ["empleado", "admin", "administrador", "garagista", "usuario"].includes(normalizado);
};

const obtenerNombreUsuario = (usuario) => {
  const nombre = esNombreGenerico(usuario?.nombre) ? "" : usuario?.nombre;
  const nombreCompleto = [nombre, usuario?.apellido].filter(Boolean).join(" ").trim();
  const identificador =
    nombreCompleto ||
    usuario?.nombre_usuario ||
    usuario?.nombreUsuario ||
    usuario?.username ||
    usuario?.email?.split("@")[0];

  return identificador || "";
};

const obtenerCampo = (item, claves, fallback = "") => {
  const origenes = [
    item,
    item?.reserva,
    item?.datos,
    item?.data,
    item?._doc,
    item?.dataValues,
  ];

  for (const origen of origenes) {
    const clave = claves.find((key) => origen?.[key] !== undefined && origen?.[key] !== null && origen?.[key] !== "");
    if (clave) return origen[clave];

    if (origen && typeof origen === "object") {
      const entries = Object.entries(origen);
      const claveNormalizada = claves
        .map((key) => key.toLowerCase())
        .find((key) => entries.some(([entryKey, value]) =>
          entryKey.toLowerCase() === key && value !== undefined && value !== null && value !== ""
        ));
      if (claveNormalizada) {
        const entry = entries.find(([entryKey]) => entryKey.toLowerCase() === claveNormalizada);
        if (entry) return entry[1];
      }
    }
  }

  return fallback;
};

const esValorVerdadero = (valor) => {
  if (valor === true || valor === 1) return true;
  if (valor === false || valor === 0 || valor == null) return false;
  if (typeof valor !== "string") return false;

  const texto = valor.trim().toLowerCase();
  if (!texto || ["false", "0", "no", "null", "undefined"].includes(texto)) return false;
  if (["true", "1", "si", "sí", "completo", "completado"].includes(texto)) return true;
  return !Number.isNaN(new Date(valor).getTime());
};

const tieneSalidaRegistrada = (reserva) =>
  [
    obtenerCampo(reserva, ["salida", "egreso", "check_out", "checkOut", "salio"]),
    obtenerCampo(reserva, ["salida_registrada", "salidaRegistrada"]),
    obtenerCampo(reserva, ["fecha_salida_real", "fechaSalidaReal"]),
    obtenerCampo(reserva, ["hora_salida_real", "horaSalidaReal"]),
  ].some(esValorVerdadero);

const tieneEntradaRegistrada = (reserva) =>
  [
    obtenerCampo(reserva, ["entrada", "ingreso", "check_in", "checkIn", "entro"]),
    obtenerCampo(reserva, ["entrada_registrada", "entradaRegistrada"]),
    obtenerCampo(reserva, ["fecha_entrada_real", "fechaEntradaReal"]),
    obtenerCampo(reserva, ["hora_entrada_real", "horaEntradaReal"]),
  ].some(esValorVerdadero);

const obtenerFechaHoraProgramada = (fecha, hora) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) || !/^\d{2}:\d{2}$/.test(String(hora))) {
    return null;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [horas, minutos] = hora.split(":").map(Number);
  const fechaHora = new Date(anio, mes - 1, dia, horas, minutos);

  return Number.isNaN(fechaHora.getTime()) ? null : fechaHora;
};

const obtenerNombreGarage = (garage) =>
  garage
    ? obtenerCampo(garage, ["nombre", "name", "descripcion", "ubicacion", "nombre_garage", "garage_nombre", "nombre_zona", "direccion"], "Garage")
    : "";

const esMismaFecha = (fechaA, fechaB) =>
  fechaA.getFullYear() === fechaB.getFullYear() &&
  fechaA.getMonth() === fechaB.getMonth() &&
  fechaA.getDate() === fechaB.getDate();

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";
  const fechaReserva = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(fechaReserva.getTime())) return fecha;

  const hoy = new Date();
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);

  if (esMismaFecha(fechaReserva, hoy)) return "Hoy";
  if (esMismaFecha(fechaReserva, manana)) return "Manana";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(fechaReserva);
};

const extraerFechaStr = (datetime) => {
  if (!datetime) return "";
  const conEspacio = datetime.split(" ");
  if (conEspacio.length > 1) return conEspacio[0];
  return datetime.split("T")[0];
};

const extraerHoraLocal = (fechaStr) => {
  if (!fechaStr) return "--:--";
  const valor = String(fechaStr);
  if (/^\d{2}:\d{2}/.test(valor)) return valor.slice(0, 5);

  if (valor.includes("T")) {
    const tieneZonaHoraria = /(?:Z|[+-]\d{2}:?\d{2})$/.test(valor);
    if (tieneZonaHoraria) {
      const fecha = new Date(valor);
      if (!Number.isNaN(fecha.getTime())) {
        return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
      }
    }

    const hora = valor.split("T")[1]?.slice(0, 5);
    return hora || "--:--";
  }

  const partes = valor.split(" ");
  if (partes.length > 1) return partes[1].slice(0, 5);

  return "--:--";
};

const normalizarReserva = (reserva, vehiculosPorId, garagesPorId, modelosPorId, marcasPorId) => {
  const idVehiculo = obtenerCampo(reserva, ["id_vehiculo", "idVehiculo", "vehiculo_id", "vehiculoId"]);
  const idGarage = obtenerIdGarageAsignado(reserva);
  const vehiculo = vehiculosPorId.get(Number(idVehiculo));
  const garageReserva = garagesPorId.get(Number(idGarage));
  const patente = obtenerCampo(vehiculo, ["patente", "placa", "matricula"]);
  const idModelo = Number(obtenerCampo(vehiculo, ["id_modelo", "idModelo", "modelo_id"]));
  const modeloObj = modelosPorId.get(idModelo);
  const modelo = modeloObj?.nombre || "";
  const marcaNombre = marcasPorId.get(Number(modeloObj?.id_marca))?.nombre || "";
  const fechaEntrada = obtenerCampo(reserva, ["fecha_entrada", "fechaEntrada", "fecha_inicio", "fechaInicio"]);
  const fechaSalida = obtenerCampo(reserva, ["fecha_salida", "fechaSalida", "fecha_finalizacion", "fechaFinalizacion", "fecha_fin", "fechaFin"]);
  const fecha = obtenerCampo(reserva, ["fecha", "fecha_reserva", "fechaReserva"], extraerFechaStr(fechaEntrada));
  const horaInicio = extraerHoraLocal(fechaEntrada);
  const horaFin = extraerHoraLocal(fechaSalida);
  const ubicacion = obtenerCampo(reserva, ["ubicacion", "sede", "nombre_sede", "garage_nombre"], "") ||
    obtenerNombreGarage(garageReserva) ||
    "Garage asignado";

  const plaza = obtenerCampo(reserva, ["plaza", "nro_plaza", "numero_plaza", "espacio"], patente || "Auto");
  const zona = obtenerCampo(reserva, ["nombre_zona", "nivel", "piso", "sector", "zona"], "Reserva");

  return {
    id: reserva.id ?? reserva.id_reserva ?? `${fecha}-${idVehiculo}-${horaInicio}`,
    fecha,
    fechaLabel: formatearFecha(fecha),
    horario: `${horaInicio} - ${horaFin}`,
    ubicacion,
    plaza,
    nivel: zona,
    nombre_garage: ubicacion,
    nro_plaza: fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", { day: "2-digit", timeZone: "UTC" }) : "-",
    nombre_zona: fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" }) : "Mes",
    hora_entrada: horaInicio,
    hora_salida: horaFin,
    entradaRegistrada: tieneEntradaRegistrada(reserva),
    salidaRegistrada: tieneSalidaRegistrada(reserva),
    vehiculo: vehiculo ? { patente, marca: marcaNombre, modelo } : null,
  };
};

const EmpleadoDashboardIntroSkeleton = () => (
  <div className="empleado-dashboard-intro empleado-dashboard-intro-skeleton" aria-label="Cargando datos del empleado">
    <span className="empleado-skeleton-line empleado-skeleton-kicker" />
    <span className="empleado-skeleton-line empleado-skeleton-title" />
    <span className="empleado-skeleton-line empleado-skeleton-subtitle" />
  </div>
);

const EmpleadoDisponibilidadSkeleton = () => (
  <section className="empleado-disponibilidad-card empleado-disponibilidad-skeleton" aria-label="Cargando disponibilidad">
    <div className="empleado-disponibilidad-top">
      <span className="empleado-skeleton-block empleado-skeleton-parking" />
      <span className="empleado-skeleton-block empleado-skeleton-live" />
    </div>
    <span className="empleado-skeleton-line empleado-skeleton-disponibilidad-label" />
    <div className="empleado-skeleton-availability-row">
      <span className="empleado-skeleton-line empleado-skeleton-big-number" />
      <span className="empleado-skeleton-line empleado-skeleton-capacity-label" />
    </div>
    <span className="empleado-skeleton-line empleado-skeleton-occupancy" />
    <div className="empleado-skeleton-metrics">
      <span className="empleado-skeleton-block empleado-skeleton-chip" />
      <span className="empleado-skeleton-block empleado-skeleton-chip empleado-skeleton-chip-short" />
    </div>
  </section>
);

const EmpleadoReservasSkeleton = () => (
  <div className="empleado-reservas-skeleton-list" aria-label="Cargando reservas">
    {Array.from({ length: 1 }).map((_, index) => (
      <section className="empleado-reservas-section" key={index}>
        <article className="empleado-reserva-card empleado-reserva-card-skeleton">
          <span className="empleado-skeleton-block empleado-skeleton-reserva-plaza" />
          <div className="empleado-skeleton-reserva-info">
            <span className="empleado-skeleton-line empleado-skeleton-reserva-title" />
            <span className="empleado-skeleton-line empleado-skeleton-reserva-text" />
          </div>
          <span className="empleado-skeleton-block empleado-skeleton-reserva-action" />
        </article>
      </section>
    ))}
  </div>
);
  
function EmpleadoDashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [todasReservas, setTodasReservas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [garages, setGarages] = useState([]);
  const [garagesSede, setGaragesSede] = useState([]);
  const [garageUsuario, setGarageUsuario] = useState(null);
  const [garageSeleccionadoId, setGarageSeleccionadoId] = useState("");
  const [modelos, setModelos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deployableOpen, setDeployableOpen] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaNormEditando, setReservaNormEditando] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
  const [descripcionReporte, setDescripcionReporte] = useState("");
  const [prioridadReporte, setPrioridadReporte] = useState("Media");
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [mensajeReporte, setMensajeReporte] = useState(null);
  const reporteSuccessTimeoutRef = useRef(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [disponibilidadHoras, setDisponibilidadHoras] = useState([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  useEffect(() => {
    let montado = true;

    const cargarDatosEmpleado = async () => {
      setLoading(true);
      setError("");

      try {
        const idUsuario = Number(obtenerIdUsuario(usuario));
        const [reservasResponse, vehiculosResponse, garagesResponse, usuarioResponse, modelosResponse, marcasResponse] = await Promise.all([
          ReservasGetAll(),
          VehiculosGetAll(),
          GaragesGetAll(),
          Number.isFinite(idUsuario) ? UsuariosGetById(idUsuario) : Promise.resolve({ respuesta: false, datos: null }),
          ModelosGetAll(),
          MarcasGetAll(),
        ]);

        if (!montado) return;

        const perfilUsuarioApi = usuarioResponse.respuesta ? obtenerObjeto(usuarioResponse.datos) : null;
        const perfilEmpleado = perfilUsuarioApi || usuario;

        if (perfilUsuarioApi) {
          setPerfilUsuario(perfilUsuarioApi);
        }

        const vehiculosApi = vehiculosResponse.respuesta ? obtenerListado(vehiculosResponse.datos) : [];
        const modelosLista = modelosResponse.respuesta ? obtenerListado(modelosResponse.datos) : [];
        const marcasLista = marcasResponse.respuesta ? obtenerListado(marcasResponse.datos) : [];
        const modelosPorIdMap = new Map(modelosLista.map((m) => [Number(m.id ?? m.id_modelo ?? m._id), m]));
        const marcasPorIdMap = new Map(marcasLista.map((m) => [Number(m.id ?? m.id_marca ?? m._id), m]));
        const vehiculosDelUsuario = vehiculosApi
          .filter((vehiculo) => Number(vehiculo.id_usuario ?? vehiculo.idUsuario ?? vehiculo.usuario_id) === idUsuario)
          .map((vehiculo) => {
            const idModelo = Number(vehiculo.id_modelo ?? vehiculo.idModelo ?? vehiculo.modelo_id);
            const modeloObj = modelosPorIdMap.get(idModelo);
            const modelo = modeloObj?.nombre || "";
            const marcaNombre = marcasPorIdMap.get(Number(modeloObj?.id_marca ?? modeloObj?.idMarca))?.nombre || "";
            return { ...vehiculo, marca_nombre: marcaNombre, modelo_nombre: modelo };
          });
        const idsVehiculos = new Set(vehiculosDelUsuario.map((vehiculo) => Number(obtenerIdVehiculo(vehiculo))));

        const reservasApi = reservasResponse.respuesta ? obtenerListado(reservasResponse.datos) : [];
        const reservasDelUsuario = reservasApi.filter((reserva) => {
          const reservaUsuarioId = Number(reserva.id_usuario ?? reserva.idUsuario ?? reserva.usuario_id);
          const reservaVehiculoId = Number(reserva.id_vehiculo ?? reserva.idVehiculo ?? reserva.vehiculo_id ?? reserva.vehiculoId);
          return reservaUsuarioId === idUsuario || idsVehiculos.has(reservaVehiculoId);
        });

        const garages = garagesResponse.respuesta ? obtenerListado(garagesResponse.datos) : [];
        const idSedeEmpleado = Number(obtenerIdSedeUsuario(perfilEmpleado));
        // GaragesGetAll ya aplica el alcance por tratos para la sede autenticada.
        const garagesDeSede = Number.isFinite(idSedeEmpleado)
          ? garages.filter(esGarageActivo)
          : [];
        const idGarageEmpleado = Number(obtenerIdGarageAsignado(perfilEmpleado));
        const garageGuardadoId = Number(localStorage.getItem(GARAGE_DASHBOARD_STORAGE_KEY));
        const garageEncontrado =
          garagesDeSede.find((garage) => Number(obtenerIdGarage(garage)) === garageGuardadoId) ??
          garagesDeSede.find((garage) => Number(obtenerIdGarage(garage)) === idGarageEmpleado) ??
          garagesDeSede[0] ??
          null;

        setVehiculos(vehiculosDelUsuario);
        setGarages(garages);
        setGaragesSede(garagesDeSede);
        setGarageUsuario(garageEncontrado);
        setGarageSeleccionadoId(garageEncontrado ? String(obtenerIdGarage(garageEncontrado)) : "");
        setReservas(reservasDelUsuario);
        setTodasReservas(reservasApi);
        setModelos(modelosResponse.respuesta ? obtenerListado(modelosResponse.datos) : []);
        setMarcas(marcasResponse.respuesta ? obtenerListado(marcasResponse.datos) : []);

        if (!reservasResponse.respuesta || !vehiculosResponse.respuesta) {
          setError("No se pudieron cargar todos tus datos.");
        } else if (!Number.isFinite(idSedeEmpleado)) {
          setError("No se pudo identificar tu sede.");
        } else if (garagesDeSede.length === 0) {
          setError("No hay garages disponibles para tu sede.");
        }
      } catch (err) {
        console.error("Error al cargar el dashboard de empleado:", err);
        if (montado) setError("Ocurrio un error al cargar tus reservas.");
      } finally {
        if (montado) setLoading(false);
      }
    };

    cargarDatosEmpleado();

    return () => {
      montado = false;
    };
  }, [usuario]);

  useEffect(() => {
    let montado = true;

    const cargarDisponibilidad = async () => {
      if (!garageSeleccionadoId) return;
      setCargandoDisponibilidad(true);

      try {
        const response = await ReservasGetDisponibilidadPorHora(garageSeleccionadoId, fechaSeleccionada);
        if (!montado) return;

        if (response.respuesta && response.datos?.horas) {
          const garage = garagesSede.find((g) => String(obtenerIdGarage(g)) === garageSeleccionadoId);
          const apertura = obtenerHoraApertura(garage);
          const cierre = obtenerHoraCierre(garage);
          let horas = response.datos.horas || [];
          if (apertura && cierre) {
            horas = horas.filter((h) => h.hora >= apertura && h.hora <= cierre);
          }
          setDisponibilidadHoras(horas);
          setHoraSeleccionada("");
        }
      } catch (err) {
        console.error("Error al cargar disponibilidad por hora:", err);
      } finally {
        if (montado) setCargandoDisponibilidad(false);
      }
    };

    cargarDisponibilidad();

    return () => { montado = false; };
  }, [garageSeleccionadoId, fechaSeleccionada]);

  useEffect(() => {
    return () => {
      if (reporteSuccessTimeoutRef.current) {
        clearTimeout(reporteSuccessTimeoutRef.current);
      }
    };
  }, []);

  const vehiculosPorId = useMemo(
    () => new Map(vehiculos.map((vehiculo) => [Number(obtenerIdVehiculo(vehiculo)), vehiculo])),
    [vehiculos]
  );

  const garagesPorId = useMemo(
    () => new Map(garages.map((garage) => [Number(obtenerIdGarage(garage)), garage])),
    [garages]
  );

  const modelosPorId = useMemo(
    () => new Map(modelos.map((m) => [Number(m.id ?? m.id_modelo ?? m._id), m])),
    [modelos]
  );

  const marcasPorId = useMemo(
    () => new Map(marcas.map((m) => [Number(m.id ?? m.id_marca ?? m._id), m])),
    [marcas]
  );

  const reservasRawPorId = useMemo(
    () => new Map(reservas.map((r) => [r.id ?? r.id_reserva, r])),
    [reservas]
  );

  const reservasNormalizadas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return reservas
      .map((reserva) => normalizarReserva(reserva, vehiculosPorId, garagesPorId, modelosPorId, marcasPorId))
      .filter((reserva) => {
        if (reserva.salidaRegistrada) return false;
        const salidaProgramada = obtenerFechaHoraProgramada(reserva.fecha, reserva.hora_salida);
        if (!reserva.entradaRegistrada && salidaProgramada && salidaProgramada <= new Date()) return false;
        if (!reserva.fecha) return true;
        const fecha = new Date(`${reserva.fecha}T00:00:00`);
        return Number.isNaN(fecha.getTime()) || fecha >= hoy;
      })
      .sort((a, b) => `${a.fecha} ${a.horario}`.localeCompare(`${b.fecha} ${b.horario}`));
  }, [reservas, vehiculosPorId, garagesPorId, modelosPorId, marcasPorId]);

  const reservaPrincipal = reservasNormalizadas[0] || null;
  const restoReservas = reservasNormalizadas.slice(1);
  const tieneResto = restoReservas.length > 0;
  const capacidadReservas = Number(garageUsuario?.capacidad_reservas || 0);
  const capacidadNoReservas = Number(garageUsuario?.capacidad_para_no_reservas || 0);
  const ocupacionReservas = Number(garageUsuario?.ocupacion_reservas || 0);
  const ocupacionNoReservas = Number(garageUsuario?.ocupacion_no_reservas || 0);
  const totalCapacidad = capacidadReservas + capacidadNoReservas;
  const ocupacion = ocupacionReservas + ocupacionNoReservas;
  const porcentajeOcupacion = totalCapacidad > 0 ? Math.round((ocupacion / totalCapacidad) * 100) : null;
  const pctReservas = capacidadReservas > 0 ? Math.round((ocupacionReservas / capacidadReservas) * 100) : 0;
  const pctNoReservas = capacidadNoReservas > 0 ? Math.round((ocupacionNoReservas / capacidadNoReservas) * 100) : 0;
  const libresNoReservas = capacidadNoReservas > 0 ? Math.max(capacidadNoReservas - ocupacionNoReservas, 0) : null;

  const reservasDelGarage = useMemo(() => {
    if (!garageSeleccionadoId) return 0;
    const idGarageNum = Number(garageSeleccionadoId);
    return todasReservas.filter((r) => Number(obtenerIdGarageAsignado(r)) === idGarageNum).length;
  }, [todasReservas, garageSeleccionadoId]);
  const capacidadReservasDisponible = Math.max(capacidadReservas - reservasDelGarage, 0);

  const horaDataActual = useMemo(() => {
    if (!horaSeleccionada || disponibilidadHoras.length === 0) return null;
    return disponibilidadHoras.find((h) => h.hora === horaSeleccionada) || null;
  }, [horaSeleccionada, disponibilidadHoras]);

  const nombre = obtenerNombreUsuario(perfilUsuario || usuario);

  const handleGarageDashboardChange = (event) => {
    const nuevoId = event.target.value;
    const garageSeleccionado = garagesSede.find((garage) => String(obtenerIdGarage(garage)) === nuevoId) ?? null;

    setGarageSeleccionadoId(nuevoId);
    setGarageUsuario(garageSeleccionado);
    setHoraSeleccionada("");
    localStorage.setItem(GARAGE_DASHBOARD_STORAGE_KEY, nuevoId);
  };

  const handleHoraChange = (event) => {
    setHoraSeleccionada(event.target.value);
  };

  const handleFechaChange = (event) => {
    setFechaSeleccionada(event.target.value);
  };

  const handleReservaClick = (reservaNorm) => {
    const raw = reservasRawPorId.get(reservaNorm.id);
    if (raw) {
      setReservaEditando(raw);
      setReservaNormEditando(reservaNorm);
    }
  };

  const handleCopyReserva = (reservaNorm) => {
    const raw = reservasRawPorId.get(reservaNorm.id);
    if (!raw) return;

    const horaInicio = extraerHoraLocal(obtenerCampo(raw, ["fecha_entrada", "fechaEntrada", "fecha_inicio", "fechaInicio"]));
    const horaFin = extraerHoraLocal(obtenerCampo(raw, ["fecha_salida", "fechaSalida", "fecha_finalizacion", "fechaFinalizacion", "fecha_fin", "fechaFin"]));
    const idGarage = Number(obtenerIdGarageAsignado(raw));
    const idVehiculo = Number(obtenerCampo(raw, ["id_vehiculo", "idVehiculo", "vehiculo_id", "vehiculoId"]));

    navigate("/nueva_reserva", {
      state: {
        copiaReserva: { horaInicio, horaFin, idGarage, idVehiculo },
      },
    });
  };

  const handleReservaActualizada = (reservaActualizada) => {
    setReservas((prev) =>
      prev.map((r) => {
        const id = r.id ?? r.id_reserva;
        return Number(id) === Number(reservaActualizada.id ?? reservaActualizada.id_reserva)
          ? reservaActualizada
          : r;
      })
    );
    setReservaEditando(null);
    setReservaNormEditando(null);
  };

  const handleReservaEliminada = (idReserva) => {
    setReservas((prev) =>
      prev.filter((r) => {
        const id = r.id ?? r.id_reserva;
        return Number(id) !== Number(idReserva);
      })
    );
    setReservaEditando(null);
    setReservaNormEditando(null);
  };

  const abrirModalReporte = () => {
    if (reporteSuccessTimeoutRef.current) {
      clearTimeout(reporteSuccessTimeoutRef.current);
      reporteSuccessTimeoutRef.current = null;
    }
    setMensajeReporte(null);
    setModalReporteOpen(true);
  };

  const cerrarModalReporte = () => {
    if (enviandoReporte) return;
    if (reporteSuccessTimeoutRef.current) {
      clearTimeout(reporteSuccessTimeoutRef.current);
      reporteSuccessTimeoutRef.current = null;
    }
    setModalReporteOpen(false);
    setDescripcionReporte("");
    setPrioridadReporte("Media");
    setMensajeReporte(null);
  };

  const handleEnviarReporte = async (event) => {
    event.preventDefault();
    const descripcion = descripcionReporte.trim();
    const idUsuario = Number(obtenerIdUsuario(perfilUsuario || usuario));

    if (!descripcion) {
      setMensajeReporte({ tipo: "error", texto: "Describi brevemente el problema." });
      return;
    }

    if (contarPalabras(descripcion) > MAX_PALABRAS) {
      setMensajeReporte({ tipo: "error", texto: `La descripcion no puede tener mas de ${MAX_PALABRAS} palabras.` });
      return;
    }

    if (!Number.isFinite(idUsuario)) {
      setMensajeReporte({ tipo: "error", texto: "No se pudo identificar tu usuario." });
      return;
    }

    setEnviandoReporte(true);
    setMensajeReporte(null);

    const resultado = await ConflictosCreate({
      id_usuario: idUsuario,
      descripcion,
      prioridad: prioridadReporte,
    });

    if (resultado.respuesta) {
      setDescripcionReporte("");
      setPrioridadReporte("Media");
      setMensajeReporte({ tipo: "success", texto: "Mensaje enviado correctamente." });
      reporteSuccessTimeoutRef.current = setTimeout(() => {
        setModalReporteOpen(false);
        setMensajeReporte(null);
        reporteSuccessTimeoutRef.current = null;
      }, 1600);
    } else {
      setMensajeReporte({ tipo: "error", texto: resultado.datos?.message || "No se pudo enviar el reporte." });
    }

    setEnviandoReporte(false);
  };

  return (
    <div className="empleado-dashboard-page">
      <HeaderEmpleado />
      <main className="empleado-dashboard-main">
        {loading ? (
          <>
            <EmpleadoDashboardIntroSkeleton />
          </>
        ) : (
         
            <div className="empleado-dashboard-intro">
              <span className="empleado-dashboard-kicker">{new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</span>
              <h1 className="empleado-dashboard-title">
                Hola{nombre ? ` ${nombre}` : ""}
              </h1>
            </div>
        )}

        <div className="empleado-reservas-header">
          <div>
            <span>Agenda</span>
            <h2>Mis Reservas Actuales</h2>
          </div>
          <button
            type="button"
            className="empleado-reportar-problema-link"
            onClick={abrirModalReporte}
          >
            <MessageCircleQuestion size={16} />
            Soporte
          </button>
        </div>

        {error && (
          <div className="empleado-dashboard-feedback empleado-dashboard-feedback-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <EmpleadoReservasSkeleton />
        ) : reservasNormalizadas.length > 0 ? (
          <>
            <TarjetaReserva key={reservasNormalizadas[0].id} reserva={reservasNormalizadas[0]} onClick={handleReservaClick} onCopy={handleCopyReserva} />
            {tieneResto && (
              <button type="button" className={`empleado-reservas-toggle${deployableOpen ? " empleado-reservas-toggle--open" : ""}`} onClick={() => setDeployableOpen((prev) => !prev)}>
                <span>{deployableOpen ? "Ocultar" : `Mostrar todas (${restoReservas.length})`}</span>
                <span className="empleado-reservas-toggle-arrow" aria-hidden="true">&gt;</span>
              </button>
            )}
            <div className={`empleado-reservas-rest${deployableOpen ? " empleado-reservas-rest--open" : ""}`}>
              {restoReservas.map((reserva) => (
                <TarjetaReserva key={reserva.id} reserva={reserva} onClick={handleReservaClick} onCopy={handleCopyReserva} />
              ))}
            </div>
          </>
        ) : (
          <div className="empleado-dashboard-feedback">
            No tenes reservas activas.
          </div>
        )}

        <button
          type="button"
          className="empleado-nueva-reserva-btn"
          onClick={() => navigate("/nueva_reserva")}
        >
          Nueva reserva
        </button>

       <FormularioDetallesVehiculo vehiculos={vehiculos} onVehiculoEliminado={(id) => setVehiculos((prev) => prev.filter((v) => (v.id ?? v.id_vehiculo ?? v._id) !== id))} />

      
      </main>
      <FooterEmpleado />

      {modalReporteOpen && (
        <div className="empleado-reporte-overlay" role="presentation" onMouseDown={cerrarModalReporte}>
          <section
            className="empleado-reporte-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="empleado-reporte-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="empleado-reporte-header">
              <div>
                <span>Soporte</span>
                <h2 id="empleado-reporte-title">Reportar problema</h2>
              </div>
              <button type="button" className="empleado-reporte-close" onClick={cerrarModalReporte} aria-label="Cerrar reporte">
                <X size={20} />
              </button>
            </div>

            <form className="empleado-reporte-form" onSubmit={handleEnviarReporte}>
              <label className="empleado-reporte-field">
                <span>Prioridad</span>
                <select value={prioridadReporte} onChange={(event) => setPrioridadReporte(event.target.value)}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </label>

              <label className="empleado-reporte-field">
                <span>Descripcion</span>
                <textarea
                  value={descripcionReporte}
                  onChange={(event) => setDescripcionReporte(event.target.value)}
                  placeholder="Contanos que paso"
                  rows={5}
                  maxLength={3000}
                />
                <span className={`empleado-reporte-wordcount ${contarPalabras(descripcionReporte) > MAX_PALABRAS ? "empleado-reporte-wordcount--exceeded" : ""}`}>
                  {contarPalabras(descripcionReporte)}/{MAX_PALABRAS} palabras
                </span>
              </label>

              {mensajeReporte && (
                <div className={`empleado-reporte-feedback empleado-reporte-feedback--${mensajeReporte.tipo}`} role="alert">
                  {mensajeReporte.texto}
                </div>
              )}

              <button type="submit" className="empleado-reporte-submit" disabled={enviandoReporte || mensajeReporte?.tipo === "success"}>
                {enviandoReporte ? "Enviando..." : "Enviar reporte"}
              </button>
            </form>
          </section>
        </div>
      )}

      {reservaEditando && reservaNormEditando && (
        <ModalEditarReserva
          reservaRaw={reservaEditando}
          reservaNorm={reservaNormEditando}
          onClose={() => { setReservaEditando(null); setReservaNormEditando(null); }}
          onActualizada={handleReservaActualizada}
          onEliminada={handleReservaEliminada}
        />
      )}
    </div>
  );
}

export default EmpleadoDashboard;
