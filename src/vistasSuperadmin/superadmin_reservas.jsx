import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  ParkingCircle,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import "./superadmin_reservas.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { ReservasGetAll } from "../servicies/API_Reserva";
import { GaragesGetAll } from "../servicies/API_Garage";
import { SedesGetAll } from "../servicies/API_Sede";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { UsuariosGetAll } from "../servicies/API_Usuario";
import { VehiculosGetAll } from "../servicies/API_Vehiculo";
import { ModelosGetAll } from "../servicies/API_Modelo";
import { MarcasGetAll } from "../servicies/API_Marca";
import { TratosGetAll } from "../servicies/API_TratoEmpresaGarage";

gsap.registerPlugin(useGSAP);

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.reservas)) return datos.reservas;
  return [];
};

const obtenerCampo = (item, claves, fallback = "") => {
  const origenes = [item, item?.reserva, item?.datos, item?.data, item?._doc, item?.dataValues];
  for (const origen of origenes) {
    const clave = claves.find((key) => origen?.[key] !== undefined && origen?.[key] !== null && origen?.[key] !== "");
    if (clave) return origen[clave];
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

const tieneEntradaRegistrada = (reserva) =>
  [
    obtenerCampo(reserva, ["entrada", "ingreso", "check_in", "checkIn", "entro"]),
    obtenerCampo(reserva, ["entrada_registrada", "entradaRegistrada"]),
    obtenerCampo(reserva, ["fecha_entrada_real", "fechaEntradaReal"]),
    obtenerCampo(reserva, ["hora_entrada_real", "horaEntradaReal"]),
  ].some(esValorVerdadero);

const tieneSalidaRegistrada = (reserva) =>
  [
    obtenerCampo(reserva, ["salida", "egreso", "check_out", "checkOut", "salio"]),
    obtenerCampo(reserva, ["salida_registrada", "salidaRegistrada"]),
    obtenerCampo(reserva, ["fecha_salida_real", "fechaSalidaReal"]),
    obtenerCampo(reserva, ["hora_salida_real", "horaSalidaReal"]),
  ].some(esValorVerdadero);

const TZ_ARG = "America/Argentina/Buenos_Aires";

const tieneZonaHoraria = (valor) => /(?:Z|[+-]\d{2}:?\d{2})$/.test(String(valor).trim());

const extraerFechaStr = (datetime) => {
  if (!datetime) return "";
  const valor = String(datetime).trim();
  if (tieneZonaHoraria(valor)) {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: TZ_ARG,
      }).format(fecha);
    }
  }
  const conEspacio = valor.split(" ");
  if (conEspacio.length > 1) return conEspacio[0];
  return valor.split("T")[0];
};

const extraerHoraLocal = (fechaStr) => {
  if (!fechaStr) return "--:--";
  const valor = String(fechaStr).trim();
  if (/^\d{2}:\d{2}/.test(valor) && !valor.includes("T") && !valor.includes(" ")) return valor.slice(0, 5);

  if (tieneZonaHoraria(valor)) {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: TZ_ARG,
      }).format(fecha);
    }
  }

  if (valor.includes("T")) {
    const hora = valor.split("T")[1]?.slice(0, 5);
    return hora && /^\d{2}:\d{2}$/.test(hora) ? hora : "--:--";
  }

  const partes = valor.split(" ");
  if (partes.length > 1) return partes[1].slice(0, 5);
  return "--:--";
};

const fechaHoyStr = () => {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ_ARG,
  }).format(new Date());
};

const formatearFechaCorta = (fecha) => {
  if (!fecha) return "Sin fecha";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    const [y, m, d] = String(fecha).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 15, 0, 0));
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: TZ_ARG,
    }).format(date);
  }
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ_ARG,
  }).format(date);
};

const ESTADOS = {
  programada: { label: "Programada", clase: "resv-estado--programada" },
  en_curso: { label: "En curso", clase: "resv-estado--curso" },
  finalizada: { label: "Finalizada", clase: "resv-estado--finalizada" },
  vencida: { label: "Vencida", clase: "resv-estado--vencida" },
  cancelada: { label: "Cancelada", clase: "resv-estado--cancelada" },
};

const ESTADO_ORDER = ["programada", "en_curso", "finalizada", "vencida", "cancelada"];

const HORAS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

const derivarEstado = (reserva, fecha, horaFin) => {
  if (esValorVerdadero(obtenerCampo(reserva, ["borrado", "Borrado", "cancelada", "anulada"]))) return "cancelada";
  if (tieneSalidaRegistrada(reserva)) return "finalizada";
  if (tieneEntradaRegistrada(reserva)) return "en_curso";

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) && /^\d{2}:\d{2}$/.test(String(horaFin))) {
    const fin = new Date(`${fecha}T${horaFin}:00-03:00`);
    if (!Number.isNaN(fin.getTime()) && fin < new Date()) return "vencida";
  }
  return "programada";
};

const ReservasTableSkeleton = ({ rows = 6 }) => (
  <div className="resv-table-shell" aria-label="Cargando reservas">
    <table className="resv-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Vehiculo</th>
          <th>Garage</th>
          <th>Empresa / Sede</th>
          <th>Fecha</th>
          <th>Horario</th>
          <th>En el garage</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index}>
            {Array.from({ length: 8 }).map((_, col) => (
              <td key={col}>
                <span className="resv-skeleton-line" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function SuperadminReservas() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [reservas, setReservas] = useState([]);
  const [garages, setGarages] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [tratos, setTratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroHoraDesde, setFiltroHoraDesde] = useState("");
  const [filtroHoraHasta, setFiltroHoraHasta] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroGarage, setFiltroGarage] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPresencia, setFiltroPresencia] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let montado = true;

    const cargarDatos = async () => {
      try {
        const [reservasRes, garagesRes, sedesRes, empresasRes, usuariosRes, vehiculosRes, modelosRes, marcasRes, tratosRes] =
          await Promise.all([
            ReservasGetAll({ force: recarga > 0 }),
            GaragesGetAll(),
            SedesGetAll(),
            EmpresasGetAll(),
            UsuariosGetAll(),
            VehiculosGetAll(),
            ModelosGetAll(),
            MarcasGetAll(),
            TratosGetAll(),
          ]);

        if (!montado) return;

        if (!reservasRes.respuesta) {
          setError("No se pudieron cargar las reservas.");
        }

        setReservas(reservasRes.respuesta ? obtenerListado(reservasRes.datos) : []);
        setGarages(garagesRes.respuesta ? obtenerListado(garagesRes.datos) : []);
        setSedes(sedesRes.respuesta ? obtenerListado(sedesRes.datos) : []);
        setEmpresas(empresasRes.respuesta ? obtenerListado(empresasRes.datos) : []);
        setUsuarios(usuariosRes.respuesta ? obtenerListado(usuariosRes.datos) : []);
        setVehiculos(vehiculosRes.respuesta ? obtenerListado(vehiculosRes.datos) : []);
        setModelos(modelosRes.respuesta ? obtenerListado(modelosRes.datos) : []);
        setMarcas(marcasRes.respuesta ? obtenerListado(marcasRes.datos) : []);
        setTratos(tratosRes.respuesta ? obtenerListado(tratosRes.datos) : []);
      } catch (err) {
        console.error("Error al cargar las reservas del sistema:", err);
        if (montado) setError("Ocurrio un error al cargar las reservas.");
      } finally {
        if (montado) {
          setLoading(false);
          setRefrescando(false);
        }
      }
    };

    cargarDatos();
    return () => { montado = false; };
  }, [recarga]);

  const handleRefrescar = () => {
    setRefrescando(true);
    setError("");
    setRecarga((n) => n + 1);
  };

  const reservasNormalizadas = useMemo(() => {
    const usuariosPorId = new Map(usuarios.map((u) => [Number(u.id ?? u.id_usuario), u]));
    const vehiculosPorId = new Map(vehiculos.map((v) => [Number(v.id ?? v.id_vehiculo ?? v._id), v]));
    const modelosPorId = new Map(modelos.map((m) => [Number(m.id ?? m.id_modelo ?? m._id), m]));
    const marcasPorId = new Map(marcas.map((m) => [Number(m.id ?? m.id_marca ?? m._id), m]));
    const sedesPorId = new Map(sedes.map((s) => [Number(s.id ?? s.id_sede), s]));
    const empresasPorId = new Map(empresas.map((e) => [Number(e.id ?? e.id_empresa), e]));
    const garagesPorId = new Map(
      garages.map((g) => [Number(g.id_garage ?? g.id ?? g._id), g])
    );

    return reservas.map((reserva) => {
      const id = reserva.id ?? reserva.id_reserva;
      const fechaEntrada = obtenerCampo(reserva, ["fecha_entrada", "fechaEntrada", "fecha_inicio", "fechaInicio"]);
      const fechaSalida = obtenerCampo(reserva, ["fecha_salida", "fechaSalida", "fecha_finalizacion", "fechaFinalizacion", "fecha_fin", "fechaFin"]);
      const fecha = obtenerCampo(reserva, ["fecha", "fecha_reserva", "fechaReserva"], extraerFechaStr(fechaEntrada));
      const horaInicio = extraerHoraLocal(fechaEntrada);
      const horaFin = extraerHoraLocal(fechaSalida);

      const idGarage = Number(obtenerCampo(reserva, ["id_garage", "idGarage", "garage_id", "garageId"]));
      const garage = garagesPorId.get(idGarage);

      const idVehiculo = Number(obtenerCampo(reserva, ["id_vehiculo", "idVehiculo", "vehiculo_id", "vehiculoId"]));
      const vehiculo = vehiculosPorId.get(idVehiculo);
      const modeloObj = modelosPorId.get(Number(vehiculo?.id_modelo ?? vehiculo?.idModelo));
      const marcaNombre = marcasPorId.get(Number(modeloObj?.id_marca ?? modeloObj?.idMarca))?.nombre || "";
      const patente = obtenerCampo(vehiculo, ["patente", "placa", "matricula"]);

      const idUsuario = Number(
        obtenerCampo(reserva, ["id_usuario", "idUsuario", "usuario_id"]) ||
        vehiculo?.id_usuario ||
        vehiculo?.idUsuario
      );
      const usuario = usuariosPorId.get(idUsuario);
      const idSede = Number(usuario?.id_sede ?? usuario?.idSede);
      const sede = sedesPorId.get(idSede);
      const idEmpresa = Number(sede?.id_empresa ?? sede?.idEmpresa ?? usuario?.id_empresa);
      const empresa = empresasPorId.get(idEmpresa);
      const nombreUsuario = usuario
        ? `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || usuario.email
        : `Usuario #${Number.isFinite(idUsuario) ? idUsuario : "-"}`;

      const estado = derivarEstado(reserva, fecha, horaFin);
      const entradaRegistrada = tieneEntradaRegistrada(reserva);
      const salidaRegistrada = tieneSalidaRegistrada(reserva);
      const estaDentro = entradaRegistrada && !salidaRegistrada;

      return {
        id: id ?? `${fecha}-${idVehiculo}-${horaInicio}`,
        fecha,
        horaInicio,
        horaFin,
        estado,
        estaDentro,
        idGarage: Number.isFinite(idGarage) ? idGarage : null,
        idSede: Number.isFinite(idSede) ? idSede : null,
        idEmpresa: Number.isFinite(idEmpresa) ? idEmpresa : null,
        nombreGarage: garage
          ? garage.nombre || garage.name || garage.descripcion || garage.ubicacion || `Garage #${idGarage}`
          : idGarage ? `Garage #${idGarage}` : "Sin garage",
        nombreSede: sede ? sede.nombre || sede.name || `Sede #${idSede}` : "Sin sede",
        nombreEmpresa: empresa ? empresa.nombre || empresa.name || `Empresa #${idEmpresa}` : "Sin empresa",
        nombreUsuario,
        emailUsuario: usuario?.email || "",
        patente: patente || "Sin patente",
        vehiculoDetalle: [marcaNombre, modeloObj?.nombre].filter(Boolean).join(" "),
      };
    });
  }, [reservas, garages, sedes, empresas, usuarios, vehiculos, modelos, marcas]);

  const sedesDisponibles = useMemo(
    () => (filtroEmpresa ? sedes.filter((s) => Number(s.id_empresa ?? s.idEmpresa) === Number(filtroEmpresa)) : sedes),
    [sedes, filtroEmpresa]
  );

  const garagesDisponibles = useMemo(() => {
    const garageIds = new Set(tratos
      .filter((trato) => !filtroSede || Number(trato.id_sede) === Number(filtroSede))
      .filter((trato) => !filtroEmpresa || Number(trato.id_empresa) === Number(filtroEmpresa))
      .map((trato) => Number(trato.id_garage)));
    if (!filtroSede && !filtroEmpresa) return garages;
    return garages.filter((garage) => garageIds.has(Number(garage.id_garage ?? garage.id)));
  }, [garages, tratos, filtroSede, filtroEmpresa]);

  const reservasFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return reservasNormalizadas
      .filter((reserva) => {
        if (filtroFecha && reserva.fecha !== filtroFecha) return false;
        if (filtroHoraDesde && reserva.horaFin !== "--:--" && reserva.horaFin < filtroHoraDesde) return false;
        if (filtroHoraHasta && reserva.horaInicio !== "--:--" && reserva.horaInicio > filtroHoraHasta) return false;
        if (filtroEmpresa && reserva.idEmpresa !== Number(filtroEmpresa)) return false;
        if (filtroSede && reserva.idSede !== Number(filtroSede)) return false;
        if (filtroGarage && reserva.idGarage !== Number(filtroGarage)) return false;
        if (filtroEstado && reserva.estado !== filtroEstado) return false;
        if (filtroPresencia === "dentro" && !reserva.estaDentro) return false;
        if (filtroPresencia === "fuera" && reserva.estaDentro) return false;

        if (!query) return true;
        return [
          reserva.nombreUsuario,
          reserva.emailUsuario,
          reserva.patente,
          reserva.vehiculoDetalle,
          reserva.nombreGarage,
          reserva.nombreSede,
          reserva.nombreEmpresa,
        ].some((valor) => String(valor || "").toLowerCase().includes(query));
      })
      .sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`));
  }, [reservasNormalizadas, busqueda, filtroFecha, filtroHoraDesde, filtroHoraHasta, filtroEmpresa, filtroSede, filtroGarage, filtroEstado, filtroPresencia]);

  const hoy = fechaHoyStr();
  const stats = useMemo(() => ({
    total: reservasFiltradas.length,
    hoy: reservasFiltradas.filter((r) => r.fecha === hoy).length,
    dentro: reservasFiltradas.filter((r) => r.estaDentro).length,
    programadas: reservasFiltradas.filter((r) => r.estado === "programada").length,
  }), [reservasFiltradas, hoy]);

  const hayFiltros = Boolean(
    busqueda || filtroFecha || filtroHoraDesde || filtroHoraHasta || filtroEmpresa || filtroSede || filtroGarage || filtroEstado || filtroPresencia
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroFecha("");
    setFiltroHoraDesde("");
    setFiltroHoraHasta("");
    setFiltroEmpresa("");
    setFiltroSede("");
    setFiltroGarage("");
    setFiltroEstado("");
    setFiltroPresencia("");
  };

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.5 } });
      tl.from(".resv-animate-header", { y: 24, opacity: 0 })
        .from(".resv-animate-stat", { y: 16, opacity: 0, stagger: 0.06 }, "-=0.25")
        .from(".resv-animate-toolbar", { y: 16, opacity: 0 }, "-=0.2")
        .from(".resv-animate-table", { y: 20, opacity: 0 }, "-=0.2");
    }
  }, { dependencies: [loading], scope: containerRef });

  return (
    <div className="superadmin-reservas-page" ref={containerRef}>
      <HeaderSuperadmin />

      <main className="superadmin-reservas-main">
        <header className="resv-header resv-animate-header">
          <div className="resv-header-left">
            <button className="boton-back" onClick={() => navigate("/superadmin_dashboard")} aria-label="Volver al dashboard">
              <ArrowLeft size={24} />
            </button>
            <div className="resv-titulos">
              <h1>Reservas del Sistema</h1>
              <p>Todas las reservas de todas las empresas, sedes y garages.</p>
            </div>
          </div>
          <div className="resv-header-actions">
            <BotonGenerico
              className="btn-archivados"
              onClick={handleRefrescar}
              disabled={refrescando}
            >
              <RefreshCcw size={18} className={refrescando ? "resv-refresh-girando" : ""} />
              <span>{refrescando ? "Actualizando..." : "Actualizar"}</span>
            </BotonGenerico>
          </div>
        </header>

        {!loading && (
          <section className="resv-stats">
            <div className="resv-stat-card resv-animate-stat" style={{ borderTop: "3px solid #3B82F6" }}>
              <span className="resv-stat-label">Reservas mostradas</span>
              <span className="resv-stat-valor">{stats.total}</span>
            </div>
            <div className="resv-stat-card resv-animate-stat" style={{ borderTop: "3px solid #F59E0B" }}>
              <span className="resv-stat-label">Hoy</span>
              <span className="resv-stat-valor">{stats.hoy}</span>
            </div>
            <div className="resv-stat-card resv-animate-stat" style={{ borderTop: "3px solid #10B981" }}>
              <span className="resv-stat-label">Dentro del garage</span>
              <span className="resv-stat-valor">{stats.dentro}</span>
            </div>
            <div className="resv-stat-card resv-animate-stat" style={{ borderTop: "3px solid #8B5CF6" }}>
              <span className="resv-stat-label">Programadas</span>
              <span className="resv-stat-valor">{stats.programadas}</span>
            </div>
          </section>
        )}

        {loading ? (
          <>
            <div className="resv-toolbar resv-toolbar-skeleton">
              <span className="resv-skeleton-line resv-skeleton-search" />
              <span className="resv-skeleton-line resv-skeleton-filtros" />
            </div>
            <ReservasTableSkeleton />
          </>
        ) : (
          <>
            <section className="resv-toolbar resv-animate-toolbar">
              <div className="resv-toolbar-fila resv-toolbar-fila--campos">
                <div className="resv-search">
                  <Search className="resv-search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por usuario, patente, garage, sede o empresa..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                <div className="resv-filtro-campo">
                  <label>
                    <CalendarDays size={14} />
                    Dia
                  </label>
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  />
                </div>

                <div className="resv-filtro-campo">
                  <label>
                    <Clock3 size={14} />
                    Desde
                  </label>
                  <div className="resv-select-wrapper">
                    <select value={filtroHoraDesde} onChange={(e) => setFiltroHoraDesde(e.target.value)}>
                      <option value="">--:--</option>
                      {HORAS.map((hora) => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="resv-chevron" />
                  </div>
                </div>

                <div className="resv-filtro-campo">
                  <label>
                    <Clock3 size={14} />
                    Hasta
                  </label>
                  <div className="resv-select-wrapper">
                    <select value={filtroHoraHasta} onChange={(e) => setFiltroHoraHasta(e.target.value)}>
                      <option value="">--:--</option>
                      {HORAS.map((hora) => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="resv-chevron" />
                  </div>
                </div>

                <div className="resv-filtro-campo">
                  <label>Empresa</label>
                  <div className="resv-select-wrapper">
                    <select
                      value={filtroEmpresa}
                      onChange={(e) => {
                        setFiltroEmpresa(e.target.value);
                        setFiltroSede("");
                        setFiltroGarage("");
                      }}
                    >
                      <option value="">Todas</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id ?? empresa.id_empresa} value={empresa.id ?? empresa.id_empresa}>
                          {empresa.nombre || empresa.name || `Empresa #${empresa.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="resv-chevron" />
                  </div>
                </div>

                <div className="resv-filtro-campo">
                  <label>Sede</label>
                  <div className="resv-select-wrapper">
                    <select
                      value={filtroSede}
                      onChange={(e) => {
                        setFiltroSede(e.target.value);
                        setFiltroGarage("");
                      }}
                    >
                      <option value="">Todas</option>
                      {sedesDisponibles.map((sede) => (
                        <option key={sede.id ?? sede.id_sede} value={sede.id ?? sede.id_sede}>
                          {sede.nombre || sede.name || `Sede #${sede.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="resv-chevron" />
                  </div>
                </div>

                <div className="resv-filtro-campo">
                  <label>Garage</label>
                  <div className="resv-select-wrapper">
                    <select value={filtroGarage} onChange={(e) => setFiltroGarage(e.target.value)}>
                      <option value="">Todos</option>
                      {garagesDisponibles.map((garage) => {
                        const idGarage = garage.id_garage ?? garage.id ?? garage._id;
                        return (
                          <option key={idGarage} value={idGarage}>
                            {garage.nombre || garage.name || garage.descripcion || `Garage #${idGarage}`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} className="resv-chevron" />
                  </div>
                </div>
              </div>

              <div className="resv-toolbar-fila resv-toolbar-fila--opciones">
                <div className="resv-filtro-grupo" role="group" aria-labelledby="resv-estado-label">
                  <span className="resv-filtro-grupo__label" id="resv-estado-label">
                    Estado de la reserva
                  </span>
                  <div className="resv-estado-pills">
                    <button
                      type="button"
                      className={`resv-pill ${!filtroEstado ? "active" : ""}`}
                      onClick={() => setFiltroEstado("")}
                    >
                      Todas
                    </button>
                    {ESTADO_ORDER.map((estado) => (
                      <button
                        key={estado}
                        type="button"
                        className={`resv-pill resv-pill--${estado} ${filtroEstado === estado ? "active" : ""}`}
                        onClick={() => setFiltroEstado(estado)}
                      >
                        {ESTADOS[estado].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="resv-filtro-grupo resv-filtro-grupo--presencia" role="group" aria-labelledby="resv-presencia-label">
                  <span className="resv-filtro-grupo__label" id="resv-presencia-label">
                    <ParkingCircle size={14} />
                    En el garage
                  </span>
                  <div className="resv-presencia-pills">
                    <button
                      type="button"
                      className={`resv-pill ${!filtroPresencia ? "active" : ""}`}
                      onClick={() => setFiltroPresencia("")}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      className={`resv-pill resv-pill--dentro ${filtroPresencia === "dentro" ? "active" : ""}`}
                      onClick={() => setFiltroPresencia("dentro")}
                    >
                      Dentro
                    </button>
                    <button
                      type="button"
                      className={`resv-pill resv-pill--fuera ${filtroPresencia === "fuera" ? "active" : ""}`}
                      onClick={() => setFiltroPresencia("fuera")}
                    >
                      Fuera
                    </button>
                  </div>
                </div>

                {hayFiltros && (
                  <button type="button" className="resv-btn-limpiar" onClick={limpiarFiltros}>
                    <X size={14} />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </section>

            {error && (
              <div className="resv-feedback resv-feedback--error" role="alert">
                {error}
              </div>
            )}

            {!error && reservasFiltradas.length === 0 ? (
              <div className="resv-feedback">
                {hayFiltros
                  ? "No hay reservas que coincidan con los filtros aplicados."
                  : "Todavia no hay reservas registradas en el sistema."}
              </div>
            ) : !error && (
              <div className="resv-table-shell resv-animate-table">
                <table className="resv-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Vehiculo</th>
                      <th>Garage</th>
                      <th>Empresa / Sede</th>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>En el garage</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservasFiltradas.map((reserva) => (
                      <tr key={reserva.id}>
                        <td>
                          <strong>{reserva.nombreUsuario}</strong>
                          {reserva.emailUsuario && <span>{reserva.emailUsuario}</span>}
                        </td>
                        <td>
                          <strong>{reserva.patente}</strong>
                          {reserva.vehiculoDetalle && <span>{reserva.vehiculoDetalle}</span>}
                        </td>
                        <td>{reserva.nombreGarage}</td>
                        <td>
                          <strong>{reserva.nombreEmpresa}</strong>
                          <span>{reserva.nombreSede}</span>
                        </td>
                        <td className="resv-celda-fecha">{formatearFechaCorta(reserva.fecha)}</td>
                        <td className="resv-celda-horario">
                          {reserva.horaInicio} - {reserva.horaFin}
                        </td>
                        <td>
                          <span className={`resv-presencia ${reserva.estaDentro ? "resv-presencia--dentro" : "resv-presencia--fuera"}`}>
                            <span className="resv-presencia__dot" aria-hidden="true" />
                            {reserva.estaDentro ? "Dentro" : "Fuera"}
                          </span>
                        </td>
                        <td>
                          <span className={`resv-estado ${ESTADOS[reserva.estado].clase}`}>
                            {ESTADOS[reserva.estado].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <FooterSuperadmin />
    </div>
  );
}
