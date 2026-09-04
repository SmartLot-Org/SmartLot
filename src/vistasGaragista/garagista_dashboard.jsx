import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Eye,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { GaragesGetAll, GaragesGetById } from "../servicies/API_Garage";
import { ReservasCheckIn, ReservasCheckOut, ReservasGetControlAcceso } from "../servicies/API_Reserva";
import { UsuariosGetById } from "../servicies/API_Usuario";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import HeaderAdmin from "../componentesAdmin/header_admin";
import FooterAdmin from "../componentesAdmin/footer_admin";
import { useAuth } from "../contexts/useAuth";
import { showToast } from "../helpers/toast";
import { normalizarPatente } from "../helpers/patente";
import { getUsuarioGarageIds } from "../helpers/usuarios";
import {
  aplanarReservaControlAcceso,
  obtenerReservasControlAcceso,
  reservaPerteneceAlGarage,
} from "../helpers/controlAcceso";
import "./garagista_dashboard.css";

const MENSAJE_INGRESO_ANTICIPADO =
  "No se puede ingresar el vehículo hasta una hora antes del horario pautado de la reserva.";

const MINUTOS_ANTICIPACION_INGRESO = 60;
const SKELETON_CARD_KEYS = ["reserva-1", "reserva-2", "reserva-3"];
const SKELETON_MOVEMENT_KEYS = ["movimiento-1", "movimiento-2", "movimiento-3"];

const obtenerHoraActual = () =>
  new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

const obtenerFechaActual = () =>
  new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

const obtenerFechaISOActual = () =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

const tieneZonaHoraria = (valor) => /(?:Z|[+-]\d{2}:?\d{2})$/.test(String(valor).trim());

const extraerFecha = (valor) => {
  if (!valor) return "";
  const texto = String(valor);
  if (tieneZonaHoraria(texto)) {
    const fecha = new Date(texto);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(fecha);
    }
  }

  const coincidencia = texto.match(/^\d{4}-\d{2}-\d{2}/);
  if (coincidencia) return coincidencia[0];

  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
};

const obtenerFechaReserva = (reserva) => {
  const candidatos = [
    reserva.fecha_entrada,
    reserva.fechaEntrada,
    reserva.fecha_inicio,
    reserva.fechaInicio,
    reserva.fecha,
    reserva.fecha_reserva,
    reserva.fechaReserva,
  ];

  for (const candidato of candidatos) {
    const fecha = extraerFecha(candidato);
    if (fecha) return fecha;
  }
  return "";
};

const obtenerIdGarage = (garage) =>
  garage?.id_garage ?? garage?.idGarage ?? garage?.garage_id ?? garage?.id ?? garage?._id;

const obtenerIdReserva = (reserva) =>
  reserva?.id_reserva ?? reserva?.id ?? reserva?._id;

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.reservas)) return datos.reservas;
  if (Array.isArray(datos?.usuarios)) return datos.usuarios;
  return [];
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

const normalizarEstadoReserva = (reserva) => {
  const entro = [
    reserva.entrada,
    reserva.ingreso,
    reserva.check_in,
    reserva.checkIn,
    reserva.entro,
    reserva.entrada_registrada,
    reserva.entradaRegistrada,
    reserva.fecha_entrada_real,
    reserva.fechaEntradaReal,
  ].some(esValorVerdadero);
  const salio = [
    reserva.salida,
    reserva.egreso,
    reserva.check_out,
    reserva.checkOut,
    reserva.salio,
    reserva.salida_registrada,
    reserva.salidaRegistrada,
    reserva.fecha_salida_real,
    reserva.fechaSalidaReal,
  ].some(esValorVerdadero);

  if (salio) return "Finalizado";
  if (entro) return "Dentro";
  return "Pendiente";
};

const extraerHora = (valor) => {
  if (!valor) return null;
  const texto = String(valor).trim();

  if (/^\d{2}:\d{2}/.test(texto)) return texto.slice(0, 5);

  if (tieneZonaHoraria(texto)) {
    const fecha = new Date(texto);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(fecha);
    }
  }

  if (texto.includes("T")) return texto.split("T")[1]?.slice(0, 5);
  if (texto.includes(" ")) return texto.split(" ")[1]?.slice(0, 5);
  if (texto.includes(":")) return texto.slice(0, 5);
  return null;
};

const obtenerHoraEntradaReal = (reserva) => {
  const candidatos = [
    reserva.fecha_entrada_real,
    reserva.fechaEntradaReal,
    reserva.hora_entrada_real,
    reserva.horaEntradaReal,
    reserva.entrada_registrada,
    reserva.entradaRegistrada,
    reserva.check_in,
    reserva.checkIn,
    reserva.entrada,
    reserva.ingreso,
    reserva.fecha_ingreso,
    reserva.fechaIngreso,
    reserva.hora_ingreso,
    reserva.horaIngreso,
    reserva.ingreso_at,
    reserva.ingresoAt,
    reserva.check_in_at,
    reserva.checkInAt,
    reserva.movimiento?.fecha_entrada,
    reserva.movimiento?.fechaEntrada,
    reserva.movimiento?.hora_entrada,
    reserva.movimiento?.horaEntrada,
    reserva.movimiento?.fecha_ingreso,
    reserva.movimiento?.hora_ingreso,
  ];

  for (const candidato of candidatos) {
    if (typeof candidato === "boolean" || candidato === 0 || candidato === 1) continue;
    const hora = extraerHora(candidato);
    if (hora) return hora;
  }

  return null;
};

const obtenerHoraSalidaReal = (reserva) => {
  const candidatos = [
    reserva.fecha_salida_real,
    reserva.fechaSalidaReal,
    reserva.hora_salida_real,
    reserva.horaSalidaReal,
    reserva.salida_registrada,
    reserva.salidaRegistrada,
    reserva.check_out,
    reserva.checkOut,
    reserva.salida,
    reserva.egreso,
    reserva.fecha_egreso,
    reserva.fechaEgreso,
    reserva.hora_egreso,
    reserva.horaEgreso,
    reserva.egreso_at,
    reserva.egresoAt,
    reserva.check_out_at,
    reserva.checkOutAt,
    reserva.movimiento?.fecha_salida,
    reserva.movimiento?.fechaSalida,
    reserva.movimiento?.hora_salida,
    reserva.movimiento?.horaSalida,
    reserva.movimiento?.fecha_egreso,
    reserva.movimiento?.hora_egreso,
  ];

  for (const candidato of candidatos) {
    if (typeof candidato === "boolean" || candidato === 0 || candidato === 1) continue;
    const hora = extraerHora(candidato);
    if (hora) return hora;
  }

  return null;
};

const obtenerFechaHoraReserva = (reserva) => {
  const fecha = reserva?.fechaReserva;
  const hora = reserva?.horaReserva;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return null;

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [horas, minutos] = hora.split(":").map(Number);
  const fechaHora = new Date(anio, mes - 1, dia, horas, minutos);

  return Number.isNaN(fechaHora.getTime()) ? null : fechaHora;
};

const obtenerHoraHabilitacionIngreso = (reserva) => {
  const fechaHoraReserva = obtenerFechaHoraReserva(reserva);
  if (!fechaHoraReserva) return null;

  const fechaHabilitacion = new Date(fechaHoraReserva);
  fechaHabilitacion.setMinutes(fechaHabilitacion.getMinutes() - MINUTOS_ANTICIPACION_INGRESO);
  return fechaHabilitacion;
};

const formatearHora = (fecha) =>
  new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);

const obtenerMensajeIngresoAnticipado = (reserva) => {
  const fechaHabilitacion = obtenerHoraHabilitacionIngreso(reserva);
  if (!fechaHabilitacion) return MENSAJE_INGRESO_ANTICIPADO;

  return `No se puede registrar el ingreso todavia. La entrada del vehiculo se podra efectuar a partir de las ${formatearHora(fechaHabilitacion)}, una hora antes del horario de la reserva.`;
};

const obtenerFechaHoraProgramada = (fecha, hora) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) || !/^\d{2}:\d{2}$/.test(String(hora))) {
    return null;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [horas, minutos] = hora.split(":").map(Number);
  const fechaHora = new Date(anio, mes - 1, dia, horas, minutos);

  return Number.isNaN(fechaHora.getTime()) ? null : fechaHora;
};

const estaReservaPendienteVencida = (reserva, ahora = new Date()) => {
  if (reserva.estado !== "Pendiente") return false;
  const salidaProgramada = obtenerFechaHoraProgramada(reserva.fechaReserva, reserva.horaSalidaPrevista);
  return Boolean(salidaProgramada && salidaProgramada <= ahora);
};

const obtenerClaseEstado = (estado) =>
  String(estado || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

function BadgeEstado({ estado }) {
  return (
    <span className={`garagista-status garagista-status--${obtenerClaseEstado(estado)}`}>
      {estado}
    </span>
  );
}

function EmptyState({ mensaje }) {
  return <div className="garagista-empty">{mensaje}</div>;
}

function SkeletonLine({ className = "" }) {
  return <span className={`garagista-skeleton-line ${className}`} aria-hidden="true" />;
}

function SkeletonAccessCard() {
  return (
    <article className="access-card access-card--skeleton" aria-hidden="true">
      <div className="access-card__top">
        <div className="garagista-skeleton-stack">
          <SkeletonLine className="garagista-skeleton-line--title" />
          <SkeletonLine className="garagista-skeleton-line--text" />
        </div>
        <SkeletonLine className="garagista-skeleton-line--badge" />
      </div>

      <dl className="access-card__meta">
        <div>
          <SkeletonLine className="garagista-skeleton-line--label" />
          <SkeletonLine className="garagista-skeleton-line--value" />
        </div>
        <div>
          <SkeletonLine className="garagista-skeleton-line--label" />
          <SkeletonLine className="garagista-skeleton-line--value garagista-skeleton-line--short" />
        </div>
      </dl>

      <SkeletonLine className="garagista-skeleton-line--button" />
    </article>
  );
}

function GaragistaDashboardSkeleton() {
  return (
    <div className="garagista-skeleton" role="status" aria-label="Cargando datos del garage">
      <div className="garagista-mobile-tabs garagista-skeleton-tabs" aria-hidden="true">
        <SkeletonLine className="garagista-skeleton-line--tab" />
        <SkeletonLine className="garagista-skeleton-line--tab" />
      </div>

      <div className="garagista-sections-grid">
        {["Ingresos pendientes", "Autos dentro"].map((titulo) => (
          <section className="garagista-section garagista-mobile-panel is-active" key={titulo}>
            <div className="garagista-section-heading" aria-hidden="true">
              <div>
                <SkeletonLine className="garagista-skeleton-line--eyebrow" />
                <SkeletonLine className="garagista-skeleton-line--heading" />
              </div>
              <SkeletonLine className="garagista-skeleton-line--count" />
            </div>

            <div className="garagista-card-list">
              {SKELETON_CARD_KEYS.map((key) => (
                <SkeletonAccessCard key={`${titulo}-${key}`} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="garagista-section garagista-section--movements">
        <div className="garagista-section-heading" aria-hidden="true">
          <div>
            <SkeletonLine className="garagista-skeleton-line--eyebrow" />
            <SkeletonLine className="garagista-skeleton-line--heading" />
          </div>
          <SkeletonLine className="garagista-skeleton-line--count" />
        </div>

        <div className="movements-list" aria-hidden="true">
          {SKELETON_MOVEMENT_KEYS.map((key) => (
            <article className="movement-row movement-row--skeleton" key={key}>
              <div className="garagista-skeleton-stack">
                <SkeletonLine className="garagista-skeleton-line--title" />
                <SkeletonLine className="garagista-skeleton-line--text" />
              </div>
              <SkeletonLine className="garagista-skeleton-line--badge" />
              <SkeletonLine className="garagista-skeleton-line--value" />
              <SkeletonLine className="garagista-skeleton-line--value" />
              <SkeletonLine className="garagista-skeleton-line--value" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function GaragistaDashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [garageData, setGarageData] = useState(null);
  const [garagesDisponibles, setGaragesDisponibles] = useState([]);
  const [garageSeleccionadoId, setGarageSeleccionadoId] = useState(null);
  const [garageGaragistaId, setGarageGaragistaId] = useState(null);
  const [asignacionConsultada, setAsignacionConsultada] = useState(false);
  const [cargandoGaragesAdmin, setCargandoGaragesAdmin] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seccionMovil, setSeccionMovil] = useState("pendientes");
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [tipoVerificacion, setTipoVerificacion] = useState("ingreso");
  const [patenteIngresada, setPatenteIngresada] = useState("");
  const [errorVerificacion, setErrorVerificacion] = useState("");
  const [patenteVerificada, setPatenteVerificada] = useState(false);
  const [guardandoAccion, setGuardandoAccion] = useState(false);

  const esAdmin = Number(usuario?.id_rol) === 1;
  const idUsuarioSesion = Number(usuario?.id ?? usuario?.id_usuario ?? usuario?._id) || null;
  const idGarageSesion = useMemo(() => {
    const idNormalizado = getUsuarioGarageIds(usuario)[0];
    if (idNormalizado) return idNormalizado;
    const idAlternativo = Number(usuario?.idGarage ?? usuario?.garage_id ?? usuario?.garageId);
    return Number.isInteger(idAlternativo) && idAlternativo > 0 ? idAlternativo : null;
  }, [usuario]);
  const [fechaISOActual, setFechaISOActual] = useState(obtenerFechaISOActual);
  const fechaActual = obtenerFechaActual();
  const idGarageAsignado = useMemo(
    () => esAdmin ? garageSeleccionadoId : garageGaragistaId ?? idGarageSesion,
    [esAdmin, garageGaragistaId, garageSeleccionadoId, idGarageSesion]
  );
  const terminoBusqueda = busqueda.trim().toLowerCase();
  const capacidadTotal = useMemo(() => {
    if (!garageData) return 0;
    return Number(garageData.capacidad_reservas || 0) + Number(garageData.capacidad_para_no_reservas || 0);
  }, [garageData]);
  const cargandoVista = idGarageAsignado
    ? cargando
    : esAdmin ? cargandoGaragesAdmin : Boolean(idUsuarioSesion) && !asignacionConsultada;
  const errorVista = idGarageAsignado
    ? errorCarga
    : esAdmin
      ? cargandoGaragesAdmin ? "" : "No hay garages disponibles para consultar."
      : "No tenés un garage asignado.";

  useEffect(() => {
    const actualizarFecha = () => setFechaISOActual(obtenerFechaISOActual());
    const intervalo = window.setInterval(actualizarFecha, 60 * 1000);
    window.addEventListener("focus", actualizarFecha);
    document.addEventListener("visibilitychange", actualizarFecha);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizarFecha);
      document.removeEventListener("visibilitychange", actualizarFecha);
    };
  }, []);

  useEffect(() => {
    if (esAdmin) return;

    let cancelado = false;
    if (!idUsuarioSesion) return;

    UsuariosGetById(idUsuarioSesion, { force: true })
      .then((respuesta) => {
        if (cancelado || !respuesta.respuesta) return;

        const payload = respuesta.datos;
        const candidatos = [
          ...(Array.isArray(payload) ? payload : []),
          payload,
          payload?.usuario,
          payload?.data,
          payload?.datos,
        ].filter((item) => item && typeof item === "object" && !Array.isArray(item));
        const ids = candidatos.flatMap(getUsuarioGarageIds);
        const idActual = ids[0] ?? idGarageSesion;
        setGarageGaragistaId(Number(idActual) || null);
      })
      .finally(() => {
        if (!cancelado) setAsignacionConsultada(true);
      });

    return () => { cancelado = true; };
  }, [esAdmin, idGarageSesion, idUsuarioSesion]);

  useEffect(() => {
    if (!esAdmin) return;

    let cancelado = false;

    const cargarGaragesDelAdmin = async () => {
      setCargandoGaragesAdmin(true);
      try {
        const garagesResp = await GaragesGetAll();
        if (cancelado) return;

        // El backend limita el listado por usuario_garage o por tratos de la sede/empresa.
        const garagesPermitidos = obtenerListado(garagesResp.datos);

        setGaragesDisponibles(garagesPermitidos);
        setGarageSeleccionadoId((actual) => {
          const seleccionValida = actual && garagesPermitidos.some(
            (garage) => Number(obtenerIdGarage(garage)) === actual
          );
          return seleccionValida ? actual : Number(obtenerIdGarage(garagesPermitidos[0])) || null;
        });
      } catch {
        if (!cancelado) {
          setGaragesDisponibles([]);
          setGarageSeleccionadoId(null);
        }
      } finally {
        if (!cancelado) setCargandoGaragesAdmin(false);
      }
    };

    cargarGaragesDelAdmin();
    return () => { cancelado = true; };
  }, [esAdmin, usuario?.id_empresa, usuario?.id_sede]);

  useEffect(() => {
    if (!idGarageAsignado) return;

    let cancelado = false;

    const cargarDatos = async () => {
      setCargando(true);
      setErrorCarga("");

      try {
        const [garageResp, reservasResp] = await Promise.all([
          GaragesGetById(idGarageAsignado),
          ReservasGetControlAcceso(idGarageAsignado, fechaISOActual, { force: true }),
        ]);

        if (cancelado) return;

        const garageRaw = garageResp.respuesta ? garageResp.datos : null;
        const garageCandidates = [garageRaw];
        if (garageRaw?.data) garageCandidates.push(garageRaw.data);
        if (garageRaw?.garage) garageCandidates.push(garageRaw.garage);
        if (Array.isArray(garageRaw)) garageCandidates.push(garageRaw[0]);
        const garage = garageCandidates.find((g) => g && typeof g === "object" && !Array.isArray(g)) || null;

        setGarageData(garage);

        if (!reservasResp.respuesta) {
          throw new Error(
            reservasResp.datos?.message || "No se pudieron obtener las reservas del garage."
          );
        }

        const todasReservas = obtenerReservasControlAcceso(reservasResp.datos)
          .map(aplanarReservaControlAcceso);

        const reservasDelGarage = todasReservas
          .filter((r) => {
            if (esValorVerdadero(r.borrado)) return false;
            return reservaPerteneceAlGarage(r, idGarageAsignado);
          })
          .map((r) => {
            const estadoBase = normalizarEstadoReserva(r);
            const fechaReserva = obtenerFechaReserva(r);
            const horaSalidaPrevista = extraerHora(r.hora_salida)
              ?? extraerHora(r.horaFin)
              ?? extraerHora(r.fecha_salida)
              ?? extraerHora(r.fecha_fin)
              ?? extraerHora(r.fechaFinalizacion)
              ?? "--:--";
            const estado = estaReservaPendienteVencida({
              estado: estadoBase,
              fechaReserva,
              horaSalidaPrevista,
            }) ? "Sin registro" : estadoBase;

            return {
              id: obtenerIdReserva(r),
              conductor: r.conductor || r.usuario_nombre || r.usuario?.nombre || "Conductor desconocido",
              fechaReserva,
              horaReserva: extraerHora(r.hora_entrada)
                ?? extraerHora(r.horaInicio)
                ?? extraerHora(r.fecha_entrada)
                ?? extraerHora(r.fecha_inicio)
                ?? "--:--",
              horaSalidaPrevista,
              vehiculo: [
                r.marca_nombre ?? r.vehiculo?.marca?.nombre ?? r.vehiculo?.marca,
                r.modelo_nombre ?? r.vehiculo?.modelo?.nombre ?? r.vehiculo?.modelo,
              ].filter(Boolean).join(" ") || "Vehículo desconocido",
              patenteInterna: r.patente || r.vehiculo?.patente || r.vehiculo?.placa || "--",
              estado,
              horaEntrada: obtenerHoraEntradaReal(r),
              horaSalida: obtenerHoraSalidaReal(r),
              raw: r,
            };
          });

        if (!cancelado) setReservas(reservasDelGarage);
      } catch (error) {
        if (!cancelado) {
          setErrorCarga(error.message || "No se pudieron cargar las reservas del garage.");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();
    return () => { cancelado = true; };
  }, [fechaISOActual, idGarageAsignado]);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) => {
      if (reserva.fechaReserva !== fechaISOActual) return false;
      if (!terminoBusqueda) return true;

      const textoVisible = `${reserva.conductor} ${reserva.vehiculo}`.toLowerCase();
      return textoVisible.includes(terminoBusqueda);
    });
  }, [fechaISOActual, reservas, terminoBusqueda]);

  const reservasPendientes = reservasFiltradas.filter(
    (reserva) => reserva.estado === "Pendiente"
  );
  const autosDentro = reservasFiltradas.filter((reserva) => {
    if (reserva.estado !== "Dentro") return false;
    if (!terminoBusqueda) return true;
    return `${reserva.conductor} ${reserva.vehiculo}`.toLowerCase().includes(terminoBusqueda);
  });
  const movimientosFinalizados = reservasFiltradas.filter(
    (reserva) => reserva.estado === "Finalizado" || reserva.estado === "Sin registro"
  );
  const cantidadAutosDentro = reservasFiltradas.filter((reserva) => reserva.estado === "Dentro").length;

  const abrirVerificacion = (reserva) => {
    if (esAdmin) return;
    setReservaSeleccionada(reserva);
    setTipoVerificacion("ingreso");
    setPatenteIngresada("");
    setErrorVerificacion("");
    setPatenteVerificada(false);
  };

  const abrirVerificacionSalida = (reserva) => {
    if (esAdmin || guardandoAccion) return;
    setReservaSeleccionada(reserva);
    setTipoVerificacion("salida");
    setPatenteIngresada("");
    setErrorVerificacion("");
    setPatenteVerificada(false);
  };

  const cerrarVerificacion = () => {
    setReservaSeleccionada(null);
    setPatenteIngresada("");
    setErrorVerificacion("");
    setPatenteVerificada(false);
  };

  const verificarPatente = (event) => {
    event.preventDefault();
    if (esAdmin || !reservaSeleccionada) return;

    const patenteEscrita = normalizarPatente(patenteIngresada);
    if (!patenteEscrita) {
      setErrorVerificacion("Ingresá la patente completa para continuar.");
      return;
    }

    const patenteEsperada = normalizarPatente(reservaSeleccionada.patenteInterna);

    if (patenteEscrita !== patenteEsperada) {
      setErrorVerificacion(
        tipoVerificacion === "salida"
          ? "La patente ingresada no coincide con el vehículo registrado"
          : "La patente ingresada no coincide con la reserva."
      );
      return;
    }

    setErrorVerificacion("");
    setPatenteVerificada(true);
  };

  const confirmarAcceso = async () => {
    if (esAdmin || guardandoAccion || !reservaSeleccionada || !patenteVerificada) return;

    const horaHabilitacionIngreso = obtenerHoraHabilitacionIngreso(reservaSeleccionada);
    if (horaHabilitacionIngreso && new Date() < horaHabilitacionIngreso) {
      setErrorVerificacion(obtenerMensajeIngresoAnticipado(reservaSeleccionada));
      return;
    }

    setGuardandoAccion(true);
    const horaEntrada = obtenerHoraActual();
    const resultado = await ReservasCheckIn(reservaSeleccionada.id, patenteIngresada);

    if (resultado.respuesta) {
      setReservas((reservasActuales) =>
        reservasActuales.map((reserva) =>
          reserva.id === reservaSeleccionada.id
            ? {
                ...reserva,
                estado: "Dentro",
                horaEntrada,
                raw: { ...reserva.raw, ...resultado.datos },
              }
            : reserva
        )
      );
      cerrarVerificacion();
      showToast("Ingreso verificado correctamente.", "success");
    } else {
      const mensajeBackend = resultado.datos?.message || "";
      const ingresoTodaviaNoHabilitado = /todav[ií]a no est[aá] habilitad/i.test(mensajeBackend);
      setErrorVerificacion(
        ingresoTodaviaNoHabilitado
          ? obtenerMensajeIngresoAnticipado(reservaSeleccionada)
          : mensajeBackend || "No se pudo registrar el ingreso en el servidor."
      );
    }
    setGuardandoAccion(false);
  };

  const confirmarSalida = async () => {
    if (esAdmin || guardandoAccion || !reservaSeleccionada || !patenteVerificada) return;

    setGuardandoAccion(true);
    setErrorVerificacion("");
    const resultado = await ReservasCheckOut(reservaSeleccionada.id, patenteIngresada);

    if (resultado.respuesta) {
      const datosSalida = resultado.datos?.data ?? resultado.datos?.reserva ?? resultado.datos;
      const horaSalidaBackend = obtenerHoraSalidaReal(datosSalida || {});
      const horaSalida = horaSalidaBackend || obtenerHoraActual();

      setReservas((reservasActuales) =>
        reservasActuales.map((reserva) =>
          reserva.id === reservaSeleccionada.id
            ? {
                ...reserva,
                estado: "Finalizado",
                horaSalida,
                raw: { ...reserva.raw, ...datosSalida },
              }
            : reserva
        )
      );
      cerrarVerificacion();
      showToast("Salida registrada correctamente.", "success");
    } else {
      setErrorVerificacion(
        resultado.datos?.message || "No se pudo registrar la salida en el servidor. Intentá nuevamente."
      );
    }

    setGuardandoAccion(false);
  };

  return (
    <>
      <HeaderAdmin homePath={esAdmin ? "/admin_dashboard" : "/garagista_dashboard"} />

      <main className="garagista-page">
        <div className="garagista-shell">
          <header className="garagista-hero">
            <div className="garagista-title-block">
              {esAdmin ? (
                <button
                  className="garagista-icon-button"
                  type="button"
                  onClick={() => navigate("/admin_dashboard")}
                  aria-label="Volver al dashboard de admin"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : null}

              <div>
                <span className="garagista-eyebrow">
                  {esAdmin ? <Eye size={16} /> : <ShieldCheck size={16} />}
                  {esAdmin ? "Vista de solo lectura" : "Operación diaria"}
                </span>
                <h1>Control de acceso</h1>
              </div>
            </div>

          </header>

          <section className="garagista-summary-card" aria-label="Resumen operativo">
            <div>
              <span className="garagista-summary-label">
                {esAdmin ? "Garage consultado" : "Garage asignado"}
              </span>
              {esAdmin ? (
                <select
                  className="garagista-garage-select"
                  value={garageSeleccionadoId ?? ""}
                  onChange={(event) => setGarageSeleccionadoId(Number(event.target.value) || null)}
                  disabled={cargandoGaragesAdmin || garagesDisponibles.length === 0}
                  aria-label="Seleccionar garage para consultar"
                >
                  {garagesDisponibles.length === 0 ? (
                    <option value="">Sin garages disponibles</option>
                  ) : garagesDisponibles.map((garage) => (
                    <option key={obtenerIdGarage(garage)} value={obtenerIdGarage(garage)}>
                      {garage.nombre || garage.name || garage.descripcion || garage.ubicacion || "Garage"}
                    </option>
                  ))}
                </select>
              ) : cargandoVista ? (
                <SkeletonLine className="garagista-skeleton-line--garage" />
              ) : (
                <strong>{garageData?.nombre || garageData?.name || garageData?.descripcion || garageData?.ubicacion || garageData?.nombre_garage || garageData?.garage_nombre || "Sin garage"}</strong>
              )}
            </div>

            <div className="garagista-summary-metric">
              <CalendarDays size={19} />
              <span>{fechaActual}</span>
            </div>

            <div className="garagista-capacity">
              <CarFront size={22} />
              {cargandoVista ? (
                <SkeletonLine className="garagista-skeleton-line--capacity" />
              ) : (
                <span>{cantidadAutosDentro} / {capacidadTotal || "—"} dentro</span>
              )}
            </div>
          </section>

          <label className="garagista-search">
            <Search size={20} />
            <input
              type="search"
              placeholder="Buscar por conductor o vehículo..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </label>

          {cargandoVista ? (
            <GaragistaDashboardSkeleton />
          ) : errorVista ? (
            <div className="garagista-empty">{errorVista}</div>
          ) : (
          <>
          <div className="garagista-mobile-tabs" role="group" aria-label="Estado de las reservas">
            <button
              type="button"
              className={seccionMovil === "pendientes" ? "is-active" : ""}
              onClick={() => setSeccionMovil("pendientes")}
              aria-pressed={seccionMovil === "pendientes"}
            >
              Pendientes <span>{reservasPendientes.length}</span>
            </button>
            <button
              type="button"
              className={seccionMovil === "dentro" ? "is-active" : ""}
              onClick={() => setSeccionMovil("dentro")}
              aria-pressed={seccionMovil === "dentro"}
            >
              Dentro <span>{autosDentro.length}</span>
            </button>
          </div>
          <div className="garagista-sections-grid">
            <section className={`garagista-section garagista-mobile-panel ${seccionMovil === "pendientes" ? "is-active" : ""}`}>
              <div className="garagista-section-heading">
                <div>
                  <span>Ingresos pendientes</span>
                  <h2>Reservas próximas</h2>
                </div>
                <strong>{reservasPendientes.length}</strong>
              </div>

              <div className="garagista-card-list">
                {reservasPendientes.length > 0 ? (
                  reservasPendientes.map((reserva) => (
                    <article className="access-card" key={reserva.id}>
                      <div className="access-card__top">
                        <div>
                          <h3>{reserva.conductor}</h3>
                          <p>{reserva.vehiculo}</p>
                        </div>
                        <BadgeEstado estado={reserva.estado} />
                      </div>

                      <dl className="access-card__meta access-card__meta--single">
                        <div>
                          <dt>Hora de reserva</dt>
                          <dd>
                            <Clock3 size={15} />
                            {reserva.horaReserva}
                          </dd>
                        </div>
                      </dl>

                      {!esAdmin ? (
                        <button
                          className="garagista-primary-btn"
                          type="button"
                          onClick={() => abrirVerificacion(reserva)}
                          disabled={guardandoAccion}
                        >
                          <ShieldCheck size={17} />
                          Verificar ingreso
                        </button>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <EmptyState mensaje="No hay reservas próximas para mostrar." />
                )}
              </div>
            </section>

            <section className={`garagista-section garagista-mobile-panel ${seccionMovil === "dentro" ? "is-active" : ""}`}>
              <div className="garagista-section-heading">
                <div>
                  <span>Ocupacion actual</span>
                  <h2>Autos dentro</h2>
                </div>
                <strong>{autosDentro.length}</strong>
              </div>

              <div className="garagista-card-list">
                {autosDentro.length > 0 ? (
                  autosDentro.map((reserva) => (
                    <article className="access-card access-card--inside" key={reserva.id}>
                      <div className="access-card__top">
                        <div>
                          <h3>{reserva.conductor}</h3>
                          <p>{reserva.vehiculo}</p>
                        </div>
                        <BadgeEstado estado={reserva.estado} />
                      </div>

                      <dl className={`access-card__meta ${reserva.horaEntrada ? "" : "access-card__meta--single"}`}>
                        {reserva.horaEntrada ? (
                          <div>
                            <dt>Hora de entrada</dt>
                            <dd>
                              <DoorOpen size={15} />
                              {reserva.horaEntrada}
                            </dd>
                          </div>
                        ) : null}
                        <div>
                          <dt>Salida prevista</dt>
                          <dd>
                            <Clock3 size={15} />
                            {reserva.horaSalidaPrevista}
                          </dd>
                        </div>
                      </dl>

                      {!esAdmin ? (
                        <button
                          className="garagista-secondary-btn"
                          type="button"
                          onClick={() => abrirVerificacionSalida(reserva)}
                          disabled={guardandoAccion}
                        >
                          <CheckCircle2 size={17} />
                          Verificar salida
                        </button>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <EmptyState mensaje="No hay autos dentro con este filtro." />
                )}
              </div>
            </section>
          </div>

          <section className="garagista-section garagista-section--movements">
            <div className="garagista-section-heading">
              <div>
                <span>Actividad reciente</span>
                <h2>Últimos movimientos</h2>
              </div>
              <strong>{movimientosFinalizados.length}</strong>
            </div>

            <div className="movements-list">
              {movimientosFinalizados.length > 0 ? (
                movimientosFinalizados.map((reserva) => (
                  <article className="movement-row" key={reserva.id}>
                    <div>
                      <h3>{reserva.conductor}</h3>
                      <p>{reserva.vehiculo}</p>
                    </div>
                    <BadgeEstado estado={reserva.estado} />
                    {reserva.horaEntrada ? <span>Entrada {reserva.horaEntrada}</span> : null}
                    {reserva.horaSalida ? (
                      <span>Salida real {reserva.horaSalida}</span>
                    ) : reserva.estado === "Sin registro" ? (
                      <span>Salida prevista {reserva.horaSalidaPrevista}</span>
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyState mensaje="Todavía no hay movimientos finalizados." />
              )}
            </div>
          </section>
          </>
          )}
        </div>
      </main>

      {esAdmin ? <FooterAdmin /> : null}

      {!esAdmin && reservaSeleccionada ? (
        <ModalPortal onClose={cerrarVerificacion} overlayClassName="garagista-modal-overlay">
          <form className="garagista-modal" onSubmit={verificarPatente} onClick={(e) => e.stopPropagation()}>
            <div className="garagista-modal__header">
              <div>
                <h2>{patenteVerificada ? "Confirmar vehículo" : `Verificar ${tipoVerificacion}`}</h2>
                <p>
                  {patenteVerificada
                    ? tipoVerificacion === "salida"
                      ? "Patente verificada"
                      : "Revisá los datos antes de registrar el ingreso."
                    : `Ingresá la patente completa para validar ${tipoVerificacion === "salida" ? "la salida" : "el acceso"}.`}
                </p>
              </div>
              <button
                className="garagista-modal__close"
                type="button"
                onClick={cerrarVerificacion}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {patenteVerificada ? (
              <div className="garagista-vehicle-confirmation" role="status">
                <span className="garagista-vehicle-confirmation__icon">
                  <CarFront size={25} />
                </span>
                <div>
                  <span>{tipoVerificacion === "salida" ? "Patente verificada" : "El vehículo que ingresará es"}</span>
                  <strong>{reservaSeleccionada.vehiculo}</strong>
                  {tipoVerificacion === "ingreso" ? <small>Patente {reservaSeleccionada.patenteInterna}</small> : null}
                </div>
              </div>
            ) : (
              <>
                {tipoVerificacion === "salida" ? (
                  <div className="garagista-vehicle-confirmation">
                    <span className="garagista-vehicle-confirmation__icon">
                      <CarFront size={25} />
                    </span>
                    <div>
                      <span>Vehículo dentro</span>
                      <strong>{reservaSeleccionada.vehiculo}</strong>
                      <small>{reservaSeleccionada.conductor}</small>
                    </div>
                  </div>
                ) : null}
                <label className="garagista-modal__field">
                  <span>Patente</span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Ej: AB123CD"
                    value={patenteIngresada}
                    autoComplete="off"
                    spellCheck="false"
                    onChange={(event) => {
                      setPatenteIngresada(event.target.value);
                      setErrorVerificacion("");
                    }}
                  />
                </label>
              </>
            )}

            {errorVerificacion ? (
              <p className="garagista-modal__error" role="alert">
                {errorVerificacion}
              </p>
            ) : null}

            <div className="garagista-modal__actions">
              <button className="garagista-cancel-btn" type="button" onClick={cerrarVerificacion} disabled={guardandoAccion}>
                Cancelar
              </button>
              <button
                className="garagista-primary-btn"
                type={patenteVerificada ? "button" : "submit"}
                onClick={patenteVerificada ? (tipoVerificacion === "salida" ? confirmarSalida : confirmarAcceso) : undefined}
                disabled={guardandoAccion}
              >
                {guardandoAccion
                  ? "Guardando..."
                  : patenteVerificada
                    ? tipoVerificacion === "salida" ? "Confirmar salida" : "Confirmar"
                    : "Verificar patente"}
              </button>
            </div>
          </form>
        </ModalPortal>
      ) : null}
    </>
  );
}
